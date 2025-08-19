import { ServerDatabaseFactory } from '@/lib/database/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Get all creatures for a user (currently returns only one)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const creatureRepo = await ServerDatabaseFactory.getCreatureRepository();
    const creature = await creatureRepo.getByOwnerId(userId);

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
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const creatureRepo = await ServerDatabaseFactory.getCreatureRepository();
    await creatureRepo.deleteByOwnerId(userId);

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
