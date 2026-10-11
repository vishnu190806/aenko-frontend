import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LIBRARY_STATUSES, listLibrary, removeLibraryEntry, updateLibraryEntry } from '../../services/libraryApi.js'
import { fetchProgress, markEpisodeWatched, unmarkEpisode } from '../../services/progressApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'
import { timeAgo } from '../../utils/format.js'

const PAGE_SIZE = 12

function EpisodeTracker({ entry, onChanged }) {
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busyEp, setBusyEp] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setProgress(await fetchProgress(entry.mediaId))
    } catch (err) {
      // 404 here means "no progress yet" on some backends; treat as empty.
      if (err?.response?.status === 404) setProgress({ mediaId: entry.mediaId, watchedEpisodes: 0, totalEpisodes: entry.episodes, episodes: [] })
      else setError(apiErrorMessage(err, 'Could not load progress.'))
    } finally {
      setLoading(false)
    }
  }, [entry.mediaId, entry.episodes])

  useEffect(() => { load() }, [load])

  async function toggle(ep) {
    if (busyEp != null) return
    const watched = progress?.episodes?.includes(ep)
    setBusyEp(ep)
    try {
      if (watched) await unmarkEpisode(entry.mediaId, ep)
      else await markEpisodeWatched(entry.mediaId, ep)
      await load()
      onChanged?.()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update progress.'))
    } finally {
      setBusyEp(null)
    }
  }

  const total = progress?.totalEpisodes || entry.episodes || 12
  const eps = Array.from({ length: Math.min(total, 60) }, (_, i) => i + 1)

  if (loading) return <Loading message="Loading progress…" />
  return (
    <div>
      {error && <ErrorMessage message={error} onRetry={load} />}
      <div className="quest-progress" style={{ marginBottom: 8 }}>
        {progress?.watchedEpisodes ?? 0} / {progress?.totalEpisodes ?? total} episodes watched
        {total > 60 && ' (first 60 shown)'}
      </div>
      <div className="episode-grid">
        {eps.map((ep) => (
          <button key={ep} type="button" disabled={busyEp === ep}
            className={`ep-pill${progress?.episodes?.includes(ep) ? ' watched' : ''}`}
            onClick={() => toggle(ep)} title={progress?.episodes?.includes(ep) ? `Unmark episode ${ep}` : `Mark episode ${ep} watched`}>
            {ep}
          </button>
        ))}
      </div>
    </div>
  )
}

function LibraryRow({ entry, highlight, onChanged }) {
  const [expanded, setExpanded] = useState(highlight)
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(entry.status)
  const [rating, setRating] = useState(entry.rating ?? '')
  const [notes, setNotes] = useState(entry.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function save() {
    if (busy) return
    setBusy(true)
    setMsg('')
    try {
      await updateLibraryEntry(entry.mediaId, {
        status,
        rating: rating === '' ? null : Number(rating),
        notes: notes || null,
      })
      setEditing(false)
      setMsg('Saved.')
      onChanged?.()
    } catch (err) {
      setMsg(apiErrorMessage(err, 'Could not save changes.'))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (busy) return
    if (!window.confirm(`Remove "${entry.title}" from your library?`)) return
    setBusy(true)
    try {
      await removeLibraryEntry(entry.mediaId)
      onChanged?.()
    } catch (err) {
      setMsg(apiErrorMessage(err, 'Could not remove entry.'))
      setBusy(false)
    }
  }

  return (
    <div className="card" style={highlight ? { borderColor: 'var(--accent)' } : undefined}>
      <div style={{ display: 'flex', gap: 12 }}>
        {entry.coverImage && <img src={entry.coverImage} alt="" loading="lazy" style={{ width: 72, height: 100, objectFit: 'cover', borderRadius: 10 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3>{entry.title}</h3>
          <div className="chip-row">
            <span className="chip orange">{entry.status}</span>
            {entry.rating ? <span className="chip gold">★ {entry.rating}/10</span> : null}
            {entry.episodes ? <span className="chip">{entry.episodes} eps</span> : null}
            {entry.score ? <span className="chip">MAL ★ {entry.score}</span> : null}
          </div>
          {entry.notes && !editing && <p style={{ marginTop: 6 }}>📝 {entry.notes}</p>}
          {msg && <div className="quest-progress" style={{ marginTop: 6 }}>{msg}</div>}
          <div className="btn-row">
            <button type="button" className="btn secondary small" onClick={() => setExpanded((v) => !v)}>
              {expanded ? 'Hide episodes' : 'Track episodes'}
            </button>
            <button type="button" className="btn ghost small" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button type="button" className="btn danger small" disabled={busy} onClick={remove}>Remove</button>
          </div>
        </div>
      </div>
      {editing && (
        <div className="grid two" style={{ marginTop: 12 }}>
          <div className="field">
            <label htmlFor={`lib-status-${entry.mediaId}`}>Status</label>
            <select id={`lib-status-${entry.mediaId}`} className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              {LIBRARY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`lib-rating-${entry.mediaId}`}>Rating (1–10)</label>
            <input id={`lib-rating-${entry.mediaId}`} className="input" type="number" min="1" max="10" value={rating} onChange={(e) => setRating(e.target.value)} placeholder="—" />
          </div>
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor={`lib-notes-${entry.mediaId}`}>Notes</label>
            <textarea id={`lib-notes-${entry.mediaId}`} className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} />
          </div>
          <div><button type="button" className="btn small" disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save changes'}</button></div>
        </div>
      )}
      {expanded && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <EpisodeTracker entry={entry} onChanged={onChanged} />
        </div>
      )}
      <div className="quest-progress" style={{ marginTop: 8 }}>
        {entry.completedAt ? `Completed ${timeAgo(entry.completedAt)}` : entry.startedAt ? `Started ${timeAgo(entry.startedAt)}` : ''}
      </div>
    </div>
  )
}

export function Library() {
  const [params] = useSearchParams()
  const highlight = params.get('highlight')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshTick, setRefreshTick] = useState(0)

  // refreshTick is intentionally read so child mutations can trigger a reload.
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      void refreshTick
      setData(await listLibrary({ status: status || undefined, page, size: PAGE_SIZE }))
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load library.'))
    } finally {
      setLoading(false)
    }
  }, [status, page, refreshTick])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="page-head">
        <h2>My Library 📚</h2>
        <p>Track watch status, ratings, notes and episode progress. XP and quest updates come from the server.</p>
      </div>
      <div className="toolbar">
        <select className="select" style={{ maxWidth: 220 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }} aria-label="Filter by status">
          <option value="">All statuses</option>
          {LIBRARY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="spacer" />
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>{data ? `${data.totalElements ?? data.content?.length ?? 0} entries` : ''}</span>
      </div>

      {loading && <Loading message="Loading library…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && (!data?.content || data.content.length === 0) && (
        <EmptyState title="Your library is empty" hint="Discover anime and add titles with “Plan to Watch”." />
      )}
      <div className="grid two">
        {(data?.content || []).map((e) => (
          <LibraryRow key={e.mediaId} entry={e} highlight={highlight === String(e.mediaId)} onChanged={() => setRefreshTick((t) => t + 1)} />
        ))}
      </div>
      {data && (data.totalPages > 1 || data.hasNext || page > 0) && (
        <div className="pagination">
          <button type="button" className="btn secondary small" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Prev</button>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Page {page + 1}{data.totalPages ? ` of ${data.totalPages}` : ''}</span>
          <button type="button" className="btn secondary small" disabled={(data.totalPages ? page + 1 >= data.totalPages : !data.hasNext) || loading} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}

export default Library

