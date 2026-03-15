import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { fetchUser } from "@/lib/actions/user.actions";
import AccountProfile from "@/components/forms/AccountProfile";

async function Page() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const userData = {
    id: user.id,
    objectId: userInfo._id.toString(),
    username: userInfo.username || "",
    name: userInfo.name || "",
    bio: userInfo.bio || "",
    image: userInfo.image || user.imageUrl,
    classification: userInfo.classification || "",
  };

  return (
    <section className="mx-auto max-w-3xl flex flex-col justify-start px-10 py-20">
      <h1 className="head-text">Edit Profile</h1>
      <p className="mt-3 text-base-regular text-light-2">
        Update your profile information
      </p>

      <section className="mt-9 bg-dark-2 p-10 rounded-xl">
        <AccountProfile user={userData} btnTitle="Save Changes" />
      </section>
    </section>
  );
}

export default Page;
