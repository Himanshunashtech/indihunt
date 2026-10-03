import React from "react";
import type { Metadata } from "next";
import { getProductById, Product } from "@/lib/supabase";
import ProductSettingsClient from "./ProductSettingsClient";

export const revalidate = 0; // Dynamic product settings page

const SITE_URL = "https://indihunt.in";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  let product: Product | null = null;
  try {
    product = await getProductById(id);
  } catch {
    // Handled below
  }

  const productName = product?.name || "Product";

  return {
    title: `${productName} Settings — IndiHunt`,
    description: `Manage launch settings, team members, media gallery, badges, and promotions for ${productName} on IndiHunt.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/my-products/${id}/settings`,
    },
    openGraph: {
      title: `${productName} Settings | IndiHunt`,
      description: `Manage settings and launch configuration for ${productName}.`,
      url: `${SITE_URL}/my-products/${id}/settings`,
      siteName: "IndiHunt",
    },
  };
}

export default async function ProductSettingsPage({ params }: PageProps) {
  const { id } = await params;
  let initialProduct: Product | null = null;

  try {
    initialProduct = await getProductById(id);
  } catch {
    // Client fallback
  }

  return (
    <ProductSettingsClient
      initialProduct={initialProduct}
      initialProductId={id}
    />
  );
}
