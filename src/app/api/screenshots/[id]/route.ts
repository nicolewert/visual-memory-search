import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../../convex/_generated/api'
import { Id } from '../../../../../convex/_generated/dataModel'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params
    
    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid screenshot ID'
        },
        { status: 400 }
      )
    }

    // Delete the screenshot from Convex
    await convex.mutation(api.screenshots.deleteScreenshot, {
      id: id as Id<"screenshots">
    })

    return NextResponse.json({
      success: true,
      message: 'Screenshot deleted successfully'
    })

  } catch (error) {
    console.error('Delete screenshot API error:', error)
    
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to delete screenshot'
      },
      { status: 500 }
    )
  }
}