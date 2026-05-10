# gemsle.ch — Reisearchiv

Migration der bestehenden WebSite-X5-Site `gemsle.ch` (Reiseberichte +
Galerien von Marcel & Melanie Killer) auf einen modernen Stack als Vorschau
für den Kunden.

**Live:** [https://gemsle.therkiller.dev](https://gemsle.therkiller.dev)
*(noindex, nicht von Google indexiert; gemsle.ch bleibt der einzige öffentliche Auftritt bis zum Cutover)*

---

## Status (Stand: 2026-05-10)

### Was steht

- ✅ **Komplett-Sicherung** der Live-Site (`mirror/gemsle.ch/`, 1.3 GB) plus
  ursprüngliches WebSite-X5-Projekt-Backup (`archive/`, 15 GB Original-Bilder
  in der X5 Library).
- ✅ **Strukturierte Content-Extraktion**: 141 HTML-Reports automatisch zu
  Markdown-Dateien konvertiert (`content/*.md`) inkl. Frontmatter mit Trip,
  Section, Breadcrumb, Galerie-Liste, Tagebuch-Einträgen.
- ✅ **Bilder lokal verfügbar**: 10'226 Originale aus der Live-Site geladen
  (`mirror/gemsle.ch/gallery/`) plus 10'226 webp-Thumbnails (`thumbs/`,
  ~290 MB).
- ✅ **Nuxt-App** auf produktivem Stack:
  Nuxt 4 + Nuxt Content + Nuxt UI v4 + Nuxt Image, Tailwind 4, Light/Dark
  Mode, Sticky Sidebar mit Original-Menühierarchie, Galerie-Grid mit
  Lightbox.
- ✅ **Static Generation** (`nuxt generate`) → 137 prerenderte Seiten.
- ✅ **Caddy + Docker + Coolify** Deploy-Pipeline mit gelayerten Images
  (Bilder als stabiler Layer, HTML als volatiler Layer).
- ✅ **Container Registry**: `ghcr.io/killer-r2d2/gemsle-app:1.0` (public
  package, kein Auth nötig).
- ✅ **Live-Vorschau** unter `https://gemsle.therkiller.dev` mit gültigem
  Let's-Encrypt-Cert, `X-Robots-Tag: noindex`.
- ✅ **GitHub-Repo** `killer-r2d2/gemsle-backup` (private), Quelle inkl.
  Markdown im Repo, Bilder ausserhalb.

### Was bewusst (noch) nicht gemacht ist

- ❌ **Editor-Workflow für den Kunden**: Nuxt Studio / Decap CMS / Strapi
  noch nicht entschieden — der Kunde muss aktuell nichts editieren.
- ❌ **App auf eigenem Server (`therkiller-webdev`)**: Aktuell läuft der
  Container auf dem Coolify-Host (46.224.144.135), nicht auf dem dafür
  vorgesehenen webdev (46.224.111.41). Suboptimal aus Failure-Domain-Sicht,
  für Vorschau OK. Spätere saubere Lösung: webdev als zweiten Coolify-Server
  hinzufügen, App dorthin umziehen, DNS auf webdev (46.224.111.41) zurück.
- ❌ **Domain-Cutover**: gemsle.ch zeigt weiter auf die alte X5-Site. Der
  Wechsel passiert erst, wenn das neue Setup vom Kunden abgenommen ist.
- ❌ **Redirects** für alte URL-Pfade. Mapping liegt bereit in
  `app/assets/slug-map.json` (`legacy → neu`).
- ❌ **CMS-Integration**: Markdown-Dateien sind aktuell die Quelle, Editor
  läuft via Code/Git.

---

## Stack

| | |
|---|---|
| Framework | Nuxt 4 (`nuxt generate` für SSG) |
| Content | `@nuxt/content` v3 — Markdown-Files in `content/` |
| UI-Kit | `@nuxt/ui` v4 (Tailwind 4) |
| Bilder | `@nuxt/image` (statisches Provider-Setup, vor-generierte Thumbnails) |
| HTTP-Server | Caddy 2 (Alpine) |
| Container | Docker, Image: `ghcr.io/killer-r2d2/gemsle-app:1.0` (~1.5 GB) |
| Plattform | Coolify auf `therkiller-coolify` (Tailnet) |
| TLS | Let's Encrypt via Coolify-internem Traefik |

---

## Voraussetzungen für lokales Setup

- Node 20+, pnpm 10+
- Docker (für `prepare-deploy.mjs` + Image-Build)
- Lokale Bildbestände:
  ```
  <workspace>/mirror/gemsle.ch/gallery/   # 1.3 GB Originalbilder (10'226 Dateien)
  app/thumbs/                              # 290 MB Thumbnails (10'226 webp)
  ```
- SSH-Zugang zum Tailnet (`therkiller-coolify`, `therkiller-webdev`)
- Tailscale-Client laufend (für `ssh therkiller-webdev`-Komfort)

