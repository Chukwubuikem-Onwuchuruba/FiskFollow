"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SignOutButton, SignedIn, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { getSocket } from "@/lib/socket";

import { sidebarLinks } from "@/constants";

interface Props {
  unreadCount?: number;
}

const LeftSidebar = ({ unreadCount = 0 }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    setLocalUnreadCount(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    if (!userId) return;

    const socket = getSocket();

    // Show dot instantly when a new message arrives
    socket.on("notification:newMessage", () => {
      setLocalUnreadCount((prev) => prev + 1);
    });

    // When messages are read, reset to server value
    socket.on("notification:messagesRead", () => {
      setLocalUnreadCount(0);
    });

    return () => {
      socket.off("notification:newMessage");
      socket.off("notification:messagesRead");
    };
  }, [userId]);

  if (!isLoaded) return null;
  if (!isDesktop) return null;

  return (
    <section className="custom-scrollbar leftsidebar">
      <div className="flex w-full flex-1 flex-col gap-6 px-6">
        {sidebarLinks.map((link) => {
          const isActive =
            (pathname.includes(link.route) && link.route.length > 1) ||
            pathname === link.route;

          let href = link.route;
          if (link.route === "/profile") {
            href = userId ? `/profile/${userId}` : "/sign-in";
          }

          return (
            <Link
              href={href}
              key={link.label}
              className={`leftsidebar_link ${isActive && "bg-primary-500"}`}
            >
              <div className="relative">
                <Image
                  src={link.imgURL}
                  alt={link.label}
                  width={24}
                  height={24}
                />
                {link.label === "Messages" && localUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
                )}
              </div>
              <p className="text-light-1 max-lg:hidden">{link.label}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 px-6">
        <SignedIn>
          <SignOutButton redirectUrl="/sign-in">
            <div className="flex cursor-pointer gap-4 p-4">
              <Image
                src="/assets/logout.svg"
                alt="logout"
                width={24}
                height={24}
              />
              <p className="text-light-2 max-lg:hidden">Logout</p>
            </div>
          </SignOutButton>
        </SignedIn>
      </div>
    </section>
  );
};

export default LeftSidebar;
