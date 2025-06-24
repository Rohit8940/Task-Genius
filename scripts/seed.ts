(globalThis as any).WebSocket = require('ws');

import { db } from '@/lib/db';
import { users, tasks } from '@/db/schema';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Insert users with clerkUserId
  const insertedUsers = await db
    .insert(users)
    .values([
      {
        email: 'alice@example.com',
        clerkUserId: 'user_alice_001',
      },
      {
        email: 'bob@example.com',
        clerkUserId: 'user_bob_002',
      },
    ])
    .returning();

  console.log(`👤 Inserted users: ${insertedUsers.length}`);

  // 2. Insert tasks using inserted user IDs
  const insertedTasks = await db
    .insert(tasks)
    .values([
      {
        title: 'Buy groceries',
        completed: false,
        userId: insertedUsers[0].id,
      },
      {
        title: 'Finish project',
        completed: true,
        userId: insertedUsers[1].id,
      },
    ])
    .returning();

  console.log(`Inserted tasks: ${insertedTasks.length}`);

  process.exit(0);
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
