# gemsle.ch — Reisearchiv

Nuxt 4 + Nuxt Content + Nuxt UI + Nuxt Image. Migration der bestehenden
WebSite-X5-Site `gemsle.ch` auf einen modernen Stack. Static-generated, deployt
hinter Caddy in Coolify.

## Stack

- **Nuxt 4** mit static generation (`nuxt generate`)
- **@nuxt/content** — Markdown-Dateien in `content/` als Inhalt
- **@nuxt/ui** v4 (Tailwind 4) — Komponenten + Theme-System
- **@nuxt/image** — Bild-Pipeline
- **Caddy 2** + **Docker** — siehe `DEPLOY.md`

## Voraussetzungen für lokales Setup

- Node 20+ und pnpm 10+
- Docker (für `prepare-deploy.mjs` und Image-Build)
- Lokale Bildbestände aus dem alten Mirror und der Thumbnail-Pipeline:

```
<workspace>/mirror/gemsle.ch/gallery/   # 1.3 GB Originalbilder (10'226 Dateien)
app/thumbs/                              # 290 MB Thumbnails (10'226 webp)
```

Die Originalbilder sind nicht im Repo (zu gross). Sie müssen einmalig vom
bestehenden Mirror kopiert oder neu via dem alten Sync-Skript heruntergeladen
werden.

## Erstes Setup

```sh
pnpm install
```

`public/gallery` und `public/thumbs` als Symlinks auf die lokalen Bilderordner
anlegen (auf jedem Entwickler-Rechner separat, da `.gitignored`):

```sh
ln -s ../../mirror/gemsle.ch/gallery public/gallery   # Pfad anpassen
ln -s ../thumbs public/thumbs
```

## Entwicklung

```sh
pnpm dev          # http://localhost:3000
```

## Inhalte

`content/*.md` ist die Quelle der Wahrheit. Jede Datei beschreibt eine Seite
mit YAML-Frontmatter (titel, breadcrumb, gallery, entries, …) plus Markdown.

Beim ersten Bootstrap wurden die 141 Markdown-Files automatisch aus dem alten
HTML-Auftritt erzeugt:

```sh
node scripts/import.mjs        # liest data/*.json → schreibt content/*.md
                               # data/ und das Bootstrap-Skript bleiben für
                               # einen erneuten Re-Import erhalten, sind aber
                               # für den normalen Workflow nicht nötig.
```

## Build

```sh
pnpm generate                  # erzeugt .output/public/ (≈ 1.6 GB inkl. Bilder)
node scripts/prepare-deploy.mjs # splittet in .deploy/heavy + .deploy/site
```

## Deploy

Siehe `DEPLOY.md` für den kompletten Coolify-Ablauf.

```sh
docker buildx build --platform linux/amd64 -t gemsle-app:1.0 --load .
docker save gemsle-app:1.0 | gzip | ssh <user>@<host> "gunzip | docker load"
# In Coolify: Docker Image → gemsle-app:1.0 → Port 80 → Domain
```

## Verzeichnisstruktur

```
app/
├── app/                Vue Source (Pages, Components)
│   ├── app.vue         Layout (Header, Sidebar, Footer)
│   ├── pages/
│   │   ├── index.vue   Übersicht
│   │   └── [slug].vue  Bericht-Detail
│   ├── components/
│   │   ├── AppNav.vue       Sidebar-Navigation
│   │   ├── AppNavList.vue   Verschachtelte Untermenüs
│   │   └── AppGallery.vue   Bildergrid + Lightbox
│   └── assets/
│       ├── menu.json        Navigation-Hierarchie (vom Import-Skript)
│       └── slug-map.json    legacy → neuer Slug (für künftige Redirects)
│
├── content/            Markdown — die Quelle der Wahrheit
├── content.config.ts   Schema für Nuxt Content
│
├── scripts/
│   ├── import.mjs           HTML → Markdown (Bootstrap, einmalig)
│   └── prepare-deploy.mjs   Build-Output für Docker layer-optimieren
│
├── public/             favicon + Symlinks (gallery, thumbs) zu lokalen Assets
├── data/               (.gitignored) JSON-Snapshot der Alt-Inhalte
├── thumbs/             (.gitignored) Generierte Thumbnails
│
├── nuxt.config.ts      Nuxt-Konfiguration
├── Dockerfile          Caddy-basiertes Image
├── Caddyfile           Static-Server-Config (gzip, noindex, Cache-Header)
└── DEPLOY.md           Schritt-für-Schritt für Coolify
```

## Wichtige Konventionen

- **Slugs** werden URL-freundlich serialisiert (`woche-1-23.04.---27.04.` →
  `woche-1-23-04-27-04`). Das Original liegt im Frontmatter unter
  `legacy_slug` und in `app/assets/slug-map.json` für spätere Redirects.
- **Robots:** Caddy setzt `X-Robots-Tag: noindex, nofollow` site-wide. Solange
  gemsle.ch parallel online ist, indexiert Google die Vorschau nicht als
  Duplikat.
- **Theme:** Hell/Dunkel respektiert die System-Einstellung, Toggle in der
  Header-Leiste, Auswahl per `localStorage` persistiert.
