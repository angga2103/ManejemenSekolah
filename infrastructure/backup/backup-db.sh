#!/bin/bash
# ==============================================================================
# POSTGRESQL BACKUP SCRIPT WITH GPG ENCRYPTION
# ==============================================================================
set -e

BACKUP_DIR="${BACKUP_DIR:-/var/backups/edusaas}"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/edusaas_db_${DATE}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Starting database backup at $(date)..."

# Execute pg_dump within container or host
docker exec -t edusaas-postgres pg_dump -U "${POSTGRES_USER:-postgres}" -d "${POSTGRES_DB:-edusaas_dev}" | gzip > "${BACKUP_FILE}"

echo "[INFO] Database dump created: ${BACKUP_FILE} ($(du -sh "${BACKUP_FILE}" | cut -f1))"

# Encrypt backup if PASSPHRASE is provided
if [ -n "${BACKUP_PASSPHRASE}" ]; then
    echo "[INFO] Encrypting backup with GPG..."
    gpg --batch --yes --passphrase "${BACKUP_PASSPHRASE}" -c "${BACKUP_FILE}"
    rm -f "${BACKUP_FILE}"
    echo "[INFO] Encrypted backup created: ${ENCRYPTED_FILE}"
fi

# Retention policy: Delete backups older than 14 days
find "${BACKUP_DIR}" -type f -mtime +14 -name "edusaas_db_*" -delete

echo "[INFO] Backup completed successfully."
