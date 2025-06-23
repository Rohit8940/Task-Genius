import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY!, // keep your API key in env
})

export async function POST(req: NextRequest) {
  try {
    const { topic } = await req.json()

    if (!topic) {
      return NextResponse.json({ error: 'Missing topic' }, { status: 400 })
    }

    const prompt = `Generate a list of 5 concise, actionable tasks to learn about "${topic}". Return only the tasks, no numbering or formatting.`

    // Using generateContent method as per latest SDK
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // or the model you have access to
      contents: prompt,
    })

    // response.text contains the generated text
    // const text = response.text

    // Split into tasks by newline and filter out empty lines
    const tasks = (response.text ?? '')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line)

    return NextResponse.json({ tasks })
  } catch (err) {
    console.error('Gemini Error:', err)
    return NextResponse.json({ error: 'Gemini API failed' }, { status: 500 })
  }
}
