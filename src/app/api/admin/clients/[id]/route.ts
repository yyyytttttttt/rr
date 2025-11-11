import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prizma";
import { z } from "zod";

const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const client = await prisma.user.findUnique({
      where: { id, role: "USER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: client.id,
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      image: client.image,
      visits: client._count.bookings,
      createdAt: client.createdAt,
    });
  } catch (error) {
    console.error("Failed to fetch client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const validated = updateClientSchema.parse(body);

    // Check if client exists
    const existingClient = await prisma.user.findUnique({
      where: { id, role: "USER" },
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
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

    return NextResponse.json(updatedClient);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation error", details: error.issues }, { status: 400 });
    }
    console.error("Failed to update client:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
