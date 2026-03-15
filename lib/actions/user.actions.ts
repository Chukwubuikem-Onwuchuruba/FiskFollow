"use server";

import { QueryFilter, SortOrder } from "mongoose";
import { revalidatePath } from "next/cache";

import Community from "../models/community.model";
import Post from "../models/post.model";
import User from "../models/user.model";

import { connectToDB } from "../mongoose";

export async function fetchUser(userId: string) {
  try {
    connectToDB();

    return await User.findOne({ id: userId })
      .populate({
        path: "communities",
        model: Community,
      })
      .populate({
        path: "posts",
        model: Post,
      })
      .populate({
        path: "followers",
        model: User,
        select: "id name username image",
      })
      .populate({
        path: "following",
        model: User,
        select: "id name username image",
      });
  } catch (error: any) {
    throw new Error(`Failed to fetch user: ${error.message}`);
  }
}

interface Params {
  userId: string;
  username: string;
  name: string;
  bio: string;
  image: string;
  path: string;
  classification: string;
}

export async function updateUser({
  userId,
  bio,
  name,
  path,
  username,
  image,
  classification,
}: Params): Promise<void> {
  try {
    connectToDB();

    await User.findOneAndUpdate(
      { id: userId },
      {
        username: username.toLowerCase(),
        name,
        bio,
        image,
        classification,
        onboarded: true,
      },
      { upsert: true },
    );

    if (path === "/profile/edit") {
      revalidatePath(path);
    }
  } catch (error: any) {
    throw new Error(`Failed to create/update user: ${error.message}`);
  }
}

export async function fetchUserPosts(userId: string) {
  try {
    connectToDB();

    const user = await User.findOne({ id: userId })
      .populate({
        path: "posts",
        model: Post,
        populate: [
          { path: "community", model: Community, select: "name id image _id" },
          {
            path: "children",
            model: Post,
            populate: { path: "author", model: User, select: "name image id" },
          },
        ],
      })
      .populate({
        path: "repostedPosts",
        model: Post,
        populate: [
          { path: "author", model: User, select: "name image id" },
          { path: "community", model: Community, select: "name id image _id" },
          {
            path: "children",
            model: Post,
            populate: { path: "author", model: User, select: "name image id" },
          },
        ],
      });

    if (!user) return { name: "", image: "", id: "", posts: [] };

    const ownPosts = (user.posts || []).map((p: any) => ({
      ...p.toObject(),
      isRepost: false,
    }));

    const ownPostIds = new Set(ownPosts.map((p: any) => p._id.toString()));

    const reposted = (user.repostedPosts || [])
      .filter((p: any) => !ownPostIds.has(p._id.toString())) // exclude own posts
      .map((p: any) => ({
        ...p.toObject(),
        isRepost: true,
      }));

    const allPosts = [...ownPosts, ...reposted].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return { name: user.name, image: user.image, id: user.id, posts: allPosts };
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return { name: "", image: "", id: userId, posts: [] };
  }
}

export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
  excludeIds = [],
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
  excludeIds?: string[];
}) {
  try {
    connectToDB();

    const skipAmount = (pageNumber - 1) * pageSize;
    const regex = new RegExp(searchString, "i");

    const query: QueryFilter<typeof User> = {
      id: { $ne: userId },
      ...(excludeIds.length > 0 && { _id: { $nin: excludeIds } }),
    };

    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    const sortOptions = { createdAt: sortBy };
    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    const totalUsersCount = await User.countDocuments(query);
    const users = await usersQuery.exec();
    const isNext = totalUsersCount > skipAmount + users.length;

    return { users, isNext };
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function getActivity(userId: string) {
  try {
    connectToDB();

    const userPosts = await Post.find({ author: userId });
    const userPostIds = userPosts.map((p) => p._id);

    // Replies: comments on user's posts by other people
    const childPostIds = userPosts.reduce((acc: any[], userPost) => {
      return acc.concat(userPost.children);
    }, []);

    const replies = await Post.find({
      _id: { $in: childPostIds },
      author: { $ne: userId },
    }).populate({ path: "author", model: User, select: "name image _id id" });

    const replyActivities = replies.map((r) => ({
      _id: r._id.toString(),
      type: "reply" as const,
      author: r.author,
      postId: r.parentId,
      createdAt: r.createdAt,
    }));

    // Likes: other users who liked any of the user's posts
    const likedPosts = await Post.find({
      _id: { $in: userPostIds },
      likes: { $exists: true, $ne: [] },
    }).populate({ path: "likes", model: User, select: "name image _id id" });

    const likeActivities: any[] = [];
    for (const post of likedPosts) {
      for (const liker of post.likes) {
        if (liker._id.toString() === userId.toString()) continue;
        likeActivities.push({
          _id: `like-${post._id}-${liker._id}`,
          type: "like" as const,
          author: liker,
          postId: post._id.toString(),
          createdAt: post.createdAt,
        });
      }
    }

    // Reposts: other users who reposted any of the user's posts
    const repostedPosts = await Post.find({
      _id: { $in: userPostIds },
      reposts: { $exists: true, $ne: [] },
    }).populate({ path: "reposts", model: User, select: "name image _id id" });

    const repostActivities: any[] = [];
    for (const post of repostedPosts) {
      for (const reposter of post.reposts) {
        if (reposter._id.toString() === userId.toString()) continue;
        repostActivities.push({
          _id: `repost-${post._id}-${reposter._id}`,
          type: "repost" as const,
          author: reposter,
          postId: post._id.toString(),
          createdAt: post.createdAt,
        });
      }
    }

    // Merge and sort by most recent
    const allActivity = [
      ...replyActivities,
      ...likeActivities,
      ...repostActivities,
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return allActivity;
  } catch (error) {
    console.error("Error fetching activity: ", error);
    throw error;
  }
}

export async function fetchUserLikedPosts(userId: string) {
  try {
    connectToDB();

    const user = await User.findOne({ id: userId }).populate({
      path: "likedPosts",
      model: Post,
      populate: [
        { path: "author", model: User, select: "name image id" },
        { path: "community", model: Community, select: "name id image _id" },
        {
          path: "children",
          model: Post,
          populate: { path: "author", model: User, select: "name image id" },
        },
      ],
    });

    return user?.likedPosts || [];
  } catch (error) {
    console.error("Error fetching liked posts:", error);
    return [];
  }
}

export async function fetchUserMediaPosts(userId: string) {
  try {
    connectToDB();

    const user = await User.findOne({ id: userId }).populate({
      path: "posts",
      model: Post,
      populate: [
        { path: "author", model: User, select: "name image id" },
        { path: "community", model: Community, select: "name id image _id" },
        {
          path: "children",
          model: Post,
          populate: { path: "author", model: User, select: "name image id" },
        },
      ],
    });

    if (!user) return [];

    return (user.posts || []).filter(
      (post: any) => post.images && post.images.length > 0,
    );
  } catch (error) {
    console.error("Error fetching media posts:", error);
    return [];
  }
}
