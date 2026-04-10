"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";

interface Props {
  conversations: any[];
  currentUserMongoId: string;
  activeConversationId?: string;
}

function getConversationDisplay(convo: any, currentUserMongoId: string) {
  if (convo.isGroup) {
    const participantNames = convo.participants
      .filter((p: any) => p._id !== currentUserMongoId)
      .slice(0, 3)
      .map((p: any) => p.name)
      .join(", ");
    return {
      name: convo.name,
      image: convo.image || null,
      subtitle: participantNames,
      isGroup: true,
    };
  }
  const other = convo.participants.find(
    (p: any) => p._id !== currentUserMongoId,
  );
  return {
    name: other?.name || "Unknown",
    image: other?.image || null,
    subtitle: `@${other?.username || ""}`,
    isGroup: false,
  };
}

export default function ConversationList({
  conversations,
  currentUserMongoId,
  activeConversationId,
}: Props) {
  const router = useRouter();

  return (
    <div
      className={`${
        activeConversationId ? "hidden md:flex" : "flex"
      } w-full md:w-80 shrink-0 border-r border-dark-4 flex-col h-full`}
    >
      {/* Header */}
      <div className="p-4 border-b border-dark-4 flex items-center justify-between">
        <h2 className="text-heading4-medium text-light-1">Messages</h2>
        <button
          onClick={() => router.push("/messages/new")}
          className="text-primary-500 hover:text-primary-400 transition text-sm font-medium cursor-pointer"
        >
          + New
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="text-center text-light-3 text-small-regular mt-10">
            No conversations yet
          </p>
        ) : (
          conversations.map((convo) => {
            const display = getConversationDisplay(convo, currentUserMongoId);
            const unread =
              convo.unreadCounts?.find(
                (u: any) => u.user === currentUserMongoId,
              )?.count || 0;
            const isActive = convo._id === activeConversationId;

            return (
              <Link
                key={convo._id}
                href={`/messages/${convo._id}`}
                className={`flex items-center gap-3 p-4 hover:bg-dark-3 transition cursor-pointer ${
                  isActive ? "bg-dark-3" : ""
                }`}
              >
                <div className="relative h-12 w-12 shrink-0">
                  {display.image ? (
                    <Image
                      src={display.image}
                      alt={display.name}
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-dark-4 flex items-center justify-center">
                      <Users className="w-5 h-5 text-light-3" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-small-semibold text-light-1 truncate">
                      {display.name}
                    </p>
                    {unread > 0 && (
                      <span className="ml-2 bg-primary-500 text-white text-xs rounded-full px-1.5 py-0.5 shrink-0">
                        {unread}
                      </span>
                    )}
                  </div>
                  <p className="text-subtle-medium text-light-3 truncate">
                    {display.subtitle}
                  </p>
                  {convo.lastMessage && (
                    <p className="text-subtle-medium text-gray-1 truncate mt-0.5">
                      {convo.lastMessage.text || "📷 Image"}
                    </p>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
