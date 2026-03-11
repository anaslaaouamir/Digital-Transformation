import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';

function useFontAwesome() {
  useEffect(() => {
    const id = 'fa-cdn';
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id; link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
    document.head.appendChild(link);
  }, []);
}

export type Interaction = {
  id: string;
  leadId: number;
  company: string;
  contactName?: string;
  city?: string;
  sector?: string;
  phone?: string;
  email?: string;
  channel: 'EMAIL' | 'WHATSAPP';
  status: 'SENT' | 'OPENED' | 'REPLIED' | 'BOUNCED';
  contactStatus?: string;
  interactionType?: string;
  sequenceStatus?: string;
  sentAt: string;
  openedAt?: string;
  repliedAt?: string;
};

const EMPTY_LEADS: any[] = [];

const CHANNEL_LIST           = ['EMAIL', 'WHATSAPP'];
const STATUS_LIST            = ['SENT', 'OPENED', 'REPLIED', 'BOUNCED'];
const CONTACT_STATUS_LIST = [
  'NON_CONTACTE','EN_SEQUENCE',
  'MASSE_EMAIL_ENVOYE','MASS_WHATSAPP_ENVOYE',
  'MANUAL_EMAIL_ENVOYE','MANUAL_WHATSAPP_ENVOYE',
  'AI_EMAIL_ENVOYE','AI_WHATSAPP_ENVOYE',
  'TERMINE_SANS_REPONSE','A_REPONDU',
  'BOUNCED_EMAIL','BOUNCED_PHONENUMBER',
];
const INTERACTION_TYPE_LIST  = ['MANUAL','SEQUENCE','AI_GENERATED','MASSE','RESPONSE'];
const SEQ_ENROLLMENT_STATUS  = ['ACTIVE','PAUSED','COMPLETED','CANCELLED'];

const EMAIL_TEMPLATES = [
  { id: 't1', name: 'Premiere approche',  subject: 'Collaboration digitale -- {{company}}',              body: "Bonjour,\n\nJ'ai decouvert {{company}} dans le secteur {{sector}} a {{city}}.\n\nChez ELBAHI.NET, nous accompagnons les entreprises marocaines dans leur transformation digitale.\n\nDisponible pour 15 minutes cette semaine ?\n\nCordialement,\nAbderrahim\nELBAHI.NET" },
  { id: 't2', name: 'Relance J+3',        subject: 'Re: Collaboration -- {{company}}',                   body: "Bonjour,\n\nJe me permets de revenir vers vous. Nous avons aide des entreprises similaires a {{company}} a augmenter leur visibilite de +150%.\n\nQuand seriez-vous disponible ?\n\nBien cordialement,\nAbderrahim\nELBAHI.NET" },
  { id: 't3', name: 'Audit gratuit',      subject: 'Audit gratuit pour {{company}}',                    body: "Bonjour ,\n\nJe vous propose un audit digital gratuit de {{company}} incluant :\n- Analyse SEO\n- Benchmark concurrentiel\n- Recommandations personnalisees\n\nUn simple oui suffit !\n\nAbderrahim\nELBAHI.NET" },
  { id: 't4', name: 'Social proof',       subject: 'Resultats pour une entreprise similaire',           body: "Bonjour ,\n\nNous avons accompagne une entreprise {{sector}} a {{city}} :\n-> +180% trafic qualifie\n-> +85 leads/mois\n-> ROI 4.5x\n\nDiscutons comment reproduire ces resultats pour {{company}}.\n\n15 minutes ?\n\nAbderrahim\nELBAHI.NET" },
  { id: 't5', name: 'Dernier contact',    subject: 'Derniere tentative -- {{company}}',                 body: "Bonjour ,\n\nCe sera mon dernier message. Si le digital n'est pas prioritaire pour {{company}} en ce moment, je comprends.\n\nN'hesitez pas a me recontacter quand le moment sera venu.\n\nAbderrahim\nELBAHI.NET" },
];

const WA_TEMPLATES = {
  intro:    (lead) => `Bonjour ${(lead?.name||'').split(' ')[0]},\n\nJe suis Abderrahim d'ELBAHI.NET.\n\nJ'ai remarque ${lead?.company} et j'aimerais echanger 10 min sur votre strategie digitale.\n\nwww.elbahi.net`,
  followup: (lead) => `Bonjour ${(lead?.name||'').split(' ')[0]},\n\nJe reviens suite a mon precedent message.\n\nToujours partant pour discuter de ${lead?.company} ?\n\nAbderrahim - ELBAHI.NET`,
  proposal: (lead) => `Bonjour ${(lead?.name||'').split(' ')[0]},\n\nVoici notre proposition pour ${lead?.company}.\n\nDocument en piece jointe.\n\nVos questions sont les bienvenues !\n\nAbderrahim - ELBAHI.NET`,
  catalog:  ()     => `Bonjour,\n\nNos services ELBAHI.NET :\n\n- Sites web\n- Marketing digital\n- Design & Branding\n- SEO\n\nTarifs adaptes au Maroc.\n\nInteresse(e) ? Repondez OUI !`,
};

const QUICK_ATTACHMENTS = [
  { name: 'Proposition commerciale.pdf', size: 2400000 },
  { name: 'Strategie digitale.pdf',      size: 1800000 },
  { name: 'Grille tarifaire.pdf',        size:  850000 },
  { name: 'Etude de cas client.pdf',     size: 3200000 },
  { name: 'Presentation agence.pptx',    size: 5600000 },
];

function applyTemplate(tmpl, lead) {
  const vars = {
    '{{firstName}}': (lead?.name||'').split(' ')[0],
    '{{company}}':   lead?.company || '',
    '{{sector}}':    lead?.sector  || '',
    '{{city}}':      lead?.city    || '',
    '{{email}}':     lead?.email   || '',
  };
  let subject = tmpl.subject, body = tmpl.body;
  Object.entries(vars).forEach(([k,v]) => { subject = subject.replaceAll(k,v); body = body.replaceAll(k,v); });
  return { subject, body };
}

/* ─── Style maps ─── */
const STATUS_CFG = {
  SENT:    { bg:'#f8fafc', text:'#475569', border:'#cbd5e1', icon:'fa-solid fa-paper-plane',          label:'Envoye'  },
  OPENED:  { bg:'#fffbeb', text:'#b45309', border:'#fcd34d', icon:'fa-solid fa-envelope-open',        label:'Ouvert'  },
  REPLIED: { bg:'#ecfdf5', text:'#047857', border:'#6ee7b7', icon:'fa-solid fa-reply',                label:'Repondu' },
  RECEIVED:{ bg:'#e0f2fe', text:'#0284c7', border:'#bae6fd', icon:'fa-solid fa-inbox',                label:'Recu'    },
  BOUNCED: { bg:'#fef2f2', text:'#b91c1c', border:'#fecaca', icon:'fa-solid fa-triangle-exclamation', label:'Bounce'  },
};

const CHANNEL_CFG = {
  EMAIL:     { color:'#2563eb', icon:'fa-solid fa-envelope',     label:'EMAIL'     },
  WHATSAPP:  { color:'#16a34a', icon:'fa-brands fa-whatsapp',    label:'WHATSAPP'  },
};

