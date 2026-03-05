import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";

import Comment from "@/components/forms/Comment";
import PostCard from "@/components/cards/PostCard";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchPostById } from "@/lib/actions/post.actions";

export const revalidate = 0;

async function page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return null;

  const user = await currentUser();
  if (!user) return null;

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const post = await fetchPostById(id);
  if (!post) return null;

  const currentUserMongoId = userInfo._id.toString();

  return (
    <section className="relative">
      <div>
        <PostCard
          id={post._id}
          currentUserId={user.id}
          currentUserMongoId={currentUserMongoId}
          parentId={post.parentId}
          content={post.text}
          author={post.author}
          community={post.community}
          createdAt={post.createdAt}
          comments={post.children}
          images={post.images}
          likes={post.likes?.map((id: any) => id.toString()) || []}
          reposts={post.reposts?.map((id: any) => id.toString()) || []}
        />
      </div>

      <div className="mt-7">
        <Comment
          postId={id}
          currentUserImg={user.imageUrl}
          currentUserId={JSON.stringify(userInfo._id)}
        />
      </div>

      <div className="mt-10">
        {post.children.map((childItem: any) => (
          <PostCard
            key={childItem._id}
            id={childItem._id}
            currentUserId={user.id}
            currentUserMongoId={currentUserMongoId}
            parentId={childItem.parentId}
            content={childItem.text}
            author={childItem.author}
            community={childItem.community}
            createdAt={childItem.createdAt}
            comments={childItem.children}
            images={childItem.images}
            likes={childItem.likes?.map((id: any) => id.toString()) || []}
            reposts={childItem.reposts?.map((id: any) => id.toString()) || []}
            isComment
          />
        ))}
      </div>
    </section>
  );
}

export default page;
