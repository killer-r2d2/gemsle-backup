import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page',
      source: '*.md',
      schema: z.object({
        slug: z.string(),
        canonical: z.boolean().default(false),
        section: z.string().nullable().optional(),
        trip: z.string().nullable().optional(),
        breadcrumb: z.array(z.string()).default([]),
        order: z.number().optional(),
        gallery: z.array(z.string()).default([]),
        entries: z.array(
          z.object({
            date: z.string(),
            ort: z.string().optional(),
            km: z.string().optional(),
            land: z.string().optional()
          })
        ).default([])
      })
    })
  }
})
