import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

type Employe = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: string;
};

export default function EmployeEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState<Employe | null>(null);
  const [loading, setLoading] = useState(false);

  const onChange =
    (key: keyof Employe) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      if (!form) return;
      setForm({ ...form, [key]: e.target.value });
    };

  useEffect(() => {
    const fetchEmploye = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/employes/${id}`);
        if (!res.ok) throw new Error('Erreur chargement');
        const data = await res.json();
        setForm(data);
      } catch (err) {
        alert('Impossible de charger l’employé');
      }
    };

    fetchEmploye();
  }, [id]);

  const submit = async () => {
    if (!form) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/api/employes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error('Erreur modification');

      navigate('/store-admin/employes');
    } catch (err) {
      alert('Échec de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (!form) return <div style={{ padding: 30 }}>Chargement...</div>;

  return (
    <div style={{ padding: 30 }}>
      <h2>Modifier l’employé</h2>

      <div style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
        <input value={form.nom} onChange={onChange('nom')} placeholder="Nom" />
        <input value={form.prenom} onChange={onChange('prenom')} placeholder="Prénom" />
        <input value={form.email} onChange={onChange('email')} placeholder="Email" />
        <input value={form.telephone} onChange={onChange('telephone')} placeholder="Téléphone" />

        <select value={form.role} onChange={onChange('role')}>
          <option value="Commercial">Commercial</option>
          <option value="Developpeur">Développeur</option>
        </select>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/store-admin/employes')}>
            Annuler
          </button>

          <button onClick={submit} disabled={loading}>
            {loading ? 'Modification...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  );
}
