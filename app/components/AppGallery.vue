<script setup lang="ts">
const props = defineProps<{
  images: string[]
}>()

function thumbHref(url: string) {
  return '/thumbs/' + url.replace(/^gallery\//, '').replace(/\.[a-z0-9]+$/i, '.webp')
}
function origHref(url: string) {
  return '/' + url.replace(/^\/+/, '')
}

const open = ref(false)
const idx = ref(0)
const items = computed(() => props.images)

function show(i: number) {
  idx.value = i
  open.value = true
}
function next() { idx.value = (idx.value + 1) % items.value.length }
function prev() { idx.value = (idx.value - 1 + items.value.length) % items.value.length }
function onKey(e: KeyboardEvent) {
  if (!open.value) return
  if (e.key === 'Escape') open.value = false
  else if (e.key === 'ArrowRight') next()
  else if (e.key === 'ArrowLeft') prev()
}

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section
    v-if="images.length"
    class="mt-12 pt-8 border-t border-default"
  >
    <h2 class="font-serif text-xl mb-4 flex items-baseline gap-2">
      Galerie
      <UBadge
        :label="String(images.length)"
        color="neutral"
        variant="soft"
        size="sm"
      />
    </h2>

    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5">
      <button
        v-for="(url, i) in images"
        :key="url"
        type="button"
        class="aspect-3/2 overflow-hidden rounded bg-elevated cursor-zoom-in group"
        @click="show(i)"
      >
        <img
          :src="thumbHref(url)"
          loading="lazy"
          decoding="async"
          alt=""
          class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        >
      </button>
    </div>

    <UModal
      v-model:open="open"
      fullscreen
      :ui="{ overlay: 'bg-black/95', content: 'bg-transparent ring-0 shadow-none' }"
    >
      <template #content>
        <div
          class="relative w-full h-full flex items-center justify-center select-none"
          @click.self="open = false"
        >
          <button
            type="button"
            aria-label="Schliessen"
            class="absolute top-4 right-4 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            @click="open = false"
          >
            <UIcon
              name="i-lucide-x"
              class="size-5"
            />
          </button>
          <button
            type="button"
            aria-label="Vorheriges Bild"
            class="absolute left-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            @click="prev"
          >
            <UIcon
              name="i-lucide-chevron-left"
              class="size-5"
            />
          </button>
          <button
            type="button"
            aria-label="Nächstes Bild"
            class="absolute right-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
            @click="next"
          >
            <UIcon
              name="i-lucide-chevron-right"
              class="size-5"
            />
          </button>
          <img
            :src="origHref(items[idx])"
            class="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl"
            alt=""
            @click.stop
          >
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm tabular-nums tracking-wider">
            {{ idx + 1 }} / {{ items.length }}
          </div>
        </div>
      </template>
    </UModal>
  </section>
</template>
