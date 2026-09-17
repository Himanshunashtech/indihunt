import { NextRequest } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';
import { apiSuccess, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'product-screenshots';

    if (!file) {
      return apiFailure('No file uploaded', 400);
    }

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const adminSupabase = createAdminSupabaseClient();
    const { error: uploadError } = await adminSupabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type || 'image/png',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      return apiFailure(uploadError.message, 500);
    }

    const { data: publicUrlData } = adminSupabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return apiSuccess({ url: publicUrlData.publicUrl });
  } catch (error: any) {
    return apiFailure(error?.message || 'Failed to upload media', 500);
  }
}
