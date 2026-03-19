"use client";

import { useState, useTransition, useEffect } from "react";
import { Heart, Repeat2 } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  likePost,
  unlikePost,
  repostPost,
  unrepostPost,
} from "@/lib/actions/post.actions";
import { getSocket } from "@/lib/socket";

interface Props {
  postId: string;
  currentUserId: string;
  initialLikes: string[];
  initialReposts: string[];
  currentUserMongoId: string;
}

export default function PostActions({
  postId,
  currentUserId,
  initialLikes,
  initialReposts,
  currentUserMongoId,
}: Props) {
  const pathname = usePathname();
  const [likes, setLikes] = useState(initialLikes);
  const [reposts, setReposts] = useState(initialReposts);
  const [isPendingLike, startLikeTransition] = useTransition();
  const [isPendingRepost, startRepostTransition] = useTransition();

  const isLiked = likes.includes(currentUserMongoId);
  const isReposted = reposts.includes(currentUserMongoId);

  // Listen for real-time updates from other users
  useEffect(() => {
    const socket = getSocket();

    socket.on(
      "post:likesUpdated",
      (data: { postId: string; likes: string[] }) => {
        if (data.postId === postId) {
          setLikes(data.likes);
        }
      },
    );

    socket.on(
      "post:repostsUpdated",
      (data: { postId: string; reposts: string[] }) => {
        if (data.postId === postId) {
          setReposts(data.reposts);
        }
      },
    );

    return () => {
      socket.off("post:likesUpdated");
      socket.off("post:repostsUpdated");
    };
  }, [postId]);

  const handleLike = () => {
    startLikeTransition(async () => {
      const newLikes = isLiked
        ? likes.filter((id) => id !== currentUserMongoId)
        : [...likes, currentUserMongoId];

      setLikes(newLikes);

      if (isLiked) {
        await unlikePost(postId, currentUserMongoId, pathname);
      } else {
        await likePost(postId, currentUserMongoId, pathname);
      }

      // Broadcast updated likes to everyone
      const socket = getSocket();
      socket.emit("post:liked", { postId, likes: newLikes });
    });
  };

  const handleRepost = () => {
    startRepostTransition(async () => {
      const newReposts = isReposted
        ? reposts.filter((id) => id !== currentUserMongoId)
        : [...reposts, currentUserMongoId];

      setReposts(newReposts);

      if (isReposted) {
        await unrepostPost(postId, currentUserMongoId, pathname);
      } else {
        await repostPost(postId, currentUserMongoId, pathname);
      }

      // Broadcast updated reposts to everyone
      const socket = getSocket();
      socket.emit("post:reposted", { postId, reposts: newReposts });
    });
  };

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={handleLike}
        disabled={isPendingLike}
        className="flex items-center gap-1 cursor-pointer"
      >
        <Heart
          className={`w-6 h-6 transition ${
            isLiked
              ? "fill-red-500 text-red-500"
              : "text-light-2 hover:text-red-500"
          }`}
        />
        {likes.length > 0 && (
          <span className="text-subtle-medium text-gray-1">{likes.length}</span>
        )}
      </button>

      <button
        onClick={handleRepost}
        disabled={isPendingRepost}
        className="flex items-center gap-1 cursor-pointer"
      >
        <Repeat2
          className={`w-6 h-6 transition ${
            isReposted ? "text-green-500" : "text-light-2 hover:text-green-500"
          }`}
        />
        {reposts.length > 0 && (
          <span className="text-subtle-medium text-gray-1">
            {reposts.length}
          </span>
        )}
      </button>
    </div>
  );
}
