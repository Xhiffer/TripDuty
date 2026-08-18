#!/usr/bin/env bash
# Déploie Trip Duty sur le serveur : l'application et l'API.
set -euo pipefail

HOST="root@168.231.80.167"
KEY="$HOME/.ssh/sydeplay_deploy"
SSH="ssh -i $KEY $HOST"

echo "→ Compilation"
npm run build

echo "→ Envoi de l'application"
tar czf /tmp/tripduty-dist.tgz -C dist .
scp -q -i "$KEY" /tmp/tripduty-dist.tgz "$HOST":/tmp/
$SSH 'rm -rf /var/www/tripduty/* && tar xzf /tmp/tripduty-dist.tgz -C /var/www/tripduty && rm /tmp/tripduty-dist.tgz && find /var/www/tripduty -name "._*" -delete'

echo "→ Envoi de l'API"
tar czf /tmp/tripduty-server.tgz server docker-compose.yml
scp -q -i "$KEY" /tmp/tripduty-server.tgz "$HOST":/opt/tripduty/
$SSH 'cd /opt/tripduty && tar xzf tripduty-server.tgz && rm tripduty-server.tgz && find . -name "._*" -delete && docker compose up -d --build >/dev/null 2>&1'

echo "→ Vérification"
$SSH 'sleep 3; curl -sf http://127.0.0.1:8090/api/health >/dev/null && echo "API en ligne" || (echo "API muette"; docker logs tripduty-api-1 2>&1 | tail -20; exit 1)'

rm -f /tmp/tripduty-dist.tgz /tmp/tripduty-server.tgz
echo "✓ Déployé sur https://tripduty.exmpleconcession.com"
