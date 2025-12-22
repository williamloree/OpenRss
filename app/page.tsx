"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { Article } from "@/@types/Article";
import { checkIsUrl } from "@/utils/string";
import { useRssFeeds } from "@/hooks/useRssFeeds";
import { useSettings } from "@/hooks/useSettings";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

import Header from "@/components/Header";
import Card from "@/components/Card";
import Squares from "@/components/Squares";

export default function Page() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedFeedInfo, setLoadedFeedInfo] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const { addFeed, feeds } = useRssFeeds();
  const { settings } = useSettings();

  // Debug: log feeds when they change
  useEffect(() => {
    console.log("[Page] feeds changed:", feeds.length, "feeds", feeds);
  }, [feeds]);

  const getRssData = useCallback(
    async (url: string) => {
      try {
        if (!url) return;
        setIsLoading(true);
        const res = await fetch(`/api/rss/parse?url=${url}`);
        const data = await res.json();

        if (data.items && data.items.length > 0) {
          setArticles(data.items);
          setAllArticles(data.items);
          setLoadedFeedInfo(data.feed?.title || url);
          if (data.feed?.title) {
            addFeed(url, data.feed.title);
          }
        }
      } catch (error: unknown) {
        console.log("🚀 ~ getRssData ~ error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [addFeed]
  );

  const loadSavedFeeds = useCallback(async () => {
    console.log("[loadSavedFeeds] Called with feeds:", feeds.length, "feeds");

    if (feeds.length === 0) {
      console.log("[loadSavedFeeds] No feeds found, showing empty state");
      setArticles([]);
      setAllArticles([]);
      setLoadedFeedInfo("");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const feedUrls = feeds.map((feed) => feed.url);
      const res = await fetch("/api/rss/parse-multiple", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: feedUrls }),
      });

      const data = await res.json();

      if (data.items && data.items.length > 0) {
        setArticles(data.items);
        setAllArticles(data.items);
        // Set feed info based on number of feeds loaded
        if (feeds.length === 1) {
          setLoadedFeedInfo(feeds[0].title || feeds[0].url);
        } else {
          setLoadedFeedInfo(`${feeds.length} flux RSS`);
        }
      } else {
        setArticles([]);
        setAllArticles([]);
        setLoadedFeedInfo("");
      }
    } catch (error) {
      console.log("🚀 ~ loadSavedFeeds ~ error:", error);
      setArticles([]);
      setAllArticles([]);
      setLoadedFeedInfo("");
    } finally {
      setIsLoading(false);
    }
  }, [feeds]);

  const checkQueryUrl = useCallback(
    (query: string) => {
      setCurrentPage(1); // Reset to first page on search

      if (!query.trim()) {
        setArticles(allArticles);
        return;
      }

      if (checkIsUrl(query)) {
        getRssData(query);
      } else {
        const filtered = allArticles.filter((article) =>
          article.title.toLowerCase().includes(query.toLowerCase())
        );
        setArticles(filtered);
      }
    },
    [getRssData, allArticles]
  );

  // Pagination logic
  const articlesPerPage = settings.articlesPerPage;
  const totalPages = Math.ceil(articles.length / articlesPerPage);

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * articlesPerPage;
    const endIndex = startIndex + articlesPerPage;
    return articles.slice(startIndex, endIndex);
  }, [articles, currentPage, articlesPerPage]);

  // Reset to page 1 when articles change
  useEffect(() => {
    setCurrentPage(1);
  }, [articles.length]);

  // Refresh AOS when page changes
  useEffect(() => {
    AOS.refresh();
  }, [currentPage]);

  useEffect(() => {
    loadSavedFeeds();
  }, [loadSavedFeeds]);

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 800,
      easing: "ease-in-out",
      once: true,
      mirror: false,
    });
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Squares Background */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-white">
        <Squares
          direction="diagonal"
          speed={0.5}
          borderColor="#e5e5e5"
          squareSize={64}
          hoverFillColor="rgba(198, 246, 213, 0.3)"
        />
      </div>

      <Header onSearch={checkQueryUrl} />
      <main className="container mx-auto px-4 pb-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-sage-900 text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-sage-200">
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-sage-300 border-t-sage-600 rounded-full animate-spin"></div>
              <h2 className="text-2xl font-bold mb-2">Chargement des articles...</h2>
              <p className="text-sage-700">
                {feeds.length > 0
                  ? `Récupération de ${feeds.length} flux RSS`
                  : "Chargement en cours"}
              </p>
            </div>
          </div>
        ) : articles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-sage-900 text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-sage-200">
              <svg
                className="w-24 h-24 mx-auto mb-6 text-sage-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <h2 className="text-2xl font-bold mb-2">Aucun article à afficher</h2>
              <p className="text-sage-700 mb-4">
                Recherchez un article ou entrez une URL de flux RSS
              </p>
              <button
                onClick={() => {
                  const drawer = document.querySelector('[title="Mes flux RSS"]');
                  if (drawer instanceof HTMLElement) drawer.click();
                }}
                className="mt-4 px-6 py-3 bg-sage-600 text-white rounded-lg font-semibold hover:bg-sage-700 transition-all shadow-md hover:shadow-lg"
              >
                Gérer mes flux RSS
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 text-sage-900 text-center bg-white/60 backdrop-blur-sm rounded-xl p-4 shadow-md border border-sage-200">
              <p className="text-sm font-medium">
                {articles.length} article{articles.length > 1 ? "s" : ""} chargé
                {articles.length > 1 ? "s" : ""}
                {loadedFeedInfo && ` depuis ${loadedFeedInfo}`}
                {totalPages > 1 && ` • Page ${currentPage} sur ${totalPages}`}
              </p>
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {paginatedArticles.map((article, index) => (
                <div
                  key={article.guid}
                  data-aos="fade-up"
                  data-aos-delay={index * 50}
                >
                  <Card article={article} />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-sage-300 text-sage-700 rounded-lg hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  title="Page précédente"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="hidden sm:inline">Précédent</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show first page, last page, current page, and pages around current
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, arr) => (
                      <div key={page} className="flex items-center gap-2">
                        {/* Add ellipsis if there's a gap */}
                        {idx > 0 && page - arr[idx - 1] > 1 && (
                          <span className="text-sage-500">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-all shadow-md ${
                            currentPage === page
                              ? "bg-sage-600 text-white"
                              : "bg-white border-2 border-sage-300 text-sage-700 hover:bg-sage-50"
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-sage-300 text-sage-700 rounded-lg hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                  title="Page suivante"
                >
                  <span className="hidden sm:inline">Suivant</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
