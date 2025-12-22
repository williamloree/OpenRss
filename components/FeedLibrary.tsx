"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Search } from "lucide-react";
import { useRssFeeds } from "@/hooks/useRssFeeds";
import { FeedLibraryItem } from "@/lib/db";

interface FeedLibraryProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedLibrary({ isOpen, onClose }: FeedLibraryProps) {
  const [feedsByCategory, setFeedsByCategory] = useState<Record<string, FeedLibraryItem[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [addedFeeds, setAddedFeeds] = useState<Set<string>>(new Set());
  const { addFeed, feeds } = useRssFeeds();

  useEffect(() => {
    if (isOpen) {
      loadLibrary();
      // Mark already added feeds
      const existingUrls = new Set(feeds.map(f => f.url));
      setAddedFeeds(existingUrls);
    }
  }, [isOpen, feeds]);

  const loadLibrary = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/feeds-library');
      const result = await response.json();
      if (result.success) {
        setFeedsByCategory(result.data);
      }
    } catch (error) {
      console.error('Error loading feed library:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFeed = (feed: FeedLibraryItem) => {
    addFeed(feed.url, feed.title);
    setAddedFeeds(prev => new Set(prev).add(feed.url));
  };

  const filterFeeds = (feeds: FeedLibraryItem[]) => {
    if (!searchQuery.trim()) return feeds;
    const query = searchQuery.toLowerCase();
    return feeds.filter(feed =>
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
  const totalFeeds = Object.values(feedsByCategory).reduce((sum, feeds) => sum + feeds.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col border-2 border-sage-300 m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-sage-200">
          <div>
            <h2 className="text-2xl font-bold text-sage-900">Bibliothèque de flux RSS</h2>
            <p className="text-sm text-sage-600 mt-1">
              {totalFeeds} flux disponibles dans {Object.keys(feedsByCategory).length} catégories
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-sage-100 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-6 h-6 text-sage-700" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-sage-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-sage-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un flux..."
              className="w-full pl-10 pr-4 py-3 border-2 border-sage-300 rounded-xl focus:border-sage-600 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-sage-300 border-t-sage-600 rounded-full animate-spin"></div>
            </div>
          ) : Object.keys(filteredCategories).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-sage-600">
              <Search className="w-16 h-16 mb-4 text-sage-400" />
              <p className="text-lg font-medium">Aucun flux trouvé</p>
              <p className="text-sm">Essayez une autre recherche</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(filteredCategories).map(([categoryName, categoryFeeds]) => (
                <div key={categoryName} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center gap-2 sticky top-0 bg-white py-2">
                    <span className="text-2xl">{categoryFeeds[0].category_icon}</span>
                    <h3 className="text-lg font-bold text-sage-900">{categoryName}</h3>
                    <span className="text-sm text-sage-500">({categoryFeeds.length})</span>
                  </div>

                  {/* Feeds Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categoryFeeds.map((feed) => {
                      const isAdded = addedFeeds.has(feed.url);
                      return (
                        <div
                          key={feed.id}
                          className="p-4 border-2 border-sage-200 rounded-xl hover:border-sage-400 transition-all bg-white hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sage-900 truncate">
                                {feed.title}
                              </h4>
                              {feed.description && (
                                <p className="text-sm text-sage-600 mt-1 line-clamp-2">
                                  {feed.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-1 bg-sage-100 text-sage-700 rounded-full">
                                  {feed.language.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => !isAdded && handleAddFeed(feed)}
                              disabled={isAdded}
                              className={`flex items-center gap-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                                isAdded
                                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                  : 'bg-sage-600 text-white hover:bg-sage-700 hover:shadow-md'
                              }`}
                              title={isAdded ? 'Déjà ajouté' : 'Ajouter ce flux'}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Ajouté
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  Ajouter
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-sage-200 bg-sage-50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-sage-600">
              {feeds.length} flux dans votre liste
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors font-semibold"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
