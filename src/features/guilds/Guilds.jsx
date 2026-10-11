import { useCallback, useEffect, useState } from 'react'
import { createGuild, listGuilds } from '../../services/guildApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { GuildCard } from '../../components/Cards.jsx'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'

export function Guilds() {
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [tag, setTag] = useState('')
  const [description, setDescription] = useState('')
  const [privacy, setPrivacy] = useState('PUBLIC')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setGuilds(await listGuilds())
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load guilds.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    if (busy) return
    if (!name.trim()) {
      setNotice('Guild name is required.')
      return
    }
    setBusy(true)
    setNotice('')
    try {
      await createGuild({ name: name.trim(), tag: tag.trim() || undefined, description: description.trim() || undefined, privacy })
      setName('')
      setTag('')
      setDescription('')
      setShowForm(false)
      setNotice('Guild created — you are its OWNER.')
      await load()
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Could not create guild.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h2>Guilds 🛡️</h2>
        <p>Band together, earn guild XP per watched episode, and tackle guild quests.</p>
      </div>
      <div className="toolbar">
        <button type="button" className="btn small" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : '+ Create guild'}</button>
      </div>
      {notice && <div className="form-ok" style={{ marginBottom: 12 }}>{notice}</div>}
      {showForm && (
        <form className="card" style={{ marginBottom: 16 }} onSubmit={handleCreate}>
          <div className="form">
            <div className="field">
              <label htmlFor="gname">Guild name</label>
              <input id="gname" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required />
            </div>
            <div className="grid two">
              <div className="field">
                <label htmlFor="gtag">Tag (max 10)</label>
                <input id="gtag" className="input" value={tag} onChange={(e) => setTag(e.target.value)} maxLength={10} placeholder="e.g. NOVA" />
              </div>
              <div className="field">
                <label htmlFor="gprivacy">Privacy</label>
                <select id="gprivacy" className="select" value={privacy} onChange={(e) => setPrivacy(e.target.value)}>
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PRIVATE">PRIVATE</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label htmlFor="gdesc">Description</label>
              <textarea id="gdesc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
            </div>
            <button type="submit" className="btn" disabled={busy}>{busy ? 'Creating…' : 'Create guild'}</button>
          </div>
        </form>
      )}
      {loading && <Loading message="Loading guilds…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && guilds.length === 0 && (
        <EmptyState title="No guilds yet" hint="Create the first guild and invite fellow travelers." />
      )}
      <div className="grid two">
        {guilds.map((g) => <GuildCard key={g.id} guild={g} />)}
      </div>
    </div>
  )
}

export default Guilds

