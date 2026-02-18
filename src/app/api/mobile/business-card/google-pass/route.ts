export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { createCorsResponse } from '../../../../../lib/jwt';
import { rateLimit, sanitizeIp } from '../../../../../lib/rate-limit';
import { getClinicInfo } from '../../../../../lib/clinic-info';
import { serverError } from '../../../../../lib/api-error';

const limiter = rateLimit({ windowMs: 60_000, max: 30, keyPrefix: 'mob-bcard-google' });

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

    const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
    const serviceAccountB64 = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64;

    if (!issuerId || !serviceAccountB64) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
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
      cardTitle: { defaultValue: { language: 'ru', value: clinic.name } },
      header: { defaultValue: { language: 'ru', value: clinic.name } },
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
        payload: { genericObjects: [genericObject] },
      },
      serviceAccountJson.private_key,
      { algorithm: 'RS256' },
    );

    const saveUrl = `https://pay.google.com/gp/v/save/${token}`;

    return NextResponse.json({ url: saveUrl }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    return serverError('[MOB_BCARD_GOOGLE]', e);
  }
}
