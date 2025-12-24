import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SavedFilterInputSchema } from "@/features/tasks/types";

const MAX_SAVED_FILTERS = 10;

// GET /api/saved-filters - List saved filters for authenticated user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in to view saved filters" } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User not found" } },
        { status: 401 }
      );
    }

    const savedFilters = await prisma.savedFilter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: savedFilters.map((filter) => ({
        id: filter.id,
        name: filter.name,
        filters: JSON.parse(filter.filters),
        createdAt: filter.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching saved filters:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch saved filters" } },
      { status: 500 }
    );
  }
}

// POST /api/saved-filters - Create a new saved filter
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in to save filters" } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User not found" } },
        { status: 401 }
      );
    }

    // Check filter limit
    const existingCount = await prisma.savedFilter.count({
      where: { userId: user.id },
    });

    if (existingCount >= MAX_SAVED_FILTERS) {
      return NextResponse.json(
        {
          error: {
            code: "LIMIT_EXCEEDED",
            message: `Maximum ${MAX_SAVED_FILTERS} filters reached. Delete one to save more.`,
          },
        },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parsed = SavedFilterInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input provided",
            details: parsed.error.errors.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    const { name, filters } = parsed.data;

    // Create saved filter
    const savedFilter = await prisma.savedFilter.create({
      data: {
        name,
        filters: JSON.stringify(filters),
        userId: user.id,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: savedFilter.id,
          name: savedFilter.name,
          filters: JSON.parse(savedFilter.filters),
          createdAt: savedFilter.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating saved filter:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to save filter" } },
      { status: 500 }
    );
  }
}
