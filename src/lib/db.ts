import 'dotenv/config' // only in dev env or ts-node usage
import { drizzle } from 'drizzle-orm/neon-serverless'
import { Pool } from '@neondatabase/serverless'
import * as schema from '@/db/schema'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
})

export const db = drizzle(pool, { schema })
