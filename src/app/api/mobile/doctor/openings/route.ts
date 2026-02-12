import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prizma";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { z } from "zod";
import { serverError } from "../../../../../lib/api-error";

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

const querySchema = z.object({
  from: z.string().datetime('Неверный формат даты from'),
  to: z.string().datetime('Неверный формат даты to'),
});

const createOpeningSchema = z.object({
  startUtc: z.string().datetime('Неверный формат startUtc'),
  endUtc: z.string().datetime('Неверный формат endUtc'),
});

const createMultipleSchema = z.object({
  openings: z.array(createOpeningSchema).min(1, 'Укажите хотя бы один слот'),
});

/**
 * GET /api/mobile/doctor/openings
 * Получение доступных слотов врача
 * Требует JWT авторизацию и роль DOCTOR
 */
export async function GET(req: NextRequest) {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;

  // Проверка роли
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Доступ запрещен. Требуется роль врача.' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(req.url);
    const parsed = querySchema.safeParse({
      from: url.searchParams.get("from"),
      to: url.searchParams.get("to"),
    });

    if (!parsed.success) {
      return NextResponse.json({
        error: "Ошибка валидации параметров",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }

    const { from, to } = parsed.data;
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Получаем doctorId из query параметров
    const doctorIdParam = url.searchParams.get('doctorId');

    // Определяем ID врача в зависимости от роли
    let doctor;

    if (role === 'ADMIN') {
      // Админ может смотреть openings любого врача
      if (!doctorIdParam) {
        return NextResponse.json(
          { error: 'Для админа необходимо указать doctorId в query параметрах' },
          { status: 400 }
        );
      }

      doctor = await prisma.doctor.findUnique({
        where: { id: doctorIdParam },
        select: { id: true },
      });
    } else {
      // Врач смотрит свои openings
      doctor = await prisma.doctor.findFirst({
        where: { userId },
        select: { id: true },
      });
    }

    if (!doctor) {
      return NextResponse.json(
        { error: 'Профиль врача не найден' },
        { status: 404 }
      );
    }

    // Загружаем openings и bookings параллельно
    const [openings, bookings] = await Promise.all([
      prisma.opening.findMany({
        where: {
          doctorId: doctor.id,
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate },
        },
        orderBy: { startUtc: "asc" },
        select: { id: true, startUtc: true, endUtc: true },
      }),
      prisma.booking.findMany({
        where: {
          doctorId: doctor.id,
          status: { in: ["PENDING", "CONFIRMED"] },
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate },
        },
        select: { id: true, startUtc: true, endUtc: true },
      }),
    ]);

    return NextResponse.json({
      openings: openings.map((o) => ({ id: o.id, start: o.startUtc, end: o.endUtc })),
      busy: bookings.map((b) => ({ id: b.id, start: b.startUtc, end: b.endUtc })),
      meta: {
        from: fromDate,
        to: toDate,
        totalOpenings: openings.length,
        totalBusy: bookings.length,
      }
    });

  } catch (error) {
    return serverError('[MOBILE_DOCTOR_OPENINGS] GET Error', error);
  }
}

/**
 * POST /api/mobile/doctor/openings
 * Создание доступных слотов врача
 * Требует JWT авторизацию и роль DOCTOR
 */
export async function POST(req: NextRequest) {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;

  // Проверка роли
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Доступ запрещен. Требуется роль врача.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const parsed = createMultipleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: "Ошибка валидации",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }

    // Получаем doctorId из body (для админа)
    const doctorIdFromBody = (body as any)?.doctorId;

    // Определяем ID врача в зависимости от роли
    let doctor;

    if (role === 'ADMIN') {
      // Админ может создавать openings для любого врача
      if (!doctorIdFromBody) {
        return NextResponse.json(
          { error: 'Для админа необходимо указать doctorId в body' },
          { status: 400 }
        );
      }

      doctor = await prisma.doctor.findUnique({
        where: { id: doctorIdFromBody },
        select: { id: true },
      });
    } else {
      // Врач создает свои openings
      doctor = await prisma.doctor.findFirst({
        where: { userId },
        select: { id: true },
      });
    }

    if (!doctor) {
      return NextResponse.json(
        { error: 'Профиль врача не найден' },
        { status: 404 }
      );
    }

    // Валидация: проверяем что startUtc < endUtc для каждого слота
    for (const opening of parsed.data.openings) {
      const start = new Date(opening.startUtc);
      const end = new Date(opening.endUtc);
      if (start >= end) {
        return NextResponse.json({
          error: "Время начала должно быть раньше времени окончания",
          opening
        }, { status: 400 });
      }
    }

    // Создаем слоты
    const createdOpenings = await prisma.opening.createMany({
      data: parsed.data.openings.map(o => ({
        doctorId: doctor.id,
        startUtc: new Date(o.startUtc),
        endUtc: new Date(o.endUtc),
      })),
      skipDuplicates: true,
    });

    console.log(`[MOBILE_DOCTOR_OPENINGS] Created ${createdOpenings.count} openings for doctor ${doctor.id}`);

    return NextResponse.json({
      success: true,
      message: `Создано ${createdOpenings.count} слотов`,
      count: createdOpenings.count,
    }, { status: 201 });

  } catch (error) {
    return serverError('[MOBILE_DOCTOR_OPENINGS] POST Error', error);
  }
}

/**
 * DELETE /api/mobile/doctor/openings
 * Удаление слотов врача по ID
 */
export async function DELETE(req: NextRequest) {
  const auth = requireAuth(req);

  if ('error' in auth) {
    return auth.error;
  }

  const { userId, role } = auth.payload;

  // Проверка роли
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Доступ запрещен. Требуется роль врача.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json().catch(() => null);
    const schema = z.object({
      openingIds: z.array(z.string()).min(1, 'Укажите хотя бы один ID слота'),
    });

    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({
        error: "Ошибка валидации",
        details: parsed.error.flatten().fieldErrors
      }, { status: 400 });
    }

    // Получаем ID врача
    const doctor = await prisma.doctor.findFirst({
      where: { userId },
      select: { id: true },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Профиль врача не найден' },
        { status: 404 }
      );
    }

    // Удаляем только слоты этого врача
    const deleted = await prisma.opening.deleteMany({
      where: {
        id: { in: parsed.data.openingIds },
        doctorId: doctor.id, // Важно: только свои слоты
      },
    });

    console.log(`[MOBILE_DOCTOR_OPENINGS] Deleted ${deleted.count} openings for doctor ${doctor.id}`);

    return NextResponse.json({
      success: true,
      message: `Удалено ${deleted.count} слотов`,
      count: deleted.count,
    });

  } catch (error) {
    return serverError('[MOBILE_DOCTOR_OPENINGS] DELETE Error', error);
  }
}
