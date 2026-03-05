import { fetchCommunityPosts } from "@/lib/actions/community.actions";
import { fetchUserPosts } from "@/lib/actions/user.actions";
import { fetchUser } from "@/lib/actions/user.actions";
import PostCard from "../cards/PostCard";

interface Props {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

async function PostsTab({ currentUserId, accountId, accountType }: Props) {
  let result: any = null;

  try {
    if (accountType === "Community") {
      result = await fetchCommunityPosts(accountId);
    } else {
      result = await fetchUserPosts(accountId);
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
    return <div className="text-light-1">Error loading posts</div>;
  }

  if (!result || !result.posts) {
    return <p className="no-result">No posts found</p>;
  }

  // Get the current user's MongoDB _id for like/repost state
  const currentUserInfo = await fetchUser(currentUserId);
  const currentUserMongoId = currentUserInfo?._id?.toString() || "";

  return (
    <section className="mt-9 flex flex-col gap-10">
      {result.posts.length === 0 ? (
        <p className="no-result">No posts found</p>
      ) : (
        result.posts.map((post: any) => (
          <PostCard
            key={`${post._id}-${post.isRepost}`}
            id={post._id}
            currentUserId={currentUserId}
            currentUserMongoId={currentUserMongoId}
            parentId={post.parentId}
            content={post.text}
            author={
              accountType === "User" && !post.isRepost
                ? { name: result.name, image: result.image, id: result.id }
                : {
                    name: post.author?.name,
                    image: post.author?.image,
                    id: post.author?.id,
                  }
            }
            community={
              accountType === "Community"
                ? { name: result.name, id: result.id, image: result.image }
                : post.community
            }
            createdAt={post.createdAt}
            comments={post.children}
            images={post.images || []}
            likes={post.likes?.map((id: any) => id.toString()) || []}
            reposts={post.reposts?.map((id: any) => id.toString()) || []}
            isRepost={
              post.isRepost &&
              accountType === "User" &&
              post.author?.id !== currentUserId
            }
          />
        ))
      )}
    </section>
  );
}

export default PostsTab;
