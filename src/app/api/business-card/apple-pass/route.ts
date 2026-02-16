export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';
import { getClinicInfo } from '../../../../lib/clinic-info';
import { serverError } from '../../../../lib/api-error';

const limiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'bcard-apple' });

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

    const passTypeId = process.env.APPLE_PASS_TYPE_ID;
    const teamId = process.env.APPLE_TEAM_ID;
    const wwdrCertB64 = process.env.APPLE_WWDR_CERT_BASE64;
    const passCertB64 = process.env.APPLE_PASS_CERT_BASE64;
    const passCertPassword = process.env.APPLE_PASS_CERT_PASSWORD;

    if (!passTypeId || !teamId || !wwdrCertB64 || !passCertB64) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 },
      );
    }

    const { PKPass } = await import('passkit-generator');
    const clinic = getClinicInfo();

    const wwdrCert = Buffer.from(wwdrCertB64, 'base64');
    const passCert = Buffer.from(passCertB64, 'base64');

    const pass = new PKPass(
      {},
      {
        wwdr: wwdrCert,
        signerCert: passCert,
        signerKey: passCert,
        signerKeyPassphrase: passCertPassword || undefined,
      },
      {
        formatVersion: 1,
        serialNumber: 'clinic-business-card-v1',
        passTypeIdentifier: passTypeId,
        teamIdentifier: teamId,
        organizationName: clinic.name,
        description: `${clinic.name} — визитка`,
        foregroundColor: 'rgb(79, 83, 56)',
        backgroundColor: 'rgb(255, 252, 243)',
        labelColor: 'rgb(99, 104, 70)',
      },
    );

    pass.type = 'generic';

    pass.primaryFields.push({
      key: 'name',
      label: 'Клиника',
      value: clinic.name,
    });

    if (clinic.phone) {
      pass.secondaryFields.push({
        key: 'phone',
        label: 'Телефон',
        value: clinic.phone,
      });
    }

    if (clinic.address) {
      pass.auxiliaryFields.push({
        key: 'address',
        label: 'Адрес',
        value: clinic.address,
      });
    }

    if (clinic.website) {
      pass.backFields.push({
        key: 'website',
        label: 'Сайт',
        value: clinic.website,
      });
    }

    if (clinic.email) {
      pass.backFields.push({
        key: 'email',
        label: 'Email',
        value: clinic.email,
      });
    }

    const buffer = pass.getAsBuffer();
    const encodedName = encodeURIComponent(clinic.name);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="contact.pkpass"; filename*=UTF-8''${encodedName}.pkpass`,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e) {
    return serverError('[BCARD_APPLE]', e);
  }
}
