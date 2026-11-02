import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  Palette,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react'
import { Badge, Button, Card, Field, Input, Select, Sheet, Textarea, useToast } from '../components/ui'
import { DemoNotice } from '../components/DemoNotice'
import { Brand } from '../components/Brand'
import { IMAGE_LIBRARY } from '../lib/images'
import { TEMPLATES } from '../lib/templates'
import {
  createInstance,
  deleteInstance,
  listBookings,
  listProviders,
  resetDemo,
  saveProvider,
  subscribeData,
} from '../lib/store'
import type { Formula, Option, ProviderInstance } from '../lib/types'
import { money } from '../lib/format'
import { cn, compressImage, downloadJson, slugify, uid } from '../lib/utils'

interface LedgerRow {
  provider: ProviderInstance
  bookings: number
  collected: number
  pipeline: number
}

export default function Studio() {
  const toast = useToast()
  const [providers, setProviders] = useState<ProviderInstance[]>([])
  const [ledger, setLedger] = useState<LedgerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ProviderInstance | null>(null)
  const [cloning, setCloning] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ProviderInstance | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const refresh = async () => {
    const list = await listProviders()
    setProviders(list)
    const rows: LedgerRow[] = []
    for (const p of list) {
      const bookings = await listBookings(p.id)
      rows.push({
        provider: p,
        bookings: bookings.length,
        collected: bookings
          .filter((b) => b.deposit.status === 'paye')
          .reduce((s, b) => s + b.deposit.amount, 0),
        pipeline: bookings
          .filter((b) => b.status === 'confirmee' || b.status === 'acompte_paye')
          .reduce((s, b) => s + b.pricing.total, 0),
      })
    }
    setLedger(rows)
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      const list = await listProviders()
      if (!active) return
      setProviders(list)
      const rows: LedgerRow[] = []
      for (const p of list) {
        const bookings = await listBookings(p.id)
        rows.push({
          provider: p,
          bookings: bookings.length,
          collected: bookings.filter((b) => b.deposit.status === 'paye').reduce((sum, b) => sum + b.deposit.amount, 0),
          pipeline: bookings.filter((b) => b.status === 'confirmee' || b.status === 'acompte_paye').reduce((sum, b) => sum + b.pricing.total, 0),
        })
      }
      if (!active) return
      setLedger(rows)
      setLoading(false)
    }
    void load()
    const unsubscribe = subscribeData(() => void load())
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const cloneTemplate = async (templateId: string, name: string, slug: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId)
    if (!template) return
    const instance: ProviderInstance = {
      ...JSON.parse(JSON.stringify(template.payload)),
      id: uid('prov'),
      slug: slugify(slug) || slugify(name),
      displayName: name,
      businessName: name,
      accessCode: `${slugify(name).slice(0, 4).toUpperCase() || 'INST'}-${Math.floor(1000 + Math.random() * 8999)}`,
      createdAt: Date.now(),
    }
    try {
      await createInstance(instance)
      await refresh()
      setCloning(null)
      toast.push('Instance créée. Vous pouvez la personnaliser.', 'success')
      setEditing(instance)
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Création impossible.', 'error')
    }
  }

  const remove = async (p: ProviderInstance) => {
    try {
      await deleteInstance(p.id)
      setConfirmDelete(null)
      await refresh()
      toast.push('Instance supprimée.', 'info')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Suppression impossible.', 'error')
    }
  }

  const doReset = async () => {
    resetDemo()
    setResetOpen(false)
    await refresh()
    toast.push('Démonstration réinitialisée.', 'success')
  }

  const exportConfig = (p: ProviderInstance) => {
    const { id: _id, slug: _slug, createdAt: _createdAt, accessCode: _accessCode, ...payload } = p
    void _id; void _slug; void _createdAt; void _accessCode
    downloadJson(`cadence-config-${p.slug}.json`, { kind: 'cadence-instance-config', version: 1, provider: payload })
    toast.push('Configuration exportée (sans réservations ni code d’accès).', 'success')
  }

  const importConfig = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as { kind?: string; version?: number; provider?: Omit<ProviderInstance, 'id' | 'slug' | 'createdAt' | 'accessCode'> }
      if (parsed.kind !== 'cadence-instance-config' || parsed.version !== 1 || !parsed.provider) {
        throw new Error('Fichier de configuration Cadence invalide.')
      }
      const payload = parsed.provider
      const baseSlug = slugify(payload.displayName) || 'instance'
      const instance: ProviderInstance = {
        ...payload,
        id: uid('prov'),
        slug: `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`,
        accessCode: `${baseSlug.slice(0, 4).toUpperCase() || 'INST'}-${Math.floor(1000 + Math.random() * 8999)}`,
        createdAt: Date.now(),
        travelIncludedKm: payload.travelIncludedKm ?? 50,
      }
      await createInstance(instance)
      await refresh()
      setEditing(instance)
      toast.push('Configuration importée dans une nouvelle instance.', 'success')
    } catch (err) {
      toast.push(err instanceof Error ? err.message : 'Import impossible.', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="h-6 w-6 animate-spin text-ink/40" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brand />
            <Badge tone="outline" className="hidden sm:inline-flex">Studio</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)} icon={<RotateCcw className="h-3.5 w-3.5" />}>
              <span className="hidden sm:inline">Réinitialiser</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => importRef.current?.click()} icon={<Upload className="h-3.5 w-3.5" />}>
              <span className="hidden sm:inline">Importer</span>
            </Button>
            <input
              ref={importRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importConfig(file)
                e.target.value = ''
              }}
            />
            <Link to="/">
              <Button variant="outline" size="sm">
                Voir la démo
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
        <div className="max-w-2xl">
          <Badge tone="outline" className="mb-4">
            <Sparkles className="h-3 w-3" /> Studio de modèles
          </Badge>
          <h1 className="display-section text-ink">
            Un modèle, des milliers d’instances
          </h1>
          <p className="lede mt-5 max-w-xl">
            Le modèle « Saxophone de mariage » contient la structure complète : textes,
            formules, options, photos et palette. Clonez-le, remplacez les photos, réécrivez les
            textes, changez les tarifs. Chaque clone devient une instance indépendante, avec son
            propre back-office et son propre journal d’acomptes.
          </p>
        </div>

        <DemoNotice className="mt-6">
          Studio de démonstration : les instances vivent dans ce navigateur. Exportez une configuration
          pour la réutiliser ailleurs ; aucun paiement réel n’est connecté.
        </DemoNotice>

        {/* ------------------------------------------------- modèles */}
        <section className="mt-14">
          <h2 className="display-page mb-5 text-ink">Modèles disponibles</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TEMPLATES.map((t) => (
              <Card key={t.id} padded={false} className="flex flex-col overflow-hidden">
                <div className="relative h-32">
                  <img src={t.coverPhoto} alt={t.name} className="h-full w-full object-cover" />
                  <span
                    className="absolute bottom-2 left-2 rounded-full px-2.5 py-1 text-[10px] font-medium text-white"
                    style={{ background: t.accentPreview }}
                  >
                    {t.category}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="text-[20px] font-medium tracking-[-0.035em] leading-tight text-ink">{t.name}</h3>
                  <p className="mt-1.5 flex-1 text-[12.5px] leading-relaxed text-ink/55">
                    {t.description}
                  </p>
                  <p className="mt-3 text-[11.5px] text-ink/40">
                    {t.payload.formulas.length} formules · {t.payload.options.length} options
                  </p>
                  <Button
                    size="sm"
                    className="mt-3"
                    full
                    variant={t.id === 'saxophone' ? 'accent' : 'primary'}
                    onClick={() => setCloning(t.id)}
                    icon={<Copy className="h-3.5 w-3.5" />}
                  >
                    Créer une instance
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------- instances */}
        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="display-page text-ink">Instances actives</h2>
              <p className="text-[13px] text-ink/55">
                {providers.length} instance{providers.length > 1 ? 's' : ''} en ligne.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {providers.map((p) => {
              const row = ledger.find((l) => l.provider.id === p.id)
              return (
                <Card key={p.id} padded={false}>
                  <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <img
                      src={p.coverPhoto}
                      alt={p.displayName}
                      className="h-28 w-full rounded-2xl object-cover sm:h-20 sm:w-32"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[20px] font-medium tracking-[-0.035em] leading-tight text-ink">
                          {p.displayName}
                        </h3>
                        <Badge tone="outline">{p.templateId}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[12.5px] text-ink/55">{p.tagline}</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink/45">
                        <span className="inline-flex items-center gap-1">
                          <Link2 className="h-3 w-3" /> /p/{p.slug}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <KeyRound className="h-3 w-3" /> {p.accessCode}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Wallet className="h-3 w-3" /> {row?.bookings ?? 0} réservations
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Lock className="h-3 w-3" /> {money(row?.collected ?? 0)} encaissés
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/p/${p.slug}`}>
                        <Button size="sm" variant="outline" icon={<ExternalLink className="h-3.5 w-3.5" />}>
                          Publique
                        </Button>
                      </Link>
                      <Link to={`/bo/${p.slug}`}>
                        <Button size="sm" variant="outline" icon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                          Back-office
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => setEditing(p)} icon={<Palette className="h-3.5 w-3.5" />}>
                        Personnaliser
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </section>

        {/* ------------------------------------------------ cloisonnement */}
        <section className="mt-12">
          <Card padded={false} className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="flex items-center gap-2 font-display text-[24px] text-ink">
                  <ShieldCheck className="h-5 w-5 text-accent" /> Cloisonnement des acomptes
                </h2>
                <p className="mt-1 text-[13px] text-ink/55">
                  Vue d’ensemble de la démo uniquement. Chaque back-office de prestataire ne montre que ses propres dossiers ; aucun montant ne transite d’une instance à l’autre.
                </p>
              </div>
              <Badge tone="success">
                <Check className="h-3 w-3" /> Isolation active
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead>
                  <tr className="border-b border-line bg-ink/2">
                    <th className="px-5 py-2.5 text-[11px] font-medium text-ink/40">
                      Instance
                    </th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-ink/40">
                      Clé de stockage
                    </th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-ink/40">
                      Réservations
                    </th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-ink/40">
                      Acomptes encaissés
                    </th>
                    <th className="px-5 py-2.5 text-[11px] font-medium text-ink/40">
                      CA confirmé
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {ledger.map((row) => (
                    <tr key={row.provider.id}>
                      <td className="px-5 py-3 text-[13.5px] font-medium text-ink">
                        {row.provider.displayName}
                      </td>
                      <td className="px-5 py-3 font-mono text-[11.5px] text-ink/50">
                        cadence.v1.data.{row.provider.id.slice(0, 10)}…
                      </td>
                      <td className="px-5 py-3 text-[13.5px] text-ink/70">{row.bookings}</td>
                      <td className="px-5 py-3 text-[13.5px] font-semibold text-ink">
                        {money(row.collected)}
                      </td>
                      <td className="px-5 py-3 text-[13.5px] text-ink/70">{money(row.pipeline)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-line bg-ink/2 px-5 py-4">
              <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink/55">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                Essai d’accès croisé : ouvrez le lien de réservation d’un prestataire avec le code
                d’un autre (par exemple{' '}
                <code className="rounded bg-ink/8 px-1.5 py-0.5 font-mono text-[11.5px]">
                  /r/studio-onze/LUC-7K2F
                </code>
                ). La réservation est refusée : elle n’existe pas dans l’instance « Studio
                Onze ».
              </p>
            </div>
          </Card>
        </section>

        <div className="mt-10 flex flex-wrap gap-2">
          {providers.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant="ghost"
              className="text-red-600/80"
              onClick={() => setConfirmDelete(p)}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Supprimer {p.displayName}
            </Button>
          ))}
        </div>
      </main>

      {/* ------------------------------------------------- clone sheet */}
      <CloneSheet
        key={cloning ?? 'none'}
        templateId={cloning}
        onClose={() => setCloning(null)}
        onConfirm={cloneTemplate}
      />

      {/* ------------------------------------------------ editor sheet */}
      {editing && (
        <InstanceEditor
          instance={editing}
          onClose={() => setEditing(null)}
          onSaved={async (p) => {
            await refresh()
            setEditing(p)
          }}
          onExport={exportConfig}
        />
      )}

      <Sheet
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={<p className="font-display text-[22px] text-ink">Supprimer l’instance ?</p>}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Conserver</Button>
            <Button variant="danger" onClick={() => confirmDelete && void remove(confirmDelete)}>Supprimer</Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/65">
          {confirmDelete?.displayName} et toutes ses réservations de démo seront supprimés de ce navigateur. Cette action est irréversible.
        </p>
      </Sheet>

      <Sheet
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title={<p className="font-display text-[22px] text-ink">Réinitialiser la démo ?</p>}
        footer={
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setResetOpen(false)}>Annuler</Button>
            <Button variant="danger" onClick={() => void doReset()}>Réinitialiser</Button>
          </div>
        }
      >
        <p className="text-[14px] leading-relaxed text-ink/65">
          Toutes les instances personnalisées et réservations seront remplacées par les cinq exemples d’origine.
        </p>
      </Sheet>
    </div>
  )
}

/* ------------------------------------------------------------ clone sheet */

function CloneSheet({
  templateId,
  onClose,
  onConfirm,
}: {
  templateId: string | null
  onClose: () => void
  onConfirm: (templateId: string, name: string, slug: string) => void
}) {
  const template = TEMPLATES.find((t) => t.id === templateId)
  const [name, setName] = useState(template && template.name !== 'Saxophone de mariage' ? template.name : '')
  const [slug, setSlug] = useState('')

  return (
    <Sheet
      open={!!templateId}
      onClose={onClose}
      title={
        <div>
          <p className="font-display text-[22px] leading-tight text-ink">Créer une instance</p>
          <p className="text-[12.5px] text-ink/55">À partir du modèle « {template?.name} »</p>
        </div>
      }
      footer={
        <Button
          full
          disabled={!name.trim()}
          onClick={() => templateId && onConfirm(templateId, name.trim(), slug.trim() || name.trim())}
          icon={<Sparkles className="h-4 w-4" />}
        >
          Créer et personnaliser
        </Button>
      }
    >
      <div className="space-y-4">
        {template && (
          <div className="overflow-hidden rounded-2xl border border-line">
            <img src={template.coverPhoto} alt="" className="h-32 w-full object-cover" />
            <div className="p-3">
              <p className="text-[13px] font-semibold text-ink">{template.name}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-ink/55">{template.description}</p>
            </div>
          </div>
        )}
        <Field label="Nom du prestataire" required>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!slug) setSlug(slugify(e.target.value))
            }}
            placeholder="Ex. Camille Bertrand"
          />
        </Field>
        <Field label="Adresse publique" hint="Le lien de réservation de l’instance.">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-[13px] text-ink/40">/p/</span>
            <Input
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              placeholder="camille-bertrand"
            />
          </div>
        </Field>
        <p className="rounded-2xl bg-accent/8 px-3.5 py-3 text-[12.5px] leading-relaxed text-ink/60">
          L’instance sera créée avec un code d’accès propre et un journal d’acomptes vide. Vous
          pourrez ensuite remplacer photos, textes et tarifs.
        </p>
      </div>
    </Sheet>
  )
}

/* --------------------------------------------------------- instance editor */

type EditTab = 'identite' | 'photos' | 'formules' | 'options' | 'apparence'

function InstanceEditor({
  instance,
  onClose,
  onSaved,
  onExport,
}: {
  instance: ProviderInstance
  onClose: () => void
  onSaved: (p: ProviderInstance) => void
  onExport: (p: ProviderInstance) => void
}) {
  const toast = useToast()
  const [draft, setDraft] = useState<ProviderInstance>(instance)
  const [tab, setTab] = useState<EditTab>('identite')
  const [saving, setSaving] = useState(false)
  const [uploadTarget, setUploadTarget] = useState<'cover' | 'gallery' | null>(null)

  const set = <K extends keyof ProviderInstance>(key: K, value: ProviderInstance[K]) =>
    setDraft((d) => ({ ...d, [key]: value }))

  const save = async () => {
    setSaving(true)
    try {
      const updated = await saveProvider(draft)
      onSaved(updated)
      toast.push('Instance enregistrée.', 'success')
    } catch (err) {
      toast.push(
        err instanceof Error ? err.message : 'Enregistrement impossible (stockage plein ?).',
        'error',
      )
    }
    setSaving(false)
  }

  const handleUpload = async (file: File) => {
    try {
      const dataUrl = await compressImage(file)
      if (uploadTarget === 'cover') {
        set('coverPhoto', dataUrl)
      } else if (uploadTarget === 'gallery') {
        set('gallery', [
          ...draft.gallery,
          { id: uid('g'), src: dataUrl, caption: 'Nouvelle photo' },
        ])
      }
      toast.push('Photo ajoutée.', 'success')
    } catch {
      toast.push('Image illisible.', 'error')
    }
  }

  const tabs: Array<{ id: EditTab; label: string }> = [
    { id: 'identite', label: 'Identité' },
    { id: 'photos', label: 'Photos' },
    { id: 'formules', label: 'Formules' },
    { id: 'options', label: 'Options' },
    { id: 'apparence', label: 'Apparence' },
  ]

  return (
    <Sheet
      open
      onClose={onClose}
      title={
        <div>
          <p className="font-display text-[22px] leading-tight text-ink">{draft.displayName}</p>
          <p className="text-[12.5px] text-ink/55">Instance · {draft.templateId}</p>
        </div>
      }
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Fermer
          </Button>
          <Button variant="outline" onClick={() => onExport(draft)} icon={<ExternalLink className="h-4 w-4" />}>
            Exporter
          </Button>
          <Button onClick={save} loading={saving} className="flex-1" icon={<Check className="h-4 w-4" />}>
            Enregistrer
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors',
                tab === t.id ? 'bg-brand text-white' : 'bg-ink/6 text-ink/60 hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'identite' && (
          <div className="space-y-3">
            <Field label="Nom affiché">
              <Input
                value={draft.displayName}
                onChange={(e) => set('displayName', e.target.value)}
              />
            </Field>
            <Field label="Nom de l’activité">
              <Input
                value={draft.businessName}
                onChange={(e) => set('businessName', e.target.value)}
              />
            </Field>
            <Field label="Accroche">
              <Input value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} />
            </Field>
            <Field label="Présentation">
              <Textarea
                value={draft.bio}
                onChange={(e) => set('bio', e.target.value)}
                size="md"
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ville">
                <Input value={draft.city} onChange={(e) => set('city', e.target.value)} />
              </Field>
              <Field label="Zone">
                <Input value={draft.zone} onChange={(e) => set('zone', e.target.value)} />
              </Field>
            </div>
            <Field label="Répertoires" hint="Séparés par des virgules.">
              <Input
                value={draft.styles.join(', ')}
                onChange={(e) =>
                  set(
                    'styles',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="E-mail">
                <Input
                  value={draft.contact.email}
                  onChange={(e) => set('contact', { ...draft.contact, email: e.target.value })}
                />
              </Field>
              <Field label="Téléphone">
                <Input
                  value={draft.contact.phone}
                  onChange={(e) => set('contact', { ...draft.contact, phone: e.target.value })}
                />
              </Field>
              <Field label="Site web">
                <Input
                  value={draft.contact.website}
                  onChange={(e) => set('contact', { ...draft.contact, website: e.target.value })}
                />
              </Field>
              <Field label="Instagram">
                <Input
                  value={draft.contact.instagram}
                  onChange={(e) => set('contact', { ...draft.contact, instagram: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Mariages">
                <Input
                  type="number"
                  value={draft.stats.weddings}
                  onChange={(e) =>
                    set('stats', { ...draft.stats, weddings: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Note">
                <Input
                  type="number"
                  step={0.1}
                  min={0}
                  max={5}
                  value={draft.stats.rating}
                  onChange={(e) =>
                    set('stats', { ...draft.stats, rating: Number(e.target.value) || 0 })
                  }
                />
              </Field>
              <Field label="Avis">
                <Input
                  type="number"
                  value={draft.stats.reviews}
                  onChange={(e) =>
                    set('stats', { ...draft.stats, reviews: Number(e.target.value) || 0 })
                  }
                />
              </Field>
            </div>
          </div>
        )}

        {tab === 'photos' && (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.13em] text-ink/40">
                Photo de couverture
              </p>
              <img
                src={draft.coverPhoto}
                alt=""
                className="h-44 w-full rounded-2xl border border-line object-cover"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setUploadTarget('cover')}
                  icon={<Upload className="h-3.5 w-3.5" />}
                >
                  Téléverser
                </Button>
                <Button size="sm" variant="ghost" onClick={() => set('coverPhoto', '/img/hero-sax.jpg')}>
                  Photo par défaut
                </Button>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.13em] text-ink/40">
                Galerie ({draft.gallery.length})
              </p>
              <div className="grid grid-cols-2 gap-2">
                {draft.gallery.map((g) => (
                  <div key={g.id} className="overflow-hidden rounded-2xl border border-line">
                    <img src={g.src} alt={g.caption} className="h-24 w-full object-cover" />
                    <div className="p-2">
                      <Input
                        value={g.caption}
                        onChange={(e) =>
                          set(
                            'gallery',
                            draft.gallery.map((x) =>
                              x.id === g.id ? { ...x, caption: e.target.value } : x,
                            ),
                          )
                        }
                        className="h-8 text-[12px]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          set('gallery', draft.gallery.filter((x) => x.id !== g.id))
                        }
                        className="mt-1.5 text-[11.5px] font-medium text-red-600/80 hover:text-red-600"
                      >
                        Retirer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => setUploadTarget('gallery')}
                icon={<Plus className="h-3.5 w-3.5" />}
              >
                Ajouter une photo
              </Button>
            </div>

            <div>
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.13em] text-ink/40">
                Banque d’images
              </p>
              <div className="grid grid-cols-3 gap-2">
                {IMAGE_LIBRARY.map((img) => (
                  <button
                    key={img.src}
                    type="button"
                    onClick={() => set('coverPhoto', img.src)}
                    className="group relative overflow-hidden rounded-lg border border-line"
                  >
                    <img src={img.src} alt={img.label} className="h-16 w-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-ink/75 px-1.5 py-0.5 text-[9.5px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11.5px] text-ink/45">
                Cliquez sur une image pour l’utiliser en couverture. Téléversez vos propres
                photos pour un rendu 100 % personnalisé.
              </p>
            </div>
          </div>
        )}

        {tab === 'formules' && (
          <div className="space-y-3">
            {draft.formulas.map((f, idx) => (
              <div key={f.id} className="rounded-2xl border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-medium text-ink/40">
                    Formule {idx + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      set('formulas', draft.formulas.filter((x) => x.id !== f.id))
                    }
                    className="text-ink/30 hover:text-red-600"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={f.name}
                    placeholder="Nom"
                    onChange={(e) =>
                      set(
                        'formulas',
                        draft.formulas.map((x) =>
                          x.id === f.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    value={f.price}
                    placeholder="Prix"
                    onChange={(e) =>
                      set(
                        'formulas',
                        draft.formulas.map((x) =>
                          x.id === f.id ? { ...x, price: Number(e.target.value) || 0 } : x,
                        ),
                      )
                    }
                  />
                </div>
                <Input
                  className="mt-2"
                  value={f.tagline}
                  placeholder="Accroche"
                  onChange={(e) =>
                    set(
                      'formulas',
                      draft.formulas.map((x) =>
                        x.id === f.id ? { ...x, tagline: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Textarea
                  className="mt-2"
                  value={f.description}
                  placeholder="Description"
                  onChange={(e) =>
                    set(
                      'formulas',
                      draft.formulas.map((x) =>
                        x.id === f.id ? { ...x, description: e.target.value } : x,
                      ),
                    )
                  }
                />
                <Textarea
                  className="mt-2"
                  value={f.includes.join('\n')}
                  placeholder="Prestations incluses (une par ligne)"
                  onChange={(e) =>
                    set(
                      'formulas',
                      draft.formulas.map((x) =>
                        x.id === f.id
                          ? { ...x, includes: e.target.value.split('\n').filter(Boolean) }
                          : x,
                      ),
                    )
                  }
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              full
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() =>
                set('formulas', [
                  ...draft.formulas,
                  {
                    id: uid('f'),
                    name: 'Nouvelle formule',
                    tagline: '',
                    price: 0,
                    duration: '1 h',
                    description: '',
                    includes: [],
                  } as Formula,
                ])
              }
            >
              Ajouter une formule
            </Button>
          </div>
        )}

        {tab === 'options' && (
          <div className="space-y-3">
            {draft.options.map((o) => (
              <div key={o.id} className="rounded-2xl border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="truncate text-[13px] font-semibold text-ink">{o.name}</p>
                  <button
                    type="button"
                    onClick={() => set('options', draft.options.filter((x) => x.id !== o.id))}
                    className="text-ink/30 hover:text-red-600"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    value={o.name}
                    onChange={(e) =>
                      set(
                        'options',
                        draft.options.map((x) =>
                          x.id === o.id ? { ...x, name: e.target.value } : x,
                        ),
                      )
                    }
                  />
                  <Input
                    type="number"
                    step={0.1}
                    value={o.price}
                    onChange={(e) =>
                      set(
                        'options',
                        draft.options.map((x) =>
                          x.id === o.id ? { ...x, price: Number(e.target.value) || 0 } : x,
                        ),
                      )
                    }
                  />
                  <Select
                    value={o.unit}
                    onChange={(e) =>
                      set(
                        'options',
                        draft.options.map((x) =>
                          x.id === o.id ? { ...x, unit: e.target.value as Option['unit'] } : x,
                        ),
                      )
                    }
                  >
                    <option value="forfait">Forfait</option>
                    <option value="heure">Par heure</option>
                    <option value="personne">Par personne</option>
                    <option value="km">Par kilomètre</option>
                  </Select>
                  <Input
                    value={o.group}
                    onChange={(e) =>
                      set(
                        'options',
                        draft.options.map((x) =>
                          x.id === o.id ? { ...x, group: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              full
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() =>
                set('options', [
                  ...draft.options,
                  {
                    id: uid('o'),
                    name: 'Nouvelle option',
                    description: '',
                    price: 0,
                    unit: 'forfait',
                    maxQty: 1,
                    group: 'Extras',
                  } as Option,
                ])
              }
            >
              Ajouter une option
            </Button>
          </div>
        )}

        {tab === 'apparence' && (
          <div className="space-y-4">
            <p className="text-[13px] leading-relaxed text-ink/55">
              L’interface reste dans le thème Cadence noir et blanc ; ces teintes personnalisent uniquement les détails décoratifs de l’instance.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(['brand', 'accent', 'paper'] as const).map((key) => (
                <Field key={key} label={key === 'brand' ? 'Couleur principale' : key === 'accent' ? 'Accent' : 'Fond'}>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.palette[key]}
                      onChange={(e) =>
                        set('palette', { ...draft.palette, [key]: e.target.value })
                      }
                      className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line/70 bg-card p-1"
                    />
                    <Input
                      value={draft.palette[key]}
                      onChange={(e) =>
                        set('palette', { ...draft.palette, [key]: e.target.value })
                      }
                    />
                  </div>
                </Field>
              ))}
            </div>

            <Field label="Déplacement inclus (km)">
              <Input
                type="number"
                min={0}
                max={500}
                value={draft.travelIncludedKm}
                onChange={(e) => set('travelIncludedKm', Math.min(500, Math.max(0, Number(e.target.value) || 0)))}
              />
            </Field>

            <Field label="Acompte (%)">
              <Input
                type="number"
                min={1}
                max={100}
                value={draft.depositPercent}
                onChange={(e) =>
                  set('depositPercent', Math.min(100, Math.max(1, Number(e.target.value) || 1)))
                }
              />
            </Field>

            <Field label="Adresse publique">
              <Input value={draft.slug} onChange={(e) => set('slug', slugify(e.target.value))} />
            </Field>

            <Field label="Code d’accès au back-office">
              <Input
                value={draft.accessCode}
                onChange={(e) => set('accessCode', e.target.value.toUpperCase())}
                className="font-mono tracking-widest"
              />
            </Field>

            <div className="overflow-hidden rounded-2xl border border-line">
              <p className="bg-ink/3 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.13em] text-ink/45">
                Aperçu
              </p>
              <div className="pastel-stage p-5 text-ink">
                <div className="rounded-2xl bg-white/85 p-4 backdrop-blur-xl">
                  <p
                    className="text-[24px] font-medium tracking-[-0.04em]"
                    style={{ color: draft.palette.brand }}
                  >
                    {draft.displayName}
                  </p>
                  <p className="mt-1 text-[12.5px] opacity-70">{draft.tagline}</p>
                  <span
                    className="mt-3 inline-flex rounded-full px-4 py-2 text-[12px] font-medium text-white"
                    style={{ background: draft.palette.accent }}
                  >
                    Réserver une date
                  </span>
                  <div className="mt-4 flex items-center gap-2.5" aria-label="Aperçu de la palette personnalisée">
                    {(['brand', 'accent', 'paper'] as const).map((key) => (
                      <span
                        key={key}
                        title={key === 'brand' ? 'Principale' : key === 'accent' ? 'Accent' : 'Fond'}
                        className="h-5 w-5 rounded-full ring-1 ring-black/10"
                        style={{ background: draft.palette[key] }}
                      />
                    ))}
                    <span className="ml-1 text-[11px] text-ink/45">Teintes décoratives</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* upload target picker */}
      <Sheet
        open={!!uploadTarget}
        onClose={() => setUploadTarget(null)}
        title={<p className="font-display text-[22px] text-ink">Ajouter une photo</p>}
      >
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-ink/2 px-4 py-8 text-center transition-colors hover:border-accent/60">
            <ImageIcon className="mb-2 h-7 w-7 text-ink/30" />
            <span className="text-[13.5px] font-semibold text-ink">Téléverser depuis mon appareil</span>
            <span className="mt-1 text-[11.5px] text-ink/45">JPEG ou PNG · redimensionné automatiquement</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleUpload(file)
                e.target.value = ''
              }}
            />
          </label>

          <div>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.13em] text-ink/40">
              Banque d’images
            </p>
            <div className="grid grid-cols-3 gap-2">
              {IMAGE_LIBRARY.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => {
                    if (uploadTarget === 'cover') set('coverPhoto', img.src)
                    else
                      set('gallery', [
                        ...draft.gallery,
                        { id: uid('g'), src: img.src, caption: img.label },
                      ])
                    setUploadTarget(null)
                  }}
                  className="overflow-hidden rounded-lg border border-line"
                >
                  <img src={img.src} alt={img.label} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Sheet>
    </Sheet>
  )
}
