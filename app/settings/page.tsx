"use client";

import { useState, useEffect, useRef } from "react";
import { useSettings } from "@/hooks/useSettings";
import { useRssFeeds } from "@/hooks/useRssFeeds";
import { ArrowLeft, Save, RefreshCw, Trash2, Webhook, List, Download, Upload } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { feeds, clearAllFeeds, exportFeeds, importFeeds } = useRssFeeds();

  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(settings.n8nWebhookUrl);
  const [autoSendToN8n, setAutoSendToN8n] = useState(settings.autoSendToN8n);
  const [articlesPerPage, setArticlesPerPage] = useState(settings.articlesPerPage);
  const [showNotionButton, setShowNotionButton] = useState(settings.showNotionButton);
  const [showDiscordButton, setShowDiscordButton] = useState(settings.showDiscordButton);
  const [showMattermostButton, setShowMattermostButton] = useState(settings.showMattermostButton);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setN8nWebhookUrl(settings.n8nWebhookUrl);
    setAutoSendToN8n(settings.autoSendToN8n);
    setArticlesPerPage(settings.articlesPerPage);
    setShowNotionButton(settings.showNotionButton);
    setShowDiscordButton(settings.showDiscordButton);
    setShowMattermostButton(settings.showMattermostButton);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      n8nWebhookUrl,
      autoSendToN8n,
      articlesPerPage,
      showNotionButton,
      showDiscordButton,
      showMattermostButton,
    });
    toast.success("Paramètres sauvegardés avec succès !")
  };

  const handleReset = () => {
    resetSettings();
    toast.success("Paramètres sauvegardés avec succès !")
  };

  const handleClearFeeds = () => {
    clearAllFeeds();
    setShowClearConfirm(false);
  };

  const testWebhook = async () => {
    if (!n8nWebhookUrl) {
      alert("Veuillez entrer une URL de webhook d'abord");
      return;
    }

    try {
      const response = await fetch("/api/n8n/send-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          article: {
            title: "Test de webhook Dechno",
            link: "https://dechno.app/test",
            author: "Dechno App",
            pubDate: new Date().toISOString(),
            content: { summary: "Ceci est un message de test pour vérifier que votre webhook n8n fonctionne correctement." },
            attachements: {},
            enclosure: {},
            guid: `test-${Date.now()}`,
          },
          webhookUrl: n8nWebhookUrl,
        }),
      });

      if (response.ok) {
        alert("✅ Test réussi ! Vérifiez Notion et Discord.");
      } else {
        alert("❌ Échec du test. Vérifiez l'URL du webhook.");
      }
    } catch (error) {
      alert("❌ Erreur lors du test : " + error);
    }
  };

  const handleExportFeeds = () => {
    exportFeeds();
  };

  const handleImportFeeds = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFeeds(file);
    setImportMessage({
      type: result.success ? 'success' : 'error',
      text: result.message
    });

    setTimeout(() => setImportMessage(null), 5000);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-sage-50 via-white to-sage-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg mb-8 sticky top-0 z-40 border-b-2 border-sage-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 hover:bg-sage-100 rounded-lg transition-colors"
              title="Retour"
            >
              <ArrowLeft className="w-6 h-6 text-sage-700" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-sage-900">Paramètres</h1>
              <p className="text-sm text-sage-600">Configurez votre application</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-12 max-w-4xl">

        {/* n8n Webhook Section */}
        <section className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-sage-200">
          <div className="flex items-center gap-3 mb-4">
            <Webhook className="w-6 h-6 text-sage-700" />
            <h2 className="text-xl font-bold text-sage-900">Webhook n8n</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-sage-700 mb-2">
                URL du Webhook n8n
              </label>
              <input
                type="url"
                value={n8nWebhookUrl}
                onChange={(e) => setN8nWebhookUrl(e.target.value)}
                placeholder="https://n8n.example.com/webhook/your-webhook-id"
                className="w-full px-4 py-3 border-2 border-sage-300 rounded-xl focus:border-sage-600 focus:outline-none transition-colors"
              />
              <p className="mt-2 text-sm text-sage-600">
                L&apos;URL du webhook n8n pour envoyer les articles vers Notion et Discord
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="autoSend"
                checked={autoSendToN8n}
                onChange={(e) => setAutoSendToN8n(e.target.checked)}
                className="w-5 h-5 text-sage-600 border-2 border-sage-300 rounded focus:ring-sage-500"
              />
              <label htmlFor="autoSend" className="text-sm font-medium text-sage-700">
                Envoyer automatiquement tous les nouveaux articles vers n8n
              </label>
            </div>

            <button
              onClick={testWebhook}
              className="px-4 py-2 bg-sage-100 text-sage-700 rounded-lg hover:bg-sage-200 transition-colors font-semibold"
            >
              Tester le webhook
            </button>
          </div>
        </section>

        {/* Display Settings */}
        <section className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-sage-200">
          <div className="flex items-center gap-3 mb-4">
            <List className="w-6 h-6 text-sage-700" />
            <h2 className="text-xl font-bold text-sage-900">Affichage</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-sage-700 mb-2">
                Articles par page
              </label>
              <select
                value={articlesPerPage}
                onChange={(e) => setArticlesPerPage(Number(e.target.value))}
                className="w-full px-4 py-3 border-2 border-sage-300 rounded-xl focus:border-sage-600 focus:outline-none transition-colors"
              >
                <option value={10}>10 articles</option>
                <option value={20}>20 articles</option>
                <option value={50}>50 articles</option>
                <option value={100}>100 articles</option>
              </select>
            </div>

            <div className="pt-4 border-t border-sage-200">
              <label className="block text-sm font-semibold text-sage-700 mb-3">
                Boutons d&apos;action sur les cartes
              </label>
              <div className="space-y-3">
                {/* Notion Toggle */}
                <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-sage-700">Bouton Notion</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showNotionButton}
                      onChange={(e) => setShowNotionButton(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sage-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top--0.5 after:left--0.5 after:bg-white after:border-sage-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sage-600"></div>
                  </label>
                </div>

                {/* Discord Toggle */}
                <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-sage-700">Bouton Discord</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showDiscordButton}
                      onChange={(e) => setShowDiscordButton(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sage-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top--0.5 after:left--0.5 after:bg-white after:border-sage-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Mattermost Toggle */}
                <div className="flex items-center justify-between p-3 bg-sage-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-sage-700">Bouton Mattermost</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showMattermostButton}
                      onChange={(e) => setShowMattermostButton(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-sage-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sage-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top--0.5 after:left--0.5 after:bg-white after:border-sage-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              <p className="mt-3 text-xs text-sage-600">
                Contrôlez quels boutons d&apos;envoi apparaissent sur les cartes d&apos;articles
              </p>
            </div>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-sage-200">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-sage-700" />
            <h2 className="text-xl font-bold text-sage-900">Gestion des données</h2>
          </div>

          <div className="space-y-4">
            {/* Import/Export Section */}
            <div className="p-4 bg-sage-50 rounded-lg border border-sage-200">
              <p className="text-sm font-semibold text-sage-700 mb-3">
                Import/Export des flux RSS
              </p>
              <p className="text-xs text-sage-600 mb-3">
                Sauvegardez vos flux RSS ou importez-les depuis un fichier JSON
              </p>

              {importMessage && (
                <div className={`mb-3 p-3 rounded-lg ${
                  importMessage.type === 'success'
                    ? 'bg-green-100 border border-green-500 text-green-800'
                    : 'bg-red-100 border border-red-500 text-red-800'
                }`}>
                  <p className="text-sm font-medium">{importMessage.text}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleExportFeeds}
                  disabled={feeds.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 disabled:bg-sage-300 disabled:cursor-not-allowed transition-colors font-semibold"
                >
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
                <button
                  onClick={triggerFileInput}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Upload className="w-4 h-4" />
                  Importer
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportFeeds}
                  className="hidden"
                />
              </div>
            </div>

            <div className="p-4 bg-sage-50 rounded-lg border border-sage-200">
              <p className="text-sm text-sage-700 mb-3">
                <strong>{feeds.length}</strong> flux RSS enregistrés
              </p>
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                >
                  Supprimer tous les flux
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-red-700">
                    Êtes-vous sûr ? Cette action est irréversible.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearFeeds}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-4 py-2 bg-sage-200 text-sage-700 rounded-lg hover:bg-sage-300 transition-colors font-semibold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-sage-50 rounded-lg border border-sage-200">
              <p className="text-sm text-sage-700 mb-3">
                Réinitialiser tous les paramètres aux valeurs par défaut
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-sage-600 text-white rounded-lg hover:bg-sage-700 transition-colors font-semibold flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-sage-200 text-sage-700 rounded-xl hover:bg-sage-300 transition-colors font-semibold"
          >
            Annuler
          </Link>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-sage-600 text-white rounded-xl hover:bg-sage-700 transition-all shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Enregistrer
          </button>
        </div>
      </main>
    </div>
  );
}
