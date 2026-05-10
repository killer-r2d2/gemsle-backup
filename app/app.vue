<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'de' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }]
})

useSeoMeta({
  title: 'Don\'t stop – Reisearchiv',
  description: 'Reiseberichte – Motorradabenteuer von Marcel & Melanie Killer'
})

const route = useRoute()
const sidebarOpen = ref(false)
watch(() => route.fullPath, () => { sidebarOpen.value = false })
</script>

<template>
  <UApp>
    <header
      class="sticky top-0 z-20 bg-elevated/80 backdrop-blur border-b border-default"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        <button
          type="button"
          class="lg:hidden p-2 -ml-2 rounded text-muted hover:text-default"
          aria-label="Menü"
          @click="sidebarOpen = !sidebarOpen"
        >
          <UIcon
            :name="sidebarOpen ? 'i-lucide-x' : 'i-lucide-menu'"
            class="size-5"
          />
        </button>

        <NuxtLink
          to="/"
          class="flex flex-col leading-tight no-underline text-default hover:text-default"
        >
          <span class="font-serif text-lg font-bold tracking-tight">Don't stop</span>
          <span class="text-[10px] uppercase tracking-[0.18em] text-muted -mt-0.5">Reisearchiv</span>
        </NuxtLink>

        <div class="ml-auto flex items-center gap-1">
          <UColorModeButton />
        </div>
      </div>
    </header>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10 py-6 lg:py-10">
      <aside
        class="lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-2 lg:border-r lg:border-default"
        :class="sidebarOpen ? 'block mb-6' : 'hidden lg:block'"
      >
        <AppNav />
      </aside>

      <main class="min-w-0">
        <NuxtPage />
      </main>
    </div>

    <footer class="border-t border-default mt-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-sm text-muted text-center">
        Vorschau-Migration aus dem WebSite-X5-Archiv. Finales Design folgt.
      </div>
    </footer>
  </UApp>
</template>
