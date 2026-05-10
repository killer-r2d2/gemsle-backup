<script setup lang="ts">
import menu from '~/assets/menu.json'

type MenuItem = { label: string, href: string | null, children?: MenuItem[] }

const items = menu as MenuItem[]
const route = useRoute()
const currentSlug = computed(() => {
  const p = route.path.replace(/^\/+/, '').replace(/\/$/, '')
  return p || 'index'
})

function slugFromHref(href: string) {
  return href.replace(/\.html$/, '')
}

function isActive(item: MenuItem): boolean {
  if (item.href && slugFromHref(item.href) === currentSlug.value) return true
  return (item.children || []).some(isActive)
}
</script>

<template>
  <nav class="text-sm">
    <ul class="space-y-0.5">
      <li
        v-for="(item, i) in items"
        :key="i"
        class="leading-snug"
      >
        <template v-if="item.children?.length">
          <UCollapsible :default-open="isActive(item)">
            <button
              type="button"
              class="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-default font-semibold hover:bg-elevated transition-colors"
            >
              <span>{{ item.label }}</span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-3.5 text-muted ui-open:rotate-90 transition-transform"
              />
            </button>
            <template #content>
              <AppNavList
                :items="item.children"
                :level="1"
              />
            </template>
          </UCollapsible>
        </template>
        <NuxtLink
          v-else-if="item.href"
          :to="`/${slugFromHref(item.href)}`"
          class="block px-2.5 py-1.5 rounded text-default font-semibold hover:bg-elevated transition-colors"
          active-class="bg-primary/10 text-primary"
        >
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
