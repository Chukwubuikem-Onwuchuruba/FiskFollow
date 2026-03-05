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

// Almost similar to Post (search + pagination) and Community (search + pagination)
export async function fetchUsers({
  userId,
  searchString = "",
  pageNumber = 1,
  pageSize = 20,
  sortBy = "desc",
}: {
  userId: string;
  searchString?: string;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: SortOrder;
}) {
  try {
    connectToDB();

    // Calculate the number of users to skip based on the page number and page size.
    const skipAmount = (pageNumber - 1) * pageSize;

    // Create a case-insensitive regular expression for the provided search string.
    const regex = new RegExp(searchString, "i");

    // Create an initial query object to filter users.
    const query: QueryFilter<typeof User> = {
      id: { $ne: userId }, // Exclude the current user from the results.
    };

    // If the search string is not empty, add the $or operator to match either username or name fields.
    if (searchString.trim() !== "") {
      query.$or = [
        { username: { $regex: regex } },
        { name: { $regex: regex } },
      ];
    }

    // Define the sort options for the fetched users based on createdAt field and provided sort order.
    const sortOptions = { createdAt: sortBy };

    const usersQuery = User.find(query)
      .sort(sortOptions)
      .skip(skipAmount)
      .limit(pageSize);

    // Count the total number of users that match the search criteria (without pagination).
    const totalUsersCount = await User.countDocuments(query);

    const users = await usersQuery.exec();

    // Check if there are more users beyond the current page.
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

    // Find all posts created by the user
    const userPosts = await Post.find({ author: userId });

    // Collect all the child post ids (replies) from the 'children' field of each user post
    const childPostIds = userPosts.reduce((acc, userPost) => {
      return acc.concat(userPost.children);
    }, []);

    // Find and return the child posts (replies) excluding the ones created by the same user
    const replies = await Post.find({
      _id: { $in: childPostIds },
      author: { $ne: userId }, // Exclude posts authored by the same user
    }).populate({
      path: "author",
      model: User,
      select: "name image _id",
    });

    return replies;
  } catch (error) {
    console.error("Error fetching replies: ", error);
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
