#!/usr/bin/env bash
# Vygeneruje PNG ikony z icons/icon.svg (Chrome headless)
set -euo pipefail
cd "$(dirname "$0")"
CHROME=$(command -v google-chrome || command -v chromium || command -v chromium-browser)
mk() { # $1 size, $2 out, $3 maskable(0/1)
  local s=$1 out=$2 inner
  if [ "$3" = 1 ]; then
    inner=$(sed -e 's#<svg[^>]*>##' -e 's#</svg>##' -e 's#<rect width="512" height="512" rx="112" fill="\#5e6ad2"/>##' icon.svg)
    printf '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="%s" height="%s"><rect width="512" height="512" fill="#5e6ad2"/><g transform="translate(76.8 76.8) scale(.7)">%s</g></svg>' "$s" "$s" "$inner" > /tmp/_icon.svg
  else
    sed "s#<svg #<svg width=\"$s\" height=\"$s\" #" icon.svg > /tmp/_icon.svg
  fi
  printf '<html><body style="margin:0;background:transparent">%s</body></html>' "$(cat /tmp/_icon.svg)" > /tmp/_icon.html
  "$CHROME" --headless=new --no-sandbox --disable-gpu --hide-scrollbars --default-background-color=00000000 \
    --window-size="$s,$s" --screenshot="$PWD/$out" "file:///tmp/_icon.html" >/dev/null 2>&1
  test -s "$out"
}
mk 192 icon-192.png 0
mk 512 icon-512.png 0
mk 512 icon-maskable-512.png 1
mk 180 apple-touch-icon.png 1
ls -la *.png
