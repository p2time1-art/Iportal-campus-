#!/bin/sh

set -e

PORT="${PORT:-10000}"

echo "Starting Laravel on port ${PORT}..."

sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf

sed -i "s/:80/:${PORT}/g" /etc/apache2/sites-available/000-default.conf

sed -i "s|/var/www/html|/var/www/html/public|g" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
