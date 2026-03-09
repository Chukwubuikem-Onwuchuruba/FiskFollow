import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import NewConversation from "@/components/messaging/NewConversation";

async function NewConversationPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const { users } = await fetchUsers({
    userId: user.id,
    pageSize: 50,
  });

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden">
      <div className="w-full md:w-80 shrink-0 border-r border-dark-4">
        <NewConversation
          users={JSON.parse(JSON.stringify(users))}
          currentUserMongoId={userInfo._id.toString()}
        />
      </div>
      <div className="hidden md:flex flex-1 items-center justify-center text-light-3">
        <p className="text-base-regular">
          Select people to start a conversation
        </p>
      </div>
    </div>
  );
}

export default NewConversationPage;
