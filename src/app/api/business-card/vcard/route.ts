import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';
import { getClinicInfo } from '../../../../lib/clinic-info';
import { serverError } from '../../../../lib/api-error';

const limiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'bcard-vcard' });

function getRateLimitKey(req: NextRequest): string {
  const ip = sanitizeIp(
    req.headers.get('x-forwarded-for'),
    req.headers.get('x-real-ip'),
  );
  if (ip !== 'unknown') return ip;
  const ua = req.headers.get('user-agent') ?? '';
  const hash = Array.from(ua).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  return `ua-${hash}`;
}

export async function GET(req: NextRequest) {
  try {
    const key = getRateLimitKey(req);
    const rl = await limiter(key);
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const clinic = getClinicInfo();

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${clinic.name}`,
      `ORG:${clinic.name}`,
    ];

    if (clinic.phone) lines.push(`TEL;TYPE=WORK,VOICE:${clinic.phone}`);
    if (clinic.email) lines.push(`EMAIL;TYPE=WORK:${clinic.email}`);
    if (clinic.address) lines.push(`ADR;TYPE=WORK:;;${clinic.address};;;;`);
    if (clinic.website) lines.push(`URL:${clinic.website}`);

    lines.push('END:VCARD');

    const vcard = lines.join('\r\n');

    const encodedName = encodeURIComponent(clinic.name);

    return new NextResponse(vcard, {
      status: 200,
      headers: {
        'Content-Type': 'text/vcard; charset=utf-8',
        'Content-Disposition': `attachment; filename="contact.vcf"; filename*=UTF-8''${encodedName}.vcf`,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e) {
    return serverError('[BCARD_VCARD]', e);
  }
}
