"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Search, Trash2 } from "lucide-react";
import { useRssFeeds } from "@/hooks/useRssFeeds";
import { FeedLibraryItem } from "@/lib/db";

interface FeedLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedLibrary({ isOpen, onClose }: FeedLibraryProps) {
  const [feedsByCategory, setFeedsByCategory] = useState<
    Record<string, FeedLibraryItem[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedFeeds, setAddedFeeds] = useState<Set<string>>(new Set());
  const { addFeed, removeFeed, feeds } = useRssFeeds();

  // Load library when modal opens
  useEffect(() => {
    if (isOpen) {
      loadLibrary();
    }
  }, [isOpen]);

  // Update added feeds when feeds change
  useEffect(() => {
    const existingUrls = new Set(feeds.map((f) => f.url));
    setAddedFeeds(existingUrls);
  }, [feeds]);

  const loadLibrary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/feeds-library");
      const result = await response.json();
      if (result.success) {
        setFeedsByCategory(result.data);
      }
    } catch (error) {
      console.error("Error loading feed library:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeed = (feed: FeedLibraryItem, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    addFeed(feed.url, feed.title);
    setAddedFeeds((prev) => new Set(prev).add(feed.url));
  };

  const handleRemoveFeed = (feedUrl: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const feedToRemove = feeds.find((f) => f.url === feedUrl);
    if (feedToRemove) {
      removeFeed(feedToRemove.id);
      setAddedFeeds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(feedUrl);
        return newSet;
      });
    }
  };

  const filterFeeds = (feeds: FeedLibraryItem[]) => {
    if (!searchQuery.trim()) return feeds;
    const query = searchQuery.toLowerCase();
    return feeds.filter(
      (feed) =>
        feed.title.toLowerCase().includes(query) ||
        feed.description?.toLowerCase().includes(query) ||
        feed.url.toLowerCase().includes(query)
    );
  };

  const getFilteredCategories = () => {
    if (!searchQuery.trim()) return feedsByCategory;

    const filtered: Record<string, FeedLibraryItem[]> = {};
    Object.entries(feedsByCategory).forEach(([category, feeds]) => {
      const matchingFeeds = filterFeeds(feeds);
      if (matchingFeeds.length > 0) {
        filtered[category] = matchingFeeds;
      }
    });
    return filtered;
  };

  if (!isOpen) return null;

  const filteredCategories = getFilteredCategories();
  const totalFeeds = Object.values(feedsByCategory).reduce(
    (sum, feeds) => sum + feeds.length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className=" overflow-hidden bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col border-2 border-border m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-border">
          <div>
            <h2 className="text-2xl font-bold ">Bibliothèque de flux RSS</h2>
            <p className="text-sm text-primary mt-1">
              {totalFeeds} flux disponibles dans{" "}
              {Object.keys(feedsByCategory).length} catégories
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 cursor-pointer hover:bg-muted rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-6 h-6 text-primary" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b-2 border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un flux..."
              className="w-full pl-10 pr-4 py-3 border-2 border-border rounded-xl focus:border-sage-600 focus:outline-none transition-colors bg-background text-foreground"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-border border-t-sage-600 rounded-full animate-spin"></div>
            </div>
          ) : Object.keys(filteredCategories).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-primary">
              <Search className="w-16 h-16 mb-4 text-accent" />
              <p className="text-lg font-medium">Aucun flux trouvé</p>
              <p className="text-sm">Essayez une autre recherche</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(filteredCategories).map(
                ([categoryName, categoryFeeds]) => (
                  <div key={categoryName} className="space-y-3">
                    {/* Category Header */}
                    <div className="flex items-center gap-2 sticky top-0 bg-background py-2">
                      <span className="text-2xl">
                        {categoryFeeds[0].category_icon}
                      </span>
                      <h3 className="text-lg font-bold text-foreground">{categoryName}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({categoryFeeds.length})
                      </span>
                    </div>

                    {/* Feeds Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryFeeds.map((feed) => {
                        const isAdded = addedFeeds.has(feed.url);
                        return (
                          <div
                            key={feed.id}
                            className="p-4 border-2 border-border rounded-xl hover:border-sage-400 transition-all bg-card hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">
                                  {feed.title}
                                </h4>
                                {feed.description && (
                                  <p className="text-sm text-primary mt-1 line-clamp-2">
                                    {feed.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full">
                                    {feed.language.toUpperCase()}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {isAdded ? (
                                  <>
                                    <button
                                      onClick={(e) =>
                                        handleRemoveFeed(feed.url, e)
                                      }
                                      className="flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap bg-red-500 text-primary-foreground hover:bg-red-600 hover:shadow-md"
                                      title="Supprimer ce flux"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Retirer
                                    </button>
                                    <div className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm bg-green-100 text-green-700">
                                      <Check className="w-4 h-4" />
                                      Ajouté
                                    </div>
                                  </>
                                ) : (
                                  <button
                                    onClick={(e) => handleAddFeed(feed, e)}
                                    className="flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap bg-primary text-primary-foreground hover:bg-sage-700 hover:shadow-md"
                                    title="Ajouter ce flux"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Ajouter
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-border bg-background">
          <div className="flex items-center justify-between">
            <p className="text-sm text-primary">
              {feeds.length} flux dans votre liste
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-sage-700 transition-colors font-semibold"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
