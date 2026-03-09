"use server";

import { revalidatePath } from "next/cache";
import { connectToDB } from "../mongoose";
import Conversation from "../models/conversation.model";
import Message from "../models/message.model";
import User from "../models/user.model";

// Get or create a DM conversation between two users
export async function getOrCreateDM(
  userMongoId: string,
  otherUserMongoId: string,
) {
  try {
    connectToDB();

    // Look for existing DM between these two users
    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [userMongoId, otherUserMongoId], $size: 2 },
    });

    if (existing) return JSON.parse(JSON.stringify(existing));

    const conversation = await Conversation.create({
      isGroup: false,
      participants: [userMongoId, otherUserMongoId],
      unreadCounts: [
        { user: userMongoId, count: 0 },
        { user: otherUserMongoId, count: 0 },
      ],
    });

    return JSON.parse(JSON.stringify(conversation));
  } catch (error: any) {
    throw new Error(`Failed to get or create DM: ${error.message}`);
  }
}

// Create a group conversation
export async function createGroupConversation({
  name,
  image,
  participantIds,
  creatorId,
}: {
  name: string;
  image?: string;
  participantIds: string[];
  creatorId: string;
}) {
  try {
    connectToDB();

    const allParticipants = Array.from(new Set([creatorId, ...participantIds]));

    const conversation = await Conversation.create({
      isGroup: true,
      name,
      image: image || null,
      participants: allParticipants,
      admins: [creatorId],
      unreadCounts: allParticipants.map((id) => ({ user: id, count: 0 })),
    });

    return JSON.parse(JSON.stringify(conversation));
  } catch (error: any) {
    throw new Error(`Failed to create group conversation: ${error.message}`);
  }
}

// Fetch all conversations for a user
export async function fetchConversations(userMongoId: string) {
  try {
    connectToDB();

    const conversations = await Conversation.find({
      participants: userMongoId,
    })
      .populate({
        path: "participants",
        model: User,
        select: "id name image username",
      })
      .populate({
        path: "lastMessage",
        model: Message,
        populate: { path: "sender", model: User, select: "name image" },
      })
      .sort({ updatedAt: -1 });

    return JSON.parse(JSON.stringify(conversations));
  } catch (error: any) {
    throw new Error(`Failed to fetch conversations: ${error.message}`);
  }
}

// Fetch messages for a conversation
export async function fetchMessages(conversationId: string) {
  try {
    connectToDB();

    const messages = await Message.find({
      conversation: conversationId,
      deleted: false,
    })
      .populate({ path: "sender", model: User, select: "id name image" })
      .sort({ createdAt: 1 });

    return JSON.parse(JSON.stringify(messages));
  } catch (error: any) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
}

// Send a message
export async function sendMessage({
  conversationId,
  senderMongoId,
  text,
  images = [],
}: {
  conversationId: string;
  senderMongoId: string;
  text?: string;
  images?: string[];
}) {
  try {
    connectToDB();

    const message = await Message.create({
      conversation: conversationId,
      sender: senderMongoId,
      text,
      images,
      readBy: [senderMongoId],
    });

    // Update last message and increment unread for everyone except sender
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        lastMessage: message._id,
        $inc: { "unreadCounts.$[elem].count": 1 },
      },
      {
        arrayFilters: [{ "elem.user": { $ne: senderMongoId } }],
      },
    );

    await message.populate({
      path: "sender",
      model: User,
      select: "id name image",
    });

    return JSON.parse(JSON.stringify(message));
  } catch (error: any) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
}

export async function markConversationAsRead(
  conversationId: string,
  userMongoId: string,
) {
  try {
    connectToDB();

    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: userMongoId } },
      { $addToSet: { readBy: userMongoId } },
    );

    await Conversation.findOneAndUpdate(
      { _id: conversationId, "unreadCounts.user": userMongoId },
      { $set: { "unreadCounts.$.count": 0 } },
    );

    revalidatePath("/messages");
    revalidatePath("/"); // revalidates layout
  } catch (error: any) {
    throw new Error(`Failed to mark as read: ${error.message}`);
  }
}

// Delete a message (soft delete)
export async function deleteMessage(messageId: string, userMongoId: string) {
  try {
    connectToDB();

    const message = await Message.findById(messageId);
    if (!message) throw new Error("Message not found");
    if (message.sender.toString() !== userMongoId)
      throw new Error("Unauthorized");

    message.deleted = true;
    await message.save();

    revalidatePath("/messages");
  } catch (error: any) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

// Get total unread count for a user (for sidebar dot)
export async function getTotalUnreadCount(userMongoId: string) {
  try {
    connectToDB();

    const conversations = await Conversation.find({
      participants: userMongoId,
      "unreadCounts.user": userMongoId,
    });

    const total = conversations.reduce((acc, convo) => {
      const entry = convo.unreadCounts.find(
        (u: any) => u.user.toString() === userMongoId,
      );
      return acc + (entry?.count || 0);
    }, 0);

    return total;
  } catch (error: any) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }
}
