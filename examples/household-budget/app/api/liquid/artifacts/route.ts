import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { SchemaValidator } from '@liqueur/protocol';

// GET - List all artifacts for user
export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const artifacts = await prisma.artifact.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ artifacts });
  } catch (error) {
    console.error('List artifacts error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to list artifacts' },
      { status: 500 }
    );
  }
}

// POST - Create new artifact
export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const { name, schema } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid name' },
        { status: 400 }
      );
    }

    if (!schema || typeof schema !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid schema' },
        { status: 400 }
      );
    }

    // Validate schema
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

    // Create artifact
    const artifact = await prisma.artifact.create({
      data: {
        name,
        schema: JSON.stringify(schema),
        userId: user.id,
      },
    });

    return NextResponse.json({
      artifact: {
        id: artifact.id,
        name: artifact.name,
        schema,
        createdAt: artifact.createdAt,
        updatedAt: artifact.updatedAt,
      },
    });
  } catch (error) {
    console.error('Create artifact error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Failed to create artifact' },
      { status: 500 }
    );
  }
}
