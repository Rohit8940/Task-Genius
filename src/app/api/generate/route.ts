import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

// Initialize Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!, // store in env
})

// Handle CORS preflight
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

// Handle POST request
export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()

    if (!topic) {
      return NextResponse.json(
        { error: 'Missing topic' },
        {
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    const prompt = `Generate a list of 5 concise, actionable tasks to learn about "${topic}". Return only the tasks, no numbering or formatting.`

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })

    const tasks = (response.text ?? '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)

    return NextResponse.json({ tasks }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Gemini Error:', err)
    return NextResponse.json(
      { error: 'Gemini API failed' },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
}
