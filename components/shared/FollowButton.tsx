"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  followUser,
  unfollowUser,
  isFollowing,
} from "@/lib/actions/follower.actions";
import { Button } from "@/components/ui/button";

interface FollowButtonProps {
  followerId: string; // Current user's MongoDB _id
  followingId: string; // Profile user's MongoDB _id
  initialIsFollowing?: boolean;
}

function FollowButton({
  followerId,
  followingId,
  initialIsFollowing = false,
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
      } else {
        await followUser({
          followerId,
          followingId,
          path: window.location.pathname,
        });
      }
      setIsFollowingState(!isFollowingState);
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
      className={`${isFollowingState ? "bg-dark-4" : "bg-primary-500"} text-light-1`}
    >
      {isLoading ? "Loading..." : isFollowingState ? "Unfollow" : "Follow"}
    </Button>
  );
}

export default FollowButton;
