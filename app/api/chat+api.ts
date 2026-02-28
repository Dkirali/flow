import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(request: Request) {
  const { messages, spendingContext } = await request.json()

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: `You are FLŌW, a friendly AI financial assistant built into a budget tracking app.
    
    The user's financial context (anonymized):
    ${JSON.stringify(spendingContext)}
    
    Guidelines:
    - Keep responses concise and actionable (2–4 sentences max for insights)
    - Be encouraging, not judgmental
    - Suggest specific, realistic changes
    - Never mention account numbers or personally identifiable information
    - If asked about investments, always include a brief risk disclaimer`,
    messages,
    maxTokens: 500,
  })

  return result.toDataStreamResponse()
}
