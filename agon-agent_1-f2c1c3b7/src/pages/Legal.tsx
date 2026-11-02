import { Link } from 'react-router-dom'
import { Music2 } from 'lucide-react'

export default function Legal() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-accent">
              <Music2 className="h-5 w-5" />
            </span>
            <span className="font-display text-xl leading-none text-ink">Cadence</span>
          </Link>
          <Link to="/" className="text-[13px] font-medium text-ink/55 hover:text-ink">
            Retour à la démo
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="font-display text-[38px] leading-tight text-ink">Informations légales</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink/60">
          Cadence est une démonstration de produit. Cette page décrit les règles applicables
          aux prestations de la plateforme.
        </p>

        <section id="mentions" className="mt-9">
          <h2 className="font-display text-[24px] text-ink">Mentions légales</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            Éditeur : Cadence SAS, capital social de 50 000 €, immatriculée au RCS de Bordeaux
            sous le numéro 000 000 000, dont le siège social est situé 12 quai des Chartrons,
            33000 Bordeaux. Directrice de la publication : Léa Fontaine. Contact :
            contact@cadence-demo.fr.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
            Hébergement : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis.
          </p>
        </section>

        <section id="confidentialite" className="mt-9">
          <h2 className="font-display text-[24px] text-ink">Confidentialité & cloisonnement</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            Les données saisies par un client (identité, coordonnées, date demandée, options)
            sont destinées au seul prestataire ayant généré le lien de réservation. Elles ne
            sont ni revendues, ni partagées, ni consultables par un autre prestataire de la
            plateforme.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
            Les données financières (acompte, référence de règlement) sont enregistrées dans un
            espace propre à chaque instance. Un acompte encaissé par un prestataire ne peut pas
            être déplacé, réutilisé ou encaissé sur une autre instance. Toute tentative d’accès
            croisé est refusée au niveau de la couche de données.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
            Durée de conservation : 3 ans à compter du dernier contact pour les demandes non
            confirmées, 10 ans à compter de l’exécution de la prestation pour les dossiers
            confirmés. Chaque prestataire dispose d’un droit d’accès, de rectification et de
            suppression sur les données de ses propres dossiers.
          </p>
        </section>

        <section id="paiement" className="mt-9">
          <h2 className="font-display text-[24px] text-ink">Paiement de l’acompte</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            L’acompte correspond au pourcentage défini par le prestataire (30 % par défaut). Il
            est dû uniquement après confirmation de la date par le prestataire, et versé sur le
            lien de réservation personnel du client.
          </p>
          <p className="mt-3 text-[14px] leading-relaxed text-ink/65">
            Prestataire de services de paiement : l’encours est assuré par l’instance de
            paiement du prestataire concerné. Cadence n’est pas partie au contrat de paiement et
            n’encaisse aucun fonds. En cas d’annulation après confirmation, les conditions
            d’annulation du prestataire s’appliquent et sont communiquées au client avant le
            règlement.
          </p>
          <p className="mt-3 rounded-xl bg-accent/8 px-4 py-3 text-[13px] leading-relaxed text-ink/60">
            Cette instance est une démonstration : aucun paiement réel n’est effectué et aucune
            donnée bancaire n’est transmise ni conservée. Les données de la démo restent dans
            votre navigateur.
          </p>
        </section>

        <section className="mt-9">
          <h2 className="font-display text-[24px] text-ink">Médiation</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-ink/65">
            Conformément à l’article L.616-1 du Code de la consommation, tout consommateur a le
            droit de recourir gratuitement à un médiateur en vue de la résolution amiable d’un
            litige. Contact : mediation@cadence-demo.fr.
          </p>
        </section>
      </main>
    </div>
  )
}
