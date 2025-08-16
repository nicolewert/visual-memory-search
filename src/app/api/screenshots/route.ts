import { NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET() {
  try {
    // Fetch all screenshots from Convex
    const screenshots = await convex.query(api.screenshots.listScreenshots)
    
    if (!screenshots || !Array.isArray(screenshots)) {
      throw new Error('Failed to fetch screenshots from database')
    }

    return NextResponse.json({
      screenshots,
      total: screenshots.length
    })

  } catch (error) {
    console.error('Screenshots API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch screenshots',
        screenshots: [],
        total: 0
      },
      { status: 500 }
    )
  }
}