---

## Erstes Setup nach `git clone`

```sh
pnpm install

# Symlinks zu Bildbeständen einrichten (gitignored, machine-specific):
ln -s ../../mirror/gemsle.ch/gallery public/gallery   # Pfad ggf. anpassen
ln -s ../thumbs public/thumbs
```

`thumbs/` muss vom Mirror einmalig generiert werden (Skript dazu hatten wir
in der vorherigen `preview/`-Phase, falls nochmal nötig: per `sharp`-Resize
der Originale auf 480 px webp).

---

## Entwicklung

```sh
pnpm dev          # http://localhost:3000
```

---

## Inhalte

`content/*.md` ist die Quelle der Wahrheit. Jede Datei = eine Seite mit
YAML-Frontmatter:

```yaml
---
title: Woche 1 23.04. - 27.04.
slug: woche-1-23-04-27-04
legacy_slug: woche-1-23.04.---27.04.
canonical: true
section: Motorrad-Reisen
trip: München Bangkok 2025
breadcrumb:
  - Motorrad-Reisen
  - München Bangkok 2025
order: 5
gallery:
  - gallery/20250426_123232867_iOS.jpg
  - …
entries:
  - { date: 27.04.2025, ort: Nis, km: 238, land: Serbien }
  - …
---

Heute war es schon ein wenig …
```

Falls jemals das Bootstrap aus den Original-HTML neu erzeugt werden muss
(z.B. nach Wiederfindung weiterer Inhalte):

```sh
node scripts/import.mjs        # liest data/*.json → schreibt content/*.md
                               # ⚠ überschreibt bestehende content/-Dateien
```

---

## Build

```sh
pnpm generate                  # erzeugt .output/public/ (~1.6 GB inkl. Bilder)
node scripts/prepare-deploy.mjs # splittet in .deploy/heavy + .deploy/site
```

`prepare-deploy` legt Hardlinks an, kein zusätzlicher Disk-Verbrauch.

---

## Deploy

Siehe `DEPLOY.md` für die volle Coolify-Schritt-Liste. Kurzform:

```sh
# 1. Image bauen
docker buildx build --platform linux/amd64 --provenance=false --sbom=false \
  -t gemsle-app:1.0 --load .

# 2. In ghcr.io pushen
docker tag gemsle-app:1.0 ghcr.io/killer-r2d2/gemsle-app:1.0
docker push ghcr.io/killer-r2d2/gemsle-app:1.0

# 3. In Coolify den Tag ändern (z.B. 1.0 → 1.1) und Redeploy klicken.
```

Bei Updates landet auf dem Server nur der ~17-MB-HTML-Layer neu — die
Bilder-Layer werden über Versionen geteilt.

---

## Verzeichnisstruktur

```
app/                       ← Repo-Root (gemsle-backup auf GitHub)
├── app/                   Vue Source
│   ├── app.vue            Layout (Header, Sidebar, Footer)
│   ├── pages/
│   │   ├── index.vue      Übersicht mit Trip-Karten
│   │   └── [slug].vue     Bericht-Detail
│   ├── components/
│   │   ├── AppNav.vue       Sidebar-Navigation aus menu.json
│   │   ├── AppNavList.vue   Verschachtelte Untermenüs
│   │   └── AppGallery.vue   Thumbnail-Grid + Lightbox
│   └── assets/
│       ├── menu.json        Navigation-Hierarchie (vom Import-Skript)
│       └── slug-map.json    legacy → neuer Slug (für spätere Redirects)
│
├── content/               141 Markdown-Berichte (Quelle der Wahrheit)
├── content.config.ts      Nuxt-Content-Schema
│
├── scripts/
│   ├── import.mjs           HTML → Markdown (Bootstrap, einmalig)
│   └── prepare-deploy.mjs   .output/public → .deploy/{heavy,site}
│
├── public/                favicon + Symlinks (gitignored)
│   ├── gallery → ../../mirror/gemsle.ch/gallery   (lokal)
│   └── thumbs  → ../thumbs                        (lokal)
├── data/                  (.gitignored) JSON-Snapshot der Alt-Inhalte
├── thumbs/                (.gitignored) generierte webp-Thumbnails
│
├── nuxt.config.ts         Nuxt-Konfiguration
├── Dockerfile             Caddy-basiertes Image, gelayerter Aufbau
├── Caddyfile              Static-Server-Config (gzip, noindex, Cache-Header)
├── DEPLOY.md              Schritt-für-Schritt-Coolify
└── README.md              ← diese Datei
```

---

## Server-Topologie

| Maschine | Tailscale-IP | Public-IP | Rolle |
|---|---|---|---|
| `therkiller-coolify` | `100.127.151.115` | `46.224.144.135` | Coolify-Host (UI + aktuell auch der Gemsle-Container) |
| `therkiller-webdev` | `100.126.3.124` | `46.224.111.41` | Eigentlich für Apps gedacht (DNS-Wildcard `*.therkiller.dev` zeigt dahin) |

