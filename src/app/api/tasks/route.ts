import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { tasks, users } from '@/db/schema'
import { eq, or } from 'drizzle-orm'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clerkUserId = searchParams.get('clerkUserId')
    const email = searchParams.get('email')

    if (!clerkUserId && !email) {
      return new NextResponse(JSON.stringify({ error: 'Missing clerkUserId or email' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const user = await db
      .select()
      .from(users)
      .where(
        or(
          clerkUserId ? eq(users.clerkUserId, clerkUserId) : undefined,
          email ? eq(users.email, email) : undefined
        )
      )
      .limit(1)

    if (user.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: corsHeaders,
      })
    }

    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, user[0].id))

    return new NextResponse(JSON.stringify(userTasks), { headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch tasks' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()

    if (!data.clerkUserId || !data.title || !data.email) {
      return new NextResponse(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const user = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.clerkUserId, data.clerkUserId),
          eq(users.email, data.email)
        )
      )
      .limit(1)

    let userId: number

    if (user.length === 0) {
      const inserted = await db
        .insert(users)
        .values({
          clerkUserId: data.clerkUserId,
          email: data.email,
        })
        .returning()

      userId = inserted[0].id
    } else {
      userId = user[0].id
    }

    const insertedTask = await db
      .insert(tasks)
      .values({
        title: data.title,
        completed: data.completed ?? false,
        userId,
        category: data.category || null,
      })
      .returning()

    return new NextResponse(JSON.stringify(insertedTask[0]), { headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new NextResponse(JSON.stringify({ error: 'Failed to insert task' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('id')
    const data = await req.json()

    if (!taskId) {
      return new NextResponse(JSON.stringify({ error: 'Missing task id' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const updates: Partial<typeof tasks.$inferInsert> = {}

    if (typeof data.completed === 'boolean') updates.completed = data.completed
    if (typeof data.title === 'string' && data.title.trim() !== '') updates.title = data.title.trim()
    if (typeof data.category === 'string') updates.category = data.category.trim() || null

    if (Object.keys(updates).length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No valid fields to update' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const updated = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, Number(taskId)))
      .returning()

    return new NextResponse(JSON.stringify(updated[0]), { headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new NextResponse(JSON.stringify({ error: 'Failed to update task' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get('id')

    if (!taskId) {
      return new NextResponse(JSON.stringify({ error: 'Missing task id' }), {
        status: 400,
        headers: corsHeaders,
      })
    }

    const deleted = await db
      .delete(tasks)
      .where(eq(tasks.id, Number(taskId)))
      .returning()

    return new NextResponse(JSON.stringify(deleted[0]), { headers: corsHeaders })
  } catch (err) {
    console.error(err)
    return new NextResponse(JSON.stringify({ error: 'Failed to delete task' }), {
      status: 500,
      headers: corsHeaders,
    })
  }
}
