#!/usr/bin/env bash
# Delete a user-installed theme wallpaper and retarget the current background
# when it pointed at the removed file.
#
# Usage: remove-wallpaper.sh <theme-name> <wallpaper-path>
# Prints the next background path (or empty) on stdout.

set -euo pipefail

theme=${1:-}
target_raw=${2:-}

if [[ -z $theme || $theme == */* || $theme == "." || $theme == ".." || ${#theme} -gt 255 ]]; then
  echo "Invalid theme name" >&2
  exit 1
fi

if [[ -z $target_raw || $target_raw != /* || ${#target_raw} -gt 4096 ]]; then
  echo "Invalid wallpaper path" >&2
  exit 1
fi

home=${HOME:-}
if [[ -z $home || $home != /* ]]; then
  echo "HOME is not absolute" >&2
  exit 1
fi

theme_dir=$home/.config/omarchy/backgrounds/$theme
stock_dir=$home/.local/state/omarchy/current/theme/backgrounds
link_path=$home/.local/state/omarchy/current/background

case $target_raw in
  "$theme_dir"/*) ;;
  *)
    echo "Refusing to delete non-user wallpaper" >&2
    exit 1
    ;;
esac

if [[ ! -f $target_raw ]]; then
  echo "Wallpaper file does not exist: $target_raw" >&2
  exit 1
fi

target=$(realpath -e "$target_raw")
case $target in
  "$theme_dir"/*) ;;
  *)
    echo "Refusing to delete non-user wallpaper" >&2
    exit 1
    ;;
esac

# Capture current background before deletion (readlink -f still resolves after
# the target file is gone on GNU coreutils).
current=""
if [[ -L $link_path || -e $link_path ]]; then
  current=$(readlink -f "$link_path" 2>/dev/null || readlink "$link_path" 2>/dev/null || true)
fi

rm -f -- "$target"

pick_fallback() {
  local -a bgs=()
  # Prefer remaining user wallpapers, then stock theme backgrounds.
  mapfile -d '' -t bgs < <(
    find -L "$theme_dir" "$stock_dir" -maxdepth 1 -type f \
      \( -iname '*.jpg' -o -iname '*.jpeg' -o -iname '*.png' -o -iname '*.gif' \
      -o -iname '*.bmp' -o -iname '*.webp' \) -print0 2>/dev/null | sort -z
  )
  if ((${#bgs[@]} > 0)); then
    printf '%s\n' "${bgs[0]}"
    return 0
  fi
  printf '\n'
  return 0
}

if [[ $current == "$target" || -z $current || ! -e $current ]]; then
  next=$(pick_fallback)
  if [[ -n $next ]]; then
    omarchy-theme-bg-set "$next"
    printf '%s\n' "$next"
  else
    printf '\n'
  fi
else
  printf '%s\n' "$current"
fi
