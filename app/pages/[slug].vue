<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { data: page } = await useAsyncData(
  () => `page-${slug.value}`,
  () => queryCollection('pages').where('slug', '=', slug.value).first()
)

if (!page.value) {
  throw createError({ statusCode: 404, statusMessage: 'Seite nicht gefunden', fatal: true })
}

useSeoMeta({
  title: page.value.title,
  description: page.value.description || ''
})
</script>

<template>
  <article
    v-if="page"
    class="max-w-3xl"
  >
    <nav
      v-if="page.breadcrumb?.length"
      class="text-xs text-muted mb-3"
      aria-label="Breadcrumb"
    >
      <span
        v-for="(crumb, i) in page.breadcrumb"
        :key="i"
      >
        <span :class="{ 'text-default': i === page.breadcrumb.length - 1 }">{{ crumb }}</span>
        <span
          v-if="i < page.breadcrumb.length - 1"
          class="mx-1.5 text-muted/60"
        >/</span>
      </span>
    </nav>

    <header class="mb-8">
      <h1 class="font-serif text-3xl sm:text-4xl tracking-tight leading-tight">
        {{ page.title }}
      </h1>
      <p
        v-if="page.description"
        class="text-lg text-muted mt-2"
      >
        {{ page.description }}
      </p>
    </header>

    <div class="prose prose-neutral dark:prose-invert max-w-none">
      <ContentRenderer :value="page" />
    </div>

    <AppGallery :images="page.gallery || []" />
  </article>
</template>

<style>
/* Highlight Datum: blocks rendered from the original X5 reports */
.prose strong {
  display: inline-block;
}
.prose strong:first-child:has(+ br) {
  background: rgb(from var(--ui-primary) r g b / 0.12);
  color: var(--ui-text);
  padding: 0.15rem 0.55rem;
  border-radius: 4px;
  font-size: 0.95rem;
  margin: 0.5rem 0 0.25rem;
}
</style>
