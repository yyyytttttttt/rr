export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, sanitizeIp } from '../../../../lib/rate-limit';
import { getClinicInfo } from '../../../../lib/clinic-info';
import { serverError } from '../../../../lib/api-error';
import jwt from 'jsonwebtoken';

const limiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'bcard-google' });

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

    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const serviceAccountB64 = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64;

    if (!issuerId || !serviceAccountB64) {
      return NextResponse.json(
        { error: 'Service unavailable' },
        { status: 503 },
      );
    }

    const clinic = getClinicInfo();

    const serviceAccountJson = JSON.parse(
      Buffer.from(serviceAccountB64, 'base64').toString('utf-8'),
    );

    const classId = `${issuerId}.clinic_business_card`;
    const objectId = `${issuerId}.clinic_card_v1`;

    const genericObject = {
      id: objectId,
      classId,
      genericType: 'GENERIC_TYPE_UNSPECIFIED',
      hexBackgroundColor: '#FFFCF3',
      logo: {
        sourceUri: {
          uri: clinic.website ? `${clinic.website}/images/logo.png` : 'https://novay-y.com/images/logo.png',
        },
      },
      cardTitle: {
        defaultValue: { language: 'ru', value: clinic.name },
      },
      header: {
        defaultValue: { language: 'ru', value: clinic.name },
      },
      textModulesData: [
        ...(clinic.phone ? [{ id: 'phone', header: 'Телефон', body: clinic.phone }] : []),
        ...(clinic.address ? [{ id: 'address', header: 'Адрес', body: clinic.address }] : []),
        ...(clinic.email ? [{ id: 'email', header: 'Email', body: clinic.email }] : []),
      ],
      linksModuleData: {
        uris: [
          ...(clinic.website ? [{ uri: clinic.website, description: 'Сайт', id: 'website' }] : []),
          ...(clinic.phone ? [{ uri: `tel:${clinic.phone}`, description: 'Позвонить', id: 'call' }] : []),
        ],
      },
    };

    const token = jwt.sign(
      {
        iss: serviceAccountJson.client_email,
        aud: 'google',
        origins: [],
        typ: 'savetowallet',
        payload: {
          genericObjects: [genericObject],
        },
      },
      serviceAccountJson.private_key,
      { algorithm: 'RS256' },
    );

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.redirect(saveUrl, {
      status: 302,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return serverError('[BCARD_GOOGLE]', e);
  }
}
