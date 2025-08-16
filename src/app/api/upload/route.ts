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

    const results = []
    const errors = []
    
    for (const file of files) {
      try {
        // Validate file
        if (!isValidImageFile(file)) {
          errors.push(`${file.name}: Invalid file type or size. Must be PNG/JPG/JPEG/WebP under 10MB.`)
          continue
        }

        // Process with Claude for visual descriptions
        const base64Data = await fileToBase64(file)
        const visualDescription = await generateVisualDescription(base64Data)
        
        // Return file data for client-side Convex storage and OCR processing
        results.push({
          filename: file.name,
          fileSize: file.size,
          visualDescription,
          file: base64Data // Return base64 for client processing
        })
        
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error)
        errors.push(`${file.name}: Processing failed`)
      }
    }

    return NextResponse.json({
      success: results.length > 0,
      uploadedCount: results.length,
      errors,
      processedFiles: results
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