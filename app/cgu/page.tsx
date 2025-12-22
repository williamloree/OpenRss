"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Scale, Shield, User, Globe, Mail } from "lucide-react";

export default function CGUPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-white">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b-2 border-sage-300">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sage-700 hover:text-sage-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Retour à l'accueil</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Title Section */}
        <div className="bg-gradient-to-r from-sage-600 to-sage-700 text-white rounded-2xl p-8 mb-8 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-10 h-10" />
            <h1 className="text-3xl font-bold">Conditions Générales d'Utilisation</h1>
          </div>
          <p className="text-sage-100 text-lg">
            Dernière mise à jour : {new Date().toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <Scale className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">1. Acceptation des conditions</h2>
                <p className="text-sage-700 leading-relaxed">
                  En accédant et en utilisant OpenRss, vous acceptez d'être lié par les présentes Conditions
                  Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser
                  ce service.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <Globe className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">2. Description du service</h2>
                <p className="text-sage-700 leading-relaxed mb-3">
                  OpenRss est un agrégateur de flux RSS gratuit et open source qui permet aux utilisateurs de :
                </p>
                <ul className="list-disc list-inside space-y-2 text-sage-700 ml-4">
                  <li>Consulter et organiser des flux RSS provenant de diverses sources</li>
                  <li>Rechercher des articles par titre, auteur, flux et date</li>
                  <li>Gérer une bibliothèque personnalisée de flux RSS</li>
                  <li>Partager des articles via des webhooks n8n vers Notion, Discord et Mattermost</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <User className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">3. Utilisation du service</h2>
                <p className="text-sage-700 leading-relaxed mb-3">
                  Vous vous engagez à utiliser OpenRss de manière responsable et conforme aux lois applicables.
                  Il est notamment interdit de :
                </p>
                <ul className="list-disc list-inside space-y-2 text-sage-700 ml-4">
                  <li>Utiliser le service à des fins illégales ou non autorisées</li>
                  <li>Tenter de compromettre la sécurité du service</li>
                  <li>Surcharger intentionnellement les serveurs</li>
                  <li>Extraire du contenu de manière automatisée en violation des droits d'auteur</li>
                  <li>Partager des contenus offensants, illégaux ou inappropriés</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">4. Données personnelles et confidentialité</h2>
                <div className="space-y-3 text-sage-700 leading-relaxed">
                  <p>
                    <strong className="text-sage-900">Stockage local :</strong> OpenRss stocke vos préférences
                    et vos flux RSS localement dans votre navigateur (localStorage et IndexedDB). Aucune donnée
                    personnelle n'est transmise à nos serveurs.
                  </p>
                  <p>
                    <strong className="text-sage-900">Webhooks n8n :</strong> Si vous configurez des webhooks
                    n8n pour partager des articles, vous êtes responsable de la sécurité de ces URL et des données
                    qui y transitent.
                  </p>
                  <p>
                    <strong className="text-sage-900">Flux RSS externes :</strong> Lors de la consultation de flux
                    RSS, des requêtes sont effectuées vers les serveurs sources. Ces serveurs peuvent collecter des
                    données selon leurs propres politiques de confidentialité.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">5. Propriété intellectuelle</h2>
                <div className="space-y-3 text-sage-700 leading-relaxed">
                  <p>
                    Le code source d'OpenRss est distribué sous licence open source. Les contenus des flux RSS
                    appartiennent à leurs auteurs et éditeurs respectifs.
                  </p>
                  <p>
                    OpenRss agit uniquement comme un agrégateur et ne revendique aucun droit sur les contenus
                    affichés. Vous devez respecter les droits d'auteur des contenus consultés.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <Scale className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">6. Limitation de responsabilité</h2>
                <div className="space-y-3 text-sage-700 leading-relaxed">
                  <p>
                    OpenRss est fourni "tel quel", sans garantie d'aucune sorte. Nous ne garantissons pas :
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>La disponibilité continue du service</li>
                    <li>L'exactitude ou la fiabilité des contenus des flux RSS</li>
                    <li>L'absence d'erreurs ou de bugs</li>
                    <li>La compatibilité avec tous les navigateurs ou appareils</li>
                  </ul>
                  <p className="mt-3">
                    Nous ne sommes pas responsables des dommages directs ou indirects résultant de l'utilisation
                    ou de l'impossibilité d'utiliser le service.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">7. Modifications du service et des CGU</h2>
                <p className="text-sage-700 leading-relaxed">
                  Nous nous réservons le droit de modifier, suspendre ou interrompre le service à tout moment
                  sans préavis. Les présentes CGU peuvent être mises à jour périodiquement. La date de dernière
                  mise à jour sera indiquée en haut de cette page.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <Globe className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">8. Loi applicable</h2>
                <p className="text-sage-700 leading-relaxed">
                  Les présentes CGU sont régies par le droit français. Tout litige relatif à l'utilisation
                  du service sera soumis à la compétence exclusive des tribunaux français.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section className="bg-white rounded-xl p-6 shadow-lg border-2 border-sage-200">
            <div className="flex items-start gap-3 mb-4">
              <Mail className="w-6 h-6 text-sage-600 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-sage-900 mb-2">9. Contact</h2>
                <p className="text-sage-700 leading-relaxed">
                  Pour toute question concernant ces Conditions Générales d'Utilisation, vous pouvez nous
                  contacter via le dépôt GitHub du projet OpenRss.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-sage-600 text-white rounded-xl font-semibold hover:bg-sage-700 transition-all shadow-md hover:shadow-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
