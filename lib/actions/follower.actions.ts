"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import User from "../models/user.model";

export async function followUser({
  followerId, // The user who is following
  followingId, // The user being followed
  path,
}: {
  followerId: string;
  followingId: string;
  path: string;
}) {
  try {
    connectToDB();

    // Add to following array of follower
    await User.findByIdAndUpdate(followerId, {
      $addToSet: { following: followingId },
    });

    // Add to followers array of followed user
    await User.findByIdAndUpdate(followingId, {
      $addToSet: { followers: followerId },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to follow user: ${error.message}`);
  }
}

export async function unfollowUser({
  followerId,
  followingId,
  path,
}: {
  followerId: string;
  followingId: string;
  path: string;
}) {
  try {
    connectToDB();

    // Remove from following array of follower
    await User.findByIdAndUpdate(followerId, {
      $pull: { following: followingId },
    });

    // Remove from followers array of followed user
    await User.findByIdAndUpdate(followingId, {
      $pull: { followers: followerId },
    });

    revalidatePath(path);
  } catch (error: any) {
    throw new Error(`Failed to unfollow user: ${error.message}`);
  }
}

export async function fetchFollowers(userId: string) {
  try {
    connectToDB();

    const user = await User.findById(userId).populate({
      path: "followers",
      model: User,
      select: "id name username image",
    });

    return user?.followers || [];
  } catch (error: any) {
    throw new Error(`Failed to fetch followers: ${error.message}`);
  }
}

export async function fetchFollowing(userId: string) {
  try {
    connectToDB();

    const user = await User.findById(userId).populate({
      path: "following",
      model: User,
      select: "id name username image",
    });

    return user?.following || [];
  } catch (error: any) {
    throw new Error(`Failed to fetch following: ${error.message}`);
  }
}

export async function isFollowing({
  followerId,
  followingId,
}: {
  followerId: string;
  followingId: string;
}) {
  try {
    connectToDB();

    const user = await User.findById(followerId);
    return (
      user?.following.some((id: any) => id.toString() === followingId) || false
    );
  } catch (error: any) {
    throw new Error(`Failed to check follow status: ${error.message}`);
  }
}
