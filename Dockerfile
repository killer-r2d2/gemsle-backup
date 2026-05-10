FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile

# Layered so the server's image store reuses unchanged layers across deploys.
# Run `node scripts/prepare-deploy.mjs` after `nuxt generate` to populate .deploy/.

# Heavy: gallery + thumbs (~1.5 GB), only changes when photos are added.
COPY .deploy/heavy /srv

# Site: HTML, JS, CSS, fonts, payloads (~17 MB), changes per content update.
COPY .deploy/site /srv

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O- http://127.0.0.1/ -U healthcheck >/dev/null || exit 1
