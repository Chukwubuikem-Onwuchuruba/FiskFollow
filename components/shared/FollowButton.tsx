"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { followUser, unfollowUser } from "@/lib/actions/follower.actions";
import { Button } from "@/components/ui/button";
import { getSocket } from "@/lib/socket";

interface FollowButtonProps {
  followerId: string;
  followingId: string;
  initialIsFollowing?: boolean;
  initialFollowersCount?: number;
}

function FollowButton({
  followerId,
  followingId,
  initialIsFollowing = false,
  initialFollowersCount = 0,
}: FollowButtonProps) {
  const [isFollowingState, setIsFollowingState] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      if (isFollowingState) {
        await unfollowUser({
          followerId,
          followingId,
          path: window.location.pathname,
        });
        setIsFollowingState(false);

        const socket = getSocket();
        socket.emit("user:unfollowed", {
          followingId,
          followersCount: initialFollowersCount - 1,
        });
      } else {
        await followUser({
          followerId,
          followingId,
          path: window.location.pathname,
        });
        setIsFollowingState(true);

        const socket = getSocket();
        socket.emit("user:followed", {
          followingId,
          followersCount: initialFollowersCount + 1,
        });
      }
      router.refresh();
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleFollow}
      disabled={isLoading}
      className={`${isFollowingState ? "bg-dark-4" : "bg-primary-500"} text-light-1 cursor-pointer`}
    >
      {isLoading ? "Loading..." : isFollowingState ? "Unfollow" : "Follow"}
    </Button>
  );
}

export default FollowButton;
