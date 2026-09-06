#!/usr/bin/env bash
# Restore the stock/default background for the current theme (ignores
# user-installed theme wallpapers in the config backgrounds folder).
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

stock_dir=$home/.local/state/omarchy/current/theme/backgrounds

mapfile -d '' -t bgs < <(
  find -L "$stock_dir" -maxdepth 1 -type f \
    \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' \
    -o -iname '*.bmp' -o -iname '*.webp' \) -print0 2>/dev/null | sort -z
)

if ((${#bgs[@]} == 0)); then
  echo "No stock theme background found for $theme" >&2
  exit 1
fi

omarchy-theme-bg-set "${bgs[0]}"
printf '%s\n' "${bgs[0]}"
