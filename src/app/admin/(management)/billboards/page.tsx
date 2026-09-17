"use client";

import React, { useState, useEffect } from "react";
import { 
  getBillboardAds, 
  createBillboardAd, 
  updateBillboardAd, 
  deleteBillboardAd, 
  uploadBillboardImage,
  BillboardAd
} from "@/lib/supabase";
import { Image as ImageIcon, Plus, Trash2, Link as LinkIcon, Loader2, Check, X, Eye } from "lucide-react";

export default function BillboardsAdminPage() {
  const [ads, setAds] = useState<BillboardAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAdForStats, setSelectedAdForStats] = useState<BillboardAd | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAds = async () => {
    setIsLoading(true);
    const fetchedAds = await getBillboardAds(true); // admin mode
    setAds(fetchedAds);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAds();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) return alert("Please select an image file.");
    
    setIsSubmitting(true);
    
    // 1. Upload image
    const imageUrl = await uploadBillboardImage(imageFile);
    if (!imageUrl) {
      alert("Failed to upload image");
      setIsSubmitting(false);
      return;
    }
    
    // 2. Create ad record
    const newAd = await createBillboardAd({
      title,
      destination_url: destinationUrl,
      image_url: imageUrl,
      is_active: true
    });
    
    if (newAd) {
      setAds([newAd, ...ads]);
      setIsModalOpen(false);
      setTitle("");
      setDestinationUrl("");
      setImageFile(null);
    } else {
      alert("Failed to create billboard ad");
    }
    
    setIsSubmitting(false);
  };

  const handleToggleActive = async (ad: BillboardAd) => {
    const updated = await updateBillboardAd(ad.id, { is_active: !ad.is_active });
    if (updated) {
      setAds(ads.map(a => a.id === ad.id ? updated : a));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this billboard ad?")) return;
    const success = await deleteBillboardAd(id);
    if (success) {
      setAds(ads.filter(a => a.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <ImageIcon className="w-4.5 h-4.5 text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Billboard Ads</h1>
            <p className="text-base text-slate-500 font-normal mt-0.5">Manage large banners for the landing page</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Billboard
        </button>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Preview</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Title & Link</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Analytics</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wider text-xs">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ads.map(ad => (
                  <tr key={ad.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 w-48">
                      <div className="aspect-[4/1] w-40 rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                        <img src={ad.image_url} alt={ad.title || "Ad"} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{ad.title || "Untitled"}</div>
                      {ad.destination_url && (
                        <a href={ad.destination_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-blue-500 hover:underline mt-1">
                          <LinkIcon className="w-3 h-3" />
                          {ad.destination_url}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <span>👁️ {ad.views_count ?? 0}</span>
                        <span className="text-slate-300">|</span>
                        <span>🖱️ {ad.clicks_count ?? 0}</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        CTR: {((ad.clicks_count ?? 0) / Math.max(1, ad.views_count ?? 0) * 100).toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleToggleActive(ad)}
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase border transition-colors flex items-center gap-1 w-fit ${ad.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {ad.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {ad.is_active ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedAdForStats(ad)}
                          className="p-2 text-slate-400 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Detailed Stats"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(ad.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Billboard"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {ads.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                      No billboard ads found. Create one to replace the default banners.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Create Billboard Ad</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Ad Image (Required)</label>
                <div className="text-xs text-slate-500 mb-2">Recommended aspect ratio: 4:1 (e.g., 1200x300px)</div>
                <input 
                  type="file" 
                  accept="image/*" 
                  required
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100 border border-slate-200 rounded-xl p-1"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Internal Title (Optional)</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Supabase Launch Week"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Destination URL (Optional)</label>
                <input 
                  type="url" 
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://example.com/promo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !imageFile}
                  className="px-5 py-2.5 rounded-xl font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Ad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Detail Modal */}
      {selectedAdForStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Billboard Stats & Details</h2>
              <button 
                onClick={() => setSelectedAdForStats(null)} 
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Image Preview */}
              <div className="aspect-[4/1] w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                <img 
                  src={selectedAdForStats.image_url} 
                  alt={selectedAdForStats.title || "Ad Preview"} 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Title and Link Info */}
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">{selectedAdForStats.title || "Untitled Billboard"}</h3>
                {selectedAdForStats.destination_url ? (
                  <a 
                    href={selectedAdForStats.destination_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 text-sm text-blue-500 hover:underline"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                    {selectedAdForStats.destination_url}
                  </a>
                ) : (
                  <p className="text-sm text-slate-400">No destination URL configured</p>
                )}
              </div>

              {/* Analytics Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Views</span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">{selectedAdForStats.views_count ?? 0}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Clicks</span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">{selectedAdForStats.clicks_count ?? 0}</span>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">CTR</span>
                  <span className="text-lg font-black text-slate-900 mt-1 block">
                    {((selectedAdForStats.clicks_count ?? 0) / Math.max(1, selectedAdForStats.views_count ?? 0) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Meta Info */}
              <div className="border-t border-slate-100 pt-4 text-xs text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span>Created At:</span>
                  <span className="font-semibold text-slate-600">
                    {new Date(selectedAdForStats.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-semibold ${selectedAdForStats.is_active ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {selectedAdForStats.is_active ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedAdForStats(null)}
                className="px-5 py-2 rounded-xl font-semibold bg-slate-950 text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
