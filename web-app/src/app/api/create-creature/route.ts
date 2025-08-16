import * as admin from 'firebase-admin';
import { NextResponse } from 'next/server';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
    }),
  });
}

const db = admin.firestore();

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

    const creature = {
      name: body.name,
      ownerId: body.ownerId,
      createdAt: admin.firestore.Timestamp.now(),
      hunger: 100,
      love: 100,
      tiredness: 0,
    };

    const docRef = await db.collection('creatures').add(creature);

    return NextResponse.json({ creatureId: docRef.id }, { status: 201 });
  } catch (error) {
    console.error('Error creating creature:', error);
    return NextResponse.json(
      { error: 'Failed to create creature' },
      { status: 500 }
    );
  }
}
