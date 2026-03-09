"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, X, Users, ChevronRight } from "lucide-react";
import {
  getOrCreateDM,
  createGroupConversation,
} from "@/lib/actions/message.actions";

interface Props {
  users: any[];
  currentUserMongoId: string;
}

export default function NewConversation({ users, currentUserMongoId }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any[]>([]);
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleUser = (user: any) => {
    setSelected((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  };

  // Auto-switch to group mode if more than 1 selected
  const handleToggle = (user: any) => {
    const newSelected = selected.find((u) => u._id === user._id)
      ? selected.filter((u) => u._id !== user._id)
      : [...selected, user];

    setSelected(newSelected);
    if (newSelected.length > 1) setIsGroup(true);
    if (newSelected.length <= 1) setIsGroup(false);
  };

  const handleStart = async () => {
    if (selected.length === 0) return;
    setIsCreating(true);

    try {
      if (selected.length === 1 && !isGroup) {
        // DM
        const convo = await getOrCreateDM(currentUserMongoId, selected[0]._id);
        router.push(`/messages/${convo._id}`);
      } else {
        // Group chat
        if (!groupName.trim()) return;
        const convo = await createGroupConversation({
          name: groupName.trim(),
          participantIds: selected.map((u) => u._id),
          creatorId: currentUserMongoId,
        });
        router.push(`/messages/${convo._id}`);
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-dark-4">
        <h2 className="text-heading4-medium text-light-1 mb-3">New Message</h2>

        {/* Selected users chips */}
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selected.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-1 bg-primary-500 rounded-full px-2 py-1"
              >
                <p className="text-subtle-medium text-white">{u.name}</p>
                <button onClick={() => handleToggle(u)}>
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Group name input - shows when more than 1 selected */}
        {isGroup && (
          <input
            type="text"
            placeholder="Group name (required)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full bg-dark-3 text-light-1 text-small-regular rounded-lg px-3 py-2 outline-none placeholder:text-gray-1 mb-3"
          />
        )}

        {/* Search */}
        <div className="flex items-center gap-2 bg-dark-3 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-1 shrink-0" />
          <input
            type="text"
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-light-1 text-small-regular outline-none flex-1 placeholder:text-gray-1"
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-light-3 text-small-regular mt-10">
            No users found
          </p>
        ) : (
          filtered.map((user) => {
            const isSelected = selected.find((u) => u._id === user._id);
            return (
              <button
                key={user._id}
                onClick={() => handleToggle(user)}
                className="w-full flex items-center gap-3 p-4 hover:bg-dark-3 transition"
              >
                <div className="relative h-10 w-10 shrink-0">
                  <Image
                    src={user.image}
                    alt={user.name}
                    fill
                    className="rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-small-semibold text-light-1">
                    {user.name}
                  </p>
                  <p className="text-subtle-medium text-light-3">
                    @{user.username}
                  </p>
                </div>
                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "bg-primary-500 border-primary-500"
                      : "border-dark-4"
                  }`}
                >
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Start button */}
      {selected.length > 0 && (
        <div className="p-4 border-t border-dark-4">
          <button
            onClick={handleStart}
            disabled={isCreating || (isGroup && !groupName.trim())}
            className="w-full bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-small-semibold rounded-lg py-3 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isCreating ? (
              "Creating..."
            ) : (
              <>
                {isGroup ? (
                  <>
                    <Users className="w-4 h-4" />
                    Create Group
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    Start Chat
                  </>
                )}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
