import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

export async function GET() {
  try {
    const inserted = await db.insert(users).values({
      email: 'test@example.com',
      clerkUserId: 'user_test_123', 
    }).returning();

    return NextResponse.json({ success: true, user: inserted });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: 'Failed to seed user' }, { status: 500 });
  }
}
