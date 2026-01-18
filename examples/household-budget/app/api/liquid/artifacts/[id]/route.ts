import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { SchemaValidator } from '@liqueur/protocol';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Get single artifact
export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;

    const artifact = await prisma.artifact.findFirst({
      where: {
        id,
        userId: user.id, // Row-Level Security
      },
    });

    if (!artifact) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      artifact: {
        id: artifact.id,
        name: artifact.name,
        schema: JSON.parse(artifact.schema),
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get artifact error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to get artifact' },
      { status: 500 }
    );
  }
}

// PUT - Update artifact
export async function PUT(request: Request, context: RouteContext) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;

    const body = await request.json();
    const { name, schema } = body;

    // Check ownership
    const existing = await prisma.artifact.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    // Validate schema if provided
    if (schema) {
      const validator = new SchemaValidator();
      const validationResult = validator.validate(schema);

      if (!validationResult.valid) {
        return NextResponse.json(
          {
            error: 'Invalid schema',
            details: validationResult.errors,
          },
          { status: 400 }
        );
      }
    }

    // Update artifact
    const artifact = await prisma.artifact.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(schema && { schema: JSON.stringify(schema) }),
      },
    });

    return NextResponse.json({
      artifact: {
        id: artifact.id,
        name: artifact.name,
        schema: JSON.parse(artifact.schema),
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update artifact error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to update artifact' },
      { status: 500 }
    );
  }
}

// DELETE - Delete artifact
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const user = await requireAuth(request);
    const { id } = await context.params;

    // Check ownership
    const existing = await prisma.artifact.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Artifact not found' },
        { status: 404 }
      );
    }

    // Delete artifact
    await prisma.artifact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete artifact error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to delete artifact' },
      { status: 500 }
    );
  }
}