DNS bei hosttech (Stand jetzt):
- `gemsle.therkiller.dev` → `46.224.144.135` (auf Coolify-Host)
- `coolify.therkiller.dev` → `46.224.144.135`
- `*.therkiller.dev` → `46.224.111.41` (Wildcard, für andere Apps)
- `therkiller.dev` → `46.224.111.41`

---

## Was wir alles gemacht haben (Verlauf)

1. **Analyse** — X5-Backup-Struktur entschlüsselt: `Upload/` mit 137 generierten
   HTML-Seiten + leeren `gallery/`-XML-Stubs (Bilder lebten nur am Server),
   `Library/` mit 10'285 Original-Bildern unter Hash-IDs, `library.xml` als
   Mapping.
2. **Mirror** — `gemsle.ch` per `wget --mirror` heruntergeladen (87 MB inkl.
   137 HTML, aber ohne Galerie weil JS-loaded).
3. **Statische Vorschau** (Wegwerf, jetzt entfernt) — Cheerio-Extractor zog
   Inhalte aus den 137 HTML-Files in strukturiertes JSON; Vanilla-HTML-Site
   mit Light/Dark-Toggle gebaut, um dem Kunden früh zu zeigen, dass alles
   erhalten bleibt.
4. **Galerie-Download** — alle 10'263 referenzierten Bilder direkt aus
   gemsle.ch geholt (37 davon 404, alle aus einer verwaisten Duplikat-Seite
   `meiertreffen-2016-1`).
5. **Thumbnails** — sharp-basierter Batch (480 px webp, Q78), 10'226 Files,
   ~292 MB, ~80 s.
6. **Nuxt-App** — neu scaffolded mit Nuxt 4 + Content + UI + Image. HTML →
   Markdown via turndown, Slugs URL-freundlich serialisiert (Punkte raus),
   Original-Menü als Sidebar-Hierarchie übernommen, Galerie + Lightbox als
   Komponenten gebaut.
7. **Aufräumen** — alte `preview/`-Phase entfernt, `data/` und `thumbs/`
   nach `app/` verschoben, `.gitignore` und `README.md` neu, Repo-Root =
   `app/`.
8. **GitHub-Repo** initialisiert (`killer-r2d2/gemsle-backup`, private).
9. **Coolify-Deploy** — Caddy-Image gebaut (linux/amd64), erst per SSH auf
   webdev geladen, später aber per `ghcr.io` published, weil Coolifys
   Pull-Mechanismus eine Registry braucht.
10. **DNS + Routing** — A-Record `gemsle.therkiller.dev` bei hosttech
    angelegt; nach Erkenntnis dass Coolify auf "localhost" deployt, IP von
    webdev → Coolify-Host umgezogen, LE-Cert wurde dann ausgestellt.

---

## Konventionen / Wichtige Notizen

- **Slugs** sind URL-freundlich (`woche-1-23-04-27-04`). Original-Slug aus
  X5 liegt in `legacy_slug`/`slug-map.json` für spätere Redirect-Regeln.
- **Robots:** Caddy setzt `X-Robots-Tag: noindex, nofollow` site-wide. Beim
  Cutover muss das raus, sonst verschwindet die Site aus Google.
- **Theme:** Hell/Dunkel via `@nuxt/ui` ColorMode, System-Default + Toggle
  (oben rechts), Persistenz in `localStorage`.
- **Pull-Policy:** Coolify deployed via `docker compose pull`; das Image
  MUSS in einer Registry liegen, nicht nur lokal.
- **BuildKit-Provenance:** Beim Build immer `--provenance=false --sbom=false`
  setzen, sonst akzeptiert ghcr.io das Manifest nicht.

---

## Nächste sinnvolle Schritte

1. **Kunden-Feedback einholen** zur Vollständigkeit der Inhalte und zum
   Look — ist das eine Basis, auf der sich aufbauen lässt?
2. **Editor-Strategie entscheiden**:
   - Nuxt Studio (gehostet, Notion-artig, kostenpflichtig)
   - Decap CMS (gratis, git-basiert, läuft als `/admin/` in der App)
   - Strapi (separates CMS, dann Nuxt nur als Frontend)
   - Kirby (PHP, file-basiert, eigenes Editor-UI)
3. **App auf webdev umziehen** als Coolify-Zweitserver (saubere Failure-
   Domain-Trennung).
4. **Domain-Cutover**: gemsle.ch DNS auf den neuen Server, alte Site
   abschalten, `noindex` entfernen, Redirect-Regeln aus `slug-map.json`
   in Caddy aktivieren.
5. **Backup-Strategie** für Bildbestände auf dem Server (S3 / R2 oder
   regelmässiger rsync).
