<script setup lang="ts">
type MenuItem = { label: string, href: string | null, children?: MenuItem[] }

const props = defineProps<{
  items: MenuItem[]
  level: number
}>()

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
  <ul
    class="border-l border-default pl-2 ml-3 mt-1 space-y-0.5"
  >
    <li
      v-for="(item, i) in props.items"
      :key="i"
    >
      <template v-if="item.children?.length">
        <UCollapsible :default-open="isActive(item)">
          <button
            type="button"
            class="w-full flex items-center justify-between px-2 py-1 rounded text-muted hover:text-default hover:bg-elevated transition-colors"
          >
            <span class="truncate">{{ item.label }}</span>
            <UIcon
              name="i-lucide-chevron-right"
              class="size-3 text-muted ui-open:rotate-90 transition-transform shrink-0 ml-1"
            />
          </button>
          <template #content>
            <AppNavList
              :items="item.children"
              :level="level + 1"
            />
          </template>
        </UCollapsible>
      </template>
      <NuxtLink
        v-else-if="item.href"
        :to="`/${slugFromHref(item.href)}`"
        class="block px-2 py-1 rounded text-muted hover:text-default hover:bg-elevated transition-colors truncate"
        active-class="!bg-primary/10 !text-primary font-medium"
      >
        {{ item.label }}
      </NuxtLink>
    </li>
  </ul>
</template>
