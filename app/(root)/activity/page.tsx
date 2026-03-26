import Image from "next/image";
import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Heart, MessageCircleMore, Repeat2, UserPlus } from "lucide-react";

import { fetchUser, getActivity } from "@/lib/actions/user.actions";

function ActivityIcon({
  type,
}: {
  type: "reply" | "like" | "repost" | "follow";
}) {
  if (type === "like")
    return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
  if (type === "repost") return <Repeat2 className="w-4 h-4 text-green-500" />;
  if (type === "follow")
    return <UserPlus className="w-4 h-4 text-primary-500" />;
  return <MessageCircleMore className="w-4 h-4 text-primary-500" />;
}

function activityLabel(type: "reply" | "like" | "repost" | "follow") {
  if (type === "like") return "liked your post";
  if (type === "repost") return "reposted your post";
  if (type === "follow") return "started following you";
  return "replied to your post";
}

async function Page() {
  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const activity = await getActivity(userInfo._id);

  return (
    <>
      <h1 className="head-text">Activity</h1>

      <section className="mt-10 flex flex-col gap-5">
        {activity.length > 0 ? (
          activity.map((item) => {
            // Follow activities link to the follower's profile
            // all others link to the post
            const href =
              item.type === "follow"
                ? `/profile/${item.author.id}`
                : `/post/${item.postId}`;

            return (
              <Link key={item._id} href={href}>
                <article className="activity-card">
                  <Image
                    src={item.author.image}
                    alt="user_logo"
                    width={20}
                    height={20}
                    className="rounded-full object-cover"
                  />
                  <p className="text-small-regular! text-light-1 flex items-center gap-1">
                    <span className="mr-1 text-primary-500">
                      {item.author.name}
                    </span>
                    <ActivityIcon type={item.type} />
                    {activityLabel(item.type)}
                  </p>
                </article>
              </Link>
            );
          })
        ) : (
          <p className="text-base-regular! text-light-3">No activity yet</p>
        )}
      </section>
    </>
  );
}

export default Page;
