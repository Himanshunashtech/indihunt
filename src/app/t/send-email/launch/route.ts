import { NextRequest } from 'next/server';
import { apiSuccessSecure, apiFailure } from '@/lib/api/response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { to, productName, productSlug, makerName } = await req.json();

    if (!to || !productName) {
      return apiFailure('Missing required fields (to, productName)', 400);
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return apiFailure('Email service not configured', 500);
    }

    const productUrl = `https://indihunt.in/products/${productSlug || encodeURIComponent(productName.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}`;
    const createAdUrl = 'https://indihunt.in/advertise';
    const firstName = (makerName || 'there').split(' ')[0];

    const plainTextContent = `Hi ${firstName},

${productName} is now scheduled on IndiHunt.

Here's your product page:
${productUrl}

If you'd like extra visibility on launch day, you can look into featured placement here:
${createAdUrl}

Congrats on the launch!

Best,
IndiHunt Team`;

    const htmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; font-size: 15px; color: #1a1a1a; line-height: 1.6; margin: 0; padding: 0; background-color: #ffffff;">
    <div style="max-width: 560px; margin: 0 auto; padding: 32px 20px;">
      <p style="margin: 0 0 16px 0;">Hi ${firstName},</p>
      <p style="margin: 0 0 16px 0;">${productName} is now launched on IndiHunt.</p>
      <p style="margin: 0 0 16px 0;">Here's your product page: <a href="${productUrl}" style="color: #2563eb;">${productUrl}</a></p>
      <p style="margin: 0 0 16px 0;">If you'd like extra visibility on launch day, you can look into featured placement here: <a href="${createAdUrl}" style="color: #2563eb;">${createAdUrl}</a></p>
      <p style="margin: 0 0 24px 0;">Congrats on the launch!</p>
      <p style="margin: 0; color: #666666;">Best,<br />IndiHunt Team</p>
    </div>
  </body>
</html>`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'IndiHunt <team@indihunt.in>';
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject: `Your product ${productName} is now live on IndiHunt!`,
        text: plainTextContent,
        html: htmlContent,
      }),
    });

    const resendData = await resendRes.json();
    if (!resendRes.ok) {
      return apiFailure(resendData?.message || 'Failed to send email via Resend', 500);
    }

    return apiSuccessSecure({ id: resendData.id });
  } catch (err: any) {
    return apiFailure(err?.message || 'Error processing email sending request', 500);
  }
}
