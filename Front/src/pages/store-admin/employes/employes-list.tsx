import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/axios';

type Employe = {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  role?: string;
};

export default function EmployesListPage() {
  const [loading, setLoading] = useState(false);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [error, setError] = useState<string | null>(null);
const navigate = useNavigate();

  // ✅ NEW: filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'Tous' | string>('Tous');

  const fetchEmployes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Employe[]>('/employes');
      const data = res.data;
      setEmployes(data);
    } catch (e: any) {
      setError(e?.message || 'Impossible de charger les employés');
    } finally {
      setLoading(false);
    }
  };

  const deleteEmploye = async (id: number) => {
    const ok = window.confirm('Supprimer cet employé ?');
    if (!ok) return;

    try {
      await api.delete(`/employes/${id}`);
      setEmployes((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Échec de la suppression');
    }
  };

  useEffect(() => {
    fetchEmployes();
  }, []);

  // ✅ NEW: role options based on data (unique)
  const roleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of employes) {
      const r = (e.role || '').trim();
      if (r) set.add(r);
    }
    return ['Tous', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [employes]);

  // ✅ NEW: filtered list
  const filteredEmployes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return employes.filter((e) => {
      const fullName = `${e.nom ?? ''} ${e.prenom ?? ''}`.trim().toLowerCase();
      const nameMatch = !q || fullName.includes(q);

      const role = (e.role ?? '').trim();
      const roleMatch = roleFilter === 'Tous' || role === roleFilter;

      return nameMatch && roleMatch;
    });
  }, [employes, search, roleFilter]);

  const styles = useMemo(
    () =>
      ({
        page: {
          padding: 30,
          background: '#f4f6f9',
          minHeight: '100vh',
        },

        card: {
          background: 'white',
          borderRadius: 14,
          boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
          padding: 24,
        },

        header: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
          gap: 12,
          flexWrap: 'wrap',
        },

        title: {
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
        },

        subtitle: {
          margin: '4px 0 0',
          fontSize: 13,
          color: '#6b7280',
        },

        controlsWrap: {
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'flex-end',
        } as React.CSSProperties,

        input: {
          height: 38,
          padding: '0 12px',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          outline: 'none',
          fontSize: 14,
          background: '#fff',
        } as React.CSSProperties,

        select: {
          height: 38,
          padding: '0 12px',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
          outline: 'none',
          fontSize: 14,
          background: '#fff',
          cursor: 'pointer',
        } as React.CSSProperties,

        buttonRow: {
          display: 'flex',
          gap: 10,
          alignItems: 'center',
        } as React.CSSProperties,

        table: {
          width: '100%',
          borderCollapse: 'collapse',
        },

        th: {
          textAlign: 'left',
          padding: 12,
          borderBottom: '2px solid #e5e7eb',
          fontSize: 13,
          color: '#6b7280',
          fontWeight: 600,
          whiteSpace: 'nowrap',
        },

        td: {
          padding: 12,
          borderBottom: '1px solid #f1f1f1',
          fontSize: 14,
          verticalAlign: 'middle',
        },

        roleBadge: {
          background: '#e0f2fe',
          color: '#0369a1',
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          display: 'inline-flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
        },

        refreshBtn: {
          background: '#e5e7eb',
          border: 'none',
          padding: '8px 14px',
          borderRadius: 10,
          cursor: 'pointer',
          fontWeight: 700,
        },

        addBtn: {
          background: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 10,
          cursor: 'pointer',
          fontWeight: 700,
        },

        deleteBtn: {
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: 10,
          cursor: 'pointer',
          fontWeight: 700,
        },
editBtn: {
  background: '#f59e0b',
  color: 'white',
  border: 'none',
  padding: '6px 12px',
  borderRadius: 10,
  cursor: 'pointer',
  fontWeight: 700,
},

        error: {
          marginBottom: 12,
          color: '#b91c1c',
          fontWeight: 700,
        },

        empty: {
          textAlign: 'center',
          padding: 20,
          color: '#9ca3af',
        },

        pill: {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 999,
          border: '1px solid #e5e7eb',
          background: '#f8fafc',
          color: '#334155',
          fontSize: 12,
          fontWeight: 700,
        } as React.CSSProperties,
      }) as { [key: string]: React.CSSProperties },
    []
  );

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>Gestion des Employés</h2>
            <p style={styles.subtitle}>Liste complète des employés enregistrés</p>
          </div>

          <div style={styles.controlsWrap}>
            {/* 🔎 Search by name */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou prénom..."
              style={{ ...styles.input, width: 260 }}
            />

            {/* 🎛️ Filter by role */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{ ...styles.select, minWidth: 170 }}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r === 'Tous' ? 'Tous les rôles' : r}
                </option>
              ))}
            </select>

            <span style={styles.pill}>
              Résultats: {filteredEmployes.length}
            </span>

            <div style={styles.buttonRow}>
              <button onClick={fetchEmployes} disabled={loading} style={styles.refreshBtn}>
                {loading ? 'Chargement...' : 'Rafraîchir'}
              </button>

              <Link to="/store-admin/employes/add" style={{ textDecoration: 'none' }}>
                <button style={styles.addBtn}>+ Ajouter</button>
              </Link>
            </div>
          </div>
        </div>

        {error && <div style={styles.error}>Erreur : {error}</div>}

        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Nom</th>
                <th style={styles.th}>Prénom</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Téléphone</th>
                <th style={styles.th}>Rôle</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEmployes.map((e) => (
                <tr key={e.id}>
                  <td style={styles.td}>{e.nom || '-'}</td>
                  <td style={styles.td}>{e.prenom || '-'}</td>
                  <td style={styles.td}>{e.email || '-'}</td>
                  <td style={styles.td}>{e.telephone || '-'}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge}>{e.role || '-'}</span>
                  </td>

               <td style={{ ...styles.td, textAlign: 'right' }}>
  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
    <button
      type="button"
      onClick={() => navigate(`/store-admin/employes/edit/${e.id}`)}
      style={styles.editBtn}
    >
      Modifier
    </button>

    <button type="button" onClick={() => deleteEmploye(e.id)} style={styles.deleteBtn}>
      Supprimer
    </button>
  </div>
</td>

                </tr>
              ))}

              {!loading && filteredEmployes.length === 0 && (
                <tr>
                  <td colSpan={6} style={styles.empty}>
                    Aucun employé trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
