#!/usr/bin/env bash
# Restore full wallpaper defaults for a theme: delete ALL user-installed
# wallpapers under ~/.config/omarchy/backgrounds/<theme>/, then apply a stock
# theme background.
#
# Usage: reset-wallpaper.sh <theme-name>
# Prints the restored stock background path on stdout.

set -euo pipefail

theme=${1:-}

if [[ -z $theme || $theme == */* || $theme == "." || $theme == ".." || ${#theme} -gt 255 ]]; then
  echo "Invalid theme name" >&2
  exit 1
fi

home=${HOME:-}
if [[ -z $home || $home != /* ]]; then
  echo "HOME is not absolute" >&2
  exit 1
fi

theme_dir=$home/.config/omarchy/backgrounds/$theme
stock_dir=$home/.local/state/omarchy/current/theme/backgrounds

# Remove every installed external/user wallpaper for this theme.
if [[ -d $theme_dir ]]; then
  find -P "$theme_dir" -maxdepth 1 -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' \
    -o -iname '*.bmp' -o -iname '*.webp' \) -delete 2>/dev/null || true
fi

mapfile -d '' -t bgs < <(
  find -L "$stock_dir" -maxdepth 1 -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' \
    -o -iname '*.bmp' -o -iname '*.webp' \) -print0 2>/dev/null | sort -z
)

# Prefer a usable stock wallpaper (>=4KiB) so near-empty brand tiles are skipped.
stock=""
for candidate in "${bgs[@]+"${bgs[@]}"}"; do
  size=$(stat -c '%s' "$candidate" 2>/dev/null || echo 0)
  if [[ $size -ge 4096 ]]; then
    stock=$candidate
    break
  fi
done

if [[ -z $stock ]]; then
  echo "No stock theme background found for $theme" >&2
  exit 1
fi

omarchy-theme-bg-set "$stock"
printf '%s\n' "$stock"
