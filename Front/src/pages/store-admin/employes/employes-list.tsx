import { useEffect, useState } from 'react';

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

  const fetchEmployes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:8080/api/employes');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Employe[];
      setEmployes(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const deleteEmploye = async (id: number) => {
    const ok = window.confirm('Delete this employee?');
    if (!ok) return;

    try {
      const res = await fetch(`http://localhost:8080/api/employes/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setEmployes((prev) => prev.filter((e) => e.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Delete failed');
    }
  };

  useEffect(() => {
    fetchEmployes();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Employees</h2>
        <button onClick={fetchEmployes} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
        <a href="/store-admin/employes/add">
          <button>+ Add employee</button>
        </a>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>Error: {error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>ID</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>Name</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>Email</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'left', padding: 8 }}>Role</th>
            <th style={{ borderBottom: '1px solid #ddd', textAlign: 'right', padding: 8 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {employes.map((e) => (
            <tr key={e.id}>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{e.id}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                {[e.prenom, e.nom].filter(Boolean).join(' ') || '-'}
              </td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{e.email || '-'}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{e.role || '-'}</td>
              <td style={{ borderBottom: '1px solid #eee', padding: 8, textAlign: 'right' }}>
                <button onClick={() => deleteEmploye(e.id)} style={{ color: 'white', background: 'crimson' }}>
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {!loading && employes.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: 16, textAlign: 'center', color: '#777' }}>
                No employees found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
