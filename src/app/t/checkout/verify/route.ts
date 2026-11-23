import { NextRequest } from 'next/server';
import { GET as dodoGET, POST as dodoPOST } from '../dodo/verify/route';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  return dodoGET(req);
}

export async function POST(req: NextRequest) {
  return dodoPOST(req);
}
