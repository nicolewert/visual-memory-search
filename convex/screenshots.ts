import { query, mutation, action } from './_generated/server'
import { v } from 'convex/values'
import { Id } from './_generated/dataModel'

export const storeScreenshot = mutation({
  args: {
    filename: v.string(),
    ocrText: v.string(),
    visualDescription: v.string(),
    fileId: v.id("_storage"),
    fileSize: v.number()
  },
  handler: async (ctx, { filename, ocrText, visualDescription, fileId, fileSize }) => {
    if (!filename.trim() || filename.length > 255) {
      throw new Error("Filename must be non-empty and max 255 characters")
    }
    
    if (fileSize <= 0) {
      throw new Error("File size must be positive")
    }

    const imageUrl = await ctx.storage.getUrl(fileId)
    if (!imageUrl) {
      throw new Error("Failed to get image URL from storage")
    }

    const screenshotId = await ctx.db.insert("screenshots", {
      filename: filename.trim(),
      uploadedAt: Date.now(),
      ocrText: ocrText || "",
      visualDescription: visualDescription || "",
      imageUrl,
      fileSize,
      processingStatus: "completed"
    })

    return screenshotId
  }
})

export const searchScreenshots = query({
  args: { 
    query: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, { query, limit = 5 }) => {
    if (!query.trim()) {
      return []
    }

    const searchQuery = query.trim().toLowerCase()
    
    const screenshots = await ctx.db
      .query("screenshots")
      .filter((q) => q.eq(q.field("processingStatus"), "completed"))
      .collect()

    const results = screenshots
      .map(screenshot => {
        const ocrMatch = screenshot.ocrText.toLowerCase().includes(searchQuery)
        const visualMatch = screenshot.visualDescription.toLowerCase().includes(searchQuery)
        const filenameMatch = screenshot.filename.toLowerCase().includes(searchQuery)
        
        let confidence = 0
        let matchType: 'text' | 'visual' | 'both' = 'text'
        
        if (ocrMatch && visualMatch) {
          confidence = 0.9
          matchType = 'both'
        } else if (ocrMatch) {
          confidence = 0.8
          matchType = 'text'
        } else if (visualMatch) {
          confidence = 0.7
          matchType = 'visual'
        } else if (filenameMatch) {
          confidence = 0.5
          matchType = 'text'
        }

        return {
          id: screenshot._id,
          filename: screenshot.filename,
          imageUrl: screenshot.imageUrl,
          ocrText: screenshot.ocrText,
          visualDescription: screenshot.visualDescription,
          confidence,
          uploadedAt: screenshot.uploadedAt,
          matchType,
          fileSize: screenshot.fileSize
        }
      })
      .filter(result => result.confidence > 0)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)

    return results
  }
})

export const listScreenshots = query({
  args: {},
  handler: async (ctx) => {
    const screenshots = await ctx.db
      .query("screenshots")
      .withIndex("by_uploaded_at")
      .order("desc")
      .collect()
    
    return screenshots
  }
})

export const getScreenshotById = query({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }) => {
    const screenshot = await ctx.db.get(id)
    return screenshot
  }
})

export const deleteScreenshot = mutation({
  args: { id: v.id("screenshots") },
  handler: async (ctx, { id }) => {
    const screenshot = await ctx.db.get(id)
    if (!screenshot) {
      throw new Error("Screenshot not found")
    }

    await ctx.db.delete(id)
  }
})

export const updateProcessingStatus = mutation({
  args: {
    id: v.id("screenshots"),
    status: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
    ocrText: v.optional(v.string()),
    visualDescription: v.optional(v.string())
  },
  handler: async (ctx, { id, status, ocrText, visualDescription }) => {
    const screenshot = await ctx.db.get(id)
    if (!screenshot) {
      throw new Error("Screenshot not found")
    }

    const updates: any = { processingStatus: status }
    if (ocrText !== undefined) updates.ocrText = ocrText
    if (visualDescription !== undefined) updates.visualDescription = visualDescription

    await ctx.db.patch(id, updates)
  }
})

export const logSearch = mutation({
  args: {
    query: v.string(),
    resultsCount: v.number(),
    responseTime: v.number()
  },
  handler: async (ctx, { query, resultsCount, responseTime }) => {
    await ctx.db.insert("searches", {
      query,
      timestamp: Date.now(),
      resultsCount,
      responseTime
    })
  }
})

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl()
  }
})

export const processScreenshot = action({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, { fileId }) => {
    // This action would be called from the client after OCR processing
    // For now, just return the fileId for further processing
    return { fileId }
  }
})