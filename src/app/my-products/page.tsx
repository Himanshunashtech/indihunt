import React from "react";
import type { Metadata } from "next";
import { getProducts, Product } from "@/lib/supabase";
import MyProductsClient from "./MyProductsClient";

export const revalidate = 0; // Dynamic maker dashboard

const SITE_URL = "https://indihunt.in";

export const metadata: Metadata = {
  title: "My Products & Launches — IndiHunt Maker Dashboard",
  description: "Manage your indie products, draft submissions, scheduled launches, and product settings on IndiHunt.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: `${SITE_URL}/my-products`,
  },
  openGraph: {
    title: "My Products & Launches — IndiHunt Maker Dashboard",
    description: "Manage your indie products, draft submissions, scheduled launches, and product settings on IndiHunt.",
    url: `${SITE_URL}/my-products`,
    siteName: "IndiHunt",
  },
};

export default async function MyProductsPage() {
  let initialProducts: Product[] = [];
  try {
    initialProducts = await getProducts();
  } catch {
    // Fallback handled on client side
  }

  return <MyProductsClient initialProducts={initialProducts} />;
}
