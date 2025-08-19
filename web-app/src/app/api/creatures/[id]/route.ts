import {
  ServerDatabaseFactory,
  UpdateCreatureDTO,
} from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const creatureRepo = await ServerDatabaseFactory.getCreatureRepository();
    const creature = await creatureRepo.getById(id);

    if (!creature) {
      return NextResponse.json(
        { error: 'Creature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ creature });
  } catch (error) {
    console.error('Error fetching creature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creature' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const creatureRepo = await ServerDatabaseFactory.getCreatureRepository();

    const updateData: UpdateCreatureDTO = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.hunger !== undefined) updateData.hunger = body.hunger;
    if (body.love !== undefined) updateData.love = body.love;
    if (body.tiredness !== undefined) updateData.tiredness = body.tiredness;

    const creature = await creatureRepo.update(id, updateData);

    if (!creature) {
      return NextResponse.json(
        { error: 'Creature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ creature });
  } catch (error) {
    console.error('Error updating creature:', error);

    if (error instanceof Error && error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Creature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update creature' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const creatureRepo = await ServerDatabaseFactory.getCreatureRepository();
    await creatureRepo.delete(id);

    return NextResponse.json(
      { message: 'Creature deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting creature:', error);

    if (error instanceof Error && error.message?.includes('not found')) {
      return NextResponse.json(
        { error: 'Creature not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete creature' },
      { status: 500 }
    );
  }
}
