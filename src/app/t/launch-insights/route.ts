import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';
import { Product, Profile, Comment } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('products')
      .select('*, maker:profiles!maker_id(*)')
      .order('upvotes_count', { ascending: false });

    let activeProducts: Product[] = [];
    if (data) {
      const now = new Date();
      activeProducts = (data as Product[]).filter(p => {
        if (p.status === 'draft') return false;
        if (p.status === 'scheduled' && p.scheduled_for) {
          return new Date(p.scheduled_for) <= now;
        }
        return true;
      });
    }

    const targetDateObj = dateStr ? new Date(dateStr) : new Date();
    const targetY = targetDateObj.getFullYear();
    const targetM = targetDateObj.getMonth() + 1;
    const targetD = targetDateObj.getDate();

    const isTodayProduct = (p: Product): boolean => {
      const dStr = p.scheduled_for || p.created_at;
      if (!dStr) return false;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return false;
      return d.getFullYear() === targetY && (d.getMonth() + 1) === targetM && d.getDate() === targetD;
    };

    const todayFilteredProducts = activeProducts.filter(isTodayProduct);
    let finalProducts = todayFilteredProducts.length > 0 ? todayFilteredProducts : activeProducts;

    activeProducts = finalProducts
      .sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0))
      .slice(0, 20);

    activeProducts.forEach((p) => {
      if (!p.tags) p.tags = [];
    });

    const slots = [
      "12:30 PM", "01:00 PM", "01:15 PM", "01:30 PM", "02:00 PM", "02:15 PM", "02:30 PM",
      "03:00 PM", "03:15 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"
    ];

    if (activeProducts.length === 0) {
      const dummyProduct: Product = {
        id: "dummy",
        name: "No products launched",
        tagline: "Be the first to submit a product!",
        description: "Be the first to submit a product!",
        website_url: "https://indihunt.com",
        logo_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=80&q=80",
        screenshots: [],
        maker_id: "dummy-user",
        upvotes_count: 0,
        comments_count: 0,
        created_at: new Date().toISOString(),
        tags: []
      };
      const dummyProfile: Profile = {
        id: "dummy-user",
        username: "IndiHunt",
        full_name: "IndiHunt Community",
        is_maker: true
      };
      const dummyComment: Comment = {
        id: "dummy-comment",
        body: "Welcome to IndiHunt! No comments are available yet.",
        created_at: new Date().toISOString(),
        user_id: "dummy-user",
        user: dummyProfile,
        upvotes_count: 0
      };
      return apiSuccessSecure({
        products: [],
        pointsTimeline: [],
        commentsTimeline: [],
        mostPoints: { product: dummyProduct, points: 0, sparkline: slots.map(() => 0) },
        mostComments: { product: dummyProduct, comments: 0, sparkline: slots.map(() => 0) },
        mostPopularTag: { name: "None", count: 0, products: [] },
        topComment: { comment: dummyComment, votes: 0, user: dummyProfile, product: dummyProduct }
      });
    }

    const pointsTimeline: any[] = [];
    const commentsTimeline: any[] = [];

    slots.forEach((slot, index) => {
      const progress = (index + 1) / slots.length;
      const logFactor = Math.log(1 + progress * 9) / Math.log(10);
      const sigmoidalFactor = 1 / (1 + Math.exp(-6 * (progress - 0.5)));

      const pointsObj: any = { time: slot };
      const commentsObj: any = { time: slot };

      activeProducts.forEach(p => {
        const pointsMax = p.upvotes_count || 0;
        const commentsMax = p.comments_count || 0;

        let pointsVal = Math.round(pointsMax * logFactor);
        if (index === 0) pointsVal = Math.round(pointsMax * 0.12);
        if (index === slots.length - 1) pointsVal = pointsMax;
        pointsObj[p.name] = Math.max(0, pointsVal);

        let commentsVal = Math.round(commentsMax * sigmoidalFactor);
        if (index === 0) commentsVal = Math.round(commentsMax * 0.05);
        if (index === slots.length - 1) commentsVal = commentsMax;
        commentsObj[p.name] = Math.max(0, commentsVal);
      });

      pointsTimeline.push(pointsObj);
      commentsTimeline.push(commentsObj);
    });

    const sortedByPoints = [...activeProducts].sort((a, b) => (b.upvotes_count || 0) - (a.upvotes_count || 0));
    const sortedByComments = [...activeProducts].sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));

    const mostPointsProduct = sortedByPoints[0];
    const mostCommentsProduct = sortedByComments[0];

    const pointsMax = mostPointsProduct.upvotes_count || 0;
    const commentsMax = mostCommentsProduct.comments_count || 0;

    const dynamicPointsSparkline = slots.map((_, i) => Math.round(pointsMax * (Math.log(1 + ((i + 1) / slots.length) * 9) / Math.log(10))));
    const dynamicCommentsSparkline = slots.map((_, i) => Math.round(commentsMax * (1 / (1 + Math.exp(-6 * (((i + 1) / slots.length) - 0.5))))));

    const tagCounts: Record<string, number> = {};
    activeProducts.forEach(p => {
      p.tags?.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    let popularTagName = "None";
    let popularTagCount = 0;
    Object.entries(tagCounts).forEach(([tag, count]) => {
      if (count > popularTagCount) {
        popularTagCount = count;
        popularTagName = tag;
      }
    });

    let topCommentObj: Comment | null = null;
    let topCommentUser: Profile | null = null;
    let topCommentProduct: Product | null = null;

    try {
      const activeProductIds = activeProducts.map(p => p.id);
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, user:profiles(*)')
        .in('product_id', activeProductIds)
        .order('upvotes_count', { ascending: false })
        .limit(1);

      if (commentsData && commentsData.length > 0) {
        const c = commentsData[0];
        topCommentObj = c as Comment;
        topCommentUser = c.user as Profile;
        topCommentProduct = activeProducts.find(p => p.id === c.product_id) || activeProducts[0];
      }
    } catch {}

    const dummyComment: Comment = {
      id: "no-comment",
      body: "Welcome to IndiHunt!",
      created_at: new Date().toISOString(),
      user_id: mostPointsProduct.maker_id || "indihunt",
      user: mostPointsProduct.maker,
      upvotes_count: 0
    };

    return apiSuccessSecure({
      products: activeProducts,
      pointsTimeline,
      commentsTimeline,
      mostPoints: {
        product: mostPointsProduct,
        points: pointsMax,
        sparkline: dynamicPointsSparkline
      },
      mostComments: {
        product: mostCommentsProduct,
        comments: commentsMax,
        sparkline: dynamicCommentsSparkline
      },
      mostPopularTag: {
        name: popularTagName,
        count: popularTagCount,
        products: activeProducts.filter(p => p.tags?.includes(popularTagName))
      },
      topComment: {
        comment: topCommentObj || dummyComment,
        votes: topCommentObj ? (topCommentObj.upvotes_count || 0) : 0,
        user: topCommentUser || mostPointsProduct.maker,
        product: topCommentProduct || mostPointsProduct
      }
    });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch launch insights', 500);
  }
}
