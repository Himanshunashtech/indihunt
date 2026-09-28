"use client";


import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  MessageSquare,
  Sparkles,
  Search,
  User
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase, getStories, getProductSlug, getCachedStories } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function StoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories", searchQuery],
    queryFn: async () => {
      return await getStories(searchQuery);
    },
    initialData: () => (searchQuery ? undefined : getCachedStories()),
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData
  });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300 pt-32">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        
        {/* Title */}
        <div className="space-y-4 relative py-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-orange-500/5 rounded-3xl blur-3xl -z-10"></div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Maker Stories & News</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Stories from the Indian Tech Frontier
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Read interviews with founders, design strategies, engineering insights, and tech product case studies shaping Bharat&apos;s digital transformation.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search stories..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/40 border border-border/60 rounded-xl py-2.5 pl-10 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="text-center py-10 text-xs font-semibold text-muted-foreground">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl space-y-2">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto opacity-55" />
            <p className="font-semibold text-sm text-foreground">No stories found</p>
            <p className="text-xs text-muted-foreground">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
              <Link 
                key={story.id}
                href={`/stories/${getProductSlug(story.title)}`}
                className="pb-6  transition-all flex flex-col group cursor-pointer"
              >
                <div className="aspect-[16/10] bg-muted relative overflow-hidden">
                  <img 
                    src={story.image_url || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80"} 
                    alt={story.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {story.category || "Story"}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-medium text-foreground/90 group-hover:text-[#ff5733] transition-colors leading-snug line-clamp-2">
                      {story.title}
                    </h3>
                    <p className="mt-0.5 block text-base text-foreground/80 leading-relaxed line-clamp-3">
                      {story.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border/60 flex items-center justify-between text-sm font-medium text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full overflow-hidden bg-muted border border-border" style={{ width: "16px", height: "16px" }}>
                        <img 
                          src={story.user?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"} 
                          alt="Author" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground/80 hover:text-[#ff5733]">@{story.user?.username || "maker"}</span>
                    </div>

                    <div className="flex items-center gap-1 text-sm font-normal text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(story.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
