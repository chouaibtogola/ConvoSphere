"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { useEffect } from 'react';
import { auth } from '../lib/firebase';
import { updateOnlineStatus } from '../../lib/userStatus';

const inter = Inter({ subsets: ["latin"] });

// Remove the export of metadata
// export const metadata: Metadata = {
//   title: "Convo App",
//   description: "Connect, chat, and collaborate with ease",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        updateOnlineStatus(user.uid)
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
