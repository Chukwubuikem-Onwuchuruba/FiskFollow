"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { getSocket } from "@/lib/socket";

interface User {
  id: string;
  name: string;
  username: string;
  image: string;
}

interface Props {
  profileUserId: string;
  followers: User[];
  following: User[];
  followersCount: number;
  followingCount: number;
}

export default function FollowListModal({
  profileUserId,
  followers,
  following,
  followersCount,
  followingCount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"followers" | "following">("followers");
  const [localFollowersCount, setLocalFollowersCount] =
    useState(followersCount);

  useEffect(() => {
    setLocalFollowersCount(followersCount);
  }, [followersCount]);

  useEffect(() => {
    const socket = getSocket();

    socket.on(
      "user:followersUpdated",
      (data: { followingId: string; followersCount: number }) => {
        if (data.followingId === profileUserId) {
          setLocalFollowersCount(data.followersCount);
        }
      },
    );

    return () => {
      socket.off("user:followersUpdated");
    };
  }, [profileUserId]);

  const openFollowers = () => {
    setTab("followers");
    setOpen(true);
  };
  const openFollowing = () => {
    setTab("following");
    setOpen(true);
  };
  const list = tab === "followers" ? followers : following;

  return (
    <>
      <div className="flex gap-8 mt-2">
        <button
          onClick={openFollowers}
          className="flex flex-col items-center cursor-pointer hover:opacity-80 transition"
        >
          <span className="text-light-1 text-small-semibold">
            {localFollowersCount}
          </span>
          <span className="text-gray-1 text-subtle-medium">Followers</span>
        </button>
        <button
          onClick={openFollowing}
          className="flex flex-col items-center cursor-pointer hover:opacity-80 transition"
        >
          <span className="text-light-1 text-small-semibold">
            {followingCount}
          </span>
          <span className="text-gray-1 text-subtle-medium">Following</span>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-dark-2 rounded-xl w-full max-w-md mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-dark-4">
              <div className="flex gap-6">
                <button
                  onClick={() => setTab("followers")}
                  className={`text-small-semibold transition ${
                    tab === "followers"
                      ? "text-light-1 border-b-2 border-primary-500 pb-1"
                      : "text-gray-1"
                  }`}
                >
                  Followers
                </button>
                <button
                  onClick={() => setTab("following")}
                  className={`text-small-semibold transition ${
                    tab === "following"
                      ? "text-light-1 border-b-2 border-primary-500 pb-1"
                      : "text-gray-1"
                  }`}
                >
                  Following
                </button>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-1 hover:text-light-1 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto max-h-96">
              {list.length === 0 ? (
                <p className="text-center text-light-3 text-small-regular py-10">
                  {tab === "followers"
                    ? "No followers yet"
                    : "Not following anyone yet"}
                </p>
              ) : (
                list.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 p-4 hover:bg-dark-3 transition"
                  >
                    <div className="relative h-10 w-10 shrink-0">
                      <Image
                        src={user.image}
                        alt={user.name}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-small-semibold text-light-1">
                        {user.name}
                      </p>
                      <p className="text-subtle-medium text-gray-1">
                        @{user.username}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
