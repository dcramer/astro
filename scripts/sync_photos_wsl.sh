#!/usr/bin/env bash
set -euo pipefail

# Adapted from https://github.com/jamiesmith/astrophotography.
# WSL-friendly translation of the macOS syncPhotos.sh helper.
# Configure the source and destination roots with environment variables
# or the command-line options below.

PRIMARY_ROOT="${SYNC_PRIMARY_ROOT:-}"
MIRROR_ROOT="${SYNC_MIRROR_ROOT:-}"
DROPBOX_ROOT="${SYNC_DROPBOX_ROOT:-}"
SLEEP_SECONDS="${SYNC_SLEEP_SECONDS:-10}"
RUN_FOREVER=true
DRY_RUN=false

usage() {
    cat <<USAGE
Usage: $(basename "$0") [options]
  -p <path>    Primary astro images root (SYNC_PRIMARY_ROOT)
  -m <path>    Mirror volume root (SYNC_MIRROR_ROOT)
  -d <path>    Dropbox staging root (SYNC_DROPBOX_ROOT)
  -i <sec>     Seconds to sleep between sync passes (SYNC_SLEEP_SECONDS, default: 10)
  -1           Run a single pass instead of looping forever
  -n           Dry run (add --dry-run to rsync)
Environment overrides are shown in parentheses above.
USAGE
    exit 9
}

log() {
    printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$*"
}

require_tool() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Required tool '$1' not found in PATH" >&2
        exit 1
    fi
}

require_dir() {
    local label="$1"
    local dir="$2"
    if [[ -z "${dir}" ]]; then
        echo "Missing path for ${label}; supply it via CLI or environment" >&2
        usage
    fi
    if [[ ! -d "${dir}" ]]; then
        echo "Directory '${dir}' (for ${label}) does not exist" >&2
        exit 1
    fi
}

while getopts ":p:m:d:i:1nh" option; do
    case "$option" in
        p) PRIMARY_ROOT="${OPTARG}" ;;
        m) MIRROR_ROOT="${OPTARG}" ;;
        d) DROPBOX_ROOT="${OPTARG}" ;;
        i) SLEEP_SECONDS="${OPTARG}" ;;
        1) RUN_FOREVER=false ;;
        n) DRY_RUN=true ;;
        h) usage ;;
        :) echo "Option -${OPTARG} requires an argument" >&2; usage ;;
        *) usage ;;
    esac
done

require_tool rsync

require_dir "primary root" "${PRIMARY_ROOT}"
require_dir "mirror root" "${MIRROR_ROOT}"
require_dir "dropbox root" "${DROPBOX_ROOT}"

RSYNC_OPTS=(--verbose --size-only --archive --update \
    --exclude "@Focus3 Runs" \
    --exclude "@Focus2 Runs" \
    --exclude "Closed Loop Slews" \
    --exclude ".Trashes" \
    --exclude ".Spotlight-V100" \
    --exclude "astrophotography" \
    --exclude "Automated*")

if [[ "${DRY_RUN}" == true ]]; then
    RSYNC_OPTS+=(--dry-run)
fi

trap 'log "Stopping sync loop"; exit 0' SIGINT SIGTERM

while true; do
    log "Synchronizing ${PRIMARY_ROOT} -> ${MIRROR_ROOT}"
    rsync "${RSYNC_OPTS[@]}" "${PRIMARY_ROOT}/" "${MIRROR_ROOT}"

    log "Synchronizing ${MIRROR_ROOT} -> ${DROPBOX_ROOT}"
    rsync "${RSYNC_OPTS[@]}" "${MIRROR_ROOT}/" "${DROPBOX_ROOT}"

    if [[ "${RUN_FOREVER}" == false ]]; then
        break
    fi

    sleep "${SLEEP_SECONDS}"
done

log "Sync complete."
