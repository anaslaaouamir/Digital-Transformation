import { useState, useCallback, useMemo, useEffect } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
export type Lead = {
  id: number; name: string; company: string; role: string; email: string;
  phone: string; city: string; sector: string; score: number; status: string;
  website?: string; aiMessage?: string | null; employees?: string; revenue?: string;
  linkedin?: string; enriched?: boolean;
};
type Email = {
  id: number; leadId: number; to: string; subject: string; body: string;
  status: "sent" | "scheduled" | "draft" | "bounced";
  scheduledDate?: string | null; sentAt?: string | null;
  openedAt?: string | null; repliedAt?: string | null;
  type: string; sequenceId?: number | null; sequenceStep?: number | null;
  attachments?: Attachment[]; channel?: string;
  whatsappPhone?: string; whatsappBody?: string;
};
type Attachment = { name: string; size: number; type: string; file?: File | null; isTemplate?: boolean; };
type Sequence = {
  id: number; leadIds: number[];
  steps: { templateId: string; day: number; status: string }[];
  createdAt: string; status: string;
  stats: { sent: number; opened: number; replied: number };
};
type EmailCompose = {
  leadId: number | null; to: string; subject: string; body: string; type: string;
  channel?: string; scheduled?: boolean; scheduledDate?: string;
  sequenceId?: number; sequenceStep?: number; attachments?: Attachment[];
  whatsappPhone?: string; whatsappBody?: string;
};
type EmailTemplate = { id: string; name: string; subject: string; body: string; };

// ── Templates ─────────────────────────────────────────────────────────────────
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  { id: "t1", name: "🎯 Première approche", subject: "Collaboration digitale — {{company}}", body: "Bonjour,\n\nJ'ai eu l'occasion de découvrir {{company}} et votre positionnement dans le secteur {{sector}} à {{city}}.\n\nChez ELBAHI.NET, nous accompagnons les entreprises marocaines dans leur transformation digitale avec des résultats mesurables.\n\nSeriez-vous disponible pour un échange de 15 minutes cette semaine ?\n\nCordialement,\nAbderrahim\nELBAHI.NET" },
  { id: "t2", name: "🔄 Relance J+3", subject: "Re: Collaboration digitale — {{company}}", body: "Bonjour ,\n\nJe me permets de revenir vers vous suite à mon précédent message.\n\nJe serais ravi de vous présenter en 10 minutes comment nous avons aidé des entreprises similaires à {{company}} à augmenter leur visibilité en ligne de +150%.\n\nQuand seriez-vous disponible ?\n\nBien cordialement,\nAbderrahim\nELBAHI.NET" },
  { id: "t3", name: "🎁 Offre valeur", subject: "Audit gratuit pour {{company}}", body: "Bonjour ,\n\nPour vous montrer concrètement ce qu'ELBAHI.NET peut apporter à {{company}}, je vous propose un audit digital gratuit.\n\nCet audit inclut :\n- Analyse SEO de votre site\n- Benchmark concurrentiel\n- Recommandations personnalisées\n\nIntéressé(e) ? Un simple \"oui\" suffit.\n\nCordialement,\nAbderrahim\nELBAHI.NET" },
  { id: "t4", name: "👋 Dernier follow-up", subject: "Dernière tentative — {{company}}", body: "Bonjour ,\n\nJe ne veux pas encombrer votre boîte mail, donc ce sera mon dernier message.\n\nSi le digital n'est pas une priorité pour {{company}} en ce moment, je comprends tout à fait.\n\nJe vous souhaite une excellente continuation.\n\nCordialement,\nAbderrahim\nELBAHI.NET" },
  { id: "t5", name: "🏆 Social proof", subject: "Comment nous avons aidé une entreprise similaire à {{company}}", body: "Bonjour ,\n\nNous avons récemment accompagné une entreprise du secteur {{sector}} à {{city}}. Résultats en 3 mois :\n\n→ +180% de trafic qualifié\n→ +85 leads/mois via le site\n→ ROI de 4.5x sur les campagnes\n\nJe serais heureux de discuter comment reproduire ces résultats pour {{company}}.\n\n15 minutes cette semaine ?\n\nAbderrahim\nELBAHI.NET" },
];

