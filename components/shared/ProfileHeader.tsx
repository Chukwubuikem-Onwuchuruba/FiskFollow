import Link from "next/link";
import Image from "next/image";
import { ReactNode } from "react";
import FollowListModal from "./FollowListModal";

interface FollowUser {
  id: string;
  name: string;
  username: string;
  image: string;
}

interface Props {
  accountId: string;
  authUserId: string;
  name: string;
  username: string;
  imgUrl: string;
  bio: string;
  classification?: string;
  followersCount?: number;
  followingCount?: number;
  followers?: FollowUser[];
  following?: FollowUser[];
  type?: string;
  children?: ReactNode;
  profileUserId?: string;
}

function ProfileHeader({
  accountId,
  authUserId,
  name,
  username,
  imgUrl,
  bio,
  classification,
  followersCount = 0,
  followingCount = 0,
  followers = [],
  following = [],
  type,
  children,
  profileUserId,
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
            {classification && (
              <p className="text-subtle-medium text-primary-500 mt-0.5">
                {classification}
              </p>
            )}

            <FollowListModal
              profileUserId={profileUserId || ""}
              followers={followers}
              following={following}
              followersCount={followersCount}
              followingCount={followingCount}
            />
          </div>
        </div>

        {children ? (
          <div>{children}</div>
        ) : (
          accountId === authUserId &&
          type !== "Community" && (
            <Link href="/profile/edit">
              <div className="flex cursor-pointer gap-3 rounded-lg bg-dark-3 px-4 py-2">
                <Image
                  src="/assets/edit.svg"
                  alt="edit"
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
