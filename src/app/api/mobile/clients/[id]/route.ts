import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createCorsResponse } from "../../../../../lib/jwt";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// Обработка OPTIONS для CORS preflight
export async function OPTIONS(request: NextRequest) {
  return createCorsResponse(request);
}

// PATCH - Update client data
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = requireAuth(req, ['ADMIN', 'DOCTOR']);

  if ('error' in auth) {
    return auth.error;
  }

  const { id } = await params;

  console.log("[MOBILE_CLIENT_UPDATE] PATCH request for client:", id, "by user:", auth.payload.userId);

  try {
    const body = await req.json();
    const validated = updateClientSchema.parse(body);

    // Check if client exists
    const existingClient = await prisma.user.findUnique({
      where: { id, role: "USER" },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Клиент не найден" }, { status: 404 });
    }

    // Update client
    const updatedClient = await prisma.user.update({
      where: { id },
      data: {
        ...(validated.name !== undefined && { name: validated.name }),
        ...(validated.email !== undefined && { email: validated.email }),
        ...(validated.phone !== undefined && { phone: validated.phone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    });

    console.log("[MOBILE_CLIENT_UPDATE] Updated client:", updatedClient.id);
    return NextResponse.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Ошибка валидации", details: error.issues }, { status: 400 });
    }
    console.error("[MOBILE_CLIENT_UPDATE] Failed to update client:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
