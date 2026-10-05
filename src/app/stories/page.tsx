"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  BookOpen, 
  Calendar, 
  Sparkles, 
  Search, 
  PenSquare, 
  Plus, 
  X, 
  Upload, 
  Loader2,
  CheckCircle,
  Tag
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  supabase, 
  getStories, 
  getProductSlug, 
  getCachedStories, 
  createStory, 
  uploadImage, 
  checkContentViolation,
  Story 
} from "@/lib/supabase";
import { useAppDispatch, useAppSelector, setAuthModalOpen } from "@/lib/store";
import Navbar from "@/components/Navbar";

const CATEGORIES = ["All", "Makers", "Guides", "Playbooks", "Interviews", "Tech", "General"];

export default function StoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Makers");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const reduxUser = useAppSelector((state) => state.auth.user);
  const reduxProfile = useAppSelector((state) => state.auth.profile);

  const activeUser = reduxUser || (reduxProfile ? { id: reduxProfile.id } : null);

  const { data: allStories = [], isLoading } = useQuery({
    queryKey: ["stories", searchQuery],
    queryFn: async () => {
      return await getStories(searchQuery);
    },
    initialData: () => (searchQuery ? undefined : getCachedStories()),
    staleTime: 30 * 1000,
    refetchOnMount: true,
  });

  const filteredStories = allStories.filter((story: Story) => {
    if (selectedCategory !== "All") {
      const storyCat = (story.category || "General").toLowerCase();
      if (storyCat !== selectedCategory.toLowerCase()) return false;
    }
    return true;
  });

  const handleOpenCreateModal = () => {
    if (!activeUser) {
      dispatch(setAuthModalOpen(true));
      return;
    }
    setShowCreateModal(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUser) return;

    setIsUploading(true);
    setErrorMessage("");
    try {
      const ext = file.name.split(".").pop();
      const path = `${activeUser.id}/${Date.now()}.${ext}`;
      let uploadedUrl: string | null = "";

      if (supabase) {
        uploadedUrl = await uploadImage("story-images", file, path);
      }

      if (!uploadedUrl) {
        uploadedUrl = URL.createObjectURL(file);
      }
      setImageUrl(uploadedUrl || "");
    } catch (err: any) {
      console.error("Error uploading story image:", err);
      setErrorMessage("Failed to upload image. You can paste an image URL instead.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUser) {
      dispatch(setAuthModalOpen(true));
      return;
    }

    if (!title.trim() || !content.trim()) {
      setErrorMessage("Please fill in both title and content.");
      return;
    }

    // Content moderation
    const titleCheck = checkContentViolation(title);
    if (titleCheck.hasViolation) {
      setErrorMessage(titleCheck.message || "Title contains restricted words.");
      return;
    }

    const contentCheck = checkContentViolation(content);
    if (contentCheck.hasViolation) {
      setErrorMessage(contentCheck.message || "Content contains restricted words.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payload: Partial<Story> = {
        title: title.trim(),
        content: content.trim(),
        category,
        image_url: imageUrl.trim() || undefined,
        excerpt: excerpt.trim() || content.trim().substring(0, 150) + "...",
        user_id: activeUser.id,
      };

      const result = await createStory(payload);
      if (result) {
        // Reset form
        setTitle("");
        setContent("");
        setExcerpt("");
        setImageUrl("");
        setCategory("Makers");
        setShowCreateModal(false);

        // Invalidate queries to instantly display
        queryClient.invalidateQueries({ queryKey: ["stories"] });
      } else {
        setErrorMessage("Failed to create story. Please try again.");
      }
    } catch (err: any) {
      console.error("Error creating story:", err);
      setErrorMessage(err?.message || "Failed to publish story.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-orange-500 selection:text-white transition-colors duration-300 pt-28">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Header Hero */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative py-4 border-b border-border/50">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-[11px] font-bold uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Maker Stories & Insights</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Stories from the Indian Tech Frontier
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Read how makers, founders, and indie hackers build, launch, and scale their tech products in India.
            </p>
          </div>

          <div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <PenSquare className="w-4 h-4" />
              <span>Write a Story</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px] sm:max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search stories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/40 border border-border/60 rounded-xl py-2 pl-9 pr-4 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Stories Grid */}
        {isLoading && filteredStories.length === 0 ? (
          <div className="text-center py-16 text-xs font-semibold text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            <span>Loading stories...</span>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-border/60 rounded-2xl space-y-3">
            <Sparkles className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
            <p className="font-bold text-sm text-foreground">No stories found</p>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "Try adjusting your search query" : "Be the first maker to write a story in this category!"}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Write Story</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => {
              const author = story.user || {
                username: "maker",
                full_name: "Maker",
                avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
              };
              const authorUsername = author.username || "maker";
              const authorName = author.full_name || authorUsername;
              const slug = getProductSlug(story.title) || story.id;

              return (
                <article 
                  key={story.id}
                  className="bg-card border border-border/60 rounded-2xl overflow-hidden hover:border-orange-500/50 hover:shadow-lg transition-all flex flex-col group"
                >
                  <Link href={`/stories/${slug}`} className="block relative aspect-[16/10] bg-muted overflow-hidden">
                    <Image 
                      src={story.image_url || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80"} 
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={600}
                      height={375}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={85}
                    />
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      {story.category || "Story"}
                    </div>
                  </Link>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <Link href={`/stories/${slug}`}>
                        <h2 className="text-base font-bold text-foreground group-hover:text-orange-500 transition-colors leading-snug line-clamp-2">
                          {story.title}
                        </h2>
                      </Link>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {story.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                      <Link 
                        href={`/${authorUsername}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-muted border border-border flex-shrink-0">
                          <Image 
                            src={author.avatar_url || `https://avatar.vercel.sh/${authorUsername}`} 
                            alt={authorName} 
                            className="w-full h-full object-cover"
                            width={20}
                            height={20}
                          />
                        </div>
                        <span className="font-semibold text-foreground/80 hover:text-orange-500 truncate max-w-[120px]">
                          @{authorUsername}
                        </span>
                      </Link>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {story.published_at 
                            ? new Date(story.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                            : "Recent"}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Write Story Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-border/60 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
                  <PenSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Write a Maker Story</h3>
                  <p className="text-xs text-muted-foreground">Share your product journey, learnings, or engineering insights.</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-500">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Story Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How I Built and Launched My SaaS in 30 Days"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-muted/40 border border-border/60 rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:border-orange-500 transition-colors max-w-full"
                  >
                    <option value="Makers">Makers</option>
                    <option value="Guides">Guides</option>
                    <option value="Playbooks">Playbooks</option>
                    <option value="Interviews">Interviews</option>
                    <option value="Tech">Tech</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Cover Image (Optional)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 bg-muted/40 border border-border/60 border-dashed rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-orange-500 transition-all">
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{imageUrl ? "Image selected" : "Upload image"}</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {imageUrl && (
                <div className="relative aspect-video max-h-36 rounded-xl overflow-hidden border border-border">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 p-1 bg-black/70 text-white rounded-md hover:bg-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Short Excerpt (Optional)</label>
                <input
                  type="text"
                  placeholder="A short 1-2 sentence preview for the card..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3.5 py-2 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Story Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={8}
                  placeholder="Write your story here... Markdown formatting is supported!"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl p-3.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-orange-500 transition-colors resize-y font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Publish Story</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
