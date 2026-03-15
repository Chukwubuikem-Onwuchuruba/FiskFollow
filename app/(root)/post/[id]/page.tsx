import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

import Comment from "@/components/forms/Comment";
import PostCard from "@/components/cards/PostCard";

import { fetchUser } from "@/lib/actions/user.actions";
import { fetchPostById } from "@/lib/actions/post.actions";
import { MoveLeft } from "lucide-react";

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

  // Check if this post has a parent
  const parentPost =
    post.parentId && typeof post.parentId === "object" ? post.parentId : null;

  return (
    <section className="relative">
      {/* Show parent post if this is a reply */}
      {parentPost && (
        <div className="mb-4">
          <Link
            href={`/post/${parentPost._id}`}
            className="text-gray-1 hover:text-light-1 transition mb-2 flex items-center w-fit"
          >
            <MoveLeft className="w-5 h-5" />
          </Link>
          <PostCard
            id={parentPost._id.toString()}
            currentUserId={user.id}
            currentUserMongoId={currentUserMongoId}
            parentId={parentPost.parentId || null}
            content={parentPost.text}
            author={parentPost.author}
            community={parentPost.community || null}
            createdAt={parentPost.createdAt}
            comments={[]}
            images={parentPost.images || []}
            likes={parentPost.likes?.map((id: any) => id.toString()) || []}
            reposts={parentPost.reposts?.map((id: any) => id.toString()) || []}
          />
          <div className="mt-2 mb-4 h-0.5 w-full bg-dark-3" />
        </div>
      )}

      <div>
        <PostCard
          id={post._id}
          currentUserId={user.id}
          currentUserMongoId={currentUserMongoId}
          parentId={
            typeof post.parentId === "string"
              ? post.parentId
              : post.parentId?._id?.toString() || null
          }
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
