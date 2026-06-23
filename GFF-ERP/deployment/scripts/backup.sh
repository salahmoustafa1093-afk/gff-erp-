#!/bin/bash
# =============================================================================
# GFF ERP Enterprise - Database Backup Script
# =============================================================================
# Description: Automated daily database backup with compression and retention
# Version: 1.0
# Usage: bash backup.sh [--full] [--uploads] [--cleanup-only]
# Cron: 0 2 * * * /opt/gff-erp/scripts/backup.sh
# =============================================================================

set -euo pipefail

# =============================================================================
# Colors
# =============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# =============================================================================
# Configuration
# =============================================================================
APP_NAME="gff-erp"
APP_DIR="/opt/${APP_NAME}"
BACKEND_DIR="${APP_DIR}/backend"
BACKUP_DIR="${APP_DIR}/backups"
UPLOAD_DIR="${APP_DIR}/uploads"
LOG_DIR="/var/log/${APP_NAME}"
BACKUP_LOG="${LOG_DIR}/backup.log"

# Date and timestamp
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DAY_OF_WEEK=$(date +%u)  # 1=Monday, 7=Sunday

# Database configuration (read from .env if available)
if [ -f "${BACKEND_DIR}/.env" ]; then
    DB_URL=$(grep -E '^DATABASE_URL=' "${BACKEND_DIR}/.env" | cut -d'=' -f2- | tr -d '"' | tr -d "'")
    DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
else
    DB_NAME="${APP_NAME}_db"
    DB_USER="${APP_NAME}_user"
    DB_HOST="localhost"
    DB_PORT="5432"
fi

# Backup retention policy
DAILY_RETENTION=30      # Keep 30 days of daily backups
WEEKLY_RETENTION=12     # Keep 12 weeks of weekly backups
MONTHLY_RETENTION=12    # Keep 12 months of monthly backups

# Backup options
BACKUP_FULL=false
BACKUP_UPLOADS=false
CLEANUP_ONLY=false

# =============================================================================
# Parse arguments
# =============================================================================
for arg in "$@"; do
    case $arg in
        --full)
            BACKUP_FULL=true
            shift
            ;;
        --uploads)
            BACKUP_UPLOADS=true
            shift
            ;;
        --cleanup-only)
            CLEANUP_ONLY=true
            shift
            ;;
    esac
done

# =============================================================================
# Logging
# =============================================================================
mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly} "$LOG_DIR"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$BACKUP_LOG"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARN: $1${NC}" | tee -a "$BACKUP_LOG"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$BACKUP_LOG"
}

# =============================================================================
# Functions
# =============================================================================

# Create database backup
create_db_backup() {
    local output_file=$1
    local backup_format=$2
    
    log "Creating database backup: ${output_file}"
    
    # Set PGPASSWORD environment variable for authentication
    if [ -f "${BACKEND_DIR}/.env" ]; then
        DB_PASSWORD=$(grep -E '^DATABASE_URL=' "${BACKEND_DIR}/.env" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
        export PGPASSWORD="$DB_PASSWORD"
    fi
    
    case $backup_format in
        custom)
            # Custom format (compressed, fastest restore)
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -F c -f "${output_file}" 2>> "$BACKUP_LOG"
            ;;
        plain)
            # Plain SQL format (human-readable)
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -F p -f "${output_file}" 2>> "$BACKUP_LOG"
            ;;
        directory)
            # Directory format (parallel restore)
            pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
                -F d -f "${output_file}" -j 4 2>> "$BACKUP_LOG"
            ;;
        *)
            error "Unknown backup format: $backup_format"
            return 1
            ;;
    esac
    
    unset PGPASSWORD
    
    if [ $? -eq 0 ] && [ -f "$output_file" ]; then
        local file_size=$(du -h "$output_file" | cut -f1)
        log "Database backup created: ${output_file} (${file_size})"
        return 0
    else
        error "Database backup failed"
        return 1
    fi
}

# Compress backup file
compress_backup() {
    local input_file=$1
    local output_file="${input_file}.gz"
    
    log "Compressing backup..."
    
    if command -v pigz > /dev/null 2>&1; then
        pigz -f "$input_file" 2>> "$BACKUP_LOG"
    else
        gzip -f "$input_file" 2>> "$BACKUP_LOG"
    fi
    
    if [ -f "$output_file" ]; then
        local orig_size=$(du -h "$input_file" 2>/dev/null | cut -f1 || echo "unknown")
        local comp_size=$(du -h "$output_file" | cut -f1)
        log "Compression complete: ${comp_size} (compressed from ${orig_size})"
        return 0
    else
        warn "Compression may have failed"
        return 1
    fi
}

