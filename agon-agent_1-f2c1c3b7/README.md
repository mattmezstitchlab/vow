# Cadence — démo de réservation pour prestataires de mariage

Application web **mobile-first** de démonstration : un lien public par prestataire, des formules,
des options, une date proposée, une confirmation prestataire et un acompte **simulé**.
Le design existant est conservé : fond crème, vert profond, accent doré, typographie éditoriale.

> Démo prête à présenter à cinq prestataires. Aucun paiement réel, aucun e-mail envoyé,
> aucune donnée bancaire collectée. Les données restent dans le navigateur.

## Démarrage

```bash
cd agon-agent_1-f2c1c3b7
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Build de production : `npm run build` puis `npm run preview`.

## Parcours de démonstration (5 minutes)

1. Ouvrir la page publique de **Lucas Ferrand** : `/p/lucas-ferrand`.
2. Cliquer sur **Réserver une date**, choisir la formule *Cérémonie + Cocktail*, ajouter une option,
   proposer une date, renseigner des coordonnées fictives et envoyer la demande.
3. Ouvrir le back-office : `/bo/lucas-ferrand`, code **SAXO-2468**.
4. Sélectionner la demande, ajuster les options si besoin, puis **Confirmer la date**.
5. Revenir sur le lien de suivi client : l’acompte devient payable. Cliquer sur **Payer l’acompte**,
   simuler le règlement, puis vérifier dans le back-office que l’acompte apparaît comme reçu.

### Codes d’accès des cinq instances fictives

| Prestataire | Page publique | Back-office | Code démo |
|---|---|---|---|
| Lucas Ferrand | `/p/lucas-ferrand` | `/bo/lucas-ferrand` | `SAXO-2468` |
| Camille Rheault | `/p/camille-rheault` | `/bo/camille-rheault` | `SAXO-3197` |
| Studio Onze | `/p/studio-onze` | `/bo/studio-onze` | `ONZE-4410` |
| Ariane Delcourt | `/p/ariane-delcourt` | `/bo/ariane-delcourt` | `HARPE-5521` |
| Marc Delon | `/p/marc-delon` | `/bo/marc-delon` | `DELON-7734` |

## Routes

- `/` — présentation de la démo et accès aux cinq instances.
- `/p/:slug` — page publique d’un prestataire.
- `/p/:slug/reserver` — parcours client en 5 étapes.
- `/r/:slug/:code` — suivi de réservation et paiement simulé de l’acompte.
- `/bo/:slug` — back-office prestataire (demandes, offres, disponibilités, réglages).
- `/studio` — clonage/personnalisation d’instances, export/import de configuration.
- `/legal` — informations légales et limites de la démonstration.

## Fonctionnalités principales

- Formules, options, quantités, tarifs TTC, acompte configurable, solde restant.
- Options dérivées : kilomètres au-delà du rayon inclus, nombre d’invités.
- Calendrier avec dates indisponibles : blocages manuels + dates déjà confirmées/payées.
- Demande client sans paiement, confirmation prestataire, contre-proposition de date acceptée par le client.
- Devis ajustable avant confirmation, verrouillé ensuite ; paiement au montant courant uniquement.
- Paiement simulé idempotent, référence de démo, journal par instance.
- Back-office mobile avec recherche, filtres, détail en feuille modale, note interne, historique.
- Studio : modèle « Saxophone de mariage » réutilisable, photos/textes/tarifs modifiables,
  export/import de configuration sans réservations ni code d’accès.
- Mise à jour inter-onglets via `localStorage` + événements, brouillon de réservation dans l’onglet courant.

## Architecture et cloisonnement

- React 19 + TypeScript + Vite + Tailwind CSS 4, Framer Motion, Lucide.
- Persistance locale : une clé `cadence.v1.data.<providerId>` par instance.
- Les prix sont recalculés depuis le catalogue prestataire ; le client ne fournit pas de montant.
- Les écritures vérifient le `providerId` ; un code de réservation n’est pas lisible depuis une autre instance.
- Pas de panier commun, pas de partage d’acompte entre prestataires.

## Limites assumées de la démo

- Le cloisonnement est applicatif/front-end, pas une authentification serveur.
- Les liens publics ne sont partageables que dans le même navigateur (stockage local).
- Aucun paiement réel ni envoi d’e-mail. Les avis, prestataires et références sont fictifs.
- Pour la production : backend, authentification, autorisations serveur, paiement connecté au compte
  de chaque prestataire, webhooks signés, e-mails transactionnels, CGV/CGU et mentions légales complètes.

## Tests

```bash
npm test          # tests unitaires (pricing, disponibilité, store, cloisonnement)
npm run lint      # ESLint
npm run build     # TypeScript + build Vite
npm run test:e2e  # Playwright (nécessite Chromium : npx playwright install chromium)
```

Les tests E2E couvrent le parcours mobile complet demande → confirmation → acompte simulé,
ainsi que le refus d’accès croisé entre prestataires.
