#!/bin/sh
if ! git rev-parse --verify --quiet HEAD~1 >/dev/null 2>&1; then
  exit 1
fi
changed=$(git diff --name-only HEAD~1 HEAD)
if [ -z "$changed" ]; then
  exit 1
fi
for f in $changed; do
  case "$f" in
    apps/web/docs/*|*.md) ;;
    *) exit 1 ;;
  esac
done
exit 0
