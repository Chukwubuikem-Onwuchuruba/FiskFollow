import { fetchUserMediaPosts } from "@/lib/actions/user.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import PostCard from "../cards/PostCard";

interface Props {
  currentUserId: string;
  accountId: string;
}

async function MediaTab({ currentUserId, accountId }: Props) {
  const userInfo = await fetchUser(accountId);
  const mediaPosts = await fetchUserMediaPosts(accountId);

  if (!mediaPosts.length) return <p className="no-result mt-9">No media yet</p>;

  return (
    <section className="mt-9 flex flex-col gap-10">
      {mediaPosts.map((post: any) => (
        <PostCard
          key={post._id}
          id={post._id}
          currentUserId={currentUserId}
          currentUserMongoId={userInfo?._id?.toString()}
          parentId={post.parentId}
          content={post.text}
          author={post.author}
          community={post.community}
          createdAt={post.createdAt}
          comments={post.children}
          images={post.images || []}
          likes={post.likes?.map((id: any) => id.toString()) || []}
          reposts={post.reposts?.map((id: any) => id.toString()) || []}
        />
      ))}
    </section>
  );
}

export default MediaTab;
