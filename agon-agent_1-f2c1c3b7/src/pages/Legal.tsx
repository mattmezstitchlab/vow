import { Link } from 'react-router-dom'
import { Brand } from '../components/Brand'
import { DemoNotice } from '../components/DemoNotice'

export default function Legal() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Brand />
          <Link to="/" className="text-[13px] font-medium text-ink/55 hover:text-ink">
            Retour à la démo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="display-section text-ink">Informations légales & confidentialité</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink/60">
          Noria est ici une démonstration de produit, pas un service de réservation ou de paiement en production.
        </p>
        <DemoNotice className="mt-5">
          Aucun paiement réel, aucun e-mail envoyé, aucune donnée bancaire collectée. Les données de la démo
          restent dans le stockage local de votre navigateur.
        </DemoNotice>

        <section id="mentions" className="mt-12 rounded-3xl bg-white p-6 soft-shadow">
          <h2 className="text-[22px] font-medium tracking-[-0.04em] text-ink">Éditeur de la démonstration</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            Ce prototype est présenté à titre d’exemple. Les prestataires, avis, coordonnées et références
            de paiement affichés sont fictifs. Aucune société réelle n’est identifiée comme éditrice tant
            que le projet n’est pas déployé en production avec ses mentions légales complètes.
          </p>
        </section>

        <section id="confidentialite" className="mt-12 rounded-3xl bg-white p-6 soft-shadow">
          <h2 className="text-[22px] font-medium tracking-[-0.04em] text-ink">Données et cloisonnement</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            Les informations saisies (identité, coordonnées, date, options) sont enregistrées dans le
            navigateur, dans une clé de stockage propre à chaque instance de prestataire. Le back-office
            d’un prestataire ne liste que ses propres dossiers. Le Studio de démonstration affiche une
            vue d’ensemble séparée, uniquement sur ce navigateur.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
            Ce cloisonnement est applicatif, pas une garantie de sécurité serveur : toute personne ayant
            accès au navigateur ou aux outils de développement peut lire le stockage local. N’utilisez
            pas de données sensibles réelles dans cette démo. Vous pouvez effacer les données via
            « Réinitialiser » dans le Studio ou en vidant le stockage du site.
          </p>
        </section>

        <section id="paiement" className="mt-12 rounded-3xl bg-white p-6 soft-shadow">
          <h2 className="text-[22px] font-medium tracking-[-0.04em] text-ink">Acompte et paiement</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            L’acompte correspond au pourcentage défini par le prestataire (30 % par défaut). Il n’est
            payable qu’après confirmation de la date. Dans la démo, le paiement est simulé : aucun débit,
            aucun remboursement, aucun transfert bancaire n’a lieu.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
            Règle produit : pas de panier commun ni de partage d’acompte entre prestataires. Chaque
            règlement est rattaché à une seule instance. En production, le paiement devra être encaissé
            directement par le prestataire concerné (par exemple via son propre compte de paiement),
            sans que Noria ne détienne ou ne redistribue les fonds.
          </p>
        </section>

        <section className="mt-12 rounded-3xl bg-white p-6 soft-shadow">
          <h2 className="text-[22px] font-medium tracking-[-0.04em] text-ink">Avant une mise en production</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-ink/65">
            <li>Backend avec authentification prestataire et autorisations serveur par instance.</li>
            <li>Paiement réel connecté au compte de chaque prestataire, webhooks signés et idempotents.</li>
            <li>Envoi d’e-mails transactionnels (demande, confirmation, reçu d’acompte).</li>
            <li>Mentions légales, CGV/CGU, politique de confidentialité et médiation de la consommation renseignées.</li>
            <li>Conditions d’annulation et de remboursement propres à chaque prestataire, acceptées avant paiement.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