const CONTACT_STATUS_CFG = {
  NON_CONTACTE:           { bg:'#f1f5f9', text:'#475569', border:'#e2e8f0', icon:'fa-solid fa-circle',               label:'Non contacte'     },
  EN_SEQUENCE:            { bg:'#eef2ff', text:'#4338ca', border:'#a5b4fc', icon:'fa-solid fa-diagram-project',      label:'En sequence'      },
  MASSE_EMAIL_ENVOYE:     { bg:'#f5f3ff', text:'#5b21b6', border:'#c4b5fd', icon:'fa-solid fa-bullhorn',             label:'Email masse'      },
  MASS_WHATSAPP_ENVOYE:   { bg:'#f0fdf4', text:'#15803d', border:'#bbf7d0', icon:'fa-brands fa-whatsapp',            label:'WA masse'         },
  MANUAL_EMAIL_ENVOYE:    { bg:'#f0f9ff', text:'#0369a1', border:'#bae6fd', icon:'fa-solid fa-keyboard',             label:'Email manuel'     },
  MANUAL_WHATSAPP_ENVOYE: { bg:'#dcfce7', text:'#166534', border:'#86efac', icon:'fa-brands fa-whatsapp',            label:'WA manuel'        },
  AI_EMAIL_ENVOYE:        { bg:'#fdf4ff', text:'#7c3aed', border:'#e9d5ff', icon:'fa-solid fa-robot',                label:'Email IA'         },
  AI_WHATSAPP_ENVOYE:     { bg:'#faf5ff', text:'#6d28d9', border:'#d8b4fe', icon:'fa-solid fa-robot',                label:'WA IA'            },
  TERMINE_SANS_REPONSE:   { bg:'#fff7ed', text:'#9a3412', border:'#fdba74', icon:'fa-solid fa-clock-rotate-left',    label:'Sans reponse'     },
  A_REPONDU:              { bg:'#ecfdf5', text:'#047857', border:'#6ee7b7', icon:'fa-solid fa-check',                label:'A repondu'        },
  BOUNCED_EMAIL:          { bg:'#fef2f2', text:'#b91c1c', border:'#fecaca', icon:'fa-solid fa-triangle-exclamation', label:'Email bounce'     },
  BOUNCED_PHONENUMBER:    { bg:'#fff1f2', text:'#be123c', border:'#fda4af', icon:'fa-solid fa-phone-slash',          label:'WA bounce'        },
};

const ITYPE_CFG = {
  MANUAL:       { icon:'fa-solid fa-keyboard',          label:'Manuel'   },
  SEQUENCE:     { icon:'fa-solid fa-diagram-project',   label:'Sequence' },
  AI_GENERATED: { icon:'fa-solid fa-robot',             label:'IA'       },
  MASSE:        { icon:'fa-solid fa-bullhorn',          label:'Masse'    },
  RESPONSE:     { icon:'fa-solid fa-reply',             label:'Reponse'  },
};

const SEQ_CFG = {
  ACTIVE:    { bg:'#ecfdf5', text:'#047857', border:'#6ee7b7', icon:'fa-solid fa-play',        label:'Active'    },
  PAUSED:    { bg:'#fffbeb', text:'#b45309', border:'#fcd34d', icon:'fa-solid fa-pause',       label:'En pause'  },
  COMPLETED: { bg:'#f1f5f9', text:'#475569', border:'#e2e8f0', icon:'fa-solid fa-check-double',label:'Terminee'  },
  CANCELLED: { bg:'#fef2f2', text:'#b91c1c', border:'#fecaca', icon:'fa-solid fa-xmark',       label:'Annulee'   },
};

/* ─── Formatters ─── */
const fmtDate = (iso) => {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('fr-MA', { day:'2-digit', month:'short', year:'numeric' });
};
const fmtTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('fr-MA', { hour:'2-digit', minute:'2-digit' });
};
const timeAgo = (iso) => {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  const d  = Math.floor(ms / 86400000);
  const h  = Math.floor(ms / 3600000);
  if (d > 0) return `il y a ${d}j`;
  if (h > 0) return `il y a ${h}h`;
  return "a l'instant";
};
const fmtSize = (b) => b > 1e6 ? `${(b/1e6).toFixed(1)} MB` : `${Math.round(b/1000)} KB`;
const getReplyAt = (row: any) => row?.repliedAt || ((row?.interactionType === 'RESPONSE' || (row as any)?.type === 'RESPONSE') ? row?.sentAt : undefined);

/* ─── Shared micro-styles ─── */
const S = {
  input: {
    width:'100%', boxSizing:'border-box', padding:'9px 11px',
    border:'1px solid #e2e8f0', borderRadius:7, fontSize:13,
    color:'#0f172a', outline:'none', background:'#fff', fontFamily:'inherit',
  },
  label: {
    display:'block', fontSize:10, fontWeight:700, color:'#94a3b8',
    textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:5,
  },
  card: {
    background:'#fff', border:'1px solid #e2e8f0', borderRadius:12,
    boxShadow:'0 1px 3px rgba(0,0,0,0.05)',
  },
  tag: (bg, text, border) => ({
    display:'inline-flex', alignItems:'center', gap:5,
    background:bg, color:text, border:`1px solid ${border}`,
    borderRadius:20, padding:'3px 10px', fontSize:11, fontWeight:600,
    whiteSpace:'nowrap',
  }),
};

/* ══════════════════════════════════════════
   SMALL BADGE COMPONENTS
══════════════════════════════════════════ */
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] || STATUS_CFG.SENT;
  return (
    <span style={S.tag(c.bg, c.text, c.border)}>
      <i className={c.icon} style={{ fontSize:10 }} />
      {c.label}
    </span>
  );
}

function ChannelBadge({ channel }) {
  const c = CHANNEL_CFG[channel] || CHANNEL_CFG.EMAIL;
  return (
    <span style={S.tag('#f8fafc', c.color, '#e2e8f0')}>
      <i className={c.icon} style={{ fontSize:12 }} />
      <span style={{ fontWeight:700 }}>{c.label}</span>
    </span>
  );
}

function ITypeBadge({ type }) {
  const c = ITYPE_CFG[type] || { icon:'fa-solid fa-circle', label:type };
  return (
    <span style={S.tag('#f8fafc', '#475569', '#e2e8f0')}>
      <i className={c.icon} style={{ fontSize:10 }} />
      {c.label}
    </span>
  );
}

function ContactStatusBadge({ status }) {
  const c = CONTACT_STATUS_CFG[status] || CONTACT_STATUS_CFG.NON_CONTACTE;
  return (
    <span style={S.tag(c.bg, c.text, c.border)}>
      <i className={c.icon} style={{ fontSize:10 }} />
      {c.label}
    </span>
  );
}

function SeqBadge({ status }) {
  const c = SEQ_CFG[status] || SEQ_CFG.ACTIVE;
  return (
    <span style={S.tag(c.bg, c.text, c.border)}>
      <i className={c.icon} style={{ fontSize:10 }} />
      {c.label}
    </span>
  );
}

