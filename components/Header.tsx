"use client";

import React, { useState } from "react";
import { Bookmark, Settings, Library, FileText } from "lucide-react";
import Link from "next/link";
import Drawer from "./Drawer";
import FeedLibrary from "./FeedLibrary";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onSearch: (query: string) => void;
  articleCount?: number;
  loadedFeedInfo?: string;
  currentPage?: number;
  totalPages?: number;
  onOpenPatchNotes?: () => void;
}

const Header = React.memo(
  ({
    onSearch,
    articleCount,
    loadedFeedInfo,
    currentPage,
    totalPages,
    onOpenPatchNotes,
  }: HeaderProps) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);

    const handleSelectFeed = (url: string) => {
      onSearch(url);
    };

    return (
      <>
        <header className="bg-background backdrop-blur-sm shadow-lg mb-8 sticky top-0 z-40 border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo Section */}
              <div className="flex items-center gap-3">
                <div className="hidden md:block">
                  <h1 className="text-xl font-bold text-foreground">OpenRss</h1>
                  <p className="text-xs text-primary">Agrégateur RSS</p>
                </div>
              </div>

              {/* Search Section */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    id="search"
                    type="text"
                    onChange={(e) => onSearch(e.target.value)}
                    className="w-full px-4 py-3 pl-12 rounded-xl border border-border focus:border-primary focus:outline-none transition-colors text-foreground placeholder-accent-foreground bg-card"
                    placeholder="Rechercher par titre, auteur, flux, date ou entrer une URL RSS..."
                  />
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Stats Info */}
              {articleCount !== undefined && articleCount > 0 && (
                <div className="hidden lg:block text-sm text-foreground font-medium bg-card px-4 py-3 rounded-xl border border-border">
                  {articleCount} article{articleCount > 1 ? "s" : ""}
                  {loadedFeedInfo && ` • ${loadedFeedInfo}`}
                  {totalPages &&
                    totalPages > 1 &&
                    ` • Page ${currentPage} / ${totalPages}`}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <ThemeToggle />
                {onOpenPatchNotes && (
                  <button
                    onClick={onOpenPatchNotes}
                    className="p-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-all shadow-md hover:shadow-lg"
                    title="Notes de version"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="p-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all shadow-md hover:shadow-lg"
                  title="Bibliothèque de flux"
                >
                  <Library className="w-5 h-5" />
                </button>
                <Link
                  href="/settings"
                  className="p-3 bg-sage-100 text-sage-700 rounded-xl hover:bg-sage-200 transition-all shadow-md hover:shadow-lg"
                  title="Paramètres"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-sage-700 transition-all shadow-md hover:shadow-lg"
                  title="Mes flux RSS"
                >
                  <Bookmark className="w-5 h-5" />
                  <span className="hidden sm:inline font-medium">Mes flux</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onSelectFeed={handleSelectFeed}
        />

        <FeedLibrary
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
        />
      </>
    );
  }
);

Header.displayName = "Header";

export default Header;
