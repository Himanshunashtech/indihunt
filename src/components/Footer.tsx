"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const TOP_PRODUCT_CATEGORIES = [
  {
    title: "Engineering & Development",
    links: [
      { label: "Vibe Coding Tools", href: "/categories/vibe-coding" },
      { label: "AI Coding Agents", href: "/categories/ai-coding-agents" },
      { label: "AI Code Editors", href: "/categories/ai-code-editors" }
    ]
  },
  {
    title: "LLMs",
    links: [
      { label: "AI Chatbots", href: "/categories/ai-chatbots" },
      { label: "AI Infrastructure Tools", href: "/categories/ai-infrastructure" },
      { label: "Prompt Engineering Tools", href: "/categories/prompt-engineering-tools" }
    ]
  },
  {
    title: "Productivity",
    links: [
      { label: "AI notetakers", href: "/categories/ai-meeting-notetakers" },
      { label: "Note and writing apps", href: "/categories/notes-documents" },
      { label: "Team collaboration software", href: "/categories/team-collaboration" },
      { label: "Search", href: "/categories/search" },
      { label: "AI Workflow Automation", href: "/categories/ai-workflow-automation" }
    ]
  },
  {
    title: "Marketing & Sales",
    links: [
      { label: "Lead generation software", href: "/categories/lead-generation" },
      { label: "Marketing automation platforms", href: "/categories/marketing-automation" }
    ]
  },
  {
    title: "Design & Creative",
    links: [
      { label: "Video editing", href: "/categories/video-editing" },
      { label: "Design resources", href: "/categories/design-resources" },
      { label: "Graphic design tools", href: "/categories/graphic-design-tools" },
      { label: "AI Generative Media", href: "/categories/ai-generative-media" }
    ]
  },
  {
    title: "Social & Community",
    links: [
      { label: "Social Networking", href: "/categories/social-networking" },
      { label: "Professional networking platforms", href: "/categories/professional-networking" },
      { label: "Community management", href: "/categories/community-management" }
    ]
  },
  {
    title: "Finance",
    links: [
      { label: "Accounting software", href: "/categories/accounting" },
      { label: "Fundraising resources", href: "/categories/fundraising-resources" },
      { label: "Investing", href: "/categories/investing" }
    ]
  },
  {
    title: "AI Agents",
    links: [
      { label: "AI Voice Agents", href: "/categories/ai-voice-agents" },
      { label: "See All Categories >>", href: "/categories", highlight: true }
    ]
  }
];

const MAIN_PAGES = [
  { label: "Advertise", href: "/advertise" },
  { label: "CEO's Letter", href: "/home" },
  { label: "IndiHunt Pages ⚡", href: "/pages" },
  { label: "Makers", href: "/makers" },
  { label: "About", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "FAQ", href: "/faq" },
  { label: "Help Center", href: "/help" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
  { label: "Terms of Service", href: "/terms" },
  { label: "llm.txt", href: "/llm.txt" },
];



export default function Footer() {
  const pathname = usePathname();
  if (pathname && (pathname.startsWith("/page/") || pathname === "/home")) {
    return null;
  }

  return (
    <footer
      className="relative w-full overflow-hidden"
      style={{ background: "#0a0a12" }}
    >
      {/* Subtle dot-grid background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top separator glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, #ff5a00 30%, #f59e0b 60%, transparent 100%)",
          opacity: 0.4,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">

        {/* Categories Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-6">
            <h4 className="text-sm font-semibold text-[#c4c4d4] uppercase tracking-wider">
              Top Product Categories
            </h4>
            <Link
              href="/home"
              className="text-xs sm:text-sm font-bold text-[#ff5a00] hover:text-orange-400 flex items-center gap-1.5 transition-colors group"
            >
              <span>CEO's Letter</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-8">
            {TOP_PRODUCT_CATEGORIES.map((cat) => (
              <div key={cat.title} className="flex flex-col gap-3">
                <h5 className="text-xs font-semibold text-[#8a8a9a] dark:text-[#a0a0b0]">
                  {cat.title}
                </h5>
                <ul className="flex flex-col gap-2">
                  {cat.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className={`text-xs sm:text-sm hover:text-orange-500 transition-colors ${link.highlight ? "font-bold text-white hover:underline" : "text-white/90"
                          }`}
                      >
                        {link.label}
                      </Link>
                      {link.highlight && (
                        <div className="mt-4 flex items-center gap-2.5">
                          <a
                            href="https://x.com/SonuHs9557"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="X / Twitter"
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:text-orange-400"
                            style={{ color: "#8a8a9a", background: "#ffffff0a" }}
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                          </a>

                          <a
                            href="https://www.linkedin.com/company/indihunt/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="LinkedIn"
                            className="flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 hover:text-orange-400"
                            style={{ color: "#8a8a9a", background: "#ffffff0a" }}
                          >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                            </svg>
                          </a>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Main Pages & Copyright Row */}
        <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-white/10">
          {/* Copyright */}
          <p className="text-[10px] sm:text-xs text-[#c4c4d4] whitespace-nowrap">
            © 2026 IndiHunt
          </p>

          {/* Main Pages */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {MAIN_PAGES.map((page) => (
              <Link
                key={page.label}
                href={page.href}
                className="text-xs sm:text-sm font-medium text-white hover:text-orange-500 transition-colors whitespace-nowrap"
              >
                {page.label}
              </Link>
            ))}
          </div>


        </div>

        {/* Moving Badges Marquee Banner */}

      </div>
    </footer>
  );
}