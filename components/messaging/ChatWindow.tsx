"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Send, Trash2, Users } from "lucide-react";
import {
  sendMessage,
  deleteMessage,
  markConversationAsRead,
} from "@/lib/actions/message.actions";
import { getSocket } from "@/lib/socket";
import Link from "next/link";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Mark messages as read when opening conversation
    markConversationAsRead(conversation._id, currentUserMongoId);
    socket.emit("message:read", {
      conversationId: conversation._id,
      userMongoId: currentUserMongoId,
    });

    // Receive new messages
    socket.on("message:receive", (message: any) => {
      setMessages((prev) => [...prev, message]);
      // Mark as read immediately since we're in the conversation
      markConversationAsRead(conversation._id, currentUserMongoId);
      socket.emit("message:read", {
        conversationId: conversation._id,
        userMongoId: currentUserMongoId,
      });
    });

    // Typing indicators
    socket.on("typing:start", ({ userName }: { userName: string }) => {
      setTypingUser(userName);
    });

    socket.on("typing:stop", () => {
      setTypingUser(null);
    });

    // Read receipts
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

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

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
    if (!text.trim()) return;
    setIsSending(true);

    // Stop typing indicator
    const socket = getSocket();
    socket.emit("typing:stop", { conversationId: conversation._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    try {
      const newMessage = await sendMessage({
        conversationId: conversation._id,
        senderMongoId: currentUserMongoId,
        text: text.trim(),
      });

      setMessages((prev) => [...prev, newMessage]);
      setText("");

      // Broadcast to others in the room
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
                        className="opacity-0 group-hover:opacity-100 transition text-gray-1 hover:text-red-500"
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
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          {message.images.map((img: string, i: number) => (
                            <div key={i} className="relative aspect-square">
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

        {/* Typing indicator */}
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
        </div>
        <button
          onClick={handleSend}
          disabled={isSending || !text.trim()}
          className="bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition rounded-full p-2 cursor-pointer"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
