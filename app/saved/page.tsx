"use client";

import { useEffect, useState } from "react";
import { useSavedArticles, SavedArticle, getStorageSize } from "@/hooks/useSavedArticles";
import { useSettings } from "@/hooks/useSettings";
import { Bookmark, Trash2, ArrowLeft, X, ExternalLink, HardDrive, Clock, User } from "lucide-react";
import Link from "next/link";
import AOS from "aos";
import "aos/dist/aos.css";

import SavedCard from "@/components/SavedCard";
import Squares from "@/components/ui/Squares";
import Footer from "@/components/Footer";
import { toast } from "sonner";

export default function SavedPage() {
  const { articles, removeArticle, clearAllSaved } = useSavedArticles();
  const { settings } = useSettings();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<SavedArticle | null>(null);
  const [storageInfo, setStorageInfo] = useState({ used: "0 KB", percentage: 0 });

  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }, []);

  useEffect(() => {
    setStorageInfo(getStorageSize());
  }, [articles]);

  const handleRemove = (guid: string) => {
    removeArticle(guid);
    toast.info("Article retiré des sauvegardes");
  };

  const handleClearAll = () => {
    if (showConfirmClear) {
      clearAllSaved();
      setShowConfirmClear(false);
      toast.success("Tous les articles ont été supprimés");
    } else {
      setShowConfirmClear(true);
      setTimeout(() => setShowConfirmClear(false), 3000);
    }
  };

  const handleReadOffline = (article: SavedArticle) => {
    setSelectedArticle(article);
  };

  const closeReader = () => {
    setSelectedArticle(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Squares Background */}
      {settings.showSquares && (
        <div className="fixed inset-0 -z-10 h-full w-full bg-background">
          <Squares
            direction="diagonal"
            speed={0.5}
            borderColor="#6B72801A"
            squareSize={64}
            hoverFillColor="rgba(251, 191, 36, 0.2)"
          />
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Retour</span>
              </Link>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-lg">
                  <Bookmark className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Articles sauvegardés</h1>
                  <p className="text-sm text-muted-foreground">
                    {articles.length} article{articles.length !== 1 ? "s" : ""} disponible{articles.length !== 1 ? "s" : ""} hors-ligne
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Storage indicator */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground bg-card px-3 py-2 rounded-lg border border-border">
                <HardDrive className="w-4 h-4" />
                <span>{storageInfo.used}</span>
                <div className="w-16 h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      storageInfo.percentage > 80 ? "bg-red-500" : "bg-amber-500"
                    }`}
                    style={{ width: `${storageInfo.percentage}%` }}
                  />
                </div>
              </div>

              {/* Clear all button */}
              {articles.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    showConfirmClear
                      ? "bg-red-500 text-white"
                      : "bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500"
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {showConfirmClear ? "Confirmer" : "Tout effacer"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-foreground text-center bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-border">
              <div className="w-24 h-24 mx-auto mb-6 bg-amber-100 rounded-full flex items-center justify-center">
                <Bookmark className="w-12 h-12 text-amber-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Aucun article sauvegardé</h2>
              <p className="text-muted-foreground mb-6 max-w-md">
                Sauvegardez des articles depuis la page d&apos;accueil en cliquant sur l&apos;icône
                <Bookmark className="w-4 h-4 inline mx-1" />
                pour les lire plus tard, même sans connexion internet.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-all shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                Parcourir les articles
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {articles.map((article, index) => (
              <div
                key={article.guid}
                data-aos="fade-up"
                data-aos-delay={index * 50}
              >
                <SavedCard
                  article={article}
                  onRemove={handleRemove}
                  onReadOffline={handleReadOffline}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      {/* Article Viewer Modal - Full screen iframe with original site styles */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/80">
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700">
            <div className="flex items-center gap-3 text-white overflow-hidden">
              <span className="text-amber-400 font-medium truncate max-w-[200px] sm:max-w-none">
                {selectedArticle.siteName || "Article"}
              </span>
              <span className="text-gray-500 hidden sm:inline">•</span>
              <span className="text-gray-300 truncate hidden sm:inline max-w-md">
                {selectedArticle.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={selectedArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Original</span>
              </a>
              <button
                onClick={closeReader}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Iframe with styled HTML */}
          <iframe
            srcDoc={selectedArticle.styledHtml || `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                  img { max-width: 100%; height: auto; }
                </style>
              </head>
              <body>
                <h1>${selectedArticle.title}</h1>
                ${selectedArticle.content.body}
              </body>
              </html>
            `}
            className="w-full h-full pt-12 bg-white"
            title={selectedArticle.title}
            sandbox="allow-same-origin"
          />
        </div>
      )}
    </div>
  );
}