const WA_TEMPLATES = {
  intro:    (lead: any) => `Bonjour ${(lead?.name||'').split(' ')[0]},\n\nJe suis Abderrahim d'ELBAHI.NET.\n\nJ'ai remarque ${lead?.company} et j'aimerais echanger 10 min sur votre strategie digitale.\n\nwww.elbahi.net`,
  followup: (lead: any) => `Bonjour ${(lead?.name||'').split(' ')[0]},\n\nJe reviens suite a mon precedent message.\n\nToujours partant pour discuter de ${lead?.company} ?\n\nAbderrahim - ELBAHI.NET`,
  proposal: (lead: any) => `Bonjour ${(lead?.name||'').split(' ')[0]},\n\nVoici notre proposition pour ${lead?.company}.\n\nDocument en piece jointe.\n\nVos questions sont les bienvenues !\n\nAbderrahim - ELBAHI.NET`,
  catalog:  ()     => `Bonjour,\n\nNos services ELBAHI.NET :\n\n- Sites web\n- Marketing digital\n- Design & Branding\n- SEO\n\nTarifs adaptes au Maroc.\n\nInteresse(e) ? Repondez OUI !`,
};

// ── Score helpers ──────────────────────────────────────────────────────────────
const scoreConfig = (s: number) =>
  s >= 80 ? { color: "#17c653", bg: "rgba(23,198,83,0.1)", label: "Hot" }
  : s >= 60 ? { color: "#f6b100", bg: "rgba(246,177,0,0.1)", label: "Warm" }
  : { color: "#f8285a", bg: "rgba(248,40,90,0.1)", label: "Cold" };

function ScoreBadge({ score }: { score: number }) {
  const c = scoreConfig(score);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: c.bg, border: `1px solid ${c.color}20` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: c.color, fontVariantNumeric: "tabular-nums" }}>{score}</span>
    </span>
  );
}

function KpiCard({ icon, label, value, trend, accent }: { icon: string; label: string; value: string | number; trend?: string; accent: string }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #f1f1f4", borderRadius: 12, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14, flex: "1 1 160px", minWidth: 140 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: `${accent}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <i className={icon} style={{ fontSize: 18, color: accent }} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#071437", lineHeight: 1.2, fontVariantNumeric: "tabular-nums" }}>{value}</div>
        <div style={{ fontSize: 12, color: "#99a1b7", fontWeight: 500, marginTop: 2 }}>{label}</div>
        {trend && <div style={{ fontSize: 11, color: "#17c653", fontWeight: 600, marginTop: 3 }}>{trend}</div>}
      </div>
    </div>
  );
}

