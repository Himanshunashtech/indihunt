import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('id, name, tech_stack, tags')
      .eq('id', id)
      .single();

    if (error || !product) {
      return apiFailure('Product not found', 404);
    }

    const techStack = product.tech_stack || [];
    return apiSuccessSecure(techStack);
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to fetch tech stack', 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { tech } = body;

    if (!tech || typeof tech !== 'string') {
      return apiFailure('Invalid tech name', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('tech_stack')
      .eq('id', id)
      .single();

    if (error || !product) {
      return apiFailure('Product not found', 404);
    }

    const currentStack: string[] = product.tech_stack || [];
    if (!currentStack.includes(tech)) {
      currentStack.push(tech);
      await supabase
        .from('products')
        .update({ tech_stack: currentStack })
        .eq('id', id);
    }

    return apiSuccessSecure({ techStack: currentStack });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to add tech to stack', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const tech = searchParams.get('tech');

    if (!tech) {
      return apiFailure('Missing tech query parameter', 400);
    }

    const supabase = await createServerSupabaseClient();
    const { data: product, error } = await supabase
      .from('products')
      .select('tech_stack')
      .eq('id', id)
      .single();

    if (error || !product) {
      return apiFailure('Product not found', 404);
    }

    const currentStack: string[] = (product.tech_stack || []).filter(
      (t: string) => t.toLowerCase() !== tech.toLowerCase()
    );

    await supabase
      .from('products')
      .update({ tech_stack: currentStack })
      .eq('id', id);

    return apiSuccessSecure({ techStack: currentStack });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to remove tech from stack', 500);
  }
}
