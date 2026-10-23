#!/usr/bin/env bash
# Usage: tv-install <git-ref> <app|probe>
set -euo pipefail
REF=${1:?ref}; KIND=${2:-app}
case "$KIND" in app|probe) ;; *) echo "usage: tv-install <git-ref> <app|probe> (got KIND=$KIND)" >&2; exit 2;; esac
: "${TV_HOST:?}" "${TIZEN_AUTHOR_P12_B64:?}" "${TIZEN_AUTHOR_PASSWORD:?}" "${TIZEN_DISTRIBUTOR_P12_B64:?}" "${TIZEN_DISTRIBUTOR_PASSWORD:?}"
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP
git clone --quiet --depth 1 --branch "$REF" https://github.com/phew-blue/tizen-home-screen "$WORK/src"
cd "$WORK/src"
mkdir -p "$WORK/certs" && umask 077
base64 -d <<<"$TIZEN_AUTHOR_P12_B64" > "$WORK/certs/author.p12"
base64 -d <<<"$TIZEN_DISTRIBUTOR_P12_B64" > "$WORK/certs/distributor.p12"
tizen security-profiles remove -n ths >/dev/null 2>&1 || true
tizen security-profiles add -n ths -a "$WORK/certs/author.p12" -p "$TIZEN_AUTHOR_PASSWORD" \
  -d "$WORK/certs/distributor.p12" -dp "$TIZEN_DISTRIBUTOR_PASSWORD"
if [ "$KIND" = app ]; then
  npm ci --omit=dev --silent
  OUT_DIR="$WORK/wp/wallpapers" node scripts/fetch-wallpapers.mjs
  mv "$WORK/wp/wallpapers/wallpapers.js" "$WORK/wp/wallpapers.js"
  node scripts/stage-wgt.mjs ui "$WORK/wp" tizen/config.xml tizen/icon.png "$WORK/stage"
  APP_ID=PhewTvHome.Home
else
  mkdir -p "$WORK/stage" && cp tizen/probe/* "$WORK/stage/"
  APP_ID=PhewProbe1.Probe
fi
tizen package -t wgt -s ths -- "$WORK/stage"
PKG=${APP_ID%%.*}
PRODUCED=$(ls "$WORK"/stage/*.wgt)
WGT="$WORK/stage/$PKG.wgt"
[ "$PRODUCED" = "$WGT" ] || mv "$PRODUCED" "$WGT"
sdb connect "$TV_HOST"
sdb devices | grep -q "$TV_HOST" || { echo "TV $TV_HOST not listed by sdb devices" >&2; exit 1; }
trap 'sdb disconnect "$TV_HOST" >/dev/null 2>&1; rm -rf "$WORK"' EXIT
tizen install -n "$(basename "$WGT")" -s "$TV_HOST" -- "$WORK/stage"
tizen run -p "$APP_ID" -s "$TV_HOST"
echo "installed $APP_ID from $REF"
