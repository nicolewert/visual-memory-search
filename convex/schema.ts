import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
    createdAt: v.number(),
  }).index('by_created_at', ['createdAt']),

  users: defineTable({
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_email', ['email']),

  notes: defineTable({
    title: v.string(),
    content: v.string(),
    userId: v.id('users'),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId'])
    .index('by_created_at', ['createdAt']),

  screenshots: defineTable({
    filename: v.string(),
    uploadedAt: v.number(),
    ocrText: v.string(),
    visualDescription: v.string(),
    imageUrl: v.string(),
    fileSize: v.number(),
    processingStatus: v.union(v.literal("pending"), v.literal("completed"), v.literal("failed")),
  }).index('by_uploaded_at', ['uploadedAt'])
    .index('by_processing_status', ['processingStatus'])
    .searchIndex('search_content', {
      searchField: 'ocrText',
      filterFields: ['processingStatus']
    }),

  searches: defineTable({
    query: v.string(),
    timestamp: v.number(),
    resultsCount: v.number(),
    responseTime: v.number(),
  }).index('by_timestamp', ['timestamp'])
    .index('by_query', ['query']),
})