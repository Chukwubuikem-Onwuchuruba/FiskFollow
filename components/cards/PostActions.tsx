"use client";

import { useState, useTransition } from "react";
import { Heart, Repeat2 } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  likePost,
  unlikePost,
  repostPost,
  unrepostPost,
} from "@/lib/actions/post.actions";

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

  const handleLike = () => {
    startLikeTransition(async () => {
      if (isLiked) {
        setLikes((prev) => prev.filter((id) => id !== currentUserMongoId));
        await unlikePost(postId, currentUserMongoId, pathname);
      } else {
        setLikes((prev) => [...prev, currentUserMongoId]);
        await likePost(postId, currentUserMongoId, pathname);
      }
    });
  };

  const handleRepost = () => {
    startRepostTransition(async () => {
      if (isReposted) {
        setReposts((prev) => prev.filter((id) => id !== currentUserMongoId));
        await unrepostPost(postId, currentUserMongoId, pathname);
      } else {
        setReposts((prev) => [...prev, currentUserMongoId]);
        await repostPost(postId, currentUserMongoId, pathname);
      }
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
