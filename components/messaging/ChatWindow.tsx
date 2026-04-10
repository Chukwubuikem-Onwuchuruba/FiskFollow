"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Send,
  Trash2,
  Users,
  Paperclip,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  sendMessage,
  deleteMessage,
  markConversationAsRead,
} from "@/lib/actions/message.actions";
import { getSocket } from "@/lib/socket";
import { useUploadThing } from "@/lib/uploadthing";
import Link from "next/link";
import EmojiPicker from "../shared/EmojiPicker";
import { ArrowLeft } from "lucide-react";

interface Props {
  conversation: any;
  initialMessages: any[];
  currentUserMongoId: string;
  currentUserImage: string;
  currentUserName: string;
}

export default function ChatWindow({
  conversation,
  initialMessages,
  currentUserMongoId,
  currentUserImage,
  currentUserName,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("messageImage");

  const otherParticipant = !conversation.isGroup
    ? conversation.participants.find((p: any) => p._id !== currentUserMongoId)
    : null;

  const headerName = conversation.isGroup
    ? conversation.name
    : otherParticipant?.name || "Unknown";

  const headerImage = conversation.isGroup
    ? conversation.image
    : otherParticipant?.image;

  const headerSubtitle = conversation.isGroup
    ? conversation.participants
        .filter((p: any) => p._id !== currentUserMongoId)
        .slice(0, 3)
        .map((p: any) => p.name)
        .join(", ")
    : `@${otherParticipant?.username || ""}`;

  // Socket setup
  useEffect(() => {
    const socket = getSocket();

    socket.emit("user:join", currentUserMongoId);
    socket.emit("conversation:join", conversation._id);

    markConversationAsRead(conversation._id, currentUserMongoId);
    socket.emit("message:read", {
      conversationId: conversation._id,
      userMongoId: currentUserMongoId,
    });
    socket.emit("notification:messagesRead");

    socket.on("message:receive", (message: any) => {
      setMessages((prev) => [...prev, message]);
      markConversationAsRead(conversation._id, currentUserMongoId);
      socket.emit("message:read", {
        conversationId: conversation._id,
        userMongoId: currentUserMongoId,
      });
    });

    socket.on("typing:start", ({ userName }: { userName: string }) => {
      setTypingUser(userName);
    });

    socket.on("typing:stop", () => {
      setTypingUser(null);
    });

    socket.on("message:read", ({ userMongoId }: { userMongoId: string }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.readBy?.includes(userMongoId)
            ? m
            : { ...m, readBy: [...(m.readBy || []), userMongoId] },
        ),
      );
    });

    return () => {
      socket.emit("conversation:leave", conversation._id);
      socket.off("message:receive");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:read");
    };
  }, [conversation._id, currentUserMongoId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    if (files.length + newFiles.length > 4) {
      alert("You can only attach up to 4 images");
      return;
    }

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [...prev, event.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTyping = (value: string) => {
    setText(value);
    const socket = getSocket();
    socket.emit("typing:start", {
      conversationId: conversation._id,
      userName: currentUserName,
    });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing:stop", { conversationId: conversation._id });
    }, 1500);
  };

  const handleSend = async () => {
    if (!text.trim() && files.length === 0) return;
    setIsSending(true);

    const socket = getSocket();
    socket.emit("typing:stop", { conversationId: conversation._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      let uploadedImageUrls: string[] = [];

      if (files.length > 0) {
        const imgRes = await startUpload(files);
        if (imgRes) {
          uploadedImageUrls = imgRes.map((res) => res.ufsUrl);
        }
      }

      const newMessage = await sendMessage({
        conversationId: conversation._id,
        senderMongoId: currentUserMongoId,
        text: text.trim() || undefined,
        images: uploadedImageUrls,
      });

      setMessages((prev) => [...prev, newMessage]);
      setText("");
      setFiles([]);
      setImagePreviews([]);

      socket.emit("message:send", newMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId, currentUserMongoId);
      setMessages((prev) => prev.filter((m) => m._id !== messageId));
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-1 flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-dark-4 shrink-0">
        {/* Back button — mobile only */}
        <Link
          href="/messages"
          className="md:hidden text-gray-1 hover:text-light-1 transition mr-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <Link
          href={conversation.isGroup ? "#" : `/profile/${otherParticipant?.id}`}
          className={`flex items-center gap-3 ${!conversation.isGroup && "hover:opacity-80 transition cursor-pointer"}`}
        >
          <div className="relative h-10 w-10 shrink-0">
            {headerImage ? (
              <Image
                src={headerImage}
                alt={headerName}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-dark-4 flex items-center justify-center">
                <Users className="w-5 h-5 text-light-3" />
              </div>
            )}
          </div>
          <div>
            <p className="text-small-semibold text-light-1">{headerName}</p>
            <p className="text-subtle-medium text-light-3 truncate max-w-xs">
              {headerSubtitle}
            </p>
          </div>
        </Link>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.length === 0 ? (
          <p className="text-center text-light-3 text-small-regular mt-10">
            No messages yet. Say hello!
          </p>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender._id === currentUserMongoId;
            return (
              <div
                key={message._id}
                className={`flex items-end gap-2 group ${isOwn ? "flex-row-reverse" : "flex-row"}`}
              >
                {!isOwn && (
                  <div className="relative h-7 w-7 shrink-0">
                    <Image
                      src={message.sender.image}
                      alt={message.sender.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}
                >
                  {conversation.isGroup && !isOwn && (
                    <p className="text-subtle-medium text-light-3 ml-1">
                      {message.sender.name}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    {isOwn && (
                      <button
                        onClick={() => handleDelete(message._id)}
                        className="opacity-0 group-hover:opacity-100 transition text-gray-1 hover:text-red-500 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl text-small-regular ${
                        isOwn
                          ? "bg-primary-500 text-white rounded-br-sm"
                          : "bg-dark-4 text-light-1 rounded-bl-sm"
                      }`}
                    >
                      {message.text && <p>{message.text}</p>}
                      {message.images?.length > 0 && (
                        <div
                          className={`grid gap-1 mt-1 ${message.images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
                        >
                          {message.images.map((img: string, i: number) => (
                            <div
                              key={i}
                              className="relative aspect-square w-40 cursor-zoom-in"
                              onClick={() => {
                                setLightboxImages(message.images);
                                setLightboxIndex(i);
                              }}
                            >
                              <Image
                                src={img}
                                alt={`image ${i + 1}`}
                                fill
                                className="rounded-lg object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {isOwn && (
                    <p className="text-subtle-medium text-gray-1">
                      {message.readBy?.length > 1 ? "Seen" : "Sent"}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}

        {typingUser && (
          <div className="flex items-center gap-2">
            <div className="bg-dark-4 rounded-2xl rounded-bl-sm px-4 py-2">
              <p className="text-subtle-medium text-light-3">
                {typingUser} is typing...
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Image previews */}
      {imagePreviews.length > 0 && (
        <div className="px-4 pt-2 flex gap-2 flex-wrap border-t border-dark-4">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="relative group w-16 h-16">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                fill
                className="rounded-lg object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition cursor-pointer"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-dark-4 flex items-center gap-3 shrink-0">
        <div className="relative h-8 w-8 shrink-0">
          <Image
            src={currentUserImage}
            alt={currentUserName}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex-1 flex items-center gap-2 bg-dark-3 rounded-full px-4 py-2">
          <textarea
            value={text}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-transparent text-light-1 text-small-regular outline-none resize-none placeholder:text-gray-1"
            disabled={isSending}
          />
          <EmojiPicker
            onEmojiSelect={(emoji) => setText((prev) => prev + emoji)}
          />
          {files.length < 4 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-light-3 hover:text-primary-500 transition cursor-pointer shrink-0"
              disabled={isSending}
            >
              <Paperclip className="w-4 h-4" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={isSending || (!text.trim() && files.length === 0)}
          className="bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-full p-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition cursor-pointer"
            onClick={() => setLightboxIndex(null)}
          >
            <X className="w-8 h-8" />
          </button>

          {lightboxImages.length > 1 && (
            <p className="absolute top-4 left-1/2 -translate-x-1/2 text-white text-small-regular">
              {lightboxIndex + 1} / {lightboxImages.length}
            </p>
          )}

          <div
            className="relative w-full max-w-3xl max-h-[85vh] aspect-square mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={lightboxImages[lightboxIndex]}
              alt={`Image ${lightboxIndex + 1}`}
              fill
              className="object-contain"
            />
          </div>

          {lightboxImages.length > 1 && (
            <>
              <button
                className="absolute left-4 text-white hover:text-gray-300 transition cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) =>
                    i! > 0 ? i! - 1 : lightboxImages.length - 1,
                  );
                }}
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                className="absolute right-4 text-white hover:text-gray-300 transition cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) =>
                    i! < lightboxImages.length - 1 ? i! + 1 : 0,
                  );
                }}
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
