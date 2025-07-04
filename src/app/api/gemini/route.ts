

import { NextRequest, NextResponse } from 'next/server'

// Allow CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const topic = body.topic

  if (!topic) {
    return NextResponse.json(
      { error: 'Topic is required' },
      {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Generate a list of 5 concise, actionable tasks to learn about "${topic}". Each task should include a category like "research", "practice", "reading", etc. Return ONLY a JSON array of objects in this format:

[
  { "title": "Task title here", "category": "Category name here" },
  ...
]`,
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await geminiRes.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    let tasks: { title: string; category: string }[] = []

    try {
      tasks = JSON.parse(text)
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', e)
      return NextResponse.json(
        { error: 'Invalid response from Gemini' },
        {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    return NextResponse.json({ tasks }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: 'Failed to generate tasks' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
