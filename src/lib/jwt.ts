import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

// Разрешенные origins для мобильного приложения
const ALLOWED_ORIGINS = [
  'https://nikropolis.ru',
  'https://novay-y.com',
  'http://mobileapp-app-iskjka:3000',  // Docker контейнер backend
  'http://app-app-0yooux:3000',        // Docker контейнер Capacitor app
  'mobileapp-app-iskjka',
  'app-app-0yooux',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.0.156:3000',
];

/**
 * Добавить CORS headers к ответу
 */
export function addCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }
  return response;
}

/**
 * Создать CORS preflight ответ
 */
export function createCorsResponse(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response, origin);
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'USER' | 'DOCTOR' | 'ADMIN';
  tokenVersion: number;
}

/**
 * Проверяет JWT токен из Authorization header
 * @param request - Next.js request object
 * @returns Payload токена или null если токен невалидный
 */
export function verifyToken(request: NextRequest): JWTPayload | null {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Убираем "Bearer "

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('[JWT] Token verification failed:', error);
    return null;
  }
}

/**
 * Middleware для защиты мобильных API endpoints
 * @param request - Next.js request object
 * @param requiredRoles - Необязательный массив ролей, которые могут получить доступ
 * @returns NextResponse с ошибкой или payload токена
 */
export function requireAuth(
  request: NextRequest,
  requiredRoles?: ('USER' | 'DOCTOR' | 'ADMIN')[]
): { error: NextResponse } | { payload: JWTPayload } {
  const payload = verifyToken(request);

  if (!payload) {
    return {
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid or missing token' },
        { status: 401 }
      ),
    };
  }

  // Проверка ролей если указаны
  if (requiredRoles && !requiredRoles.includes(payload.role)) {
    return {
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        { status: 403 }
      ),
    };
  }

  return { payload };
}
