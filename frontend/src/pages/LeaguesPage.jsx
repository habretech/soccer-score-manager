import { useState, useEffect } from 'react';
import api from '../api/client.js';
import Modal from '../components/Modal.jsx';
import Spinner from '../components/Spinner.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { AuthAction, ReadOnlyBanner } from '../components/AuthGuard.jsx';
import AuditInfo from '../components/AuditInfo.jsx';

function LeagueForm({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '');
  const [season, setSeason] = useState(initial?.season || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (initial) {
        await api.put(`/api/leagues/${initial.id}`, { name, season });
      } else {
        await api.post('/api/leagues', { name, season });
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div>
        <label className="label">League Name</label>
        <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Premier League" required />
      </div>
      <div>
        <label className="label">Season</label>
        <input className="input" value={season} onChange={e => setSeason(e.target.value)} placeholder="2024/25" required />
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Update' : 'Create League'}
        </button>
      </div>
    </form>
  );
}

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/leagues');
      setLeagues(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this league and all its data?')) return;
    await api.delete(`/api/leagues/${id}`);
    load();
  };

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (league) => { setEditing(league); setShowModal(true); };
  const closeModal = () => setShowModal(false);
  const saved = () => { closeModal(); load(); };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leagues</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your soccer leagues and seasons</p>
        </div>
        <AuthAction><button className="btn-primary" onClick={openCreate}>+ New League</button></AuthAction>
      </div>
      <ReadOnlyBanner />

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : leagues.length === 0 ? (
        <EmptyState
          icon="🏆"
          message="No leagues yet. Create your first league to get started."
          action={<AuthAction><button className="btn-primary" onClick={openCreate}>Create League</button></AuthAction>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leagues.map(league => (
            <div key={league.id} className="card flex flex-col gap-3">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">{league.name}</h2>
                <p className="text-sm text-gray-500">Season: {league.season}</p>
                <AuditInfo {...league} />
              </div>
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                <AuthAction inline><button className="btn-secondary btn-sm" onClick={() => openEdit(league)}>Edit</button></AuthAction>
                <AuthAction inline><button className="btn-danger btn-sm" onClick={() => handleDelete(league.id)}>Delete</button></AuthAction>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editing ? 'Edit League' : 'New League'} onClose={closeModal}>
          <LeagueForm initial={editing} onSave={saved} onClose={closeModal} />
        </Modal>
      )}
    </div>
  );
}
