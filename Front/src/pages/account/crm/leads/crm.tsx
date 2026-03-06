import { useState, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Lead = {
  id: number;
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  city: string;
  sector: string;
  score: number;
  status: string;
  website?: string;
  aiMessage?: string | null;
  employees?: string;
  revenue?: string;
  linkedin?: string;
  enriched?: boolean;
};

type Email = {
  id: number;
  leadId: number;
  to: string;
  subject: string;
  body: string;
  status: "sent" | "scheduled" | "draft" | "bounced";
  scheduledDate?: string | null;
  sentAt?: string | null;
  openedAt?: string | null;
  repliedAt?: string | null;
  type: string;
  sequenceId?: number | null;
  sequenceStep?: number | null;
  attachments?: Attachment[];
  channel?: string;
  whatsappPhone?: string;
  whatsappBody?: string;
};

type Attachment = {
  name: string;
  size: number;
  type: string;
  file?: File | null;
  isTemplate?: boolean;
};

type Sequence = {
  id: number;
  leadIds: number[];
  steps: { templateId: string; day: number; status: string }[];
  createdAt: string;
  status: string;
  stats: { sent: number; opened: number; replied: number };
};

type EmailCompose = {
  leadId: number | null;
  to: string;
  subject: string;
  body: string;
  type: string;
  channel?: string;
  scheduled?: boolean;
  scheduledDate?: string;
  sequenceId?: number;
  sequenceStep?: number;
  attachments?: Attachment[];
  whatsappPhone?: string;
  whatsappBody?: string;
};

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

// ── Utility ───────────────────────────────────────────────────────────────────
const scoreColor = (s: number) =>
  s >= 80
    ? { t: "#34d399", bg: "rgba(52,211,153,0.1)", glow: "0 0 10px rgba(52,211,153,0.25)" }
    : s >= 60
    ? { t: "#fbbf24", bg: "rgba(251,191,36,0.1)", glow: "0 0 10px rgba(251,191,36,0.25)" }
    : { t: "#f87171", bg: "rgba(248,113,113,0.1)", glow: "0 0 10px rgba(248,113,113,0.25)" };

function ScoreBadge({ score, size = "sm" }: { score: number; size?: "sm" | "lg" }) {
  const c = scoreColor(score);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: size === "lg" ? "5px 14px" : "3px 10px", borderRadius: 20, background: c.bg, boxShadow: c.glow }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.t }} />
      <span style={{ fontSize: size === "lg" ? 15 : 12, fontWeight: 800, color: c.t, fontFamily: "'JetBrains Mono', monospace" }}>{score}</span>
    </span>
  );
}

