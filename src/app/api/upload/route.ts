import { NextRequest, NextResponse } from 'next/server'
import { generateVisualDescription, fileToBase64, isValidImageFile } from '@/lib/claude'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json({
        success: false,
        uploadedCount: 0,
        errors: ['No files provided']
      }, { status: 400 })
    }

    // Rate limiting for batch uploads
    const MAX_BATCH_SIZE = 50
    if (files.length > MAX_BATCH_SIZE) {
      return NextResponse.json({
        success: false,
        uploadedCount: 0,
        errors: [`Too many files. Maximum ${MAX_BATCH_SIZE} files per batch.`]
      }, { status: 400 })
    }

    const results = []
    const errors = []
    const BATCH_SIZE = 3 // Process 3 files concurrently
    
    // Process files in batches to avoid overwhelming Claude API
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE)
      
      const batchPromises = batch.map(async (file) => {
        try {
          // Validate file
          if (!isValidImageFile(file)) {
            return {
              error: `${file.name}: Invalid file type or size. Must be PNG/JPG/JPEG/WebP under 10MB.`,
              filename: file.name
            }
          }

          // Process with Claude for visual descriptions
          const base64Data = await fileToBase64(file)
          const visualDescription = await generateVisualDescription(base64Data)
          
          return {
            success: true,
            filename: file.name,
            fileSize: file.size,
            visualDescription,
            file: base64Data // Return base64 for client processing
          }
          
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error)
          return {
            error: `${file.name}: Processing failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
            filename: file.name
          }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      // Separate successful results from errors
      for (const result of batchResults) {
        if ('success' in result && result.success) {
          results.push({
            filename: result.filename,
            fileSize: result.fileSize,
            visualDescription: result.visualDescription,
            file: result.file
          })
        } else if ('error' in result) {
          errors.push(result.error)
        }
      }

      // Small delay between batches to avoid overwhelming the API
      if (i + BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      uploadedCount: results.length,
      totalFiles: files.length,
      errors,
      processedFiles: results,
      batchInfo: {
        processed: results.length,
        failed: errors.length,
        total: files.length
      }
    })

  } catch (error) {
    console.error('Upload API error:', error)
    return NextResponse.json({
      success: false,
      uploadedCount: 0,
      errors: ['Server error during upload']
    }, { status: 500 })
  }
}