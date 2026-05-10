<script setup lang="ts">
import menu from '~/assets/menu.json'

type MenuItem = { label: string, href: string | null, children?: MenuItem[] }
const sections = (menu as MenuItem[]).filter((m) => m.children?.length)

const { data: pages } = await useAsyncData(
  'pages-overview',
  () => queryCollection('pages').select('slug', 'title', 'gallery', 'canonical').all()
)

const galleryBySlug = computed(() => {
  const m = new Map<string, string[]>()
  for (const p of pages.value || []) {
    m.set(p.slug, p.gallery || [])
  }
  return m
})

function slugFromHref(href: string) { return href.replace(/\.html$/, '') }

function teaserFor(node: MenuItem): string | null {
  if (node.href) {
    const slug = slugFromHref(node.href)
    const g = galleryBySlug.value.get(slug)
    if (g && g.length) return g[0]
  }
  for (const c of node.children || []) {
    const t = teaserFor(c)
    if (t) return t
  }
  return null
}
function thumbHref(url: string) {
  return '/thumbs/' + url.replace(/^gallery\//, '').replace(/\.[a-z0-9]+$/i, '.webp')
}

const stats = computed(() => {
  const list = pages.value || []
  const total = list.length
  const images = list.reduce((s, p) => s + (p.gallery?.length || 0), 0)
  return { total, images }
})

useSeoMeta({ title: 'Don\'t stop – Reisearchiv' })
</script>

<template>
  <div>
    <header class="mb-10">
      <h1 class="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-3">
        Don't stop
      </h1>
      <p class="text-lg text-muted mb-6">
        Reiseberichte – Motorradabenteuer von Marcel &amp; Melanie Killer
      </p>
      <p class="text-default mb-8 max-w-2xl">
        Inhaltsvorschau der bestehenden Berichte und Galerien aus dem Archiv. Das
        Design ist bewusst schlicht und vorläufig – es geht zunächst darum zu
        zeigen, dass alle Texte, Strukturen und Bilder erhalten geblieben sind
        und ins neue System übernommen werden können.
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl p-4 rounded border border-default bg-elevated">
        <div class="text-center">
          <div class="font-serif text-2xl">
            {{ stats.total }}
          </div>
          <div class="text-xs uppercase tracking-wider text-muted">
            Seiten
          </div>
        </div>
        <div class="text-center">
          <div class="font-serif text-2xl">
            {{ stats.images.toLocaleString('de-CH') }}
          </div>
          <div class="text-xs uppercase tracking-wider text-muted">
            Bilder
          </div>
        </div>
        <div class="text-center col-span-2 sm:col-span-1">
          <div class="font-serif text-2xl">
            141
          </div>
          <div class="text-xs uppercase tracking-wider text-muted">
            Berichte
          </div>
        </div>
      </div>
    </header>

    <section
      v-for="(group, i) in sections"
      :key="i"
      class="mb-12"
    >
      <h2 class="font-serif text-2xl mb-4 pb-2 border-b border-default">
        {{ group.label }}
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <article
          v-for="(child, ci) in group.children"
          :key="ci"
          class="rounded border border-default bg-elevated overflow-hidden flex flex-col hover:border-primary transition-colors"
        >
          <NuxtLink
            v-if="child.href || child.children?.length"
            :to="child.href ? `/${slugFromHref(child.href)}` : undefined"
            class="block group"
          >
            <div class="aspect-3/2 bg-default overflow-hidden">
              <img
                v-if="teaserFor(child)"
                :src="thumbHref(teaserFor(child)!)"
                loading="lazy"
                decoding="async"
                alt=""
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              >
            </div>
            <h3 class="font-serif text-base px-4 pt-3 pb-1 text-default">
              {{ child.label }}
            </h3>
          </NuxtLink>

          <ul
            v-if="child.children?.length"
            class="px-4 pb-4 pt-1 space-y-0.5 text-sm"
          >
            <template
              v-for="(leaf, li) in child.children"
              :key="li"
            >
              <li
                v-for="link in leaf.children?.length ? leaf.children : [leaf]"
                :key="link.label + (link.href || '')"
              >
                <NuxtLink
                  v-if="link.href"
                  :to="`/${slugFromHref(link.href)}`"
                  class="text-primary hover:underline"
                >
                  {{ link.label }}
                </NuxtLink>
              </li>
            </template>
          </ul>
        </article>
      </div>
    </section>
  </div>
</template>
