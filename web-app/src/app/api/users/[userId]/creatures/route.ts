import { NextResponse } from 'next/server';
import { DatabaseFactory } from '@/lib/database';

/**
 * Get all creatures for a user (currently returns only one)
 */
export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const creatureRepo = await DatabaseFactory.getCreatureRepository('server');
    const creature = await creatureRepo.getByOwnerId(params.userId);

    if (!creature) {
      return NextResponse.json(
        {
          message: 'No creature found for this user',
          creature: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      creature,
    });
  } catch (error) {
    console.error('Error fetching user creatures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creatures' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const creatureRepo = await DatabaseFactory.getCreatureRepository('server');
    await creatureRepo.deleteByOwnerId(params.userId);

    return NextResponse.json(
      { message: 'All creatures deleted successfully for user' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting user creatures:', error);
    return NextResponse.json(
      { error: 'Failed to delete creatures' },
      { status: 500 }
    );
  }
}
