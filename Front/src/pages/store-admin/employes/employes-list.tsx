import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type Employe = {
  id: number;
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  role?: string;
  password?: string;
};

export default function EmployesListPage() {
  const [loading, setLoading] = useState(false);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/api/employes');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Employe[];
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
      const res = await fetch(`http://localhost:8080/api/employes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEmployes((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Échec de la suppression');
    }
  };

  useEffect(() => {
    fetchEmployes();
  }, []);

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
          alignItems: 'center',
          marginBottom: 20,
          gap: 12,
          flexWrap: 'wrap',
        },

        title: {
          margin: 0,
          fontSize: 22,
          fontWeight: 700,
        },

        subtitle: {
          margin: 0,
          fontSize: 13,
          color: '#6b7280',
        },

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
        },

        refreshBtn: {
          background: '#e5e7eb',
          border: 'none',
          padding: '8px 14px',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        },

        addBtn: {
          background: '#2563eb',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        },

        deleteBtn: {
          background: '#ef4444',
          color: 'white',
          border: 'none',
          padding: '6px 12px',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        },

        error: {
          marginBottom: 12,
          color: '#b91c1c',
          fontWeight: 600,
        },

        empty: {
          textAlign: 'center',
          padding: 20,
          color: '#9ca3af',
        },

        pwdText: {
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          letterSpacing: 0.5,
        },
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

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchEmployes} disabled={loading} style={styles.refreshBtn}>
              {loading ? 'Chargement...' : 'Rafraîchir'}
            </button>

            <Link to="/store-admin/employes/add" style={{ textDecoration: 'none' }}>
              <button style={styles.addBtn}>+ Ajouter</button>
            </Link>
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
                <th style={styles.th}>Mot de passe</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {employes.map((e) => (
                <tr key={e.id}>
                  <td style={styles.td}>{e.nom || '-'}</td>
                  <td style={styles.td}>{e.prenom || '-'}</td>
                  <td style={styles.td}>{e.email || '-'}</td>
                  <td style={styles.td}>{e.telephone || '-'}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge}>{e.role || '-'}</span>
                  </td>

                  {/* ✅ password shown directly (no eye) */}
                  <td style={styles.td}>
                    <span style={styles.pwdText}>{e.password || '-'}</span>
                  </td>

                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <button onClick={() => deleteEmploye(e.id)} style={styles.deleteBtn}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && employes.length === 0 && (
                <tr>
                  <td colSpan={7} style={styles.empty}>
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
