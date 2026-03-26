import Image from "next/image";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { profileTabs } from "@/constants";

import PostsTab from "@/components/shared/PostsTab";
import ProfileHeader from "@/components/shared/ProfileHeader";
import FollowButton from "@/components/shared/FollowButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { fetchUser } from "@/lib/actions/user.actions";
import LikesTab from "@/components/shared/LikesTab";
import MediaTab from "@/components/shared/MediaTab";
import { isFollowing } from "@/lib/actions/follower.actions";

async function Page({ params }: { params: { id: string } }) {
  const { id } = await params;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(id);

  if (!userInfo) {
    return <div>User not found</div>;
  }

  if (!userInfo?.onboarded) redirect("/onboarding");

  // Fetch the current user's info to get their MongoDB _id
  const currentUserInfo = await fetchUser(user.id);

  // Check if this is the current user's profile
  const isOwnProfile = userInfo.id === user.id;

  const followStatus = currentUserInfo
    ? await isFollowing({
        followerId: currentUserInfo._id.toString(),
        followingId: userInfo._id.toString(),
      })
    : false;

  return (
    <section>
      <ProfileHeader
        accountId={userInfo.id}
        authUserId={user.id}
        name={userInfo.name}
        username={userInfo.username}
        imgUrl={userInfo.image}
        bio={userInfo.bio}
        classification={userInfo.classification}
        followersCount={userInfo.followers?.length || 0}
        followingCount={userInfo.following?.length || 0}
        followers={
          userInfo.followers?.map((f: any) => ({
            id: f.id,
            name: f.name,
            username: f.username,
            image: f.image,
          })) || []
        }
        following={
          userInfo.following?.map((f: any) => ({
            id: f.id,
            name: f.name,
            username: f.username,
            image: f.image,
          })) || []
        }
      >
        {/* Only show follow button if it's not the user's own profile */}
        {!isOwnProfile && currentUserInfo && (
          <FollowButton
            followerId={currentUserInfo._id.toString()} // Current user's MongoDB ID
            followingId={userInfo._id.toString()} // Profile user's MongoDB ID
            initialIsFollowing={followStatus}
          />
        )}
      </ProfileHeader>

      <div className="mt-9">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="tab">
            {profileTabs.map((tab) => (
              <TabsTrigger
                key={tab.label}
                value={tab.value}
                className="tab cursor-pointer"
              >
                <Image
                  src={tab.icon}
                  alt={tab.label}
                  width={24}
                  height={24}
                  className="object-contain"
                />
                <p className="max-sm:hidden">{tab.label}</p>

                {tab.label === "Posts" && (
                  <p className="ml-1 rounded-sm bg-light-4 px-2 py-1 text-tiny-medium! text-light-2">
                    {userInfo.posts?.length || 0}
                  </p>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          {profileTabs.map((tab) => (
            <TabsContent
              key={`content-${tab.label}`}
              value={tab.value}
              className="w-full text-light-1"
            >
              {tab.value === "posts" && (
                <PostsTab
                  currentUserId={user.id}
                  accountId={userInfo.id}
                  accountType="User"
                />
              )}
              {tab.value === "media" && (
                <MediaTab currentUserId={user.id} accountId={userInfo.id} />
              )}
              {tab.value === "likes" && (
                <LikesTab currentUserId={user.id} accountId={userInfo.id} />
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
export default Page;
