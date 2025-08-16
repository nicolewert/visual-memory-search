import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../convex/_generated/api'
import { searchScreenshots } from '../../../lib/search'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limitParam = searchParams.get('limit')
    
    // Validate required query parameter
    if (!query) {
      return NextResponse.json(
        { 
          error: 'Query parameter "q" is required',
          results: [],
          query: '',
          totalFound: 0,
          responseTime: 0
        },
        { status: 400 }
      )
    }

    // Sanitize and validate query
    const sanitizedQuery = query.trim();
    if (sanitizedQuery.length === 0) {
      return NextResponse.json(
        { 
          error: 'Query cannot be empty',
          results: [],
          query: sanitizedQuery,
          totalFound: 0,
          responseTime: 0
        },
        { status: 400 }
      )
    }

    if (sanitizedQuery.length > 500) {
      return NextResponse.json(
        { 
          error: 'Query too long (maximum 500 characters)',
          results: [],
          query: sanitizedQuery,
          totalFound: 0,
          responseTime: 0
        },
        { status: 400 }
      )
    }

    // Parse and validate limit parameter
    const limit = limitParam ? parseInt(limitParam, 10) : 5
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return NextResponse.json(
        { 
          error: 'Limit must be a number between 1 and 50',
          results: [],
          query: sanitizedQuery,
          totalFound: 0,
          responseTime: 0
        },
        { status: 400 }
      )
    }

    // Fetch all screenshots from Convex
    const screenshots = await convex.query(api.screenshots.listScreenshots)
    
    if (!screenshots || !Array.isArray(screenshots)) {
      throw new Error('Failed to fetch screenshots from database')
    }
    
    // Apply our advanced search algorithm
    const results = searchScreenshots(sanitizedQuery, screenshots, limit)
    
    const responseTime = Date.now() - startTime

    // Log the search for analytics (fire and forget)
    try {
      await convex.mutation(api.screenshots.logSearch, {
        query: sanitizedQuery,
        resultsCount: results.length,
        responseTime
      })
    } catch (error) {
      // Don't fail the request if logging fails
      console.warn('Failed to log search:', error)
    }

    return NextResponse.json({
      results,
      query: sanitizedQuery,
      totalFound: results.length,
      responseTime
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error('Search API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        results: [],
        query: request.nextUrl.searchParams.get('q') || '',
        totalFound: 0,
        responseTime
      },
      { status: 500 }
    )
  }
}