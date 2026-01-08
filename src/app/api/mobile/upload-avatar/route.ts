export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prizma';
import { requireAuth, createCorsResponse } from '../../../../lib/jwt';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// POST - Загрузить аватар
export async function POST(request: NextRequest) {
  const auth = requireAuth(request);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth.payload;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Проверка типа файла
    const mime = file.type || '';
    if (!mime.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only images are allowed' },
        { status: 400 }
      );
    }

    // Проверка размера файла (макс 2MB)
    const size = file.size || 0;
    if (size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 2MB' },
        { status: 400 }
      );
    }

    // Конвертировать в Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Загрузить в Cloudinary
    const upload = await new Promise<{ url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'avatars',
          overwrite: true,
          transformation: [
            { width: 512, height: 512, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (err, result) => {
          if (err || !result) return reject(err);
          resolve({ url: result.secure_url, public_id: result.public_id });
        }
      );
      stream.end(buffer);
    });

    // Обновить аватар пользователя в БД
    await prisma.user.update({
      where: { id: userId },
      data: { image: upload.url },
    });

    console.info(`[MOBILE_UPLOAD_AVATAR] Avatar uploaded for user ${userId}`);

    return NextResponse.json({ success: true, url: upload.url });
  } catch (error) {
    console.error('[MOBILE_UPLOAD_AVATAR] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
