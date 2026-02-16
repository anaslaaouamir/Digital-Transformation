import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EmployeAddPage() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    role: 'Commercial',
  });

  const onChange = (key: keyof typeof form) => (e: any) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = async () => {
    if (!form.nom || !form.email) {
      alert('Nom and email are required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('http://localhost:8080/api/employes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      navigate('/store-admin/employes');
    } catch (e: any) {
      alert(e?.message || 'Add failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 16, maxWidth: 500 }}>
      <h2>Add employee</h2>

      <div style={{ display: 'grid', gap: 10 }}>
        <label>
          First name
          <input value={form.prenom} onChange={onChange('prenom')} style={{ width: '100%' }} />
        </label>

        <label>
          Last name *
          <input value={form.nom} onChange={onChange('nom')} style={{ width: '100%' }} />
        </label>

        <label>
          Email *
          <input value={form.email} onChange={onChange('email')} style={{ width: '100%' }} />
        </label>

        <label>
          Phone
          <input value={form.telephone} onChange={onChange('telephone')} style={{ width: '100%' }} />
        </label>

        <label>
          Role
          <input value={form.role} onChange={onChange('role')} style={{ width: '100%' }} />
        </label>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => navigate('/store-admin/employes')}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
