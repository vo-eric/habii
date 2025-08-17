import { NextResponse } from 'next/server';
import {
  ServerDatabaseFactory,
  CreateCreatureDTO,
} from '@/lib/database/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.ownerId) {
      return NextResponse.json(
        {
          error: 'Owner ID is required',
        },
        { status: 400 }
      );
    }

    const creatureRepo = await ServerDatabaseFactory.getCreatureRepository();
    const creatureData: CreateCreatureDTO = {
      name: body.name,
      ownerId: body.ownerId,
      type: body.type || 'default',
      hunger: body.hunger,
      love: body.love,
      tiredness: body.tiredness,
    };

    const creature = await creatureRepo.create(creatureData);

    return NextResponse.json(
      {
        creatureId: creature.id,
        creature: creature,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating creature:', error);

    if (
      error instanceof Error &&
      error.message?.includes('already has a creature')
    ) {
      return NextResponse.json(
        {
          error:
            'User already has a creature. Each user can only have one creature.',
        },
        { status: 409 } // Conflict
      );
    }

    return NextResponse.json(
      { error: 'Failed to create creature' },
      { status: 500 }
    );
  }
}
