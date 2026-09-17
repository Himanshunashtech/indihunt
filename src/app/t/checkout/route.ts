import { NextRequest } from 'next/server';
import { getPaymentGatewayConfig } from '@/lib/supabase';
import { apiSuccess, apiFailure } from '@/lib/api/response';
import { POST as dodoPOST } from './dodo/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = await getPaymentGatewayConfig();
  return apiSuccess({
    status: 'ok',
    active_gateway: config.active_gateway || 'dodo',
    dodo_enabled: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    return await dodoPOST(req);
  } catch (error: any) {
    return apiFailure(error.message || 'Failed to process checkout', 500);
  }
}
