#!/bin/bash
# =============================================================================
# ChiroClickCRM — Let's Encrypt SSL Certificate Setup
# =============================================================================
# Run this script on the production server after docker-compose is running.
# Requires: certbot installed on the host (apt install certbot)
# =============================================================================

set -euo pipefail

DOMAIN="chiroclickcrm.no"
WEBROOT="/var/www/certbot"

# Check if certbot is installed
if ! command -v certbot &> /dev/null; then
    echo "ERROR: certbot is not installed."
    echo "Install with: sudo apt install certbot"
    exit 1
fi

# Create webroot directory if missing
sudo mkdir -p "$WEBROOT"

echo "Requesting certificate for $DOMAIN and www.$DOMAIN ..."
sudo certbot certonly \
    --webroot \
    -w "$WEBROOT" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    --non-interactive \
    --agree-tos \
    --email "admin@$DOMAIN"

# Set up automatic renewal via cron (runs twice daily, only renews if needed)
CRON_LINE="0 3,15 * * * certbot renew --quiet --deploy-hook 'docker exec chiroclickcrm-nginx nginx -s reload'"
(crontab -l 2>/dev/null | grep -v "certbot renew"; echo "$CRON_LINE") | crontab -

echo ""
echo "=== Certificate installed successfully ==="
echo ""
echo "Next steps:"
echo "  1. Uncomment the SSL server block in nginx/nginx.conf"
echo "  2. Optionally enable the HTTP->HTTPS redirect block"
echo "  3. Reload nginx: docker exec chiroclickcrm-nginx nginx -s reload"
echo ""
