import { NextRequest, NextResponse } from 'next/server';
import { createCorsResponse } from '../../../../../lib/jwt';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { getClinicInfo } from '../../../../../lib/clinic-info';
import { serverError } from '../../../../../lib/api-error';

const limiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'mob-bcard-vcard' });

export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function GET(request: NextRequest) {
  try {
    const ip = sanitizeIp(
      request.headers.get('x-forwarded-for'),
      request.headers.get('x-real-ip'),
    );
    const rl = await limiter(ip);
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
    return serverError('[MOB_BCARD_VCARD]', e);
  }
}
