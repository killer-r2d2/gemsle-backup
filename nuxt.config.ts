// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/content',
    '@nuxt/image'
  ],

  devtools: { enabled: true },

  css: ['~/assets/css/main.css'],

  // Static generation — same deploy story as the previous static preview.
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/']
    }
  },

  // Site-wide noindex (gemsle.ch remains the canonical site)
  routeRules: {
    '/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } }
  },

  content: {
    build: {
      markdown: {
        toc: { depth: 0, searchDepth: 0 }
      }
    }
  },

  image: {
    // Static provider: just emits <img> tags pointing at /gallery/... or /thumbs/...,
    // no on-the-fly processing in production (we already pre-generated thumbs).
    provider: 'none'
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
