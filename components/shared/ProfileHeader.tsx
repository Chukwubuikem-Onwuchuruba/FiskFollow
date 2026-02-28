import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";

interface Props {
  accountId: string;
  authUserId: string;
  name: string;
  username: string;
  imgUrl: string;
  bio: string;
  followersCount?: number;
  followingCount?: number;
  type?: string;
  children?: ReactNode;
}

function ProfileHeader({
  accountId,
  authUserId,
  name,
  username,
  imgUrl,
  bio,
  followersCount = 0,
  followingCount = 0,
  type,
  children,
}: Props) {
  return (
    <div className="flex w-full flex-col justify-start">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative h-20 w-20 object-cover">
            <Image
              src={imgUrl}
              alt="logo"
              fill
              className="rounded-full object-cover shadow-2xl"
            />
          </div>

          <div className="flex-1">
            <h2 className="text-left text-heading3-bold text-light-1">
              {name}
            </h2>
            <p className="text-base-medium text-gray-1">@{username}</p>

            {/* Followers & Following Stats */}
            <div className="flex gap-8 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-light-1 text-small-semibold">
                  {followersCount}
                </span>
                <span className="text-gray-1 text-subtle-medium">
                  Followers
                </span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-light-1 text-small-semibold">
                  {followingCount}
                </span>
                <span className="text-gray-1 text-subtle-medium">
                  Following
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Render children (follow button) OR edit button */}
        {children ? (
          <div>{children}</div>
        ) : (
          accountId === authUserId &&
          type !== "Community" && (
            <Link href="/profile/edit">
              <div className="flex cursor-pointer gap-3 rounded-lg bg-dark-3 px-4 py-2">
                <Image
                  src="/assets/edit.svg"
                  alt="logout"
                  width={16}
                  height={16}
                />
                <p className="text-light-2 max-sm:hidden">Edit</p>
              </div>
            </Link>
          )
        )}
      </div>

      <p className="mt-6 max-w-lg text-base-regular text-light-2">{bio}</p>

      <div className="mt-12 h-0.5 w-full bg-dark-3" />
    </div>
  );
}

export default ProfileHeader;
