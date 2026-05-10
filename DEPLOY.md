# Deploy auf Coolify (Nuxt-Variante)

Nuxt 4 + @nuxt/content + @nuxt/ui + @nuxt/image, Static-Generated, dahinter
Caddy 2 (Alpine). Öffentlich, aber `X-Robots-Tag: noindex, nofollow` hält
Suchmaschinen draussen.

## 1 — Inhalte aktualisieren *(falls neue Berichte / Bilder)*

Der Live-Mirror und die `pages.json` aus dem `preview/`-Schritt sind die
Quelle. Nach Änderungen dort:

```sh
cd /Users/rki02/dev/webdev/gemsle/app
node scripts/import-content   # liest ../preview/data, schreibt content/*.md
```

## 2 — Static Site bauen

```sh
pnpm install            # einmalig nach Repo-Klon
pnpm generate           # erzeugt .output/public/ mit allen 137 Seiten
node scripts/prepare-deploy.mjs   # splittet in .deploy/heavy + .deploy/site
```

`prepare-deploy` macht Hardlinks (kein zusätzlicher Disk-Verbrauch) und sorgt
dafür, dass das Docker-Image saubere Layers bekommt.

## 3 — DNS bei hosttech setzen *(einmalig)*

| Typ | Name | Wert | TTL |
|---|---|---|---|
| A | `gemsle` | `<SERVER-IP>` | 3600 |

Server-IP findest du in Coolify unter **Servers → dein Server → Public IP**.

## 4 — Image bauen (linux/amd64 für Coolify-Server)

```sh
docker buildx build --platform linux/amd64 -t gemsle-app:1.0 --load .
```

Image-Grösse: ~1.5 GB. Build dauert ~30 s.

## 5 — Image auf den Server bringen

```sh
docker save gemsle-app:1.0 | gzip | ssh <SSH-USER>@<SERVER> "gunzip | docker load"
```

Dauer: ~1–10 Min je nach Upload-Bandbreite. Auf dem Server sollte die Ausgabe
`Loaded image: gemsle-app:1.0` enthalten.

## 6 — In Coolify konfigurieren

1. Coolify-UI → Projekt wählen
2. **+ New Resource** → **Docker Image**
3. **Image**: `gemsle-app`, **Tag**: `1.0`
4. **Ports Exposes**: `80`
5. **Save**
6. Tab **Domains**: `https://gemsle.therkiller.dev` eintragen → Coolify holt
   das Let's-Encrypt-Cert automatisch
7. **Deploy**

## 7 — Im Browser prüfen

```
https://gemsle.therkiller.dev
```

Du siehst die Übersicht mit allen Reisen und Cover-Bildern. Klicke dich durch
einen Bericht (z.B. *Motorrad-Reisen → München Bangkok 2025 → Woche 1*) — die
Galerie öffnet sich per Klick als Lightbox mit Pfeiltasten-Navigation.

## Updates

Bei Inhaltsänderungen:

```sh
cd /Users/rki02/dev/webdev/gemsle/app
pnpm generate
node scripts/prepare-deploy.mjs
docker buildx build --platform linux/amd64 -t gemsle-app:1.1 --load .
docker save gemsle-app:1.1 | gzip | ssh <SSH-USER>@<SERVER> "gunzip | docker load"
# In Coolify Tag von 1.0 → 1.1 ändern, dann Redeploy
```

Wegen der gelayerten Image-Struktur landet bei reinen Content-Änderungen nur
ein ~17-MB-Layer neu auf dem Server. Die ~1.5 GB Bilder werden zwischen den
Versionen geteilt.

## Disk-Pflege

Nach erfolgreichem Deploy einer neuen Version, alte Tags entfernen:

```sh
ssh <SSH-USER>@<SERVER> "docker image prune -f"
```

Nur ungenutzte Images werden gelöscht — gefahrlos.

## Caching & SEO

- Caddy serviert mit `zstd`/`gzip`-Kompression
- Statische Assets bekommen `Cache-Control: public, max-age=2592000, immutable` (30 Tage)
- HTML wird mit `no-cache` markiert, damit Inhaltsänderungen sofort sichtbar werden
- Alle Antworten enthalten `X-Robots-Tag: noindex, nofollow`, sodass die
  Vorschau nicht als Duplikat von gemsle.ch indexiert wird
