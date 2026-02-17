import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';

export default function EmployeAddPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // ✅ NEW: toggle show/hide
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'Commercial',
    password: '',
  });

  const onChange = (key: keyof typeof form) => (e: any) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const isFormValid = Object.values(form).every((v) => String(v).trim() !== '');
  const hasError = (key: keyof typeof form) => submitted && String(form[key]).trim() === '';

  const submit = async () => {
  setSubmitted(true);
  if (!isFormValid) return;

  setSaving(true);
  try {
    // ✅ Map frontend -> backend
    const payload = {
      nom: form.nom,
      prenom: form.prenom,
      email: form.email,
      telephone: form.telephone,

      // ⚠️ OPTION A: backend expects role as string/enum
      role: form.role,

      // ⚠️ OPTION B (common): backend expects role object like { id: 1 }
      // role: { id: form.role === 'Commercial' ? 1 : 2 },

      // ✅ password naming (common in french backends)
      motDePasse: form.password,
      // If backend expects "password" keep: password: form.password
      // If backend expects "mdp" use: mdp: form.password
    };

    console.log('✅ payload envoyé =>', payload);

    await api.post('/employes', payload);

    navigate('/store-admin/employes');
  } catch (e: any) {
    alert(e?.message || 'Add failed');
  } finally {
    setSaving(false);
  }
};


  const styles = useMemo(() => {
    const border = '1px solid rgba(15, 23, 42, 0.12)';
    const ring = '0 0 0 3px rgba(59,130,246,.25)';
    return {
      page: {
        minHeight: '100vh',
        padding: 24,
        background:
          'radial-gradient(1200px 500px at 10% 10%, rgba(59,130,246,0.12), transparent 60%), radial-gradient(1200px 500px at 90% 20%, rgba(16,185,129,0.10), transparent 55%), #f8fafc',
        display: 'grid',
        placeItems: 'start center',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"',
        color: '#0f172a',
      } as React.CSSProperties,

      card: {
        width: '100%',
        maxWidth: 720,
        background: 'white',
        borderRadius: 16,
        border,
        boxShadow: '0 1px 2px rgba(15,23,42,0.06), 0 10px 25px rgba(15,23,42,0.06)',
        overflow: 'hidden',
      } as React.CSSProperties,

      header: {
        padding: '18px 20px',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
        background: 'linear-gradient(180deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))',
      } as React.CSSProperties,

      titleRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      } as React.CSSProperties,

      title: {
        margin: 0,
        fontSize: 20,
        fontWeight: 750,
        letterSpacing: -0.3,
      } as React.CSSProperties,

      subtitle: {
        margin: '6px 0 0',
        color: '#475569',
        fontSize: 13,
      } as React.CSSProperties,

      body: { padding: 20 } as React.CSSProperties,

      grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 14,
      } as React.CSSProperties,

      full: { gridColumn: '1 / -1' } as React.CSSProperties,

      label: {
        display: 'grid',
        gap: 6,
        fontSize: 13,
        color: '#334155',
        fontWeight: 600,
      } as React.CSSProperties,

      required: { color: '#ef4444', marginLeft: 4, fontWeight: 700 } as React.CSSProperties,

      inputBase: {
        width: '100%',
        padding: '10px 12px',
        borderRadius: 10,
        border,
        background: '#ffffff',
        outline: 'none',
        fontSize: 14,
        color: '#0f172a',
        boxShadow: '0 0 0 0 rgba(0,0,0,0)',
        transition: 'box-shadow .15s, border-color .15s, transform .05s',
      } as React.CSSProperties,

      inputError: {
        borderColor: 'rgba(239, 68, 68, 0.75)',
        background: 'rgba(239, 68, 68, 0.06)',
      } as React.CSSProperties,

      errorText: { fontSize: 12, color: '#ef4444', fontWeight: 600 } as React.CSSProperties,

      row: {
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '16px 20px',
        borderTop: '1px solid rgba(15, 23, 42, 0.08)',
        background: '#fbfdff',
      } as React.CSSProperties,

      button: {
        padding: '10px 14px',
        borderRadius: 10,
        border,
        background: 'white',
        cursor: 'pointer',
        fontWeight: 700,
        color: '#0f172a',
      } as React.CSSProperties,

      primary: {
        padding: '10px 14px',
        borderRadius: 10,
        border: '1px solid rgba(37, 99, 235, 0.5)',
        background: 'linear-gradient(180deg, #3b82f6, #2563eb)',
        cursor: 'pointer',
        fontWeight: 800,
        color: 'white',
        boxShadow: '0 10px 18px rgba(37,99,235,0.18)',
      } as React.CSSProperties,

      disabled: { opacity: 0.6, cursor: 'not-allowed', boxShadow: 'none' } as React.CSSProperties,

      chip: {
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: 'rgba(16,185,129,0.12)',
        color: '#047857',
        border: '1px solid rgba(16,185,129,0.25)',
        marginLeft: 10,
      } as React.CSSProperties,

      focusStyle: ring,

      // ✅ NEW: password row styles
      inputRow: {
        display: 'flex',
        gap: 8,
        alignItems: 'stretch',
      } as React.CSSProperties,

      eyeBtn: {
        border: border,
        background: '#fff',
        borderRadius: 10,
        padding: '0 12px',
        cursor: 'pointer',
        fontWeight: 800,
        color: '#0f172a',
        userSelect: 'none',
      } as React.CSSProperties,
    };
  }, []);

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(59,130,246,.65)';
    e.currentTarget.style.boxShadow = styles.focusStyle;
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = 'rgba(15, 23, 42, 0.12)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.titleRow}>
            <h2 style={styles.title}>Ajouter un employé</h2>
            <span style={styles.chip}>{form.role}</span>
          </div>
          <p style={styles.subtitle}>
            Remplissez les informations ci-dessous puis cliquez sur <b>Ajouter</b>.
          </p>
        </div>

        <div style={styles.body}>
          <div style={styles.grid}>
            <label style={styles.label}>
              Prénom <span style={styles.required}>*</span>
              <input
                value={form.prenom}
                onChange={onChange('prenom')}
                style={{ ...styles.inputBase, ...(hasError('prenom') ? styles.inputError : null) }}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="Ex: Sarah"
                autoComplete="given-name"
              />
              {hasError('prenom') && <span style={styles.errorText}>Champ obligatoire</span>}
            </label>

            <label style={styles.label}>
              Nom <span style={styles.required}>*</span>
              <input
                value={form.nom}
                onChange={onChange('nom')}
                style={{ ...styles.inputBase, ...(hasError('nom') ? styles.inputError : null) }}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="Ex: Dupont"
                autoComplete="family-name"
              />
              {hasError('nom') && <span style={styles.errorText}>Champ obligatoire</span>}
            </label>

            <label style={{ ...styles.label, ...styles.full }}>
              Email <span style={styles.required}>*</span>
              <input
                value={form.email}
                onChange={onChange('email')}
                style={{ ...styles.inputBase, ...(hasError('email') ? styles.inputError : null) }}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="ex: sarah.dupont@email.com"
                autoComplete="email"
                inputMode="email"
              />
              {hasError('email') && <span style={styles.errorText}>Champ obligatoire</span>}
            </label>

            <label style={styles.label}>
              Téléphone <span style={styles.required}>*</span>
              <input
                value={form.telephone}
                onChange={onChange('telephone')}
                style={{ ...styles.inputBase, ...(hasError('telephone') ? styles.inputError : null) }}
                onFocus={onFocus}
                onBlur={onBlur}
                placeholder="Ex: +212 123 423 234"
                autoComplete="tel"
                inputMode="tel"
              />
              {hasError('telephone') && <span style={styles.errorText}>Champ obligatoire</span>}
            </label>

            <label style={styles.label}>
              Rôle <span style={styles.required}>*</span>
              <select
                value={form.role}
                onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
                style={{
                  ...styles.inputBase,
                  paddingRight: 34,
                  cursor: 'pointer',
                  ...(hasError('role') ? styles.inputError : null),
                }}
                onFocus={onFocus}
                onBlur={onBlur}
              >
                <option value="Commercial">Commercial</option>
                <option value="Developpeur">Développeur</option>
              </select>
              {hasError('role') && <span style={styles.errorText}>Champ obligatoire</span>}
            </label>

            {/* ✅ PASSWORD + EYE BUTTON */}
            <label style={{ ...styles.label, ...styles.full }}>
              Mot de passe <span style={styles.required}>*</span>

              <div style={styles.inputRow}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange('password')}
                  style={{
                    ...styles.inputBase,
                    ...(hasError('password') ? styles.inputError : null),
                  }}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="Ex: ********"
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={styles.eyeBtn}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {hasError('password') && <span style={styles.errorText}>Champ obligatoire</span>}
            </label>
          </div>
        </div>

        <div style={styles.row}>
          <button type="button" onClick={() => navigate('/store-admin/employes')} style={styles.button}>
            Annuler
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={!isFormValid || saving}
            style={{
              ...styles.primary,
              ...((!isFormValid || saving) ? styles.disabled : null),
            }}
            title={!isFormValid ? 'Veuillez remplir tous les champs' : undefined}
          >
            {saving ? 'Saving...' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
