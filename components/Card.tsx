"use client";

import { Article } from "@/@types/Article";
import Link from "next/link";
import Image from "next/image";
import { Calendar, User, Bookmark, BookmarkCheck } from "lucide-react";
import { Icon } from "@iconify/react";
import { useState } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useSavedArticles } from "@/hooks/useSavedArticles";
import { toast } from "sonner";

type SendTarget = "notion" | "discord" | "mattermost" | null;

const Card = ({ article }: { article: Article }) => {
  const { settings } = useSettings();
  const { isArticleSaved, saveArticle, removeArticle } = useSavedArticles();
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingNotion, setIsSendingNotion] = useState(false);
  const [isSendingDiscord, setIsSendingDiscord] = useState(false);
  const [isSendingMattermost, setIsSendingMattermost] = useState(false);
  const [notionStatus, setNotionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [discordStatus, setDiscordStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [mattermostStatus, setMattermostStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const imageUrl = article.attachements?.articleImg || article.enclosure?.link;
  const hasImage = imageUrl && imageUrl.trim() !== "";

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSendToNotion = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!settings.n8nWebhookUrl) {
      alert("⚠️ Veuillez configurer l'URL du webhook n8n dans les Paramètres");
      return;
    }

    setIsSendingNotion(true);
    setNotionStatus("idle");

    try {
      const response = await fetch("/api/n8n/send-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article,
          webhookUrl: settings.n8nWebhookUrl,
          target: "notion",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send article to Notion");
      }

      setNotionStatus("success");
      setTimeout(() => setNotionStatus("idle"), 3000);
    } catch (error) {
      console.error("Error sending article to Notion:", error);
      setNotionStatus("error");
      setTimeout(() => setNotionStatus("idle"), 3000);
    } finally {
      setIsSendingNotion(false);
    }
  };

  const handleSendToDiscord = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!settings.n8nWebhookUrl) {
      alert("⚠️ Veuillez configurer l'URL du webhook n8n dans les Paramètres");
      return;
    }

    setIsSendingDiscord(true);
    setDiscordStatus("idle");

    try {
      const response = await fetch("/api/n8n/send-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article,
          webhookUrl: settings.n8nWebhookUrl,
          target: "discord",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send article to Discord");
      }

      setDiscordStatus("success");
      setTimeout(() => setDiscordStatus("idle"), 3000);
    } catch (error) {
      console.error("Error sending article to Discord:", error);
      setDiscordStatus("error");
      setTimeout(() => setDiscordStatus("idle"), 3000);
    } finally {
      setIsSendingDiscord(false);
    }
  };

  const handleSendToMattermost = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!settings.n8nWebhookUrl) {
      alert("⚠️ Veuillez configurer l'URL du webhook n8n dans les Paramètres");
      return;
    }

    setIsSendingMattermost(true);
    setMattermostStatus("idle");

    try {
      const response = await fetch("/api/n8n/send-article", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          article,
          webhookUrl: settings.n8nWebhookUrl,
          target: "mattermost",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send article to Mattermost");
      }

      setMattermostStatus("success");
      setTimeout(() => setMattermostStatus("idle"), 3000);
    } catch (error) {
      console.error("Error sending article to Mattermost:", error);
      setMattermostStatus("error");
      setTimeout(() => setMattermostStatus("idle"), 3000);
    } finally {
      setIsSendingMattermost(false);
    }
  };

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isArticleSaved(article.guid)) {
      removeArticle(article.guid);
      toast.info("Article retiré des sauvegardes");
    } else {
      setIsSaving(true);
      toast.loading("Téléchargement de l'article...", { id: "saving-article" });
      try {
        await saveArticle(article);
        toast.success("Article sauvegardé pour lecture hors-ligne", {
          id: "saving-article",
        });
      } catch {
        toast.error("Erreur lors de la sauvegarde", { id: "saving-article" });
      } finally {
        setIsSaving(false);
      }
    }
  };

  const isSaved = isArticleSaved(article.guid);

  return (
    <div
      title={article.feedName || undefined}
      className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl border border-border hover:border-sage-500 relative"
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
      {/* Action buttons - positioned absolutely */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        {/* Save for offline reading button */}
        <button
          data-umami-event="Save Article Offline"
          onClick={handleToggleSave}
          disabled={isSaving}
          className={`p-2 rounded-lg transition-all shadow-lg backdrop-blur-sm disabled:opacity-50 ${
            isSaved
              ? "bg-amber-500 text-white"
              : "bg-white/90 text-amber-600 hover:bg-amber-500 hover:text-white"
          }`}
          title={
            isSaving
              ? "Téléchargement..."
              : isSaved
                ? "Retirer des sauvegardes"
                : "Sauvegarder pour lecture hors-ligne"
          }
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isSaved ? (
            <BookmarkCheck className="w-5 h-5" />
          ) : (
            <Bookmark className="w-5 h-5" />
          )}
        </button>

        {/* Send to Notion button */}
        {settings.showNotionButton && (
          <button
            data-umami-event="Send to Notion"
            onClick={handleSendToNotion}
            disabled={isSendingNotion}
            className={`p-2 rounded-lg transition-all ${
              notionStatus === "success"
                ? "bg-green-500 text-white"
                : notionStatus === "error"
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-gray-800 hover:bg-gray-800 hover:text-white"
            } shadow-lg backdrop-blur-sm disabled:opacity-50`}
            title={
              notionStatus === "success"
                ? "Envoyé à Notion!"
                : notionStatus === "error"
                  ? "Erreur d'envoi à Notion"
                  : "Envoyer vers Notion"
            }
          >
            {isSendingNotion ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : notionStatus === "success" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : notionStatus === "error" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <Icon icon="ri:notion-line" className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Send to Discord button */}
        {settings.showDiscordButton && (
          <button
            data-umami-event="Send to Discord"
            onClick={handleSendToDiscord}
            disabled={isSendingDiscord}
            className={`p-2 rounded-lg transition-all ${
              discordStatus === "success"
                ? "bg-green-500 text-white"
                : discordStatus === "error"
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-indigo-600 hover:bg-indigo-600 hover:text-white"
            } shadow-lg backdrop-blur-sm disabled:opacity-50`}
            title={
              discordStatus === "success"
                ? "Envoyé à Discord!"
                : discordStatus === "error"
                  ? "Erreur d'envoi à Discord"
                  : "Envoyer vers Discord"
            }
          >
            {isSendingDiscord ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : discordStatus === "success" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : discordStatus === "error" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <Icon icon="ic:outline-discord" className="w-5 h-5" />
            )}
          </button>
        )}

        {/* Send to Mattermost button */}
        {settings.showMattermostButton && (
          <button
            data-umami-event="Send to Mattermost"
            onClick={handleSendToMattermost}
            disabled={isSendingMattermost}
            className={`p-2 rounded-lg transition-all ${
              mattermostStatus === "success"
                ? "bg-green-500 text-white"
                : mattermostStatus === "error"
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-blue-600 hover:bg-blue-600 hover:text-white"
            } shadow-lg backdrop-blur-sm disabled:opacity-50`}
            title={
              mattermostStatus === "success"
                ? "Envoyé à Mattermost!"
                : mattermostStatus === "error"
                  ? "Erreur d'envoi à Mattermost"
                  : "Envoyer vers Mattermost"
            }
          >
            {isSendingMattermost ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : mattermostStatus === "success" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : mattermostStatus === "error" ? (
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <Icon icon="simple-icons:mattermost" className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      <Link
        href={article.link}
        target="_blank"
        className="flex flex-col flex-1"
      >
        {/* Image Section */}
        <div className="relative w-full h-48 overflow-hidden">
          {hasImage ? (
            <Image
              alt={article.title}
              src={imageUrl}
              fill
              className="object-cover transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-sage-600 via-sage-500 to-sage-700 flex items-center justify-center">
              <span className="text-6xl text-white/80">📰</span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1 p-5 bg-card">
          {/* Title */}
          <h2 className="text-xl font-bold text-card-foreground mb-3 line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {article.title}
          </h2>

          {/* Description */}
          {article.content?.summary && (
            <p className="text-muted-foreground text-sm line-clamp-3 mb-4 flex-1 leading-relaxed">
              {article.content.summary}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm text-primary">
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

          {/* Read More Button */}
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg group-hover:bg-primary/70 transition-all">
              Lire l&apos;article
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
      </Link>
    </div>
  );
};

export default Card;
