import { ServerDatabaseFactory } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, ...actionParams } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const creatureRepo = await ServerDatabaseFactory.getCreatureRepository();
    let creature;

    switch (action) {
      case 'feed':
        creature = await creatureRepo.feed(id, actionParams.amount);
        break;
      case 'play':
        creature = await creatureRepo.play(id);
        break;
      case 'rest':
        creature = await creatureRepo.rest(id, actionParams.duration);
        break;
      case 'check_attention':
        const attentionStatus = await creatureRepo.needsAttention(id);
        return NextResponse.json({
          creature: await creatureRepo.getById(id),
          ...attentionStatus,
        });

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    if (!creature) {
      return NextResponse.json(
        { error: 'Creature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      creature,
      message: `Action '${action}' performed successfully`,
    });
  } catch (error) {
    console.error('Error performing creature action:', error);

    if (error instanceof Error && error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Creature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
