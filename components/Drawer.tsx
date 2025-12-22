"use client";

import { useState } from "react";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { X, Rss, Trash2, Plus, ExternalLink } from "lucide-react";
import { useRssFeeds, RssFeed } from "@/hooks/useRssFeeds";

interface RssFeedsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFeed: (url: string) => void;
}

export default function RssFeedsDrawer({
  isOpen,
  onClose,
  onSelectFeed,
}: RssFeedsDrawerProps) {
  const { feeds, addFeed, removeFeed, clearAllFeeds } = useRssFeeds();
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [newFeedTitle, setNewFeedTitle] = useState("");

  const handleAddFeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFeedUrl.trim()) {
      addFeed(newFeedUrl.trim(), newFeedTitle.trim() || undefined);
      setNewFeedUrl("");
      setNewFeedTitle("");
    }
  };

  const handleSelectFeed = (feed: RssFeed) => {
    onSelectFeed(feed.url);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Transition show={isOpen}>
      <Dialog className="relative z-50" onClose={onClose}>
        <TransitionChild
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <TransitionChild
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <DialogPanel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-auto bg-white shadow-xl">
                    {/* Header */}
                    <div className="bg-linear-to-r from-sage-600 to-sage-700 px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                          <Rss className="w-6 h-6" />
                          Mes flux RSS
                        </DialogTitle>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="rounded-md text-white/80 hover:text-white transition-colors"
                            onClick={onClose}
                          >
                            <span className="sr-only">Fermer le panneau</span>
                            <X className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-white/80">
                        {feeds.length} flux sauvegardé{feeds.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* Add Feed Form */}
                    <div className="border-b border-sage-200 bg-sage-50 px-4 py-4 sm:px-6">
                      <form onSubmit={handleAddFeed} className="space-y-3">
                        <div>
                          <label
                            htmlFor="feed-url"
                            className="block text-sm font-medium text-sage-900 mb-1"
                          >
                            URL du flux RSS
                          </label>
                          <input
                            type="url"
                            id="feed-url"
                            value={newFeedUrl}
                            onChange={(e) => setNewFeedUrl(e.target.value)}
                            placeholder="https://example.com/feed.xml"
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-600 text-sm bg-white text-sage-900"
                            required
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="feed-title"
                            className="block text-sm font-medium text-sage-900 mb-1"
                          >
                            Nom (optionnel)
                          </label>
                          <input
                            type="text"
                            id="feed-title"
                            value={newFeedTitle}
                            onChange={(e) => setNewFeedTitle(e.target.value)}
                            placeholder="Mon blog préféré"
                            className="w-full px-3 py-2 border border-sage-300 rounded-lg focus:ring-2 focus:ring-sage-500 focus:border-sage-600 text-sm bg-white text-sage-900"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-all font-medium shadow-md hover:shadow-lg"
                        >
                          <Plus className="w-4 h-4" />
                          Ajouter le flux
                        </button>
                      </form>
                    </div>

                    {/* Feeds List */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
                      {feeds.length === 0 ? (
                        <div className="text-center py-12">
                          <Rss className="w-12 h-12 mx-auto text-sage-300 mb-3" />
                          <p className="text-sage-700 text-sm">
                            Aucun flux RSS sauvegardé
                          </p>
                          <p className="text-sage-500 text-xs mt-1">
                            Ajoutez vos flux préférés ci-dessus
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {feeds.map((feed) => (
                            <div
                              key={feed.id}
                              className="group relative bg-white border-2 border-sage-200 rounded-lg p-4 hover:shadow-md hover:border-sage-500 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <button
                                  onClick={() => handleSelectFeed(feed)}
                                  className="flex-1 text-left"
                                >
                                  <h3 className="font-semibold text-sage-900 group-hover:text-sage-600 transition-colors line-clamp-2">
                                    {feed.title}
                                  </h3>
                                  <p className="text-xs text-sage-600 mt-1 flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    <span className="truncate">{feed.url}</span>
                                  </p>
                                  <p className="text-xs text-sage-500 mt-2">
                                    Ajouté le {formatDate(feed.addedAt)}
                                  </p>
                                </button>
                                <button
                                  onClick={() => removeFeed(feed.id)}
                                  className="shrink-0 p-2 text-sage-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Supprimer ce flux"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    {feeds.length > 0 && (
                      <div className="border-t border-sage-200 px-4 py-4 sm:px-6 bg-sage-50">
                        <button
                          onClick={clearAllFeeds}
                          className="w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border-2 border-red-200 hover:border-red-400"
                        >
                          Supprimer tous les flux
                        </button>
                      </div>
                    )}
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
