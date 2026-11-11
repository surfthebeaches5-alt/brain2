#!/bin/sh
# Give this version of the site one new stamp.
# Run from the repo root before every publish:   sh _tools/stamp.sh
# It rewrites every ?v=… on the site's own css/js and writes version.json to match,
# which is what makes open pages notice the update and refresh (see assets/shell.js).
set -e
cd "$(dirname "$0")/.."
V="$(date -u +%y%m%d%H%M)"
find . -name '*.html' -not -path './.git/*' -not -path './_tools/*' -print0 \
  | xargs -0 sed -i -E "s/(assets\/[A-Za-z0-9_.-]+\.(js|css))\?v=[A-Za-z0-9]+/\1?v=$V/g"
printf '{"v":"%s"}\n' "$V" > version.json
echo "stamped $V"
