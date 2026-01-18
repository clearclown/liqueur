import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(
      transactions.map((tx) => ({
        id: tx.id,
        date: tx.date.toISOString(),
        type: tx.type,
        amount: Number(tx.amount),
        description: tx.description,
        category: {
          name: tx.category.name,
          color: tx.category.color,
        },
      }))
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();

    const { date, type, categoryId, amount, description } = body;

    if (!date || !type || !categoryId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        type,
        categoryId,
        amount,
        description: description || null,
        userId: user.id,
      },
      include: { category: true },
    });

    return NextResponse.json({
      id: transaction.id,
      date: transaction.date.toISOString(),
      type: transaction.type,
      amount: Number(transaction.amount),
      description: transaction.description,
      category: {
        name: transaction.category.name,
        color: transaction.category.color,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Transaction create error:', error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
