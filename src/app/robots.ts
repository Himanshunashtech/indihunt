import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const commonDisallow = [
    "/t/",
    "/auth/",
    "/my-products/",
    "/profile/settings",
    "/analytics/",
    "/admin/",
    "/search",
  ];

  return {
    rules: [
      // General web crawlers
      {
        userAgent: "*",
        allow: "/",
        disallow: commonDisallow,
      },
      // Social Media Link Scrapers & Preview Bots
      {
        userAgent: [
          "Twitterbot",
          "facebookexternalhit",
          "LinkedInBot",
          "WhatsApp",
          "TelegramBot",
          "Discordbot",
          "Slackbot",
          "Applebot",
          "Pinterest"
        ],
        allow: "/",
      },
      // Major Search Engines
      {
        userAgent: ["Googlebot", "Bingbot", "DuckDuckBot", "YandexBot", "Baiduspider"],
        allow: "/",
        disallow: commonDisallow,
      },
      // LLM & AI Agents
      {
        userAgent: [
          "GPTBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "Google-Extended",
          "PerplexityBot",
          "anthropic-ai",
          "cohere-ai",
          "Bytespider",
          "CCBot"
        ],
        allow: "/",
        disallow: commonDisallow,
      },
    ],
    sitemap: "https://indihunt.in/sitemap.xml",
  };
}
