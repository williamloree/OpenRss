# Dechno - Agrégateur de flux RSS

Application Next.js moderne pour agréger et afficher des articles provenant de flux RSS avec une interface élégante et intuitive.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat-square&logo=tailwind-css)

## ✨ Fonctionnalités

- 📰 **Parsing RSS local** - Intégration OpenRss côté serveur sans dépendance externe
- 🎨 **Design moderne** - Interface responsive avec thème sage/vert apaisant
- 💾 **Gestion des flux** - Drawer pour ajouter, supprimer et organiser vos flux RSS
- 🔍 **Recherche intelligente** - Filtrage en temps réel par titre d'article
- 📱 **100% Responsive** - Adapté à tous les écrans (mobile, tablette, desktop)
- ⚡ **Performance optimale** - useSyncExternalStore pour une gestion d'état sans hydratation mismatch
- 🎭 **Animations fluides** - Transitions et effets visuels soignés

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
# Cloner le repository
git clone https://github.com/jeancharlescano/dechno.git
cd dechno

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

### Build & Production

```bash
# Créer le build de production
npm run build

# Lancer le serveur de production
npm start
```

## 📁 Structure du projet

```txt
dechno/
├── app/
│   ├── api/
│   │   └── rss/
│   │       ├── parse/              # Parser un flux RSS unique
│   │       └── parse-multiple/     # Parser plusieurs flux RSS
│   ├── globals.css                 # Thème Tailwind personnalisé
│   ├── layout.tsx                  # Layout principal
│   └── page.tsx                    # Page d'accueil
├── components/
│   ├── Card.tsx                    # Carte d'article
│   ├── Header.tsx                  # En-tête avec recherche
│   └── RssFeedsDrawer.tsx         # Drawer de gestion des flux
├── hooks/
│   └── useRssFeeds.ts             # Hook pour gérer les flux (localStorage)
├── lib/
│   └── rss-parser.ts              # Service de parsing RSS (OpenRss)
├── @types/
│   └── Article.tsx                # Interface TypeScript
└── utils/
    └── string.ts                  # Utilitaires string
```

## 🎯 API Routes

### Parser un flux RSS unique

```bash
GET /api/rss/parse?url=<RSS_URL>
```

Parse un flux RSS depuis une URL et retourne les articles formatés.

**Exemple:**

```bash
curl "http://localhost:3000/api/rss/parse?url=https://dev.to/feed"
```

**Réponse:**

```json
{
  "feed": {
    "title": "DEV Community",
    "description": "...",
    "link": "https://dev.to"
  },
  "items": [
    {
      "title": "Article title",
      "link": "https://...",
      "author": "John Doe",
      "pubDate": "2025-01-15T10:00:00.000Z",
      "content": { "summary": "..." },
      "guid": "unique-id"
    }
  ]
}
```

### Parser plusieurs flux RSS

```bash
POST /api/rss/parse-multiple
Content-Type: application/json

{
  "urls": [
    "https://dev.to/feed",
    "https://feeds.bbci.co.uk/news/rss.xml"
  ]
}
```

Parse plusieurs flux RSS en parallèle et retourne tous les articles agrégés.

**Exemple:**

```bash
curl -X POST http://localhost:3000/api/rss/parse-multiple \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://dev.to/feed","https://feeds.bbci.co.uk/news/rss.xml"]}'
```

## 🎨 Thème & Design

Le projet utilise un thème personnalisé **Sage Green** avec les couleurs suivantes :

| Couleur | Hex | Usage |
|---------|-----|-------|
| sage-50 | `#F5F9F1` | Arrière-plans clairs |
| sage-100 | `#EBF4DD` | Fond principal |
| sage-200 | `#D7E9BB` | Bordures claires |
| sage-300 | `#C3DE99` | Bordures moyennes |
| sage-400 | `#AFD377` | Accents légers |
| sage-500 | `#90AB8B` | Secondaire |
| sage-600 | `#5A7863` | Primaire |
| sage-700 | `#486050` | Primaire foncé |
| sage-800 | `#36483D` | Texte sombre |
| sage-900 | `#3B4953` | Texte principal |

## 🛠️ Technologies

- **[Next.js 16](https://nextjs.org/)** - Framework React avec App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Typage statique
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Styling avec thème inline
- **[rss-parser](https://www.npmjs.com/package/rss-parser)** - Parser RSS/Atom (OpenRss)
- **[HeadlessUI](https://headlessui.com/)** - Composants accessibles (Dialog, Transition)
- **[lucide-react](https://lucide.dev/)** - Icônes modernes
- **[cors](https://www.npmjs.com/package/cors)** - Gestion CORS

## 📝 Utilisation

### Dans l'interface

1. **Ajouter un flux RSS** : Cliquez sur "Mes flux" → Entrez l'URL du flux → "Ajouter le flux"
2. **Rechercher** : Tapez dans la barre de recherche pour filtrer par titre
3. **Parcourir** : Cliquez sur une carte pour lire l'article original

### Flux RSS publics pour tester

- **Dev.to** : `https://dev.to/feed`
- **BBC News** : `https://feeds.bbci.co.uk/news/rss.xml`
- **TechCrunch** : `https://techcrunch.com/feed/`
- **Le Monde** : `https://www.lemonde.fr/rss/une.xml`
- **Hacker News** : `https://news.ycombinator.com/rss`

## 🔧 Configuration

### Variables d'environnement

Aucune variable d'environnement n'est requise. Le parsing RSS se fait côté serveur sans clé API.

### Personnalisation du thème

Modifiez les couleurs dans `app/globals.css` :

```css
:root {
  --sage-600: #5A7863; /* Couleur primaire */
  --sage-100: #EBF4DD; /* Fond principal */
  /* ... autres couleurs ... */
}
```

## 🐛 Résolution de problèmes

### Erreur d'hydratation

Le projet utilise `useSyncExternalStore` pour éviter les erreurs d'hydratation avec localStorage. Si vous rencontrez ce problème :

1. Vérifiez que `suppressHydrationWarning` est présent dans `<html>` ([app/layout.tsx](app/layout.tsx:26))
2. Le hook [useRssFeeds](hooks/useRssFeeds.ts) gère correctement le SSR/CSR

### CORS lors du parsing RSS

Les requêtes RSS passent par le serveur Next.js pour éviter les problèmes CORS. Si vous avez des erreurs :

1. Vérifiez que l'URL du flux est accessible publiquement
2. Consultez les logs serveur pour plus de détails

## 🚢 Déploiement

### Vercel (Recommandé)

Le moyen le plus simple de déployer votre application Next.js :

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/jeancharlescano/dechno)

### Autres plateformes

Le projet peut être déployé sur n'importe quelle plateforme supportant Next.js :

- **Netlify** - Build command: `npm run build`
- **Railway** - Détection automatique
- **Docker** - Créez un Dockerfile avec Node.js 18+

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👤 Auteur

### Jean-Charles Cano

- GitHub: [@jeancharlescano](https://github.com/jeancharlescano)

## 🙏 Remerciements

- [OpenRss](https://github.com/williamloree/OpenRss) - Inspiration pour le parsing RSS
- [HeadlessUI](https://headlessui.com/) - Composants UI accessibles
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS

---

Fait avec ❤️ et [Claude Code](https://claude.com/claude-code)