function StatCard({ fa, label, value, accent }: { fa: string; label: string; value: string | number; accent: 'indigo' | 'amber' | 'emerald' | 'rose' | 'sky' }) {
  const theme = {
    indigo: { iconBg: 'bg-indigo-50', iconText: 'text-indigo-500', value: 'text-indigo-700', border: 'border-indigo-200' },
    amber:  { iconBg: 'bg-amber-50',  iconText: 'text-amber-500',  value: 'text-amber-700',  border: 'border-amber-200'  },
    emerald:{ iconBg: 'bg-emerald-50',iconText: 'text-emerald-500',value: 'text-emerald-700',border: 'border-emerald-200'},
    rose:   { iconBg: 'bg-rose-50',   iconText: 'text-rose-500',   value: 'text-rose-700',   border: 'border-rose-200'   },
    sky:    { iconBg: 'bg-sky-50',    iconText: 'text-sky-500',    value: 'text-sky-700',    border: 'border-sky-200'    },
  }[accent];
  return (
    <Card className={`border ${theme.border}`}>
      <CardContent className="flex items-center gap-3 py-4">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${theme.border} ${theme.iconBg}`}>
          <i className={`${fa} ${theme.iconText}`} />
        </span>
        <div>
          <p className={`text-2xl font-bold tabular-nums ${theme.value}`}>{value}</p>
          <p className="text-[11px] text-slate-400">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Email Templates ───────────────────────────────────────────────────────────
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: "t1", name: "🎯 Première approche",
    subject: "Collaboration digitale — {{company}}",
    body: "Bonjour {{firstName}},\n\nJ'ai eu l'occasion de découvrir {{company}} et votre positionnement dans le secteur {{sector}} à {{city}}.\n\nChez ELBAHI.NET, nous accompagnons les entreprises marocaines dans leur transformation digitale avec des résultats mesurables.\n\nSeriez-vous disponible pour un échange de 15 minutes cette semaine ?\n\nCordialement,\nAbderrahim\nELBAHI.NET",
  },
  {
    id: "t2", name: "🔄 Relance J+3",
    subject: "Re: Collaboration digitale — {{company}}",
    body: "Bonjour {{firstName}},\n\nJe me permets de revenir vers vous suite à mon précédent message. Je comprends que votre emploi du temps est chargé.\n\nJe serais ravi de vous présenter en 10 minutes comment nous avons aidé des entreprises similaires à {{company}} à augmenter leur visibilité en ligne de +150%.\n\nQuand seriez-vous disponible ?\n\nBien cordialement,\nAbderrahim\nELBAHI.NET",
  },
  {
    id: "t3", name: "🎁 Offre valeur",
    subject: "Audit gratuit pour {{company}}",
    body: "Bonjour {{firstName}},\n\nPour vous montrer concrètement ce qu'ELBAHI.NET peut apporter à {{company}}, je vous propose un audit digital gratuit de votre présence en ligne.\n\nCet audit inclut :\n- Analyse SEO de votre site\n- Benchmark concurrentiel\n- Recommandations personnalisées\n\nIntéressé(e) ? Un simple \"oui\" suffit et je vous l'envoie dans les 48h.\n\nCordialement,\nAbderrahim\nELBAHI.NET",
  },
  {
    id: "t4", name: "👋 Dernier follow-up",
    subject: "Dernière tentative — {{company}}",
    body: "Bonjour {{firstName}},\n\nJe ne veux pas encombrer votre boîte mail, donc ce sera mon dernier message.\n\nSi le digital n'est pas une priorité pour {{company}} en ce moment, je comprends tout à fait.\n\nJe vous souhaite une excellente continuation.\n\nCordialement,\nAbderrahim\nELBAHI.NET",
  },
  {
    id: "t5", name: "🏆 Social proof",
    subject: "Comment nous avons aidé une entreprise similaire à {{company}}",
    body: "Bonjour {{firstName}},\n\nNous avons récemment accompagné une entreprise du secteur {{sector}} à {{city}}. Résultats en 3 mois :\n\n→ +180% de trafic qualifié\n→ +85 leads/mois via le site\n→ ROI de 4.5x sur les campagnes\n\nJe serais heureux de discuter comment reproduire ces résultats pour {{company}}.\n\n15 minutes cette semaine ?\n\nAbderrahim\nELBAHI.NET",
  },
];

// ── CRM Component ─────────────────────────────────────────────────────────────
export function CRM({ leads }: { leads: Lead[] }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [emailCompose, setEmailCompose] = useState<EmailCompose | null>(null);
  const [crmFilter, setCrmFilter] = useState("all");
  const emailTemplates = DEFAULT_TEMPLATES;

  // ── Apply template vars ───────────────────────────────────────────────────
  const applyTemplate = useCallback((template: EmailTemplate, lead: Lead) => {
    const vars: Record<string, string> = {
      "{{firstName}}": lead.name?.split(" ")[0] || "",
      "{{lastName}}": lead.name?.split(" ").slice(1).join(" ") || "",
      "{{company}}": lead.company || "",
      "{{sector}}": lead.sector || "",
      "{{city}}": lead.city || "",
      "{{role}}": lead.role || "",
      "{{email}}": lead.email || "",
    };
    let subject = template.subject;
    let body = template.body;
    Object.entries(vars).forEach(([k, v]) => {
      subject = subject.replaceAll(k, v);
      body = body.replaceAll(k, v);
    });
    return { subject, body };
  }, []);

  // ── Send email ────────────────────────────────────────────────────────────
  const handleSendEmail = useCallback((emailData: Omit<Email, "id">) => {
    const newEmail: Email = {
      id: Date.now(),
      ...emailData,
      status: emailData.scheduled ? "scheduled" : "sent",
      sentAt: emailData.scheduled ? null : new Date().toISOString(),
    };
    setEmails(prev => [newEmail, ...prev]);
    setEmailCompose(null);
    return newEmail;
  }, []);

  // ── Create sequence ───────────────────────────────────────────────────────
  const handleCreateSequence = useCallback((leadIds: number[], templateIds: string[], intervalDays = 3) => {
    const newSeq: Sequence = {
      id: Date.now(),
      leadIds,
      steps: templateIds.map((tid, i) => ({ templateId: tid, day: i * intervalDays, status: i === 0 ? "active" : "pending" })),
      createdAt: new Date().toISOString(),
      status: "active",
      stats: { sent: 0, opened: 0, replied: 0 },
    };
    setSequences(prev => [newSeq, ...prev]);
    leadIds.forEach(lid => {
      const lead = leads.find(l => l.id === lid);
      if (lead && templateIds[0]) {
        const tmpl = emailTemplates.find(t => t.id === templateIds[0]);
        if (tmpl) {
          const { subject, body } = applyTemplate(tmpl, lead);
          handleSendEmail({ leadId: lid, to: lead.email, subject, body, type: "sequence", sequenceId: newSeq.id, sequenceStep: 0 });
        }
      }
    });
    return newSeq;
  }, [leads, emailTemplates, applyTemplate, handleSendEmail]);

  // ── Email stats ───────────────────────────────────────────────────────────
  const emailStats = useMemo(() => ({
    total: emails.length,
    sent: emails.filter(e => e.status === "sent").length,
    scheduled: emails.filter(e => e.status === "scheduled").length,
    opened: emails.filter(e => e.openedAt).length,
    replied: emails.filter(e => e.repliedAt).length,
    openRate: emails.filter(e => e.status === "sent").length > 0
      ? Math.round((emails.filter(e => e.openedAt).length / emails.filter(e => e.status === "sent").length) * 100)
      : 0,
    replyRate: emails.filter(e => e.status === "sent").length > 0
      ? Math.round((emails.filter(e => e.repliedAt).length / emails.filter(e => e.status === "sent").length) * 100)
      : 0,
    activeSequences: sequences.filter(s => s.status === "active").length,
  }), [emails, sequences]);

  const S = { fontFamily: "'Urbanist', sans-serif" };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 text-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <i className="fa-solid fa-envelope text-slate-500" /> CRM & Emails
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Envoyez, planifiez et suivez vos emails de prospection
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard fa="fa-solid fa-paper-plane"   label="Emails envoyés"     value={emailStats.sent}            accent="indigo" />
        <StatCard fa="fa-solid fa-clock"         label="Planifiés"          value={emailStats.scheduled}       accent="amber"  />
        <StatCard fa="fa-solid fa-eye"           label="Taux d'ouverture"   value={`${emailStats.openRate}%`}  accent="emerald"/>
        <StatCard fa="fa-solid fa-message"       label="Taux de réponse"    value={`${emailStats.replyRate}%`} accent="rose"   />
        <StatCard fa="fa-solid fa-chart-line"    label="Séquences actives"  value={emailStats.activeSequences} accent="sky"    />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <i className="fa-solid fa-bolt text-slate-500" />
                Actions rapides
              </CardTitle>
              <CardDescription className="text-xs">
                Cibler rapidement vos prospects chauds et relances
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-3">
              {[
                {
                  label: "Email prospects chauds",
                  fa: "fa-solid fa-fire",
                  sub: `${leads.filter(l => l.status === "hot" && !emails.some(e => e.leadId === l.id)).length} à contacter`,
                  onClick: () => {
                    const hotLeads = leads.filter(l => l.status === "hot" && !emails.some(e => e.leadId === l.id));
                    hotLeads.slice(0, 5).forEach(lead => {
                      const { subject, body } = applyTemplate(emailTemplates[0], lead);
                      handleSendEmail({ leadId: lead.id, to: lead.email, subject, body, type: "bulk" });
                    });
                  },
                },
                {
                  label: "Générer msg IA",
                  fa: "fa-solid fa-robot",
                  sub: "Claude personnalisé",
                  onClick: () => { /* handled per-lead in LeadPanel */ },
                },
                {
                  label: "WhatsApp en masse",
                  fa: "fa-brands fa-whatsapp",
                  sub: `${leads.filter(l => l.status === "hot" && l.phone).length} prospects chauds`,
                  onClick: () => {
                    leads.filter(l => l.status === "hot" && l.phone).slice(0, 5).forEach(lead => {
                      handleSendEmail({ leadId: lead.id, to: lead.email, type: "whatsapp", subject: `[WhatsApp] Intro — ${lead.company}`, body: `Bonjour ${lead.name?.split(" ")[0]},\n\nJe suis Abderrahim d'ELBAHI.NET. J'aimerais échanger 10 min sur votre stratégie digitale.\n\n🌐 www.elbahi.net` });
                    });
                  },
                },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={action.onClick}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <i className={`${action.fa} text-[13px]`} />
                  </span>
                  <span className="leading-tight">{action.label}</span>
                  <span className="text-[10px] font-normal text-slate-400">{action.sub}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          

          {/* Active Sequences */}
          {sequences.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <i className="fa-solid fa-rotate-right text-slate-500" />
                  Séquences actives
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sequences.map(seq => (
                  <div key={seq.id} className="rounded-lg border border-slate-200 bg-white p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700">{seq.leadIds.length} prospects • {seq.steps.length} étapes</span>
                      <span className={`text-[10px] font-bold rounded px-2 py-0.5 ${seq.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"}`}>
                        {seq.status === "active" ? "Active" : "Pausée"}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {seq.steps.map((step, i) => (
                        <div key={i} className={`h-1 flex-1 rounded ${step.status === "active" ? "bg-slate-900" : step.status === "done" ? "bg-slate-500" : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400">
                      Créée le {new Date(seq.createdAt).toLocaleDateString("fr-MA")}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── RIGHT COLUMN ───────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { k: "all",       l: "Tous" },
              { k: "sent",      l: "Envoyés" },
              { k: "whatsapp",  l: "WhatsApp" },
              { k: "scheduled", l: "Planifiés" },
            ].map(f => (
              <button
                key={f.k}
                onClick={() => setCrmFilter(f.k)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  crmFilter === f.k
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-400"
                }`}
              >
                {f.l} (
                  {f.k === "all"
                    ? emails.length
                    : f.k === "whatsapp"
                      ? emails.filter(e => e.type === "whatsapp").length
                      : emails.filter(e => e.status === f.k as any).length}
                )
              </button>
            ))}
          </div>

          {/* Email history */}
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 pb-3 pt-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <i className="fa-solid fa-paper-plane text-slate-500" />
                Historique emails
              </CardTitle>
            </CardHeader>
            {emails.length === 0 ? (
              <CardContent className="py-10 text-center text-sm text-slate-400">
                <div className="mb-3 flex justify-center">
                  <span className="flex size-10 items-center justify-center rounded-full bg-slate-50">
                    <i className="fa-solid fa-envelope-open text-lg text-slate-300" />
                  </span>
                </div>
                <p className="font-medium text-slate-500">Aucun email envoyé</p>
                <p className="text-xs text-slate-400">Utilisez les actions rapides ou composez un email</p>
              </CardContent>
            ) : (
              <CardContent className="max-h-[420px] space-y-0 divide-y divide-slate-100 overflow-y-auto p-0">
                {emails
                  .filter(e => crmFilter === "all" || (crmFilter === "whatsapp" ? e.type === "whatsapp" : e.status === crmFilter))
                  .map(email => {
                    const lead = leads.find(l => l.id === email.leadId);
                    const statusColors: Record<string, string> = { sent: "#34d399", scheduled: "#fbbf24", draft: "#60a5fa", bounced: "#f87171" };
                    const statusLabels: Record<string, string> = { sent: "✓ Envoyé", scheduled: "⏰ Planifié", draft: "📝 Brouillon", bounced: "✗ Bounced" };
                    const isWhatsApp = email.type === "whatsapp";
                    return (
                      <div key={email.id} className="space-y-1 px-4 py-3 hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                              {isWhatsApp && <i className="fa-brands fa-whatsapp text-[12px] text-slate-500" />}
                              <span className="truncate">{email.subject}</span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                              <span>À : {lead?.name || email.to}</span>
                              {lead && <span className="text-slate-300">•</span>}
                              {lead && <span className="truncate">{lead.company}</span>}
                              {(email.attachments?.length ?? 0) > 0 && (
                                <span className="ml-1 flex items-center gap-1 text-[10px] text-slate-400">
                                  <i className="fa-solid fa-paperclip" />
                                  {email.attachments!.length}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{
                                color: statusColors[email.status] || "#64748b",
                                background: `${statusColors[email.status] || "#64748b"}12`,
                              }}
                            >
                              {statusLabels[email.status] || email.status}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {email.sentAt
                                ? new Date(email.sentAt).toLocaleString("fr-MA", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </span>
                          </div>
                        </div>
                        <div className="truncate text-[11px] text-slate-400">
                          {email.body?.slice(0, 80)}...
                        </div>
                        {email.type !== "manual" && (
                          <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[9px] font-semibold uppercase text-slate-500">
                            {email.type === "sequence"
                              ? "Séquence"
                              : email.type === "bulk"
                                ? "Envoi groupé"
                                : email.type === "followup"
                                  ? "Relance"
                                  : email.type === "whatsapp"
                                    ? "WhatsApp"
                                    : email.type}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </CardContent>
            )}
          </Card>

          {/* Prospects par statut email */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <i className="fa-solid fa-users text-slate-500" />
                Prospects par statut email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { l: "Non contactés",    fa: "fa-regular fa-circle",       count: leads.filter(l => !emails.some(e => e.leadId === l.id)).length },
                { l: "Email envoyé",     fa: "fa-solid fa-paper-plane",    count: leads.filter(l => emails.some(e => e.leadId === l.id && e.status === "sent")).length },
                { l: "En séquence",      fa: "fa-solid fa-rotate-right",   count: leads.filter(l => sequences.some(s => s.status === "active" && s.leadIds.includes(l.id))).length },
                { l: "En attente réponse", fa: "fa-solid fa-hourglass-half", count: emails.filter(e => e.status === "sent" && !e.repliedAt).length },
              ].map(s => (
                <div key={s.l} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-slate-600">
                    <i className={`${s.fa} text-slate-500`} />
                    {s.l}
                  </span>
                  <span className="text-sm font-bold text-slate-800">{s.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── COMPOSE MODAL ──────────────────────────────────────────────────── */}
      {emailCompose && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setEmailCompose(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: 620, maxHeight: "85vh", background: "#0A3A40", border: "1px solid rgba(102,195,158,0.12)", borderRadius: 18, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column" }}>
            {/* Modal header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(102,195,158,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "#E3FFCC", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <i className="fa-solid fa-paper-plane" /> Composer un email
              </h3>
              <button onClick={() => setEmailCompose(null)} style={{ background: "rgba(102,195,158,0.06)", border: "none", borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(227,255,204,0.45)" }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div style={{ padding: "20px 24px", flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Recipient */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(227,255,204,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Destinataire</label>
                <select
                  value={emailCompose.leadId || ""}
                  onChange={e => {
                    const lead = leads.find(l => l.id === Number(e.target.value));
                    if (lead) setEmailCompose(prev => prev ? { ...prev, leadId: lead.id, to: lead.email } : prev);
                  }}
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(227,255,204,0.04)", border: "1px solid rgba(102,195,158,0.1)", borderRadius: 8, color: "#E3FFCC", fontSize: 13, outline: "none", fontFamily: "'Urbanist', sans-serif" }}
                >
                  <option value="">— Sélectionner un prospect —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name} ({l.company}) — {l.email}</option>)}
                </select>
              </div>

              

              {/* AI Generate */}
              {emailCompose.leadId && (
                <button onClick={async () => {
                  const lead = leads.find(l => l.id === emailCompose.leadId);
                  if (!lead) return;
                  try {
                    const res = await fetch("https://api.anthropic.com/v1/messages", {
                      method: "POST", headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        model: "claude-sonnet-4-20250514", max_tokens: 1000,
                        messages: [{ role: "user", content: `Génère un objet et corps d'email de prospection pour ELBAHI.NET. Prospect: ${lead.name}, ${lead.role}, ${lead.company} (${lead.sector}, ${lead.city}). Réponds en JSON: {"subject":"...","body":"..."}. Max 120 mots pour le body. Signe: Abderrahim, ELBAHI.NET` }]
                      })
                    });
                    const data = await res.json();
                    const text = data.content?.[0]?.text || "";
                    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
                    setEmailCompose(prev => prev ? { ...prev, subject: parsed.subject, body: parsed.body } : prev);
                  } catch {
                    const { subject, body } = applyTemplate(emailTemplates[0], leads.find(l => l.id === emailCompose.leadId)!);
                    setEmailCompose(prev => prev ? { ...prev, subject, body } : prev);
                  }
                }} style={{ padding: "10px 16px", background: "rgba(158,219,185,0.08)", border: "1px solid rgba(158,219,185,0.15)", borderRadius: 8, color: "#9EDBB9", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Urbanist', sans-serif", alignSelf: "flex-start" }}>
                  <i className="fa-solid fa-wand-magic-sparkles" /> Rédiger avec Claude AI
                </button>
              )}

              {/* Subject */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(227,255,204,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Objet</label>
                <input
                  value={emailCompose.subject}
                  onChange={e => setEmailCompose(prev => prev ? { ...prev, subject: e.target.value } : prev)}
                  placeholder="Objet de l'email..."
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(227,255,204,0.04)", border: "1px solid rgba(102,195,158,0.1)", borderRadius: 8, color: "#E3FFCC", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "'Urbanist', sans-serif" }}
                />
              </div>

              {/* Body */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(227,255,204,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" }}>Message</label>
                <textarea
                  value={emailCompose.body}
                  onChange={e => setEmailCompose(prev => prev ? { ...prev, body: e.target.value } : prev)}
                  placeholder="Votre message..." rows={7}
                  style={{ width: "100%", padding: "12px 14px", background: "rgba(227,255,204,0.04)", border: "1px solid rgba(102,195,158,0.1)", borderRadius: 8, color: "#E3FFCC", fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box", fontFamily: "'Urbanist', sans-serif" }}
                />
              </div>

              {/* Attachments */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(227,255,204,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "block" }}>Pièces jointes</label>
                <div
                  onClick={() => (document.getElementById("crm-file-upload") as HTMLInputElement)?.click()}
                  onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(102,195,158,0.5)"; }}
                  onDragLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(102,195,158,0.12)"; }}
                  onDrop={e => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    setEmailCompose(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), ...files.map(f => ({ name: f.name, size: f.size, type: f.type, file: f }))] } : prev);
                  }}
                  style={{ padding: "14px", border: "1.5px dashed rgba(102,195,158,0.12)", borderRadius: 10, background: "rgba(227,255,204,0.03)", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }}
                >
                  <input id="crm-file-upload" type="file" multiple hidden onChange={e => {
                    const files = Array.from(e.target.files || []);
                    setEmailCompose(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), ...files.map(f => ({ name: f.name, size: f.size, type: f.type, file: f }))] } : prev);
                    e.target.value = "";
                  }} />
                  <i className="fa-solid fa-plus" style={{ color:"#8DD4B0", marginBottom: 4 }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(227,255,204,0.45)" }}>Glisser-déposer ou <span style={{ color: "#8DD4B0" }}>parcourir</span></div>
                  <div style={{ fontSize: 10, color: "rgba(227,255,204,0.2)", marginTop: 2 }}>PDF, DOCX, PPTX — Max 25 MB</div>
                </div>

                {/* Quick attach */}
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {[
                    { name: "📊 Proposition commerciale.pdf", size: 2400000 },
                    { name: "🎯 Stratégie digitale.pdf", size: 1800000 },
                    { name: "💰 Grille tarifaire.pdf", size: 850000 },
                    { name: "📈 Étude de cas.pdf", size: 3200000 },
                    { name: "🏢 Présentation agence.pptx", size: 5600000 },
                  ].map(doc => (
                    <button key={doc.name} onClick={() => {
                      setEmailCompose(prev => {
                        if (!prev) return prev;
                        const existing = prev.attachments || [];
                        if (existing.some(a => a.name === doc.name)) return prev;
                        return { ...prev, attachments: [...existing, { name: doc.name, size: doc.size, type: "application/pdf", isTemplate: true }] };
                      });
                    }} style={{ padding: "5px 10px", background: "rgba(227,255,204,0.03)", border: "1px solid rgba(102,195,158,0.08)", borderRadius: 6, fontSize: 10, fontWeight: 600, color: "rgba(227,255,204,0.45)", cursor: "pointer", fontFamily: "'Urbanist', sans-serif" }}>
                      <i className="fa-solid fa-plus" style={{ fontSize:9, verticalAlign: "middle", marginRight: 3 }} />
                      {doc.name.replace(/^[^ ]+ /, "").replace(/\.(pdf|pptx)$/, "")}
                    </button>
                  ))}
                </div>

                {/* Attached files */}
                {(emailCompose.attachments || []).length > 0 && (
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    {emailCompose.attachments!.map((att, idx) => {
                      const sizeStr = att.size > 1000000 ? `${(att.size / 1000000).toFixed(1)} MB` : `${Math.round(att.size / 1000)} KB`;
                      return (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(102,195,158,0.04)", border: "1px solid rgba(102,195,158,0.1)", borderRadius: 8 }}>
                          <span style={{ fontSize: 16 }}>📎</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#E3FFCC", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{att.name}</div>
                            <div style={{ fontSize: 10, color: "rgba(227,255,204,0.25)" }}>{sizeStr}{att.isTemplate ? " • Document modèle" : ""}</div>
                          </div>
                          <button onClick={() => setEmailCompose(prev => prev ? { ...prev, attachments: prev.attachments!.filter((_, i) => i !== idx) } : prev)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(227,255,204,0.3)", padding: 4 }}>
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Channel */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(227,255,204,0.35)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, display: "block" }}>Canal d'envoi</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { k: "email",    label: "📧 Email",    color: "#66C39E", desc: "SMTP / API" },
                    { k: "whatsapp", label: "💬 WhatsApp", color: "#25d366", desc: "Business API" },
                    { k: "both",     label: "📧+💬 Les deux", color: "#fbbf24", desc: "Multi-canal" },
                  ].map(ch => {
                    const active = (emailCompose.channel || "email") === ch.k;
                    return (
                      <button key={ch.k} onClick={() => setEmailCompose(prev => prev ? { ...prev, channel: ch.k } : prev)} style={{ flex: 1, padding: "10px", borderRadius: 10, cursor: "pointer", background: active ? `${ch.color}12` : "rgba(227,255,204,0.03)", border: active ? `1.5px solid ${ch.color}40` : "1.5px solid rgba(102,195,158,0.08)", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, fontFamily: "'Urbanist', sans-serif" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: active ? ch.color : "rgba(227,255,204,0.4)" }}>{ch.label}</span>
                        <span style={{ fontSize: 10, color: "rgba(227,255,204,0.25)" }}>{ch.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* WhatsApp section */}
              {(emailCompose.channel === "whatsapp" || emailCompose.channel === "both") && (
                <div style={{ padding: "14px 16px", background: "rgba(37,211,102,0.04)", border: "1px solid rgba(37,211,102,0.12)", borderRadius: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>💬</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#25d366" }}>WhatsApp Business</span>
                  </div>
                  <input
                    value={emailCompose.whatsappPhone || (emailCompose.leadId ? leads.find(l => l.id === emailCompose.leadId)?.phone || "" : "")}
                    onChange={e => setEmailCompose(prev => prev ? { ...prev, whatsappPhone: e.target.value } : prev)}
                    placeholder="+212 6XX XX XX XX"
                    style={{ width: "100%", padding: "9px 12px", background: "rgba(227,255,204,0.04)", border: "1px solid rgba(37,211,102,0.15)", borderRadius: 7, color: "#E3FFCC", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "'JetBrains Mono', monospace", marginBottom: 10 }}
                  />
                  <textarea
                    value={emailCompose.whatsappBody || ""}
                    onChange={e => setEmailCompose(prev => prev ? { ...prev, whatsappBody: e.target.value } : prev)}
                    rows={4} placeholder="Message WhatsApp..."
                    style={{ width: "100%", padding: "10px 12px", background: "rgba(227,255,204,0.04)", border: "1px solid rgba(37,211,102,0.15)", borderRadius: 7, color: "#E3FFCC", fontSize: 12, outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "'Urbanist', sans-serif" }}
                  />
                  <div style={{ fontSize: 10, color: "rgba(227,255,204,0.2)", marginTop: 4, display: "flex", alignItems: "flex-start", gap: 6 }}>
                    <Info size={12} style={{ flexShrink: 0, marginTop: 1 }} color="rgba(227,255,204,0.2)" />
                    Nécessite un numéro WhatsApp Business vérifié. Coût : ~0.05 MAD/message.
                  </div>
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid rgba(102,195,158,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(102,195,158,0.03)" }}>
              <div style={{ fontSize: 11, color: "rgba(227,255,204,0.25)" }}>
                {emailCompose.leadId ? `→ ${leads.find(l => l.id === emailCompose.leadId)?.email || ""}` : "Sélectionnez un destinataire"}
                {(emailCompose.attachments?.length ?? 0) > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 600, color: "#8DD4B0" }}>📎 {emailCompose.attachments!.length}</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEmailCompose(null)} style={{ padding: "9px 18px", background: "rgba(102,195,158,0.06)", border: "1px solid rgba(102,195,158,0.1)", borderRadius: 8, color: "rgba(227,255,204,0.55)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Urbanist', sans-serif" }}>
                  Annuler
                </button>
                {(emailCompose.channel === "whatsapp" || emailCompose.channel === "both") && (
                  <button
                    onClick={() => {
                      if (emailCompose.leadId) {
                        handleSendEmail({ leadId: emailCompose.leadId, to: emailCompose.to, type: "whatsapp", subject: `[WhatsApp] ${emailCompose.subject || "Message"}`, body: emailCompose.whatsappBody || emailCompose.body, attachments: emailCompose.attachments });
                      }
                    }}
                    disabled={!emailCompose.leadId}
                    style={{ padding: "9px 20px", background: emailCompose.leadId ? "#25d366" : "rgba(227,255,204,0.04)", border: "none", borderRadius: 8, color: emailCompose.leadId ? "#fff" : "rgba(227,255,204,0.2)", fontSize: 13, fontWeight: 700, cursor: emailCompose.leadId ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Urbanist', sans-serif" }}
                  >
                    <span style={{ fontSize: 15 }}>💬</span> WhatsApp
                  </button>
                )}
                <button
                  onClick={() => {
                    if (emailCompose.leadId) {
                      handleCreateSequence([emailCompose.leadId], [], 3);
                    }
                  }}
                  disabled={!emailCompose.leadId}
                  style={{ padding: "9px 18px", background: emailCompose.leadId ? "#0f172a" : "rgba(227,255,204,0.04)", border: "none", borderRadius: 8, color: emailCompose.leadId ? "#fff" : "rgba(227,255,204,0.2)", fontSize: 13, fontWeight: 700, cursor: emailCompose.leadId ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Urbanist', sans-serif" }}
                >
                  <i className="fa-solid fa-rotate-right" /> Lancer séquence
                </button>
                {emailCompose.channel !== "whatsapp" && (
                  <button
                    onClick={() => {
                      if (emailCompose.leadId && emailCompose.subject && emailCompose.body) {
                        handleSendEmail({ leadId: emailCompose.leadId, to: emailCompose.to, subject: emailCompose.subject, body: emailCompose.body, type: emailCompose.type, attachments: emailCompose.attachments });
                      }
                    }}
                    disabled={!emailCompose.leadId || !emailCompose.subject || !emailCompose.body}
                    style={{ padding: "9px 22px", background: (emailCompose.leadId && emailCompose.subject && emailCompose.body) ? "linear-gradient(135deg, #66C39E, #0A3A40)" : "rgba(227,255,204,0.04)", border: "none", borderRadius: 8, color: emailCompose.leadId ? "#fff" : "rgba(227,255,204,0.2)", fontSize: 13, fontWeight: 700, cursor: (emailCompose.leadId && emailCompose.subject && emailCompose.body) ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Urbanist', sans-serif", boxShadow: (emailCompose.leadId && emailCompose.subject && emailCompose.body) ? "0 4px 16px rgba(102,195,158,0.25)" : "none" }}
                  >
                    <i className="fa-solid fa-paper-plane" /> Envoyer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
