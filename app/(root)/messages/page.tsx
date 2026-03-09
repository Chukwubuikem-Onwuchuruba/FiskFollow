import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import { fetchConversations } from "@/lib/actions/message.actions";
import ConversationList from "@/components/messaging/ConversationList";

async function MessagesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const conversations = await fetchConversations(userInfo._id.toString());

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      <ConversationList
        conversations={conversations}
        currentUserMongoId={userInfo._id.toString()}
      />
      <div className="hidden md:flex flex-1 items-center justify-center text-light-3">
        <p className="text-base-regular">
          Select a conversation to start messaging
        </p>
      </div>
    </div>
  );
}

export default MessagesPage;
