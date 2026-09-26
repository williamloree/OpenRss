export interface PatchNote {
  version: string;
  date: string;
  title: string;
  changes: {
    type: 'new' | 'improvement' | 'fix' | 'breaking';
    description: string;
  }[];
}

export const patchNotes: PatchNote[] = [{
    version: "0.1.7",
    date: "2026-09-26",
    title: "Application installable",
    changes: [
      {
        type: "new",
        description: "OpenRss s'installe comme une application (PWA) sur mobile et ordinateur"
      },
      {
        type: "new",
        description: "Mode hors ligne : les derniers articles chargés restent consultables sans connexion"
      },
      {
        type: "improvement",
        description: "Notifications d'erreur plus claires et recherche plus fluide lors de la saisie d'une URL"
      },
      {
        type: "fix",
        description: "Les URL de flux contenant des paramètres (&, ?) sont maintenant correctement chargées"
      },
      {
        type: "fix",
        description: "Renforcement de la sécurité des requêtes côté serveur"
      },
    ]
  },{
    version: "0.1.5",
    date: "2024-12-22",
    title: "Version initiale",
    changes: [
      {
        type: "new",
        description: "Ajout du système de recherche avancée par titre, auteur, flux et date"
      },
      {
        type: "new",
        description: "Affichage du nom du flux RSS sur les cartes d'articles"
      },
      {
        type: "improvement",
        description: "Hauteur des cartes uniformisée pour un meilleur rendu visuel"
      },
    ]
  },{
    version: "0.1.4",
    date: "2024-12-21",
    title: "Version initiale",
    changes: [
      {
        type: "fix",
        description: "Correction des toggles dans les paramètres"
      },
      {
        type: "new",
        description: "Bibliothèque de flux RSS avec catégories"
      }
    ]
  },
  {
    version: "0.1.3",
    date: "2024-12-20",
    title: "Version initiale",
    changes: [
      {
        type: "new",
        description: "Envoi d'articles vers Notion, Discord et Mattermost via n8n"
      },
      {
        type: "improvement",
        description: "Statistiques déplacées dans le header pour une meilleure visibilité"
      },
      {
        type: "improvement",
        description: "Auto-scroll en haut de page lors du changement de pagination"
      },
      {
        type: "fix",
        description: "Modal de bibliothèque ne se recharge plus au scroll"
      }
    ]
  }
];

export function getLatestVersion(): string {
  return patchNotes[0].version;
}

export function getPatchNotesByVersion(version: string): PatchNote | undefined {
  return patchNotes.find(note => note.version === version);
}