// ── CRM Component ─────────────────────────────────────────────────────────────
export function CRM({ leads }: { leads: Lead[] }) {
  const [emails, setEmails] = useState<Email[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [emailCompose, setEmailCompose] = useState<EmailCompose | null>(null);
  const [crmFilter, setCrmFilter] = useState("all");
  const [hotLeadsPage, setHotLeadsPage] = useState(1);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("Tell him in one phrase no more something to win his attention");
  const [toast, setToast] = useState('');
  const HOT_LEADS_PER_PAGE = 5;
  const emailTemplates = DEFAULT_TEMPLATES;
  const API_BASE = (import.meta as any).env?.VITE_GATEWAY_BASE_URL || "http://localhost:8081/api";

  useEffect(() => {
    let cancelled = false;
    const loadCache = () => {
      try { const raw = localStorage.getItem("crm_emails_cache"); if (raw) { const cached = JSON.parse(raw) as Email[]; if (!cancelled && Array.isArray(cached) && cached.length) setEmails(cached); } } catch {}
    };
    const saveCache = (rows: Email[]) => { try { localStorage.setItem("crm_emails_cache", JSON.stringify(rows.slice(0, 500))); } catch {} };
    const mapRows = (rows: any[]): Email[] => rows.filter((it: any) => String(it.channel || "EMAIL").toUpperCase() === "EMAIL").map((it: any): Email => {
      const t = String(it.type || "MANUAL").toUpperCase();
      const mapType = t === "SEQUENCE" ? "sequence" : t === "MASSE" ? "bulk" : t === "MANUAL" ? "manual" : t.toLowerCase();
      const s = String(it.status || "SENT").toUpperCase();
      const mapStatus: "sent" | "scheduled" | "draft" | "bounced" = s === "BOUNCED" ? "bounced" : "sent";
      return { id: Number(it.id ?? Date.now()), leadId: Number(it.leadId ?? it.lead_id ?? 0), to: it.email ?? "", subject: it.subject ?? "", body: it.content ?? "", status: mapStatus, sentAt: it.sentAt ?? null, openedAt: it.openedAt ?? null, repliedAt: it.repliedAt ?? null, type: mapType };
    });
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_BASE}/interactions`); const data = await res.json().catch(() => []); const rows = Array.isArray(data) ? data : (data?.data ?? []);
        if (rows && rows.length) { const mapped = mapRows(rows); if (!cancelled) { setEmails(mapped); saveCache(mapped); } return; }
      } catch {}
    };
    loadCache(); fetchAll();
    return () => { cancelled = true; };
  }, [API_BASE, leads]);

  const applyTemplate = useCallback((template: EmailTemplate, lead: Lead) => {
    const vars: Record<string, string> = { "{{firstName}}": lead.name?.split(" ")[0] || "", "{{lastName}}": lead.name?.split(" ").slice(1).join(" ") || "", "{{company}}": lead.company || "", "{{sector}}": lead.sector || "", "{{city}}": lead.city || "", "{{role}}": lead.role || "", "{{email}}": lead.email || "" };
    let subject = template.subject; let body = template.body;
    Object.entries(vars).forEach(([k, v]) => { subject = subject.replaceAll(k, v); body = body.replaceAll(k, v); });
    return { subject, body };
  }, []);

  const handleSendEmail = useCallback((emailData: Omit<Email, "id">) => {
    const newEmail: Email = { id: Date.now(), ...emailData, status: emailData.status === "scheduled" ? "scheduled" : "sent", sentAt: emailData.status === "scheduled" ? null : new Date().toISOString() };
    setEmails(prev => [newEmail, ...prev]); setEmailCompose(null); return newEmail;
  }, []);

  const sendManualEmailApi = useCallback(async (leadId: number, to: string, subject: string, body: string) => {
    try { const r = await fetch(`${API_BASE}/actions/send-manual-email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId, email: to, subject, body }) }); return r.ok; } catch { return false; }
  }, [API_BASE]);

  const sendManualWhatsAppApi = useCallback(async (phoneNumber: string, body: string) => {
    try {
      const resp = await fetch(`${API_BASE}/whatsapp/actions/send-manual-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.replace(/\s+/g, ''), body })
      });
      return resp.ok;
    } catch { return false; }
  }, [API_BASE]);

  const startSequenceApi = useCallback(async (leadId: number) => { try { await fetch(`${API_BASE}/sequences/start/${leadId}`, { method: "POST" }); } catch {} }, [API_BASE]);

  const generateAiEmailApi = useCallback(async (email: string, userPrompt: string) => {
    try {
      const resp = await fetch(`${API_BASE}/claude/generate-and-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userPrompt })
      });
      return resp.ok;
    } catch { return false; }
  }, [API_BASE]);

  const generateAiWhatsAppApi = useCallback(async (phoneNumber: string, userPrompt: string) => {
    try {
      const resp = await fetch(`${API_BASE}/claude/generate-and-send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phoneNumber.replace(/\s+/g, ''), userPrompt })
      });
      return resp.ok;
    } catch { return false; }
  }, [API_BASE]);

  const handleCreateSequence = useCallback((leadIds: number[], templateIds: string[], intervalDays = 3) => {
    const newSeq: Sequence = { id: Date.now(), leadIds, steps: templateIds.map((tid, i) => ({ templateId: tid, day: i * intervalDays, status: i === 0 ? "active" : "pending" })), createdAt: new Date().toISOString(), status: "active", stats: { sent: 0, opened: 0, replied: 0 } };
    setSequences(prev => [newSeq, ...prev]);
    leadIds.forEach(lid => {
      const lead = leads.find(l => l.id === lid);
      if (lead && templateIds[0]) { const tmpl = emailTemplates.find(t => t.id === templateIds[0]); if (tmpl) { const { subject, body } = applyTemplate(tmpl, lead); handleSendEmail({ leadId: lid, to: lead.email, subject, body, type: "sequence", sequenceId: newSeq.id, sequenceStep: 0, status: "sent" }); } }
    });
    return newSeq;
  }, [leads, emailTemplates, applyTemplate, handleSendEmail]);

  const emailStats = useMemo(() => {
    const sent = emails.filter(e => e.status === "sent").length;
    const opened = emails.filter(e => e.openedAt).length;
    const replied = emails.filter(e => e.repliedAt).length;
    return { total: emails.length, sent, scheduled: emails.filter(e => e.status === "scheduled").length, opened, replied, openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0, replyRate: sent > 0 ? Math.round((replied / sent) * 100) : 0, activeSequences: sequences.filter(s => s.status === "active").length };
  }, [emails, sequences]);

  const statusStyle = { sent: { color: "#17c653", bg: "#17c65310", label: "Envoyé", icon: "fa-solid fa-check" }, scheduled: { color: "#f6b100", bg: "#f6b10010", label: "Planifié", icon: "fa-solid fa-clock" }, draft: { color: "#5e6278", bg: "#5e627810", label: "Brouillon", icon: "fa-regular fa-file" }, bounced: { color: "#f8285a", bg: "#f8285a10", label: "Bounced", icon: "fa-solid fa-triangle-exclamation" } };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: "#071437" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap" rel="stylesheet" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />

      {toast && (
        <div style={{ position:'fixed', top:20, right:20, zIndex:3000, background:'#0f172a', color:'#fff', padding:'12px 18px', borderRadius:12, fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8, boxShadow:'0 8px 32px rgba(0,0,0,0.2)', animation:'slideDown 0.3s ease' }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize:14 }} />{toast}
        </div>
      )}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#071437", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <i className="fa-solid fa-envelope" style={{ fontSize: 16, color: "#1b84ff" }} />
            CRM & Emails
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#99a1b7" }}>Envoyez, planifiez et suivez vos emails de prospection</p>
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        <KpiCard icon="fa-solid fa-paper-plane" label="Emails envoyés" value={emailStats.sent} accent="#1b84ff" />
        <KpiCard icon="fa-solid fa-eye" label="Taux d'ouverture" value={`${emailStats.openRate}%`} accent="#17c653" />
        <KpiCard icon="fa-solid fa-reply" label="Taux de réponse" value={`${emailStats.replyRate}%`} accent="#f6b100" />
        <KpiCard icon="fa-solid fa-rotate-right" label="Séquences actives" value={emailStats.activeSequences} accent="#7239ea" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* ── LEFT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Hot leads card */}
          <div style={{ background: "#fff", border: "1px solid #f1f1f4", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f1f1f4" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fff3e0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <i className="fa-solid fa-fire" style={{ fontSize: 14, color: "#fd7e14" }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#071437" }}>Prospects chauds</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#99a1b7" }}>À contacter en priorité</p>
                </div>
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#fafafa" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#99a1b7", textTransform: "uppercase", letterSpacing: "0.06em" }}>Entreprise</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#99a1b7", textTransform: "uppercase", letterSpacing: "0.06em" }}>Secteur</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#99a1b7", textTransform: "uppercase", letterSpacing: "0.06em" }}>Score</th>
                  <th style={{ padding: "10px 16px", textAlign: "right", fontSize: 11, fontWeight: 600, color: "#99a1b7", textTransform: "uppercase", letterSpacing: "0.06em" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const hotToContact = leads.filter(l => l.status?.toLowerCase() === "hot" && !emails.some(e => e.leadId === l.id));
                  const totalHot = hotToContact.length;
                  const totalPages = Math.ceil(totalHot / HOT_LEADS_PER_PAGE);
                  const paginated = hotToContact.slice((hotLeadsPage - 1) * HOT_LEADS_PER_PAGE, hotLeadsPage * HOT_LEADS_PER_PAGE);
                  if (totalHot === 0) return (
                    <tr><td colSpan={4} style={{ padding: "40px 16px", textAlign: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#e8fff3", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                        <i className="fa-solid fa-check" style={{ fontSize: 16, color: "#17c653" }} />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#5e6278" }}>Tous contactés !</div>
                      <div style={{ fontSize: 12, color: "#99a1b7", marginTop: 4 }}>Aucun prospect chaud en attente</div>
                    </td></tr>
                  );
                  return <>
                    {paginated.map(l => (
                      <tr key={l.id} style={{ borderTop: "1px solid #f1f1f4" }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontWeight: 600, color: "#071437", fontSize: 13 }}>{l.company}</div>
                          <div style={{ fontSize: 11, color: "#99a1b7", marginTop: 2 }}>{l.name} · {l.city}</div>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 12, color: "#5e6278" }}>{l.sector || "--"}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}><ScoreBadge score={l.score} /></td>
                        <td style={{ padding: "12px 16px", textAlign: "right" }}>
                          <button
                            onClick={() => {
                              setEmailCompose({ 
                                leadId: l.id, 
                                to: l.email, 
                                subject: "", 
                                body: "", 
                                type: "manual", 
                                channel: "email",
                                whatsappPhone: l.phone || "",
                                whatsappBody: ""
                              });
                            }}
                            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#071437", border: "none", borderRadius: 7, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                          >
                            <i className="fa-solid fa-paper-plane" style={{ fontSize: 10 }} />
                              proposition
                          </button>
                        </td>
                      </tr>
                    ))}
                    {totalPages > 1 && (
                      <tr style={{ borderTop: "1px solid #f1f1f4", background: "#fafafa" }}>
                        <td colSpan={4} style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "#99a1b7" }}>{(hotLeadsPage - 1) * HOT_LEADS_PER_PAGE + 1}–{Math.min(hotLeadsPage * HOT_LEADS_PER_PAGE, totalHot)} sur {totalHot}</span>
                            <div style={{ display: "flex", gap: 4 }}>
                              {[{ disabled: hotLeadsPage === 1, onClick: () => setHotLeadsPage(p => p - 1), icon: "fa-chevron-left" }, { disabled: hotLeadsPage === totalPages, onClick: () => setHotLeadsPage(p => p + 1), icon: "fa-chevron-right" }].map((btn, i) => (
                                <button key={i} disabled={btn.disabled} onClick={btn.onClick} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #e1e3ea", background: btn.disabled ? "#fafafa" : "#fff", color: btn.disabled ? "#c4cada" : "#5e6278", cursor: btn.disabled ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <i className={`fa-solid ${btn.icon}`} style={{ fontSize: 9 }} />
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>;
                })()}
              </tbody>
            </table>
          </div>

          {/* Prospect status breakdown */}
          <div style={{ background: "#fff", border: "1px solid #f1f1f4", borderRadius: 12, padding: "18px 20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700, color: "#071437", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-users" style={{ fontSize: 13, color: "#1b84ff" }} />
              Statut des prospects
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Non contactés", icon: "fa-regular fa-circle", color: "#99a1b7", count: leads.filter(l => !emails.some(e => e.leadId === l.id)).length },
                { label: "Email envoyé", icon: "fa-solid fa-paper-plane", color: "#1b84ff", count: leads.filter(l => emails.some(e => e.leadId === l.id && e.status === "sent")).length },
                { label: "En séquence", icon: "fa-solid fa-rotate-right", color: "#7239ea", count: leads.filter(l => sequences.some(s => s.status === "active" && s.leadIds.includes(l.id))).length },
                { label: "En attente réponse", icon: "fa-solid fa-hourglass-half", color: "#f6b100", count: emails.filter(e => e.status === "sent" && !e.repliedAt).length },
              ].map(s => {
                const total = leads.length || 1;
                const pct = Math.round((s.count / total) * 100);
                return (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${s.color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <i className={s.icon} style={{ fontSize: 11, color: s.color }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "#5e6278" }}>{s.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#071437" }}>{s.count}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 4, background: "#f1f1f4", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: s.color, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", gap: 4, background: "#fff", border: "1px solid #f1f1f4", borderRadius: 10, padding: 4 }}>
            {[{ k: "all", l: "Tous", count: emails.length }, { k: "sent", l: "Envoyés", count: emails.filter(e => e.status === "sent").length }, { k: "whatsapp", l: "WhatsApp", count: emails.filter(e => e.type === "whatsapp").length }, { k: "scheduled", l: "Planifiés", count: emails.filter(e => e.status === "scheduled").length }].map(f => (
              <button key={f.k} onClick={() => setCrmFilter(f.k)}
                style={{ flex: 1, padding: "7px 10px", borderRadius: 7, border: "none", background: crmFilter === f.k ? "#071437" : "transparent", color: crmFilter === f.k ? "#fff" : "#5e6278", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, transition: "all 0.15s" }}
              >
                {f.l}
                <span style={{ padding: "1px 6px", borderRadius: 10, background: crmFilter === f.k ? "rgba(255,255,255,0.2)" : "#f1f1f4", color: crmFilter === f.k ? "#fff" : "#99a1b7", fontSize: 10, fontWeight: 700 }}>{f.count}</span>
              </button>
            ))}
          </div>

          {/* Email history */}
          <div style={{ background: "#fff", border: "1px solid #f1f1f4", borderRadius: 12, overflow: "hidden", flex: 1 }}>
            <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid #f1f1f4", display: "flex", alignItems: "center", gap: 8 }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: 13, color: "#99a1b7" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#071437" }}>Historique des emails</span>
              <span style={{ marginLeft: "auto", padding: "2px 8px", background: "#f1f1f4", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#5e6278" }}>{emails.length}</span>
            </div>
            {emails.length === 0 ? (
              <div style={{ padding: "50px 16px", textAlign: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "#f9f9f9", border: "1px solid #f1f1f4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <i className="fa-solid fa-envelope-open" style={{ fontSize: 20, color: "#c4cada" }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#5e6278" }}>Aucun email envoyé</div>
                <div style={{ fontSize: 12, color: "#99a1b7", marginTop: 4 }}>Composez votre premier email ci-dessus</div>
              </div>
            ) : (
              <div style={{ maxHeight: 480, overflowY: "auto" }}>
                {emails.filter(e => crmFilter === "all" || (crmFilter === "whatsapp" ? e.type === "whatsapp" : e.status === crmFilter)).map((email, idx) => {
                  const lead = leads.find(l => l.id === email.leadId);
                  const st = statusStyle[email.status] || statusStyle.sent;
                  const isWA = email.type === "whatsapp";
                  return (
                    <div key={email.id} style={{ padding: "14px 20px", borderBottom: idx < emails.length - 1 ? "1px solid #f9f9f9" : "none", display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: isWA ? "#17c65312" : "#1b84ff12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <i className={isWA ? "fa-brands fa-whatsapp" : "fa-solid fa-envelope"} style={{ fontSize: 15, color: isWA ? "#17c653" : "#1b84ff" }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#071437", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 200 }}>{email.subject}</span>
                          <span style={{ marginLeft: "auto", padding: "2px 8px", borderRadius: 5, background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <i className={st.icon} style={{ fontSize: 9 }} />{st.label}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: "#99a1b7", marginBottom: 4 }}>{lead?.name || email.to} · {lead?.company}</div>
                        <div style={{ fontSize: 11, color: "#c4cada", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email.body?.slice(0, 80)}…</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                          {email.type !== "manual" && (
                            <span style={{ padding: "1px 6px", background: "#f1f1f4", borderRadius: 4, fontSize: 10, fontWeight: 600, color: "#5e6278", textTransform: "uppercase" }}>
                              {email.type === "sequence" ? "Séquence" : email.type === "bulk" ? "Masse" : email.type === "whatsapp" ? "WhatsApp" : email.type}
                            </span>
                          )}
                          {email.sentAt && <span style={{ fontSize: 10, color: "#99a1b7" }}>{new Date(email.sentAt).toLocaleString("fr-MA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── COMPOSE MODAL ── */}
      {emailCompose && (
        <div onClick={() => setEmailCompose(null)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)", zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: 680, maxHeight: "92vh", background: "#fff", borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 40px 100px rgba(0,0,0,0.3)" }}>
            {/* Header */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="fa-solid fa-paper-plane" /> Envoyer une proposition
                </div>
                {(() => {
                  const lead = leads.find(l => l.id === emailCompose.leadId);
                  return lead ? (
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
                      {lead.name} &middot; {lead.company} &middot; {lead.city}
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>Composer un message</div>
                  );
                })()}
              </div>
              <button onClick={() => setEmailCompose(null)} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Recipient info */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Destinataire</label>
                {(() => {
                  const lead = leads.find(l => l.id === emailCompose.leadId);
                  return (
                    <div style={{ padding: "10px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13 }}>
                        {lead?.company?.[0] || "?"}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#071437" }}>{lead?.company || "Entreprise inconnue"}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{lead?.email || "Email inconnu"}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Channel Toggle */}
              <div>
                <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Canal d'envoi</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ k: "email", label: "Email", icon: "fa-solid fa-envelope", desc: "SMTP / API" }, { k: "whatsapp", label: "WhatsApp", icon: "fa-brands fa-whatsapp", desc: "Business API" }, { k: "both", label: "Les deux", icon: "fa-solid fa-layer-group", desc: "Multi-canal" }].map(ch => {
                    const active = (emailCompose.channel || "email") === ch.k;
                    return (
                      <button key={ch.k} onClick={() => setEmailCompose(prev => prev ? { ...prev, channel: ch.k } : prev)}
                        style={{ flex: 1, padding: "10px 8px", borderRadius: 10, cursor: "pointer", background: active ? "#f1f5f9" : "#f8fafc", border: `1.5px solid ${active ? "#475569" : "#e2e8f0"}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <i className={ch.icon} style={{ fontSize: 15, color: active ? "#0f172a" : "#94a3b8" }} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#0f172a" : "#94a3b8" }}>{ch.label}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>{ch.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AI Assistant Section */}
              <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderRadius: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: "#7c3aed" }}><i className="fa-solid fa-robot" />Claude AI — Rédaction assistée</div>
                <div>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7c3aed", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Prompt</label>
                  <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Décrivez ce que vous voulez que Claude écrive..."
                    style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid #d8b4fe", borderRadius: 8, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
                </div>
                <button
                  onClick={async () => {
                    const lead = leads.find(l => l.id === emailCompose.leadId); if (!lead) return;
                    setAiLoading(true);
                    try {
                      const channel = emailCompose.channel || "email";
                      if (channel === 'email' || channel === 'both') {
                        await generateAiEmailApi(lead.email, aiPrompt);
                      }
                      if (channel === 'whatsapp' || channel === 'both') {
                        await generateAiWhatsAppApi(lead.phone, aiPrompt);
                      }
                      setToast('Message IA envoyé ✓'); setTimeout(() => setToast(''), 3000);
                      setEmailCompose(null);
                    } catch {
                      setToast('Echec envoi IA'); setTimeout(() => setToast(''), 3000);
                    }
                    setAiLoading(false);
                  }}
                  disabled={aiLoading}
                  style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px", background: aiLoading ? "#f5f3ff" : "linear-gradient(135deg, #7c3aed, #4338ca)", border: "none", borderRadius: 8, color: aiLoading ? "#a78bfa" : "#fff", fontSize: 13, fontWeight: 700, cursor: aiLoading ? "wait" : "pointer", fontFamily: "inherit", boxShadow: aiLoading ? "none" : "0 2px 8px rgba(124, 58, 237, 0.35)" }}>
                  <i className={aiLoading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-wand-magic-sparkles"} style={{ fontSize: 13 }} />
                  {aiLoading ? "Génération en cours..." : "Rédiger avec Claude AI"}
                </button>
              </div>

              {/* Email Fields */}
              {(emailCompose.channel === "email" || emailCompose.channel === "both" || !emailCompose.channel) && (
                <div style={{ background: "#f0f4ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: "#0f172a" }}><i className="fa-solid fa-envelope" /> Email</div>
                  
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Objet</label>
                    <input value={emailCompose.subject} onChange={e => setEmailCompose(prev => prev ? { ...prev, subject: e.target.value } : prev)} placeholder="Objet de l'email..."
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#071437", outline: "none", fontFamily: "inherit" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Message</label>
                    <textarea value={emailCompose.body} onChange={e => setEmailCompose(prev => prev ? { ...prev, body: e.target.value } : prev)} placeholder="Votre message..." rows={5}
                      style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#071437", outline: "none", resize: "vertical", lineHeight: 1.7, fontFamily: "inherit" }} />
                  </div>
                </div>
              )}

              {/* WhatsApp Fields */}
              {(emailCompose.channel === "whatsapp" || emailCompose.channel === "both") && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, fontWeight: 700, fontSize: 13, color: "#0f172a" }}><i className="fa-brands fa-whatsapp" style={{ fontSize: 16 }} /> WhatsApp Business</div>
                  
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Numéro WhatsApp</label>
                    <input value={emailCompose.whatsappPhone || (emailCompose.leadId ? leads.find(l => l.id === emailCompose.leadId)?.phone || "" : "")} onChange={e => setEmailCompose(prev => prev ? { ...prev, whatsappPhone: e.target.value } : prev)} placeholder="+212 6XX XX XX XX"
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 7, fontSize: 13, outline: "none", fontFamily: "monospace" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>Message WhatsApp</label>
                    <textarea value={emailCompose.whatsappBody || emailCompose.body || ""} onChange={e => setEmailCompose(prev => prev ? { ...prev, whatsappBody: e.target.value } : prev)} rows={5} placeholder="Message WhatsApp..."
                      style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, color: "#071437", outline: "none", resize: "vertical", lineHeight: 1.7, fontFamily: "inherit" }} />
                  </div>
                  <div style={{ padding: "8px 12px", background: "rgba(0,0,0,0.02)", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 11, color: "#64748b", lineHeight: 1.5, display: "flex", gap: 8 }}>
                    <i className="fa-solid fa-circle-info" style={{ color: "#94a3b8", marginTop: 1, flexShrink: 0 }} />
                    <span>Nécessite un numéro vérifié Meta Business. Coût : ~0.05 MAD/message.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 8 }}>
                <i className="fa-solid fa-at" style={{ fontSize: 11 }} />
                {(() => {
                  const lead = leads.find(l => l.id === emailCompose.leadId);
                  return lead?.email || "--";
                })()}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEmailCompose(null)} style={{ padding: "9px 18px", border: "1px solid #e2e8f0", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
                
                <button onClick={async () => {
                  if (!emailCompose.leadId) return;
                  const lead = leads.find(l => l.id === emailCompose.leadId);
                  if (!lead) return;

                  const channel = emailCompose.channel || "email";
                  let success = false;
                  let sentAnything = false;

                  // Handle WhatsApp
                  if (channel === 'whatsapp' || channel === 'both') {
                    const phone = emailCompose.whatsappPhone || lead.phone;
                    const body = emailCompose.whatsappBody || emailCompose.body;
                    if (phone && body) {
                      const ok = await sendManualWhatsAppApi(phone, body);
                      if (ok) {
                        handleSendEmail({ leadId: emailCompose.leadId, to: lead.email, type: "whatsapp", subject: `[WhatsApp] ${emailCompose.subject || "Message"}`, body: body, status: "sent" });
                        sentAnything = true;
                        success = true;
                      } else {
                        setToast('Echec envoi WhatsApp'); setTimeout(() => setToast(''), 3000);
                        if (channel === 'whatsapp') return;
                      }
                    }
                  }

                  // Handle Email
                  if (channel === 'email' || channel === 'both') {
                    if (lead.email && emailCompose.subject && emailCompose.body) {
                      const ok = await sendManualEmailApi(emailCompose.leadId, lead.email, emailCompose.subject, emailCompose.body);
                      if (ok) {
                        handleSendEmail({ leadId: emailCompose.leadId, to: lead.email, subject: emailCompose.subject, body: emailCompose.body, type: "manual", status: "sent" });
                        sentAnything = true;
                        success = true;
                      } else {
                        setToast('Echec envoi email'); setTimeout(() => setToast(''), 3000);
                        if (channel === 'email') return;
                      }
                    }
                  }

                  if (sentAnything) {
                     setToast(channel === 'both' ? 'Email + WhatsApp envoyés ✓' : (channel === 'whatsapp' ? 'WhatsApp envoyé ✓' : 'Email envoyé ✓'));
                     setTimeout(() => setToast(''), 3000);
                     setEmailCompose(null);
                   }
                 }} 
                 disabled={(() => {
                   if (!emailCompose.leadId) return true;
                   const ch = emailCompose.channel || "email";
                   if (ch === 'email' || ch === 'both') {
                     if (!emailCompose.subject || !emailCompose.body) return true;
                   }
                   if (ch === 'whatsapp' || ch === 'both') {
                     const phone = emailCompose.whatsappPhone || leads.find(l => l.id === emailCompose.leadId)?.phone;
                     const body = emailCompose.whatsappBody || emailCompose.body;
                     if (!phone || !body) return true;
                   }
                   return false;
                 })()}
                 style={{ padding: "9px 22px", background: "#0f172a", border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                   <i className={emailCompose.channel === 'whatsapp' ? "fa-brands fa-whatsapp" : "fa-solid fa-paper-plane"} />
                   {emailCompose.channel === 'both' ? 'Envoyer les deux' : 'Envoyer'}
                 </button>

                <button onClick={() => { if (emailCompose.leadId) { startSequenceApi(emailCompose.leadId); handleCreateSequence([emailCompose.leadId], [], 3); setEmailCompose(null); setToast('Séquence lancée ✓'); setTimeout(() => setToast(''), 3000); } }}
                  disabled={!emailCompose.leadId}
                  style={{ padding: "9px 18px", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "inherit" }}>
                  <i className="fa-solid fa-rotate-right" />Lancer séquence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}