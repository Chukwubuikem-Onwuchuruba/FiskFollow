import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import PostCard from "@/components/cards/PostCard";
import Pagination from "@/components/shared/Pagination";

import { fetchPosts } from "@/lib/actions/post.actions";
import { fetchUser } from "@/lib/actions/user.actions";

async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>; // Change type to Promise
}) {
  // Await searchParams
  const params = await searchParams;

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userInfo = await fetchUser(user.id);
  if (!userInfo?.onboarded) redirect("/onboarding");

  const result = await fetchPosts(params.page ? +params.page : 1, 30);

  return (
    <>
      <h1 className="head-text text-left">Home</h1>

      <section className="mt-9 flex flex-col gap-10">
        {result.posts.length === 0 ? (
          <p className="no-result">No posts found</p>
        ) : (
          <>
            {result.posts.map((post) => (
              <PostCard
                key={post._id}
                id={post._id}
                currentUserId={user.id}
                parentId={post.parentId}
                content={post.text}
                author={post.author}
                community={post.community}
                createdAt={post.createdAt}
                comments={post.children}
                images={post.images}
              />
            ))}
          </>
        )}
      </section>

      <Pagination
        path="/"
        pageNumber={params?.page ? +params.page : 1}
        isNext={result.isNext}
      />
    </>
  );
}

export default Home;
