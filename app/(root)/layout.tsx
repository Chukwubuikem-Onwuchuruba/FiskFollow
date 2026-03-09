import React from "react";
import type { Metadata } from "next";
import { Shantell_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { dark } from "@clerk/themes";

import "../globals.css";
import LeftSidebar from "@/components/shared/LeftSidebar";
import Bottombar from "@/components/shared/Bottombar";
import RightSidebar from "@/components/shared/RightSidebar";
import Topbar from "@/components/shared/Topbar";
import { fetchUser } from "@/lib/actions/user.actions";
import { getTotalUnreadCount } from "@/lib/actions/message.actions";

const inter = Shantell_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FiskFollow",
  description: "A Social Media App for the Fisk Community.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();
  let unreadCount = 0;

  if (user) {
    const userInfo = await fetchUser(user.id);
    if (userInfo) {
      unreadCount = await getTotalUnreadCount(userInfo._id.toString());
    }
  }

  return (
    <ClerkProvider appearance={{ baseTheme: dark }}>
      <html lang="en">
        <body className={inter.className}>
          <Topbar />
          <main className="flex flex-row">
            <LeftSidebar unreadCount={unreadCount} />
            <section className="main-container">
              <div className="w-full max-w-4xl">{children}</div>
            </section>
            {/* @ts-ignore */}
            <RightSidebar />
          </main>
          <Bottombar />
        </body>
      </html>
    </ClerkProvider>
  );
}
