import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/saved-filters/[id] - Delete a saved filter
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in to delete filters" } },
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

    const { id } = await params;

    // Find the saved filter
    const savedFilter = await prisma.savedFilter.findUnique({
      where: { id },
    });

    if (!savedFilter) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Filter not found" } },
        { status: 404 }
      );
    }

    // Check ownership
    if (savedFilter.userId !== user.id) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You don't have permission to delete this filter" } },
        { status: 403 }
      );
    }

    // Delete the filter
    await prisma.savedFilter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved filter:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to delete filter" } },
      { status: 500 }
    );
  }
}
