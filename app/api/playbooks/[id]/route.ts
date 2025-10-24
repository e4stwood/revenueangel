import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data-manager';
import { verifyCompanyAdminAccess } from '@/lib/auth-utils';

// GET /api/playbooks/[id] - Get playbook details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const playbook = await prisma.playbook.findUnique({
      where: { id },
      include: {
        steps: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            sends: true,
          },
        },
      },
    });

    if (!playbook) {
      return NextResponse.json(
        { error: 'Playbook not found' },
        { status: 404 }
      );
    }

    // Verify authentication
    const auth = await verifyCompanyAdminAccess(request, playbook.companyId);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.userMessage || 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({ playbook });

  } catch (error) {
    console.error('Error fetching playbook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbook' },
      { status: 500 }
    );
  }
}

// PATCH /api/playbooks/[id] - Update playbook
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingPlaybook = await prisma.playbook.findUnique({
      where: { id },
    });

    if (!existingPlaybook) {
      return NextResponse.json(
        { error: 'Playbook not found' },
        { status: 404 }
      );
    }

    // Verify authentication
    const auth = await verifyCompanyAdminAccess(request, existingPlaybook.companyId);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.userMessage || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update playbook
    const playbook = await prisma.playbook.update({
      where: { id },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.targetRules && { targetRules: body.targetRules }),
      },
      include: {
        steps: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ playbook });

  } catch (error) {
    console.error('Error updating playbook:', error);
    return NextResponse.json(
      { error: 'Failed to update playbook' },
      { status: 500 }
    );
  }
}

// DELETE /api/playbooks/[id] - Delete playbook
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingPlaybook = await prisma.playbook.findUnique({
      where: { id },
    });

    if (!existingPlaybook) {
      return NextResponse.json(
        { error: 'Playbook not found' },
        { status: 404 }
      );
    }

    // Verify authentication
    const auth = await verifyCompanyAdminAccess(request, existingPlaybook.companyId);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.userMessage || 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.playbook.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting playbook:', error);
    return NextResponse.json(
      { error: 'Failed to delete playbook' },
      { status: 500 }
    );
  }
}

