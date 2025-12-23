"use client";

import Link from "next/link";
import { FileText, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background backdrop-blur-sm border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="flex items-center gap-2 text-sm text-primary">
            <span>© {currentYear} OpenRss</span>
            <span className="hidden md:inline">•</span>
            <span className="flex items-center gap-1">
              Fait avec <Heart className="w-4 h-4 text-red-500 fill-red-500" />{" "}
              pour la communauté
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            <Link
              href="/cgu"
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/70 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              <span>Conditions Générales d'Utilisation</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
