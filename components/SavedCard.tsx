"use client";

import { SavedArticle } from "@/hooks/useSavedArticles";
import Link from "next/link";
import { Calendar, User, Bookmark, Trash2 } from "lucide-react";
import { useState } from "react";

interface SavedCardProps {
  article: SavedArticle;
  onRemove: (guid: string) => void;
  onReadOffline: (article: SavedArticle) => void;
}

const SavedCard = ({ article, onRemove, onReadOffline }: SavedCardProps) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const hasImage = article.imageUrl && article.imageUrl.trim() !== "";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (showConfirmDelete) {
      onRemove(article.guid);
    } else {
      setShowConfirmDelete(true);
      setTimeout(() => setShowConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      title={article.feedName || undefined}
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-border hover:border-amber-500 relative"
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
        transition:
          "transform 0.1s ease-out, box-shadow 0.3s ease, border-color 0.3s ease",
      }}
      onMouseMove={(e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 30;
        const rotateY = (centerX - x) / 30;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(5px)`;
      }}
      onMouseLeave={(e) => {
        const card = e.currentTarget;
        card.style.transition =
          "transform 0.5s ease-out, box-shadow 0.3s ease, border-color 0.3s ease";
        card.style.transform =
          "perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
        setTimeout(() => {
          card.style.transition =
            "transform 0.1s ease-out, box-shadow 0.3s ease, border-color 0.3s ease";
        }, 500);
      }}
    >
      {/* Action buttons */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {/* Saved indicator */}
        <div className="p-2 rounded-lg bg-amber-500 text-white shadow-lg">
          <Bookmark className="w-5 h-5 fill-current" />
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          className={`p-2 rounded-lg transition-all shadow-lg backdrop-blur-sm ${
            showConfirmDelete
              ? "bg-red-500 text-white"
              : "bg-white/90 text-red-500 hover:bg-red-500 hover:text-white"
          }`}
          title={showConfirmDelete ? "Cliquer pour confirmer" : "Retirer de la liste"}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col flex-1 cursor-pointer" onClick={() => onReadOffline(article)}>
        {/* Image Section */}
        <div className="relative w-full h-48 overflow-hidden">
          {hasImage ? (
            <img
              alt={article.title}
              src={article.imageUrl}
              className="object-cover transition-transform duration-300 aspect-square w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-amber-600 via-amber-500 to-amber-700 flex items-center justify-center">
              <span className="text-6xl text-white/80">📖</span>
            </div>
          )}
          {/* Offline badge */}
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Hors-ligne
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-5 bg-card">
          {/* Title */}
          <h2 className="text-xl font-bold text-card-foreground mb-3 line-clamp-2 leading-snug group-hover:text-amber-600 transition-colors">
            {article.title}
          </h2>

          {/* Description */}
          {article.content?.summary && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">
              {article.content.summary}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm text-amber-600">
            {/* Author */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="truncate max-w-37.5">{article.author}</span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(article.pubDate)}</span>
            </div>
          </div>

          {/* Read Offline Button */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg group-hover:bg-amber-600 transition-all">
              Lire hors-ligne
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavedCard;
