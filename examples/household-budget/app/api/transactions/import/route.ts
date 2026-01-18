import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { TransactionType } from '@prisma/client';

interface CSVRow {
  date: string;
  type: string;
  category: string;
  amount: string;
  description: string;
}

function parseCSV(content: string): CSVRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have a header row and at least one data row');
  }

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const requiredFields = ['date', 'type', 'category', 'amount'];

  for (const field of requiredFields) {
    if (!header.includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    if (values.length < header.length) continue;

    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });

    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const content = await file.text();
    const rows = parseCSV(content);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data rows found' }, { status: 400 });
    }

    // Get user's categories
    const categories = await prisma.category.findMany({
      where: { userId: user.id },
    });
    const categoryMap = new Map(categories.map((c) => [c.name.toLowerCase(), c]));

    const errors: string[] = [];
    let imported = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for header row and 1-based indexing

      try {
        // Validate date
        const date = new Date(row.date);
        if (isNaN(date.getTime())) {
          errors.push(`Row ${rowNum}: Invalid date "${row.date}"`);
          continue;
        }

        // Validate type
        const type = row.type.toUpperCase();
        if (type !== 'EXPENSE' && type !== 'INCOME') {
          errors.push(`Row ${rowNum}: Invalid type "${row.type}" (use expense or income)`);
          continue;
        }

        // Find or create category
        let category = categoryMap.get(row.category.toLowerCase());
        if (!category) {
          // Create new category
          category = await prisma.category.create({
            data: {
              name: row.category,
              type: type === 'EXPENSE' ? 'EXPENSE' : 'INCOME',
              userId: user.id,
            },
          });
          categoryMap.set(row.category.toLowerCase(), category);
        }

        // Validate amount
        const amount = parseFloat(row.amount);
        if (isNaN(amount) || amount < 0) {
          errors.push(`Row ${rowNum}: Invalid amount "${row.amount}"`);
          continue;
        }

        // Create transaction
        await prisma.transaction.create({
          data: {
            date,
            type: type as TransactionType,
            categoryId: category.id,
            amount,
            description: row.description || null,
            userId: user.id,
          },
        });

        imported++;
      } catch (err) {
        errors.push(`Row ${rowNum}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({
      imported,
      total: rows.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('CSV import error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Import failed' },
      { status: 500 }
    );
  }
}
