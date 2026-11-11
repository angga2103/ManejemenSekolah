#!/bin/bash
# ==============================================================================
# POSTGRESQL RESTORATION SCRIPT
# ==============================================================================
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_backup_file.sql.gz[.gpg]>"
    exit 1
fi

FILE="$1"

if [[ "$FILE" == *.gpg ]]; then
    if [ -z "${BACKUP_PASSPHRASE}" ]; then
        echo "[ERROR] BACKUP_PASSPHRASE environment variable required to decrypt file."
        exit 1
    fi
    echo "[INFO] Decrypting ${FILE}..."
    DECRYPTED="${FILE%.gpg}"
    gpg --batch --yes --passphrase "${BACKUP_PASSPHRASE}" -o "${DECRYPTED}" -d "${FILE}"
    FILE="${DECRYPTED}"
fi

echo "[WARNING] Restoring database from ${FILE} will OVERWRITE target database."
read -p "Are you sure you want to proceed? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "[ABORT] Restore cancelled."
    exit 0
fi

echo "[INFO] Restoring database..."
gunzip -c "${FILE}" | docker exec -i edusaas-postgres psql -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-edusaas_dev}"

echo "[INFO] Database restored successfully at $(date)."
