"use client";

import { useEffect, useState } from "react";

interface GitHubStarsData {
  stars: number;
  url: string;
  error?: string;
}

export default function GitHubStarButton() {
  const [data, setData] = useState<GitHubStarsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStars() {
      try {
        const response = await fetch("/api/github/stars");
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("[GitHubStarButton] Error fetching stars:", error);
        setData({
          stars: 0,
          url: "https://github.com/williamloree/OpenRss",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStars();
  }, []);

  if (isLoading) {
    return null;
  }

  const formatStars = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <a
      href={data?.url || "https://github.com/williamloree/OpenRss"}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-gray-800 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 text-sm font-medium"
      title="Star on GitHub"
    >
      <span className="text-lg" aria-label="Star">
        ⭐
      </span>
      <span className="hidden sm:inline">Star on GitHub</span>
      {data && data.stars > 0 && (
        <span className="bg-gray-800 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs font-bold">
          {formatStars(data.stars)}
        </span>
      )}
    </a>
  );
}
