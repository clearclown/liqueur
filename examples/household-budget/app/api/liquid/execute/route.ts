import { NextResponse } from 'next/server';
import type { DataSource } from '@liqueur/protocol';
import { executeDataSources } from '@/lib/execute-datasource';
import { requireAuth } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Authentication check
    const user = await requireAuth(request);

    // Parse request body
    const body = await request.json();
    const { dataSources } = body as { dataSources: Record<string, DataSource> };

    if (!dataSources || typeof dataSources !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid dataSources' },
        { status: 400 }
      );
    }

    // Execute data sources with Row-Level Security (userId filtering)
    const data = await executeDataSources(dataSources, user.id);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Execute error:', error);

    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Execution failed' },
      { status: 500 }
    );
  }
}