# Backup uploads directory
backup_uploads() {
    local output_file="${BACKUP_DIR}/daily/${APP_NAME}_uploads_${TIMESTAMP}.tar.gz"
    
    if [ ! -d "$UPLOAD_DIR" ]; then
        warn "Uploads directory not found: ${UPLOAD_DIR}"
        return 1
    fi
    
    log "Creating uploads backup: ${output_file}"
    
    tar -czf "$output_file" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" 2>> "$BACKUP_LOG"
    
    if [ -f "$output_file" ]; then
        local file_size=$(du -h "$output_file" | cut -f1)
        log "Uploads backup created: ${output_file} (${file_size})"
        return 0
    else
        error "Uploads backup failed"
        return 1
    fi
}

# Create weekly backup (on Sundays)
create_weekly_backup() {
    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        log "Today is Sunday - creating weekly backup"
        
        local daily_file="${BACKUP_DIR}/daily/${APP_NAME}_${TIMESTAMP}.dump.gz"
        local weekly_file="${BACKUP_DIR}/weekly/${APP_NAME}_weekly_${DATE}.dump.gz"
        
        if [ -f "$daily_file" ]; then
            cp "$daily_file" "$weekly_file"
            log "Weekly backup created: ${weekly_file}"
        fi
    fi
}

# Create monthly backup (on 1st of month)
create_monthly_backup() {
    local day_of_month=$(date +%d)
    
    if [ "$day_of_month" -eq 1 ]; then
        log "Today is the 1st - creating monthly backup"
        
        local daily_file="${BACKUP_DIR}/daily/${APP_NAME}_${TIMESTAMP}.dump.gz"
        local monthly_file="${BACKUP_DIR}/monthly/${APP_NAME}_monthly_$(date +%Y%m).dump.gz"
        
        if [ -f "$daily_file" ]; then
            cp "$daily_file" "$monthly_file"
            log "Monthly backup created: ${monthly_file}"
        fi
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning old backups..."
    
    # Clean daily backups
    local deleted_daily=$(find "${BACKUP_DIR}/daily" -name "${APP_NAME}_*.dump.gz" -mtime +${DAILY_RETENTION} | wc -l)
    find "${BACKUP_DIR}/daily" -name "${APP_NAME}_*.dump.gz" -mtime +${DAILY_RETENTION} -delete
    log "  Deleted ${deleted_daily} old daily backups (>${DAILY_RETENTION} days)"
    
    # Clean weekly backups
    local deleted_weekly=$(find "${BACKUP_DIR}/weekly" -name "${APP_NAME}_weekly_*.dump.gz" -mtime +$((WEEKLY_RETENTION * 7)) | wc -l)
    find "${BACKUP_DIR}/weekly" -name "${APP_NAME}_weekly_*.dump.gz" -mtime +$((WEEKLY_RETENTION * 7)) -delete
    log "  Deleted ${deleted_weekly} old weekly backups (>${WEEKLY_RETENTION} weeks)"
    
    # Clean monthly backups
    local deleted_monthly=$(find "${BACKUP_DIR}/monthly" -name "${APP_NAME}_monthly_*.dump.gz" -mtime +$((MONTHLY_RETENTION * 30)) | wc -l)
    find "${BACKUP_DIR}/monthly" -name "${APP_NAME}_monthly_*.dump.gz" -mtime +$((MONTHLY_RETENTION * 30)) -delete
    log "  Deleted ${deleted_monthly} old monthly backups (>${MONTHLY_RETENTION} months)"
    
    # Clean old upload backups
    local deleted_uploads=$(find "${BACKUP_DIR}/daily" -name "${APP_NAME}_uploads_*.tar.gz" -mtime +${DAILY_RETENTION} | wc -l)
    find "${BACKUP_DIR}/daily" -name "${APP_NAME}_uploads_*.tar.gz" -mtime +${DAILY_RETENTION} -delete
    log "  Deleted ${deleted_uploads} old uploads backups"
    
    # Clean orphaned temporary files
    find "$BACKUP_DIR" -name "*.tmp" -mtime +1 -delete 2>/dev/null || true
}