/* ── Stat card ── */
function StatCard({ label, value, icon }) {
  const THEME = {
    Total:           { accent:'#2563eb', bg:'#eff6ff' },
    Repondus:        { accent:'#059669', bg:'#ecfdf5' },
    Ouverts:         { accent:'#d97706', bg:'#fffbeb' },
    'Taux de reponse': { accent:'#7c3aed', bg:'#f5f3ff' },
  };
  const t = THEME[label] || { accent:'#64748b', bg:'#f1f5f9' };
  return (
    <div style={{ ...S.card, padding:'14px 18px', display:'flex', alignItems:'center', gap:12, flex:'1 1 130px', minWidth:120, borderLeft:`3px solid ${t.accent}` }}>
      <div style={{ width:38, height:38, borderRadius:10, background:t.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <i className={icon} style={{ fontSize:16, color:t.accent }} />
      </div>
      <div>
        <div style={{ fontSize:20, fontWeight:700, color:'#0f172a', lineHeight:1.1 }}>{value}</div>
        <div style={{ fontSize:11, color:t.accent, fontWeight:700, marginTop:2 }}>{label}</div>
      </div>
    </div>
  );
}

/* ── Pagination button ── */
function PagBtn({ onClick, disabled, label, active }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:30, height:30, borderRadius:6, border:'1px solid #e2e8f0',
      background: active ? '#0f172a' : disabled ? '#f8fafc' : '#fff',
      color:      active ? '#fff'    : disabled ? '#cbd5e1' : '#475569',
      fontWeight:600, fontSize:13, cursor:disabled?'default':'pointer',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {label}
    </button>
  );
}

/* ══════════════════════════════════════════
   AI PREVIEW PANEL
══════════════════════════════════════════ */
function AiPreviewPanel({ preview, onUse, onDiscard, channel }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)',
      border: '1.5px solid #a5b4fc',
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontWeight:700, fontSize:13, color:'#4338ca' }}>
          <i className="fa-solid fa-robot" style={{ fontSize:14 }} />
          Aperçu généré par Claude AI
        </div>
        <div style={{ display:'flex', gap:6 }}>
          <button
            onClick={onDiscard}
            style={{ padding:'5px 12px', border:'1px solid #e2e8f0', borderRadius:7, background:'#fff', color:'#64748b', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}
          >
            <i className="fa-solid fa-xmark" style={{ fontSize:10 }} />
            Rejeter
          </button>
          <button
            onClick={onUse}
            style={{ padding:'5px 14px', border:'none', borderRadius:7, background:'#4338ca', color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', display:'inline-flex', alignItems:'center', gap:5 }}
          >
            <i className="fa-solid fa-check" style={{ fontSize:10 }} />
            Utiliser ce message
          </button>
        </div>
      </div>

      {/* Preview content */}
      {preview.subject && (channel === 'email' || channel === 'both') && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Objet</div>
          <div style={{ background:'#fff', border:'1px solid #c4b5fd', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#0f172a', fontWeight:600 }}>
            {preview.subject}
          </div>
        </div>
      )}

      {preview.body && (channel === 'email' || channel === 'both') && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Message Email</div>
          <div style={{ background:'#fff', border:'1px solid #c4b5fd', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#334155', lineHeight:1.6, whiteSpace:'pre-wrap', maxHeight:160, overflowY:'auto' }}>
            {preview.body}
          </div>
        </div>
      )}

      {preview.waBody && (channel === 'whatsapp' || channel === 'both') && (
        <div>
          <div style={{ fontSize:10, fontWeight:700, color:'#15803d', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>Message WhatsApp</div>
          <div style={{ background:'#fff', border:'1px solid #bbf7d0', borderRadius:8, padding:'10px 12px', fontSize:13, color:'#334155', lineHeight:1.6, whiteSpace:'pre-wrap', maxHeight:140, overflowY:'auto' }}>
            {preview.waBody}
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   COMPOSE MODAL
══════════════════════════════════════════ */
function ComposeModal({ lead, onClose, onSend, onStartSequence }) {
  const [channel,     setChannel]  = useState('email');
  const [subject,     setSubject]  = useState('');
  const [body,        setBody]     = useState('');
  const [waBody,      setWaBody]   = useState('');
  const [waPhone,     setWaPhone]  = useState(lead?.phone || '');
  const [aiLoading,   setAiLoad]   = useState(false);
  const [aiPrompt,    setAiPrompt] = useState("Tell him in one phrase no more something to win his attention");
  // AI preview state: null = not generated yet, object = preview ready to review
  const [aiPreview,   setAiPreview] = useState<{subject?:string; body?:string; waBody?:string} | null>(null);
  const API_BASE = (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api';

  useEffect(() => {
    const { subject: s, body: b } = applyTemplate(EMAIL_TEMPLATES[0], lead);
    setSubject(s);
    setBody(b);
    setWaBody(WA_TEMPLATES.intro(lead));
  }, []);

  const pickEmailTmpl = (t) => { const { subject:s, body:b } = applyTemplate(t, lead); setSubject(s); setBody(b); };
  const pickWaTmpl    = (k) => { if (WA_TEMPLATES[k]) setWaBody(WA_TEMPLATES[k](lead)); };

  /* ── Generate with Claude AI (preview only, do NOT send) ── */
const generateWithAI = async () => {
  // Guard: WhatsApp requires a phone number
  if ((channel === 'whatsapp' || channel === 'both') && !lead?.phone?.trim()) {
    setToast('Numéro WhatsApp manquant pour ce lead');
    setTimeout(() => setToast(''), 3000);
    return;
  }

  setAiLoad(true);
  setAiPreview(null);
  try {
    const res = await fetch(`${API_BASE}/claude/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:      lead?.email  || '',
        phone:      lead?.phone  || '',   // already guarded above
        userPrompt: aiPrompt     || '',
        channel,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }
      const data = await res.json().catch(() => ({}));

      // Fields match ClaudeGenerateDto exactly
      const previewObj: any = {};
      if (channel === 'email' || channel === 'both') {
        previewObj.subject = data.subject || subject;
        previewObj.body    = data.body    || body;
      }
      if (channel === 'whatsapp' || channel === 'both') {
        previewObj.waBody  = data.waBody  || waBody;
      }
      setAiPreview(previewObj);

    } catch (err) {
      // Fallback: show current form values as preview so UX never breaks
      const fallback: any = {};
      if (channel === 'email'    || channel === 'both') { fallback.subject = subject; fallback.body = body; }
      if (channel === 'whatsapp' || channel === 'both') { fallback.waBody = waBody; }
      setAiPreview(fallback);
    }
    setAiLoad(false);
  };
  /* ── Accept the AI preview: push values into the form fields ── */
  const useAiPreview = () => {
    if (!aiPreview) return;
    if (aiPreview.subject) setSubject(aiPreview.subject);
    if (aiPreview.body)    setBody(aiPreview.body);
    if (aiPreview.waBody)  setWaBody(aiPreview.waBody);
    setAiPreview(null);
  };

  const discardAiPreview = () => setAiPreview(null);

  const handleSend = () => onSend({ subject, body, waBody, waPhone, channel });
  const canSendEmail = subject.trim() && body.trim();

  /* section styles */
  const emailSection = {
    background:'#f0f4ff', border:'1px solid #bfdbfe', borderRadius:12, padding:'16px',
    display:'flex', flexDirection:'column', gap:12,
  };
  const waSection = {
    background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:12, padding:'16px',
    display:'flex', flexDirection:'column', gap:12,
  };

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.65)', backdropFilter:'blur(6px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width:680, maxHeight:'92vh', background:'#fff', borderRadius:20, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow:'0 40px 100px rgba(0,0,0,0.3)' }}
      >

        {/* ─── Header ─── */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #f1f5f9', background:'#f8fafc', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:8 }}>
              <i className="fa-solid fa-file-invoice" style={{ fontSize:16 }} />
              Envoyer une proposition
            </div>
            <div style={{ fontSize:12, color:'#94a3b8', marginTop:3 }}>
              {lead?.name} &middot; {lead?.company} &middot; {lead?.city}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width:34, height:34, borderRadius:8, border:'1px solid #e2e8f0', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ─── Body ─── */}
        <div style={{ overflowY:'auto', flex:1, padding:'20px 24px', display:'flex', flexDirection:'column', gap:16 }}>

          {/* Channel selector */}
          <div>
            <label style={S.label}>Canal d'envoi</label>
            <div style={{ display:'flex', gap:8 }}>
              {[
                { k:'email',    icon:'fa-solid fa-envelope',  label:'Email',      desc:'SMTP' },
                { k:'whatsapp', icon:'fa-brands fa-whatsapp', label:'WhatsApp',   desc:'Business API' },
                { k:'both',     icon:'fa-solid fa-layer-group',label:'Les deux',  desc:'Multi-canal' },
              ].map(ch => (
                <button
                  key={ch.k}
                  onClick={() => { setChannel(ch.k); setAiPreview(null); }}
                  style={{
                    flex:1, padding:'10px 8px', borderRadius:10, cursor:'pointer',
                    background: channel===ch.k ? '#f1f5f9' : '#f8fafc',
                    border: `1.5px solid ${channel===ch.k ? '#475569' : '#e2e8f0'}`,
                    display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                    transition:'all 0.15s',
                  }}
                >
                  <i className={ch.icon} style={{ fontSize:16, color: channel===ch.k ? '#0f172a' : '#94a3b8' }} />
                  <span style={{ fontSize:12, fontWeight:700, color: channel===ch.k ? '#0f172a' : '#94a3b8' }}>{ch.label}</span>
                  <span style={{ fontSize:10, color:'#94a3b8' }}>{ch.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Claude AI generate (preview only) ── */}
          <div style={{ background:'#faf5ff', border:'1px solid #e9d5ff', borderRadius:12, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:700, fontSize:13, color:'#7c3aed' }}>
              <i className="fa-solid fa-robot" />
              Claude AI — Rédaction assistée
            </div>
            <div>
              <label style={{ ...S.label, color:'#7c3aed' }}>Prompt</label>
              <input
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                placeholder="Describe what you want Claude to write..."
                style={{ ...S.input, borderColor:'#d8b4fe' }}
              />
            </div>
            <button
              onClick={generateWithAI}
              disabled={aiLoading}
              style={{
                alignSelf:'flex-start', display:'inline-flex', alignItems:'center', gap:7,
                padding:'8px 16px',
                background: aiLoading ? '#f5f3ff' : 'linear-gradient(135deg, #7c3aed, #4338ca)',
                border: 'none', borderRadius:8,
                color: aiLoading ? '#a78bfa' : '#fff',
                fontSize:13, fontWeight:700, cursor: aiLoading ? 'wait' : 'pointer', fontFamily:'inherit',
                boxShadow: aiLoading ? 'none' : '0 2px 8px rgba(124,58,237,0.35)',
              }}
            >
              <i className={aiLoading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-wand-magic-sparkles'} style={{ fontSize:13 }} />
              {aiLoading ? 'Génération en cours...' : 'Rédiger avec Claude AI'}
            </button>

            {/* AI Preview panel shown after generation */}
            {aiPreview && (
              <AiPreviewPanel
                preview={aiPreview}
                onUse={useAiPreview}
                onDiscard={discardAiPreview}
                channel={channel}
              />
            )}
          </div>

          {/* ── Email section ── */}
          {(channel==='email' || channel==='both') && (
            <div style={emailSection}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:700, fontSize:13, color:'#0f172a' }}>
                <i className="fa-solid fa-envelope" />
                Email
              </div>

              {/* Subject */}
              <div>
                <label style={S.label}>Objet</label>
                <input value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Objet de l'email..." style={S.input} />
              </div>

              {/* Body */}
              <div>
                <label style={S.label}>Message</label>
                <textarea value={body} onChange={e=>setBody(e.target.value)} rows={5} style={{ ...S.input, resize:'vertical', lineHeight:1.7 }} />
              </div>
            </div>
          )}

          {/* ── WhatsApp section ── */}
          {(channel==='whatsapp' || channel==='both') && (
            <div style={waSection}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:700, fontSize:13, color:'#0f172a' }}>
                <i className="fa-brands fa-whatsapp" style={{ fontSize:16 }} />
                WhatsApp Business
              </div>

              {/* Phone */}
              <div>
                <label style={S.label}>Numero WhatsApp</label>
                <input value={waPhone} onChange={e=>setWaPhone(e.target.value)} placeholder="+212 6XX XX XX XX" style={{ ...S.input, fontFamily:'monospace' }} />
              </div>

              {/* WA templates */}
              <div>
                <label style={S.label}>Template</label>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[
                    { k:'intro',    label:'Introduction',  icon:'fa-solid fa-hand-wave'    },
                    { k:'followup', label:'Relance',       icon:'fa-solid fa-rotate-right'  },
                    { k:'proposal', label:'Proposition',   icon:'fa-solid fa-file-contract' },
                    { k:'catalog',  label:'Catalogue',     icon:'fa-solid fa-table-list'    },
                  ].map(t => (
                    <button
                      key={t.k}
                      onClick={() => pickWaTmpl(t.k)}
                      style={{ padding:'5px 10px', border:'1px solid #bbf7d0', borderRadius:6, background:'#fff', fontSize:11, fontWeight:600, color:'#0f172a', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5 }}
                    >
                      <i className={t.icon} style={{ fontSize:10, color:'#94a3b8' }} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* WA body */}
              <div>
                <label style={S.label}>Message WhatsApp</label>
                <textarea value={waBody} onChange={e=>setWaBody(e.target.value)} rows={5} style={{ ...S.input, resize:'vertical', lineHeight:1.7 }} />
                <div style={{ fontSize:10, color:'#94a3b8', marginTop:3 }}>{waBody.length}/1024 caracteres</div>
              </div>

              {/* Info */}
              <div style={{ padding:'8px 12px', background:'rgba(0,0,0,0.02)', borderRadius:8, border:'1px solid #e2e8f0', fontSize:11, color:'#64748b', lineHeight:1.5, display:'flex', gap:8 }}>
                <i className="fa-solid fa-circle-info" style={{ color:'#94a3b8', marginTop:1, flexShrink:0 }} />
                <span>Necessite un numero verifie Meta Business. Cout : ~0.05 MAD/message. Les pieces jointes sont envoyees comme media.</span>
              </div>
            </div>
          )}

        </div>

        {/* ─── Footer ─── */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', background:'#f8fafc', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:8 }}>
            <i className="fa-solid fa-at" style={{ fontSize:11 }} />
            {lead?.email || '--'}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={onClose} style={{ padding:'9px 18px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
              Annuler
            </button>
            {(channel==='whatsapp'||channel==='both') && (
              <button
                onClick={handleSend}
                disabled={!!aiPreview}
                style={{
                  padding:'9px 20px',
                  background: !!aiPreview ? '#e2e8f0' : '#15803d',
                  border:'none',
                  borderRadius:8,
                  color: !!aiPreview ? '#94a3b8' : '#fff',
                  fontSize:13, fontWeight:700,
                  cursor: !!aiPreview ? 'not-allowed' : 'pointer',
                  display:'inline-flex', alignItems:'center', gap:6, fontFamily:'inherit'
                }}
              >
                <i className="fa-brands fa-whatsapp" />
                WhatsApp
              </button>
            )}
            <button
              onClick={() => onStartSequence?.()}
              disabled={!!aiPreview}
              style={{
                padding:'9px 18px',
                background: !!aiPreview ? '#e2e8f0' : '#0f172a',
                border:'none', borderRadius:8,
                color: !!aiPreview ? '#94a3b8' : '#fff',
                fontSize:13, fontWeight:700,
                cursor: !!aiPreview ? 'not-allowed' : 'pointer',
                display:'inline-flex', alignItems:'center', gap:6, fontFamily:'inherit'
              }}
            >
              <i className="fa-solid fa-rotate-right" />
              Lancer sequence
            </button>
            {channel !== 'whatsapp' && (
              <button
                onClick={handleSend}
                disabled={!canSendEmail || !!aiPreview}
                style={{
                  padding:'9px 22px',
                  background: (!canSendEmail || !!aiPreview) ? '#e2e8f0' : '#0f172a',
                  border:'none', borderRadius:8,
                  color: (!canSendEmail || !!aiPreview) ? '#94a3b8' : '#fff',
                  fontSize:13, fontWeight:700,
                  cursor: (!canSendEmail || !!aiPreview) ? 'not-allowed' : 'pointer',
                  display:'inline-flex', alignItems:'center', gap:6, fontFamily:'inherit'
                }}
              >
                <i className="fa-solid fa-paper-plane" />
                Envoyer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CONVERSATION DETAIL PANEL
══════════════════════════════════════════ */
function Conversation({ detail, onCompose, incoming, history = [] as any[] }) {
  const htmlToPlain = (html: string) => {
    if (!html) return '';
    let t = String(html);
    t = t.replace(/<img[\s\S]*?>/gi, '');
    t = t.replace(/<br\s*\/?>/gi, '\n');
    t = t.replace(/<[^>]+>/g, '');
    t = t.replace(/`/g, '').trim();
    return t;
  };
  const baseThread = useMemo(() => {
    const items: any[] = [];
    if (Array.isArray(history) && history.length) {
      const sorted = [...history].sort((a,b) => (a.sentAt||'').localeCompare(b.sentAt||''));
      for (const h of sorted) {
        const txt = htmlToPlain(h.content || h.subject || '');
        if (txt) {
          const from = (h.interactionType === 'RESPONSE' || h.type === 'RESPONSE') ? 'lead' : 'you';
          let replyTo = undefined;
          if (from === 'lead') {
            const originMsg = sorted.find(m => m.status === 'REPLIED' && m.repliedAt === h.sentAt);
            if (originMsg) {
              replyTo = htmlToPlain(originMsg.content || originMsg.subject || '');
            }
          }
          items.push({ from, txt, at: h.sentAt || new Date().toISOString(), status: h.status, type: h.interactionType || h.type, channel: h.channel, replyTo });
        }
        if (h.openedAt) items.push({ from:'system', txt:'Ouverture du message', at:h.openedAt });
      }
    } else {
      if (detail.content || detail.subject) {
        const base = detail.content ? htmlToPlain(detail.content) : String(detail.subject || '');
        if (base) items.push({ from:'you', txt: base, at: detail.sentAt || new Date().toISOString(), status: detail.status, type: detail.interactionType || (detail as any).type, channel: detail.channel });
      }
      if (detail.openedAt) items.push({ from:'system', txt:'Ouverture du message', at:detail.openedAt });
      if (detail.repliedAt)items.push({ from:'lead', txt:'Reponse recue', at:detail.repliedAt });
    }
    return items;
  }, [history, detail?.content, detail?.subject, detail?.sentAt, detail?.openedAt, detail?.repliedAt]);
  const [thread, setTh]   = useState(baseThread);
  useEffect(() => { setTh(baseThread); }, [baseThread]);

  useEffect(() => {
    if (incoming && incoming.leadId === detail.leadId) {
      setTh(t => {
        
        const from = incoming.from || 'you';
        // ✅ ADDED: Match incoming real-time lead messages to the history using the exact timestamp rule
        let replyTo = undefined;
        if (from === 'lead') {
          const originMsg = history.find(m => m.status === 'REPLIED' && m.repliedAt === incoming.at);
          if (originMsg) replyTo = htmlToPlain(originMsg.content || originMsg.subject || '');
        }
        return [...t, { from, txt: incoming.txt || '', at: incoming.at || new Date().toISOString(), replyTo }];
      });
    }
  }, [incoming, detail.leadId]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* Lead info row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
        {[
          { label:'Email',     value:detail.email  ||'--', icon:'fa-solid fa-envelope'  },
          { label:'Telephone', value:detail.phone  ||'--', icon:'fa-solid fa-phone'     },
          { label:'Secteur',   value:detail.sector ||'--', icon:'fa-solid fa-briefcase' },
        ].map(r => (
          <div key={r.label} style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 12px', display:'flex', alignItems:'center', gap:8 }}>
            <i className={r.icon} style={{ color:'#94a3b8', fontSize:13, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:9, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.07em' }}>{r.label}</div>
              <div style={{ fontSize:12, color:'#0f172a', fontWeight:600, marginTop:1 }}>{r.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Status badges */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        <StatusBadge status={detail.status} />
        <ChannelBadge channel={detail.channel} />
        <ITypeBadge type={detail.interactionType} />
        <ContactStatusBadge status={detail.contactStatus} />
        <SeqBadge status={detail.sequenceStatus} />
      </div>

      {/* Proposition CTA banner */}
      <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color:'#0f172a', display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
            <i className="fa-solid fa-file-invoice" style={{ color:'#475569' }} />
            Prospect: {detail.company} {detail.sector}
          </div>
          <div style={{ fontSize:11, color:'#94a3b8', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <span><i className="fa-solid fa-envelope" style={{ marginRight:4 }}/>Email</span>
            <span><i className="fa-brands fa-whatsapp" style={{ marginRight:4 }}/>WhatsApp</span>
            <span><i className="fa-solid fa-robot" style={{ marginRight:4 }}/>Claude AI</span>
          </div>
        </div>
        <button
          onClick={onCompose}
          style={{ flexShrink:0, padding:'10px 20px', background:'#0f172a', border:'none', borderRadius:10, color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7, fontFamily:'inherit' }}
        >
          <i className="fa-solid fa-paper-plane" />
          Envoyer proposition
        </button>
      </div>

      {/* Conversation thread */}
      <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:320, overflowY:'auto', padding:'2px 0' }}>
        {thread.map((m, i) => (
          m.from === 'system' ? (
            <div key={i} style={{ alignSelf:'center', color:'#94a3b8', fontSize:11, display:'flex', alignItems:'center', gap:5, padding:'4px 12px', background:'#f1f5f9', borderRadius:20 }}>
              <i className="fa-solid fa-eye" style={{ fontSize:10 }} />
              {m.txt} &middot; {fmtDate(m.at)} {fmtTime(m.at)}
            </div>
          ) : (
            <div key={i} style={{
              alignSelf: m.from==='you' ? 'flex-end' : 'flex-start',
              background: m.from==='you' ? '#0f172a' : (m.status==='RECEIVED' ? '#e0f2fe' : '#f1f5f9'),
              color:      m.from==='you' ? '#fff'    : '#0f172a',
              border:'1px solid #e2e8f0', borderRadius:12, padding:'10px 14px', maxWidth:'72%',
            }}>
              <div style={{ fontSize:11, marginBottom:4, opacity:0.55, display:'flex', alignItems:'center', gap:5 }}>
                <i className={m.from==='you'?'fa-solid fa-user':'fa-regular fa-building'} style={{ fontSize:10 }}/>
                {m.from==='you' ? 'Vous' : (detail.company || 'Prospect')}
                &nbsp;&middot;&nbsp;{fmtDate(m.at)} {fmtTime(m.at)}
              </div>
              <div style={{ fontSize:10, color:'#64748b', margin:'2px 0 6px' }}>
                {(m.channel || '').toString().toUpperCase()} {m.type ? `· ${m.type}` : ''}
              </div>
              {m.replyTo && (
                <div style={{ fontSize:12, lineHeight:1.4, marginBottom:8, background:'#fff', color:'#0f172a', border:'1px solid #e2e8f0', borderLeft:'3px solid #0f172a', borderRadius:8, padding:'8px 10px' }}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#64748b', marginBottom:4, display:'flex', alignItems:'center', gap:6 }}>
                    <i className="fa-solid fa-reply" style={{ fontSize:10 }} />
                    Reponse a
                  </div>
                  <div style={{ whiteSpace:'pre-wrap' }}>
                    {String(m.replyTo).length > 220 ? `${String(m.replyTo).slice(0,220)}…` : String(m.replyTo)}
                  </div>
                </div>
              )}
              <div style={{ fontSize:13, lineHeight:1.5 }}>{m.txt}</div>
            </div>
          )
        ))}
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function LeadMessanger({ leads = EMPTY_LEADS, composeForLeadId }: any) {
  useFontAwesome();

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [filter,       setFilter]       = useState('all');
  const [search,       setSearch]       = useState('');
  const [sortBy,       setSortBy]       = useState('sentAt');
  const [sortDir,      setSortDir]      = useState('desc');
  const [page,         setPage]         = useState(1);
  const [detail,       setDetail]       = useState(null);
  const [composeLead,  setComposeLead]  = useState(null);
  const [toast,        setToast]        = useState('');
  const [incomingMsg,  setIncomingMsg]  = useState(null);
  const [leadHistory,  setLeadHistory]  = useState<Interaction[]>([]);
  const PER_PAGE = 8;
  const API_BASE = (import.meta as any).env?.VITE_GATEWAY_BASE_URL || 'http://localhost:8081/api';

  useEffect(() => {
    if (composeForLeadId && Array.isArray(leads) && leads.length) {
      const l = leads.find((x: any) => x.id === composeForLeadId);
      if (l) setComposeLead(l);
    }
  }, [composeForLeadId, leads]);

  /* Stats */
  const stats = useMemo(() => ({
    total:   interactions.length,
    replied: interactions.filter(r => r.status==='REPLIED').length,
    opened:  interactions.filter(r => r.status==='OPENED').length,
  }), [interactions]);

  /* Load interactions from backend */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/interactions`, { method: 'GET' });
        const data = await res.json().catch(() => []);
        const rows = Array.isArray(data) ? data : (data?.data ?? []);
        if (Array.isArray(rows) && rows.length) {
          const mapped = rows.map((it: any) => ({
            id: String(it.id ?? `${it.leadId}-${Date.now()}`),
            leadId: Number(it.leadId ?? it.lead_id ?? 0),
            company: it.company ?? it.companyName ?? '',
            contactName: it.contactName ?? it.contact_name ?? '',
            city: it.city ?? '',
            sector: it.sector ?? '',
            phone: it.phone ?? '',
            email: it.email ?? '',
            subject: it.subject ?? '',
            content: it.content ?? '',
            channel: (String(it.channel ?? 'EMAIL').toUpperCase() === 'WHATSAPP') ? 'WHATSAPP' : 'EMAIL',
            status: (String(it.status ?? 'SENT').toUpperCase() as any),
            contactStatus: it.contactStatus ?? it.contact_status ?? undefined,
            interactionType: it.interactionType ?? it.interaction_type ?? it.type ?? undefined,
            sequenceStatus: it.sequenceStatus ?? it.sequence_status ?? undefined,
            sentAt: it.sentAt ?? it.sent_at ?? new Date().toISOString(),
            openedAt: it.openedAt ?? it.opened_at ?? undefined,
            repliedAt: it.repliedAt ?? it.replied_at ?? undefined,
          }));
          setInteractions(mapped.sort((a,b) => (b.sentAt||'').localeCompare(a.sentAt||'')));
        }
      } catch {}
    })();
  }, [API_BASE]);

  /* Latest per lead + filtered + sorted rows */
  const filtered = useMemo(() => {
    const latestByLead: Record<number, Interaction> = {};
    for (const it of interactions) {
      const key = it.leadId;
      const cur = latestByLead[key];
      if (!cur || (String(it.sentAt||'') > String(cur.sentAt||''))) latestByLead[key] = it;
    }
    let rows = Object.values(latestByLead);
    if (filter !== 'all') rows = rows.filter(r => r.status===filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.company.toLowerCase().includes(q) ||
        (r.contactName||'').toLowerCase().includes(q) ||
        (r.city||'').toLowerCase().includes(q) ||
        r.channel.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a,b) => {
      const va = a[sortBy]||'', vb = b[sortBy]||'';
      return sortDir==='asc' ? (va<vb?-1:va>vb?1:0) : (va<vb?1:va>vb?-1:0);
    });
  }, [interactions, filter, search, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageRows   = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE);

  useEffect(() => { setPage(1); setDetail(null); }, [filter, search, sortBy]);

  const toggleSort = (col) => {
    if (sortBy===col) setSortDir(d => d==='asc'?'desc':'asc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const SortIcon = ({ col }) => (
    <i
      className={sortBy===col ? (sortDir==='asc'?'fa-solid fa-sort-up':'fa-solid fa-sort-down') : 'fa-solid fa-sort'}
      style={{ marginLeft:5, fontSize:10, opacity: sortBy===col ? 1 : 0.3 }}
    />
  );

  /* Get full lead object for a row */
  const getLeadForRow = useCallback((row) =>
    leads.find(l => l.id===row.leadId) || {
      id:row.leadId, name:row.contactName, company:row.company,
      city:row.city, sector:row.sector, phone:row.phone, email:row.email,
    }, []);

  const openCompose = useCallback((row, e) => {
    if (e) e.stopPropagation();
    setComposeLead(getLeadForRow(row));
  }, [getLeadForRow]);

  const openDetail = useCallback((row: any) => {
    setDetail(row);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/interactions/lead/${row.leadId}`, { method: 'GET' });
        const data = await res.json().catch(() => []);
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        const mapped: Interaction[] = list.map((it: any) => ({
          id: String(it.id ?? `${row.leadId}-${Date.now()}`),
          leadId: Number(it.leadId ?? it.lead_id ?? row.leadId),
          company: it.company ?? row.company ?? '',
          contactName: it.contactName ?? it.contact_name ?? row.contactName ?? '',
          city: it.city ?? row.city ?? '',
          sector: it.sector ?? row.sector ?? '',
          phone: it.phone ?? row.phone ?? '',
          email: it.email ?? row.email ?? '',
          subject: it.subject ?? '',
          content: it.content ?? '',
          channel: (String(it.channel ?? 'EMAIL').toUpperCase() === 'WHATSAPP') ? 'WHATSAPP' : 'EMAIL',
          status: (String(it.status ?? 'SENT').toUpperCase() as any),
          contactStatus: it.contactStatus ?? it.contact_status ?? row.contactStatus,
          interactionType: it.interactionType ?? it.interaction_type ?? it.type ?? row.interactionType,
          sequenceStatus: it.sequenceStatus ?? it.sequence_status ?? row.sequenceStatus,
          sentAt: it.sentAt ?? it.sent_at ?? new Date().toISOString(),
          openedAt: it.openedAt ?? it.opened_at ?? undefined,
          repliedAt: it.repliedAt ?? it.replied_at ?? undefined,
        }));
        setLeadHistory(mapped.sort((a,b) => (b.sentAt||'').localeCompare(a.sentAt||'')));
      } catch { setLeadHistory([]); }
    })();
  }, [API_BASE]);

  /* Handle send from modal */
  const handleSend = useCallback(async (data) => {
    const lead   = composeLead;
    const chKey  = data.channel==='whatsapp' ? 'WHATSAPP' : 'EMAIL';
    const nowIso = new Date().toISOString();
    let textOut  = '';
    if (data.channel === 'whatsapp') {
      textOut = data.waBody || '';
    } else if (data.channel === 'email') {
      textOut = (data.subject ? `${data.subject}\n\n` : '') + (data.body||'');
    } else {
      textOut = [
        data.subject ? `Email: ${data.subject}\n\n${data.body||''}` : '',
        data.waBody ? `WhatsApp: ${data.waBody}` : ''
      ].filter(Boolean).join('\n\n');
    }

    // ── Send WhatsApp via correct API ──
    if (data.channel === 'whatsapp' || data.channel === 'both') {
      try {
        const phoneNumber = String(data.waPhone || lead?.phone || '').replace(/\s+/g, '');
        const resp = await fetch(`${API_BASE}/whatsapp/actions/send-manual-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber,
            body: data.waBody || '',
          }),
        });
        if (!resp.ok) {
          setToast('Echec envoi WhatsApp');
          if (data.channel === 'whatsapp') return;
        }
      } catch {
        setToast('Echec envoi WhatsApp (réseau)');
        if (data.channel === 'whatsapp') return;
      }
    }

    // ── Send email via backend manual-email API ──
    if (data.channel !== 'whatsapp') {
      try {
        const resp = await fetch(`${API_BASE}/actions/send-manual-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: lead.email,
            subject: data.subject || '(Sans objet)',
            body: data.body || '',
          }),
        });
        if (!resp.ok) {
          setToast('Echec envoi email');
          return;
        }
        try {
          const res2 = await fetch(`${API_BASE}/interactions`, { method: 'GET' });
          const fresh = await res2.json().catch(() => []);
          const rows = Array.isArray(fresh) ? fresh : (fresh?.data ?? []);
          const mapped = rows.map((it: any) => ({
            id: String(it.id ?? `${it.leadId}-${Date.now()}`),
            leadId: Number(it.leadId ?? it.lead_id ?? 0),
            company: it.company ?? it.companyName ?? '',
            contactName: it.contactName ?? it.contact_name ?? '',
            city: it.city ?? '',
            sector: it.sector ?? '',
            phone: it.phone ?? '',
            email: it.email ?? '',
            subject: it.subject ?? '',
            content: it.content ?? '',
            channel: (String(it.channel ?? 'EMAIL').toUpperCase() === 'WHATSAPP') ? 'WHATSAPP' : 'EMAIL',
            status: (String(it.status ?? 'SENT').toUpperCase() as any),
            contactStatus: it.contactStatus ?? it.contact_status ?? undefined,
            interactionType: it.interactionType ?? it.interaction_type ?? it.type ?? undefined,
            sequenceStatus: it.sequenceStatus ?? it.sequence_status ?? undefined,
            sentAt: it.sentAt ?? it.sent_at ?? new Date().toISOString(),
            openedAt: it.openedAt ?? it.opened_at ?? undefined,
            repliedAt: it.repliedAt ?? it.replied_at ?? undefined,
          }));
          setInteractions(mapped.sort((a,b) => (b.sentAt||'').localeCompare(a.sentAt||'')));
          setDetail(prev => prev && prev.leadId === lead.id ? { ...prev, contactStatus: 'MANUAL_EMAIL_ENVOYE' } : prev);
        } catch {}
      } catch {
        setToast('Echec envoi email (réseau)');
        return;
      }
    }

    setIncomingMsg({ leadId: lead.id, at: nowIso, from:'you', txt: textOut });
    setComposeLead(null);
    setToast(chKey==='WHATSAPP' ? 'WhatsApp envoyé ✓' : data.channel === 'both' ? 'Email + WhatsApp envoyés ✓' : 'Email envoyé ✓');
    setTimeout(() => setToast(''), 3000);
  }, [composeLead]);

  const handleStartSequence = useCallback(() => {
    const lead   = composeLead;
    if (!lead) return;
    (async () => {
      try {
        await fetch(`${API_BASE}/sequences/start/${lead.id}`, { method: 'POST' });
        await fetch(`${API_BASE}/actions/mark-contact-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId: lead.id, status: 'EN_SEQUENCE' }),
        });
      } catch {}
    })();
    const nowIso = new Date().toISOString();
    setComposeLead(null);
    setDetail(prev => prev ? { ...prev, contactStatus: 'EN_SEQUENCE', sequenceStatus: 'ACTIVE', status: 'SENT', sentAt: nowIso } : prev);
    setInteractions(prev => prev.map(r => r.leadId === lead.id ? { ...r, contactStatus: 'EN_SEQUENCE', sequenceStatus: 'ACTIVE' } : r));
    setToast('Sequence lancee');
    setTimeout(() => setToast(''), 3000);
  }, [composeLead]);

  /* Table columns */
  const COLS = [
    { label:'Prospect',  col:'company'         },
    { label:'Canal',     col:'channel'          },
    { label:'Statut',    col:'status'           },
    { label:'Contact',   col:'contactStatus'    },
    { label:'Envoye',    col:'sentAt'           },
    { label:'Ouverture', col:'openedAt'         },
    { label:'Reponse',   col:'repliedAt'        },
  ];

  /* ─── RENDER ─── */
  return (
    <div style={{ fontFamily:"'DM Sans', system-ui, sans-serif", minHeight:'100vh', padding:24, background:'transparent' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap" rel="stylesheet" />

      {/* Toast notification */}
      {toast && (
        <div style={{
          position:'fixed', top:20, right:20, zIndex:3000,
          background:'#0f172a', color:'#fff', padding:'12px 18px', borderRadius:12,
          fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8,
          boxShadow:'0 8px 32px rgba(0,0,0,0.2)', animation:'slideDown 0.3s ease',
        }}>
          <i className="fa-solid fa-circle-check" style={{ fontSize:14 }} />
          {toast}
        </div>
      )}

      {/* ═══ DETAIL VIEW ═══ */}
      <div className="max-w-[1100px] mx-auto">
      {detail ? (
        <div>
          {/* Detail header */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20, flexWrap:'wrap' }}>
            <button
              onClick={() => setDetail(null)}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', border:'1px solid #e2e8f0', borderRadius:8, background:'#fff', color:'#475569', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}
            >
              <i className="fa-solid fa-arrow-left" />
              Retour
            </button>
            <div>
              <div style={{ fontSize:18, fontWeight:700, color:'#0f172a' }}>{detail.company}</div>
              <div style={{ fontSize:12, color:'#94a3b8', marginTop:2 }}>
                <i className="fa-solid fa-location-dot" style={{ marginRight:5, fontSize:11 }}/>
                {detail.city}
              </div>
            </div>
          </div>

          {/* Conversation card */}
          <div style={{ ...S.card, padding:'22px 24px' }}>
            {detail.subject && (
              <div style={{ marginBottom:10, fontSize:13, fontWeight:700, color:'#0f172a' }}>
                Objet: {detail.subject}
              </div>
            )}
            <Conversation
              detail={detail}
              onCompose={() => setComposeLead(getLeadForRow(detail))}
              incoming={incomingMsg}
              history={leadHistory}
            />
          </div>
        </div>

      ) : (
        /* ═══ TABLE VIEW ═══ */
        <>
          {/* Page title */}
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:20, fontWeight:700, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:8 }}>
              <i className="fa-solid fa-comments" />
              Interactions
            </h2>
            <p style={{ fontSize:13, color:'#94a3b8', margin:'4px 0 0' }}>
              Activite par canal, suivi des reponses, envoi de propositions
            </p>
          </div>

          {/* Stat cards */}
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:20 }}>
            <StatCard label="Total"           value={stats.total}   icon="fa-solid fa-chart-simple" />
            <StatCard label="Repondus"        value={stats.replied} icon="fa-solid fa-reply" />
            <StatCard label="Ouverts"         value={stats.opened}  icon="fa-solid fa-envelope-open" />
            <StatCard
              label="Taux de reponse"
              value={`${stats.total ? Math.round(stats.replied/stats.total*100) : 0}%`}
              icon="fa-solid fa-chart-line"
            />
          </div>

          {/* Filter bar */}
          <div style={{ ...S.card, padding:'12px 16px', marginBottom:12, display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
            {/* Search */}
            <div style={{ position:'relative', flex:'1 1 220px', minWidth:180 }}>
              <i className="fa-solid fa-magnifying-glass" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', fontSize:13, color:'#94a3b8', pointerEvents:'none' }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher entreprise, contact, ville..."
                style={{ ...S.input, paddingLeft:32, paddingRight:search?28:12 }}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8', padding:2, display:'flex', alignItems:'center' }}>
                  <i className="fa-solid fa-xmark" />
                </button>
              )}
            </div>

            {/* Status filter pills */}
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {['all', ...STATUS_LIST].map(k => {
                const cnt    = k==='all' ? interactions.length : interactions.filter(r=>r.status===k).length;
                const active = filter===k;
                const cfg    = STATUS_CFG[k];
                return (
                  <button
                    key={k}
                    onClick={() => setFilter(k)}
                    style={{
                      padding:'6px 12px', borderRadius:20, fontSize:12, fontWeight:600,
                      border: active ? '1.5px solid #0f172a' : '1.5px solid #e2e8f0',
                      background: active ? '#0f172a' : '#f8fafc',
                      color:      active ? '#fff'    : '#64748b',
                      cursor:'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:'inherit',
                    }}
                  >
                    {cfg && <i className={cfg.icon} style={{ fontSize:10, opacity:0.8 }} />}
                    {k==='all' ? 'Tous' : (cfg?.label||k)}
                    <span style={{ background: active?'rgba(255,255,255,0.2)':'#e2e8f0', color: active?'#fff':'#64748b', borderRadius:10, padding:'0 5px', fontSize:10, marginLeft:2 }}>
                      {cnt}
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginLeft:'auto', fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:5 }}>
              <i className="fa-solid fa-list" style={{ fontSize:11 }} />
              {filtered.length} resultat{filtered.length!==1?'s':''}
            </div>
          </div>

          {/* Table */}
          <div style={{ ...S.card, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:980 }}>
                <thead>
                  <tr style={{ borderBottom:'1px solid #f1f5f9', background:'#f8fafc' }}>
                    {COLS.map(({ label, col }) => (
                      <th
                        key={col}
                        onClick={() => toggleSort(col)}
                        style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}
                      >
                        {label}<SortIcon col={col} />
                      </th>
                    ))}
                    <th style={{ padding:'11px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'#94a3b8', letterSpacing:'0.07em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(r => (
                    <tr
                      key={r.id}
                      onClick={() => openDetail(r)}
                      style={{ borderBottom:'1px solid #f1f5f9', cursor:'pointer', transition:'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background='#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background='transparent'}
                    >
                      {/* Prospect */}
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ fontWeight:600, color:'#0f172a', display:'flex', alignItems:'center', gap:6 }}>
                          <i className="fa-regular fa-building" style={{ fontSize:12, color:'#94a3b8' }} />
                          {r.company}
                        </div>
                        <div style={{ fontSize:11, color:'#94a3b8', marginTop:3, display:'flex', alignItems:'center', gap:5 }}>
                          <i className="fa-solid fa-location-dot" style={{ fontSize:10 }} />
                          {r.city}
                        </div>
                      </td>

                      {/* Canal */}
                      <td style={{ padding:'12px 14px' }}>
                        <ChannelBadge channel={r.channel} />
                      </td>

                      {/* Status */}
                      <td style={{ padding:'12px 14px' }}>
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Contact Status */}
                      <td style={{ padding:'12px 14px' }}>
                        <ContactStatusBadge status={r.contactStatus} />
                      </td>

                      {/* Sent */}
                      <td style={{ padding:'12px 14px' }}>
                        <div style={{ color:'#334155', fontWeight:500 }}>
                          {fmtDate(r.sentAt)}
                        </div>
                        <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>
                          {fmtTime(r.sentAt)} &middot; {timeAgo(r.sentAt)}
                        </div>
                      </td>

                      {/* Opened */}
                      <td style={{ padding:'12px 14px' }}>
                        {r.openedAt ? (
                          <>
                            <div style={{ color:'#334155', fontWeight:500 }}>
                              {fmtDate(r.openedAt)}
                            </div>
                            <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{fmtTime(r.openedAt)}</div>
                          </>
                        ) : <span style={{ color:'#e2e8f0', fontSize:16 }}>&#8212;</span>}
                      </td>

                      {/* Replied */}
                      <td style={{ padding:'12px 14px' }}>
                        {(() => {
                          const rep = getReplyAt(r);
                          return rep ? (
                            <>
                              <div style={{ color:'#334155', fontWeight:500 }}>
                                {fmtDate(rep)}
                              </div>
                              <div style={{ fontSize:11, color:'#94a3b8', marginTop:2 }}>{fmtTime(rep)}</div>
                            </>
                          ) : <span style={{ color:'#e2e8f0', fontSize:16 }}>&#8212;</span>;
                        })()}
                      </td>

                      {/* Action */}
                      <td style={{ padding:'12px 14px' }}>
                        <button
                          onClick={e => openCompose(r, e)}
                          style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 13px', background:'#0f172a', border:'none', borderRadius:8, color:'#fff', fontSize:11, fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', fontFamily:'inherit' }}
                        >
                          <i className="fa-solid fa-paper-plane" style={{ fontSize:10 }} />
                          Proposition
                        </button>
                      </td>
                    </tr>
                  ))}

                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ padding:'60px 16px', textAlign:'center', color:'#94a3b8' }}>
                        <i className="fa-solid fa-inbox" style={{ fontSize:32, display:'block', marginBottom:10, opacity:0.4 }} />
                        <div style={{ fontWeight:600, fontSize:14 }}>Aucune interaction</div>
                        <div style={{ fontSize:12, marginTop:4 }}>Modifiez votre recherche ou filtre</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid #f1f5f9', background:'#f8fafc' }}>
                <span style={{ fontSize:12, color:'#94a3b8', display:'flex', alignItems:'center', gap:5 }}>
                  <i className="fa-solid fa-file-lines" style={{ fontSize:11 }} />
                  Page {page} sur {totalPages} &middot; {filtered.length} lignes
                </span>
                <div style={{ display:'flex', gap:5 }}>
                  <PagBtn onClick={()=>setPage(1)}         disabled={page===1}          label={<i className="fa-solid fa-angles-left"  style={{fontSize:11}}/>} />
                  <PagBtn onClick={()=>setPage(p=>p-1)}    disabled={page===1}          label={<i className="fa-solid fa-angle-left"   style={{fontSize:11}}/>} />
                  {Array.from({ length:Math.min(5,totalPages) }, (_,i) => {
                    const p = Math.max(1, Math.min(totalPages-4, page-2)) + i;
                    return <PagBtn key={p} onClick={()=>setPage(p)} label={p} active={page===p} />;
                  })}
                  <PagBtn onClick={()=>setPage(p=>p+1)}    disabled={page===totalPages} label={<i className="fa-solid fa-angle-right"  style={{fontSize:11}}/>} />
                  <PagBtn onClick={()=>setPage(totalPages)} disabled={page===totalPages} label={<i className="fa-solid fa-angles-right" style={{fontSize:11}}/>} />
                </div>
              </div>
            )}
          </div>
        </>
      )}
      </div>

      {/* Compose modal */}
      {composeLead && (
        <ComposeModal
          lead={composeLead}
          onClose={() => setComposeLead(null)}
          onSend={handleSend}
          onStartSequence={handleStartSequence}
        />
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-10px); }
          to   { opacity:1; transform:translateY(0);     }
        }
        .fa-spin { animation: fa-spin 1s linear infinite; }
        @keyframes fa-spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
      `}</style>
    </div>
  );
}
