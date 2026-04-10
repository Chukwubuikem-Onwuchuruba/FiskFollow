import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import {
  fetchConversations,
  fetchMessages,
} from "@/lib/actions/message.actions";
import ConversationList from "@/components/messaging/ConversationList";
import ChatWindow from "@/components/messaging/ChatWindow";
import Conversation from "@/lib/models/conversation.model";
import { connectToDB } from "@/lib/mongoose";
import User from "@/lib/models/user.model";

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const userMongoId = userInfo._id.toString();
  const conversations = await fetchConversations(userMongoId);
  const messages = await fetchMessages(id);

  // Fetch current conversation details
  connectToDB();
  const conversation = await Conversation.findById(id).populate({
    path: "participants",
    model: User,
    select: "id name image username",
  });

  if (!conversation) redirect("/messages");

  const isParticipant = conversation.participants.some(
    (p: any) => p._id.toString() === userMongoId,
  );
  if (!isParticipant) redirect("/messages");

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      <ConversationList
        conversations={conversations}
        currentUserMongoId={userMongoId}
        activeConversationId={id}
      />
      <div className="flex flex-1 w-full">
        <ChatWindow
          conversation={JSON.parse(JSON.stringify(conversation))}
          initialMessages={messages}
          currentUserMongoId={userMongoId}
          currentUserImage={userInfo.image}
          currentUserName={userInfo.name}
        />
      </div>
    </div>
  );
}

export default ChatPage;