# Upload to remote storage (optional)
upload_to_remote() {
    local file=$1
    
    # AWS S3 upload (configure AWS CLI first)
    # if command -v aws > /dev/null 2>&1 && [ -f ~/.aws/credentials ]; then
    #     aws s3 cp "$file" "s3://gff-erp-backups/" >> "$BACKUP_LOG" 2>&1
    #     log "Uploaded to S3: $(basename "$file")"
    # fi
    
    # MinIO upload (configure mc first)
    # if command -v mc > /dev/null 2>&1; then
    #     mc cp "$file" gff-backups/erp/ >> "$BACKUP_LOG" 2>&1
    #     log "Uploaded to MinIO: $(basename "$file")"
    # fi
    
    # Rsync to remote server (configure SSH keys first)
    # if [ -n "${REMOTE_BACKUP_HOST:-}" ]; then
    #     rsync -az --delete "$BACKUP_DIR/" "backup@${REMOTE_BACKUP_HOST}:/backups/gff-erp/" >> "$BACKUP_LOG" 2>&1
    #     log "Synced to remote: ${REMOTE_BACKUP_HOST}"
    # fi
    
    log "Remote upload: (configure in script if needed)"
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1
    
    log "Verifying backup integrity..."
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check file size (must be > 1KB)
    local file_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo 0)
    if [ "$file_size" -lt 1024 ]; then
        error "Backup file is too small (${file_size} bytes)"
        return 1
    fi
    
    # Try to read the backup (for custom format, list contents)
    if [[ "$backup_file" == *.dump ]] || [[ "$backup_file" == *.dump.gz ]]; then
        if [[ "$backup_file" == *.gz ]]; then
            gunzip -t "$backup_file" 2>> "$BACKUP_LOG"
        fi
    fi
    
    log "Backup integrity verified"
    return 0
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification (configure sendmail/postfix first)
    # if [ -n "${BACKUP_EMAIL:-}" ] && command -v mail > /dev/null 2>&1; then
    #     echo "$message" | mail -s "GFF ERP Backup ${status}" "$BACKUP_EMAIL"
    # fi
    
    # Slack/Discord webhook (configure webhook URL first)
    # if [ -n "${BACKUP_WEBHOOK:-}" ]; then
    #     curl -s -X POST -H 'Content-type: application/json' \
    #         --data "{\"text\":\"GFF ERP Backup ${status}: ${message}\"}" \
    #         "$BACKUP_WEBHOOK" > /dev/null
    # fi
    
    : # No-op - configure as needed
}

# =============================================================================
# Main
# =============================================================================
echo -e "${BLUE}"
echo "============================================================================="
echo "  GFF ERP Enterprise - Database Backup"
echo "============================================================================="
echo -e "${NC}"

log "Backup started at $(date)"
log "Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}"
log "Backup directory: ${BACKUP_DIR}"

# If cleanup only, skip backup creation
if [ "$CLEANUP_ONLY" = true ]; then
    log "Running cleanup only..."
    cleanup_old_backups
    log "Cleanup completed at $(date)"
    exit 0
fi

# =============================================================================
# Step 1: Create database backup
# =============================================================================
log "Step 1: Creating database backup..."

DAILY_BACKUP_FILE="${BACKUP_DIR}/daily/${APP_NAME}_${TIMESTAMP}.dump"

if create_db_backup "$DAILY_BACKUP_FILE" "custom"; then
    log "Database backup created successfully"
    
    # Compress backup
    compress_backup "$DAILY_BACKUP_FILE"
    DAILY_BACKUP_FILE="${DAILY_BACKUP_FILE}.gz"
    
    # Verify backup
    verify_backup "$DAILY_BACKUP_FILE"
else
    error "Database backup failed!"
    send_notification "FAILED" "Database backup failed at $(date)"
    exit 1
fi

# =============================================================================
# Step 2: Create full backup if requested
# =============================================================================
if [ "$BACKUP_FULL" = true ]; then
    log "Step 2: Creating full SQL backup..."
    
    FULL_BACKUP_FILE="${BACKUP_DIR}/daily/${APP_NAME}_full_${TIMESTAMP}.sql"
    
    if create_db_backup "$FULL_BACKUP_FILE" "plain"; then
        compress_backup "$FULL_BACKUP_FILE"
        log "Full SQL backup created"
    else
        warn "Full SQL backup failed"
    fi
fi

# =============================================================================
# Step 3: Backup uploads if requested
# =============================================================================
if [ "$BACKUP_UPLOADS" = true ]; then
    log "Step 3: Backing up uploads..."
    backup_uploads
fi

# =============================================================================
# Step 4: Create weekly/monthly copies
# =============================================================================
log "Step 4: Creating periodic backups..."
create_weekly_backup
create_monthly_backup

# =============================================================================
# Step 5: Upload to remote storage
# =============================================================================
log "Step 5: Uploading to remote storage..."
upload_to_remote "$DAILY_BACKUP_FILE"

# =============================================================================
# Step 6: Cleanup old backups
# =============================================================================
log "Step 6: Cleaning old backups..."
cleanup_old_backups

# =============================================================================
# Summary
# =============================================================================
echo ""
log "Backup completed at $(date)"

# Calculate backup sizes
BACKUP_COUNT=$(find "$BACKUP_DIR" -name "${APP_NAME}_*.dump.gz" -type f | wc -l)
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)

log "Total backup files: ${BACKUP_COUNT}"
log "Total backup size: ${BACKUP_SIZE}"
log "Latest backup: ${DAILY_BACKUP_FILE}"
log "Backup log: ${BACKUP_LOG}"

send_notification "SUCCESS" "Backup completed at $(date). Files: ${BACKUP_COUNT}, Size: ${BACKUP_SIZE}"

exit 0
