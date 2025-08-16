import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export async function generateVisualDescription(imageBase64: string): Promise<string> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not set, returning generic description')
      return 'A screenshot or image that can be searched for its visual content.'
    }

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 150,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this screenshot in 2-3 sentences focusing on UI elements, colors, buttons, text, and key visual features that someone might search for.'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/png',
                data: imageBase64
              }
            }
          ]
        }
      ]
    })

    const content = response.content[0]
    if (content.type === 'text') {
      return content.text.trim()
    }
    
    return 'A screenshot or image with visual content.'
  } catch (error) {
    console.error('Claude API error:', error)
    return 'A screenshot or image that can be searched for its visual content.'
  }
}

export async function fileToBase64(file: File): Promise<string> {
  // Server-side conversion using Node.js Buffer
  if (typeof window === 'undefined') {
    // Server-side: Convert File to Buffer then to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    return buffer.toString('base64')
  }
  
  // Client-side: Use FileReader
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isValidImageFile(file: File): boolean {
  const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  return validTypes.includes(file.type) && file.size <= maxSize
}