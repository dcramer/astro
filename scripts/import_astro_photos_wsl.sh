#!/usr/bin/env bash
set -euo pipefail

# Adapted from https://github.com/jamiesmith/astrophotography.
# WSL-friendly translation of the macOS importAstroPhotos.sh helper.
# Configure defaults via environment variables, or pass explicit paths
# with the command-line options described in the usage text below.

shopt -s globstar nullglob

DEFAULT_DEST_DIR="${IMPORT_BASE_DEST_DIR:-}"
DEFAULT_DROPBOX_SOURCE="${IMPORT_DROPBOX_SOURCE:-}"
DEFAULT_MIRROR_SOURCE="${IMPORT_MIRROR_SOURCE:-}"
PROJECT_DIR_SUFFIX="${IMPORT_PROJECT_SUFFIX:-Project}"
TREE_ONLY=false
SOURCE_DIR=""
BASE_DEST_DIR=""

usage() {
    cat <<USAGE
Usage: $(basename "$0") (-d | -m | -s <source>) [options]
  -d                Use DROPBOX source directory (IMPORT_DROPBOX_SOURCE)
  -m                Use MIRROR source directory (IMPORT_MIRROR_SOURCE)
  -s <path>         Use an explicit source directory path
  -o <path>         Override destination root (IMPORT_BASE_DEST_DIR)
  -t                Dry run: create directory tree only (no copies)
Environment overrides:
  IMPORT_DROPBOX_SOURCE    Default for -d (e.g. /mnt/c/Users/<user>/Dropbox/AstroShedImages)
  IMPORT_MIRROR_SOURCE     Default for -m (e.g. /mnt/d/MIRRORIMAGE)
  IMPORT_BASE_DEST_DIR     Default destination root (e.g. /mnt/d/AstroImages)
  IMPORT_PROJECT_SUFFIX    Suffix for per-target project folders (default: Project)
USAGE
    exit 9
}

log() {
    printf '[%s] %s\n' "$(date --iso-8601=seconds)" "$*"
}

while getopts "dms:o:t" option; do
    case "$option" in
        d)
            SOURCE_DIR="${DEFAULT_DROPBOX_SOURCE}" ;;
        m)
            SOURCE_DIR="${DEFAULT_MIRROR_SOURCE}" ;;
        s)
            SOURCE_DIR="${OPTARG}" ;;
        o)
            BASE_DEST_DIR="${OPTARG}" ;;
        t)
            TREE_ONLY=true ;;
        *)
            usage
            ;;
    esac
done
shift $((OPTIND - 1))

[[ -z "${SOURCE_DIR}" ]] && usage
[[ -z "${BASE_DEST_DIR}" ]] && BASE_DEST_DIR="${DEFAULT_DEST_DIR}"

if [[ -z "${SOURCE_DIR}" ]]; then
    usage
fi
if [[ -z "${BASE_DEST_DIR}" ]]; then
    echo "Destination directory must be provided via -o or IMPORT_BASE_DEST_DIR" >&2
    exit 9
fi

if [[ ! -d "${SOURCE_DIR}" ]]; then
    echo "Source directory '${SOURCE_DIR}' does not exist" >&2
    exit 1
fi

mkdir -p "${BASE_DEST_DIR}"

SOURCE_DIR=$(realpath "${SOURCE_DIR}")
BASE_DEST_DIR=$(realpath "${BASE_DEST_DIR}")

log "Importing frames from ${SOURCE_DIR} to ${BASE_DEST_DIR}"

mapfile -d '' date_dirs < <(find "${SOURCE_DIR}" -mindepth 1 -maxdepth 1 -type d -name '20??-??-??' -print0 | sort -z)

if (( ${#date_dirs[@]} == 0 )); then
    log "No YYYY-MM-DD directories found in ${SOURCE_DIR}; nothing to import."
    exit 0
fi

session_date_dir=""

for date_dir in "${date_dirs[@]}"; do
    date_dir=${date_dir%/}
    date_base=${date_dir##*/}

    if [[ -z "${session_date_dir}" ]]; then
        session_date_dir="${date_base}"
        log "Session date set to ${session_date_dir}"
    fi

    find "${date_dir}" -type f -iname '*LIGHT*.fits' ! -path '*/.*' -print0 | while IFS= read -r -d '' file; do
        relative=${file#"${date_dir}/"}
        target_name=${relative%%_*}
        sanitized_target=$(printf '%s' "${target_name}" | cut -d '(' -f 1 | tr -d " '" )
        target_compact=${target_name// /}
        target_compact=${target_compact//\'/}

        new_name=${relative// /}
        new_name=${new_name//\'/}
        new_name=${new_name//${target_compact}_FlatField/FlatField}

        dest_dir="${BASE_DEST_DIR}/${sanitized_target}/${session_date_dir}"
        project_dir="${BASE_DEST_DIR}/${sanitized_target}/_${sanitized_target}-${PROJECT_DIR_SUFFIX}"

        mkdir -p "${dest_dir}/LIGHTS" "${dest_dir}/WBPP" \
                 "${project_dir}/CALIBRATED/${session_date_dir}" \
                 "${project_dir}/WORK_AREA"

        if [[ "${TREE_ONLY}" == true ]]; then
            printf 'touch "%s"\n' "${dest_dir}/LIGHTS/< LIGHTS GO HERE >"
            printf 'touch "%s"\n' "${project_dir}/CALIBRATED/${session_date_dir}/< CALIBRATED LIGHTS GO HERE >"
        else
            log "Copying ${relative} -> ${sanitized_target}/${session_date_dir}/${new_name}"
            cp -p -- "${file}" "${dest_dir}/LIGHTS/${new_name}"
        fi
    done

    find "${date_dir}" -type f -iname 'FLAT_*.fits' ! -path '*/.*' -print0 | while IFS= read -r -d '' file; do
        relative=${file#"${date_dir}/"}
        new_name=FLAT_${relative##*FLAT_}
        dest_dir="${BASE_DEST_DIR}/RAW_CALIBRATION/${session_date_dir}/FLATS"

        mkdir -p "${dest_dir}"
        if [[ "${TREE_ONLY}" == true ]]; then
            printf 'touch "%s"\n' "${dest_dir}/< FLATS GO HERE >"
        else
            log "Copying ${relative} -> RAW_CALIBRATION/${session_date_dir}/FLATS/${new_name}"
            cp -p -- "${file}" "${dest_dir}/${new_name}"
        fi
    done

done

log "Import complete."
