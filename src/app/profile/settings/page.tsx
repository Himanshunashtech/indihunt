import React from "react";
import type { Metadata } from "next";
import ProfileSettingsClient from "./ProfileSettingsClient";

export const revalidate = 0; // Dynamic account page

const SITE_URL = "https://indihunt.in";

export const metadata: Metadata = {
  title: "Account & Profile Settings — IndiHunt",
  description: "Manage your profile details, avatar, bio, links, notification preferences, and account security on IndiHunt.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/profile/settings`,
  },
  openGraph: {
    title: "Account & Profile Settings | IndiHunt",
    description: "Manage your IndiHunt maker profile and account settings.",
    url: `${SITE_URL}/profile/settings`,
    siteName: "IndiHunt",
  },
};

export default function ProfileSettingsPage() {
  return <ProfileSettingsClient />;
}
