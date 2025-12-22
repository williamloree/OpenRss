export interface Article {
  guid: string;
  title: string;
  slug: string;
  link: string;
  author: string;
  /** ISO 8601 timestamp (optionnel : "date pas tout le temps") */
  pubDate?: string;
  /** ISO 8601 timestamp pour publication programmée (optionnel) */
  scheduledPublicationTime?: string | null;
  timezone?: string | null;
  published: boolean;
  language: string;
  category: string;
  enclosure: Enclosure;
  tags: string[];
  content: ArticleContent;
  attachements?: Attachment;
  feedName?: string;
}

export interface ArticleContent {
  summary: string;
  body: string;
}

export interface Attachment {
  articleImg?: string;
  creatorAvatar?: string;
}

export interface Enclosure {
  link?: string;
  type?: string;
}
