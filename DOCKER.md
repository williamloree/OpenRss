# Documentation Docker - OpenRSS

## Vue d'ensemble

Cette application utilise Docker avec plusieurs configurations optimisées pour le développement et la production.

## Fichiers de configuration

- `Dockerfile` - Image multi-stage optimisée pour la production
- `compose.yml` - Configuration Docker Compose standard
- `compose.dev.yml` - Configuration pour le développement avec hot-reload
- `compose.prod.yml` - Configuration production avec image depuis le registry
- `.dockerignore` - Fichiers exclus du build context

## Commandes rapides

### Développement

Pour démarrer l'application en mode développement avec hot-reload :

```bash
docker-compose -f compose.dev.yml up
```

L'application sera accessible sur http://localhost:3000

Les modifications du code seront automatiquement rechargées.

### Production locale

Pour builder et démarrer l'application en mode production :

```bash
docker-compose up --build
```

### Production avec image du registry

Pour déployer depuis le registry :

```bash
docker-compose -f compose.prod.yml up -d
```

## Caractéristiques de l'image

### Multi-stage build

Le Dockerfile utilise 3 stages :

1. **deps** - Installation des dépendances avec outils de build (python3, make, g++) pour better-sqlite3
2. **builder** - Build de l'application Next.js en mode standalone
3. **runner** - Image finale minimale avec seulement les fichiers nécessaires

### Sécurité

- ✅ Utilisateur non-root (nextjs:nodejs, UID/GID 1001)
- ✅ Image Alpine Linux légère
- ✅ Pas de secrets dans les layers
- ✅ Health check configuré

### Health Check

Un endpoint `/api/health` est disponible pour vérifier l'état de l'application :

```bash
curl http://localhost:3000/api/health
```

Le health check Docker vérifie automatiquement cet endpoint toutes les 30 secondes.

### Persistence

Les données SQLite sont stockées dans un volume Docker nommé :

- `openrss-data` pour la production
- `openrss-dev-data` pour le développement

Pour sauvegarder les données :

```bash
docker run --rm -v openrss-data:/data -v $(pwd):/backup alpine tar czf /backup/openrss-backup.tar.gz -C /data .
```

Pour restaurer les données :

```bash
docker run --rm -v openrss-data:/data -v $(pwd):/backup alpine tar xzf /backup/openrss-backup.tar.gz -C /data
```

## Resource limits

Les limites de ressources sont configurées pour éviter la surconsommation :

### Production (compose.yml & compose.prod.yml)
- CPU : 1.0 max, 0.5 réservé
- Mémoire : 512MB max, 256MB réservé

### Développement (compose.dev.yml)
- CPU : 2.0 max
- Mémoire : 1GB max

## Build de l'image

### Build local

```bash
docker build -t openrss:latest .
```

### Build pour le registry

```bash
docker build -t registry.williamloree.fr/openrss:latest .
docker push registry.williamloree.fr/openrss:latest
```

### Build multi-architecture

Pour supporter ARM et x86 :

```bash
docker buildx create --name multiarch-builder --use
docker buildx build --platform linux/amd64,linux/arm64 -t registry.williamloree.fr/openrss:latest --push .
```

## Optimisations appliquées

1. **Layer caching** - Les dépendances sont copiées avant le code source
2. **Build cache cleanup** - npm cache clean après installation
3. **Multi-stage** - Seuls les artifacts nécessaires sont copiés dans l'image finale
4. **Better-sqlite3** - Build tools installés uniquement dans le stage de build
5. **.dockerignore** - Exclusion des fichiers inutiles du build context

## Monitoring

Pour voir les logs :

```bash
docker-compose logs -f
```

Pour voir le statut du health check :

```bash
docker inspect --format='{{json .State.Health}}' openrss-app | jq
```

## Résolution de problèmes

### L'application ne démarre pas

Vérifier les logs :
```bash
docker-compose logs openrss
```

### Problèmes de permissions

Les données sont owned par l'utilisateur nextjs (UID 1001). Si vous avez des problèmes :

```bash
docker exec openrss-app ls -la /app/data
```

### Rebuild complet

Si vous avez des problèmes de cache :

```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

## Notes de sécurité

⚠️ L'IDE détecte des vulnérabilités dans l'image `node:20-alpine`. Pensez à :

1. Mettre à jour régulièrement l'image de base
2. Scanner l'image avec Docker Scout :
   ```bash
   docker scout quickview openrss:latest
   ```
3. Appliquer les mises à jour de sécurité :
   ```bash
   docker pull node:20-alpine
   docker-compose build --no-cache
   ```
