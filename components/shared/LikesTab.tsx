import { fetchUserLikedPosts } from "@/lib/actions/user.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import { currentUser } from "@clerk/nextjs/server";
import PostCard from "../cards/PostCard";

interface Props {
  currentUserId: string;
  accountId: string;
}

async function LikesTab({ currentUserId, accountId }: Props) {
  const userInfo = await fetchUser(accountId);
  const likedPosts = await fetchUserLikedPosts(accountId);

  if (!likedPosts.length) return <p className="no-result">No liked posts</p>;

  return (
    <section className="mt-9 flex flex-col gap-10">
      {likedPosts.map((post: any) => (
        <PostCard
          key={post._id}
          id={post._id}
          currentUserId={currentUserId}
          parentId={post.parentId}
          content={post.text}
          author={post.author}
          community={post.community}
          createdAt={post.createdAt}
          comments={post.children}
          images={post.images || []}
          likes={post.likes?.map((id: any) => id.toString()) || []}
          reposts={post.reposts?.map((id: any) => id.toString()) || []}
          currentUserMongoId={userInfo._id.toString()}
        />
      ))}
    </section>
  );
}

export default LikesTab;
