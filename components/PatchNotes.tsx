"use client";

import { X, Sparkles, Wrench, Bug, AlertTriangle } from "lucide-react";
import { patchNotes } from "@/lib/patch-notes";

interface PatchNotesProps {
  isOpen: boolean;
  onClose: () => void;
  isNewVersion?: boolean;
}

const changeTypeConfig = {
  new: {
    icon: Sparkles,
    label: "Nouveau",
    color: "text-badge-new-text",
    bgColor: "bg-badge-new-bg",
    borderColor: "border-badge-new-border",
  },
  improvement: {
    icon: Wrench,
    label: "Amélioration",
    color: "text-badge-improvement-text",
    bgColor: "bg-badge-improvement-bg",
    borderColor: "border-badge-improvement-border",
  },
  fix: {
    icon: Bug,
    label: "Correction",
    color: "text-badge-fix-text",
    bgColor: "bg-badge-fix-bg",
    borderColor: "border-badge-fix-border",
  },
  breaking: {
    icon: AlertTriangle,
    label: "Breaking Change",
    color: "text-badge-breaking-text",
    bgColor: "bg-badge-breaking-bg",
    borderColor: "border-badge-breaking-border",
  },
};

export default function PatchNotes({
  isOpen,
  onClose,
  isNewVersion = false,
}: PatchNotesProps) {
  if (!isOpen) return null;

  const latestPatchNote = patchNotes[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-primary text-primary-foreground p-6 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              {isNewVersion && (
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-3">
                  <Sparkles className="w-4 h-4" />
                  Nouvelle version disponible !
                </div>
              )}
              <h2 className="text-2xl font-bold mb-1">Notes de version</h2>
              <p className="text-sm opacity-90">
                Version {latestPatchNote.version} •{" "}
                {new Date(latestPatchNote.date).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {patchNotes.map((note, noteIndex) => (
            <div
              key={note.version}
              className={`p-6 ${noteIndex > 0 ? "border-t border-border" : ""}`}
            >
              {noteIndex > 0 && (
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1 text-foreground">
                    Version {note.version}
                  </h3>
                  <p className="text-sm text-primary">
                    {new Date(note.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {note.changes.map((change, changeIndex) => {
                  const config = changeTypeConfig[change.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={changeIndex}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${config.bgColor} ${config.borderColor}`}
                    >
                      <div className={`shrink-0 mt-0.5 ${config.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div
                          className={`text-xs font-semibold mb-1 ${config.color}`}
                        >
                          {config.label}
                        </div>
                        <p className="text-sm text-foreground leading-relaxed">
                          {change.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 flex justify-between items-center">
          <p className="text-sm text-primary">
            Merci d&apos;utiliser OpenRss ! 🎉
          </p>
          <button
            onClick={onClose}
            className="px-6 cursor-pointer py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-sage-700 transition-all shadow-md hover:shadow-lg"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
