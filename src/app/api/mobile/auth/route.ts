import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prizma';
import { createCorsResponse } from '../../../../lib/jwt';
import { sanitizeIp } from '../../../../lib/rate-limit';
import { logger } from '../../../../lib/logger';

const JWT_SECRET = (() => {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error('[SEC] NEXTAUTH_SECRET is not set');
  return s;
})();

// Rate limiting - в памяти (для production лучше использовать Redis)
interface RateLimitEntry {
  count: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();

// Константы для rate limiting
const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 минут
const ATTEMPT_WINDOW = 60 * 1000; // 1 минута
const MAX_MAP_SIZE = 10000; // Максимальный размер Map для предотвращения утечки памяти

// Очистка старых записей каждые 5 минут (было 30)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of loginAttempts.entries()) {
    if (value.blockedUntil && now > value.blockedUntil) {
      loginAttempts.delete(key);
    } else if (now - value.lastAttempt > BLOCK_DURATION) {
      loginAttempts.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Функция для безопасного добавления в Map с лимитом размера
function setLoginAttempt(key: string, value: RateLimitEntry) {
  // Если Map переполнен, удаляем самые старые записи
  if (loginAttempts.size >= MAX_MAP_SIZE) {
    const entries = Array.from(loginAttempts.entries());
    entries.sort((a, b) => a[1].lastAttempt - b[1].lastAttempt);
    // Удаляем 20% самых старых записей
    const toDelete = Math.floor(MAX_MAP_SIZE * 0.2);
    for (let i = 0; i < toDelete; i++) {
      loginAttempts.delete(entries[i][0]);
    }
  }
  loginAttempts.set(key, value);
}

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

export async function POST(request: NextRequest) {
  // Получаем IP адрес для rate limiting
  const ip = sanitizeIp(
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-real-ip'),
  );

  const now = Date.now();

  // Проверка rate limiting
  const attempts = loginAttempts.get(ip);

  if (attempts) {
    // Если заблокирован - возвращаем ошибку
    if (attempts.blockedUntil && now < attempts.blockedUntil) {
      const minutesLeft = Math.ceil((attempts.blockedUntil - now) / 60000);
      logger.warn('[MOBILE_AUTH] Blocked login attempt');

      return NextResponse.json(
        {
          error: 'TOO_MANY_ATTEMPTS',
          message: `Слишком много попыток входа. Попробуйте через ${minutesLeft} мин.`,
          retryAfter: minutesLeft
        },
        { status: 429 }
      );
    }

    // Сброс счетчика если прошло больше минуты с последней попытки
    if (now - attempts.lastAttempt > ATTEMPT_WINDOW) {
      loginAttempts.delete(ip);
    }
  }

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      );
    }

    // Найти пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        password: true,
        role: true,
        tokenVersion: true,
        emailVerified: true,
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Проверить email verification
    if (!user.emailVerified) {
      logger.warn('[MOBILE_AUTH] Email not verified');
      return NextResponse.json(
        { error: 'EMAIL_NOT_VERIFIED', message: 'Email не подтвержден' },
        { status: 403 }
      );
    }

    // Проверить пароль
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Увеличиваем счетчик неудачных попыток
      const currentAttempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
      const newCount = currentAttempts.count + 1;

      if (newCount >= MAX_ATTEMPTS) {
        // Блокируем IP на 15 минут
        const blockedUntil = now + BLOCK_DURATION;
        setLoginAttempt(ip, { count: newCount, lastAttempt: now, blockedUntil });

        logger.warn('[MOBILE_AUTH] IP blocked after max failed attempts');

        return NextResponse.json(
          {
            error: 'TOO_MANY_ATTEMPTS',
            message: 'Слишком много неудачных попыток. Аккаунт заблокирован на 15 минут.',
            retryAfter: 15
          },
          { status: 429 }
        );
      }

      // Обновляем счетчик
      setLoginAttempt(ip, { count: newCount, lastAttempt: now });

      logger.warn('[MOBILE_AUTH] Failed login attempt', { attempt: newCount, max: MAX_ATTEMPTS });

      return NextResponse.json(
        {
          error: 'Invalid credentials',
          attemptsLeft: MAX_ATTEMPTS - newCount
        },
        { status: 401 }
      );
    }

    // Успешная авторизация - очищаем счетчик попыток
    loginAttempts.delete(ip);

    logger.debug('[MOBILE_AUTH] Successful login');

    // Создаем JWT токен для авторизации последующих запросов
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion,
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Токен действителен 7 дней
    );

    // Вернуть данные пользователя и JWT токен (без пароля!)
    return NextResponse.json({
      success: true,
      jwtToken: token, // JWT токен для последующих запросов
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role,
        tokenVersion: user.tokenVersion,
      }
    });
  } catch (error) {
    logger.error('[MOBILE_AUTH] Error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
