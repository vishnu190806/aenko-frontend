import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { animeDetail, animeRelations, libraryAddPayload } from '../../services/animeApi.js'
import { addToLibrary, listLibrary } from '../../services/libraryApi.js'
import { apiErrorMessage, isProviderConfigError } from '../../services/apiClient.js'
import { AnimeCard } from '../../components/Cards.jsx'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'
import { displayTitle } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export function AnimeDetail() {
  const { id } = useParams()
  const { isAuthenticated } = useAuth()
  const [anime, setAnime] = useState(null)
  const [relations, setRelations] = useState([])
  const [inLibrary, setInLibrary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [providerDown, setProviderDown] = useState('')
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setProviderDown('')
    try {
      const detail = await animeDetail(id)
      setAnime(detail)
      try {
        const rel = await animeRelations(id)
        setRelations(rel || [])
      } catch {
        setRelations([])
      }
    } catch (err) {
      if (isProviderConfigError(err)) setProviderDown(apiErrorMessage(err))
      else setError(apiErrorMessage(err, 'Could not load anime details.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  const checkLibrary = useCallback(async () => {
    if (!isAuthenticated || !anime) return
    // Match by internal id when known; provider results have id=null so we
    // scan the first page for a matching title as a best-effort hint.
    try {
      if (anime.id != null) {
        const page = await listLibrary({ page: 0, size: 100 })
        setInLibrary((page.content || []).find((e) => e.mediaId === anime.id) || null)
      }
    } catch { /* non-fatal */ }
  }, [anime, isAuthenticated])

  useEffect(() => { load() }, [load])
  useEffect(() => { checkLibrary() }, [checkLibrary])

  async function handleAdd(status = 'PLANNED') {
    if (!isAuthenticated) {
      setNotice('Log in to add anime to your library.')
      return
    }
    if (adding) return
    setAdding(true)
    setNotice('')
    try {
      const entry = await addToLibrary(libraryAddPayload(anime, { status }))
      setInLibrary(entry)
      setNotice(`Added to your library as ${status}.`)
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Could not add to library.'))
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <Loading message="Loading anime details…" />
  if (providerDown) return <div className="error-box" role="alert"><strong>Anime details unavailable.</strong><div>{providerDown}</div></div>
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!anime) return <EmptyState title="Anime not found" />

  const title = displayTitle(anime)

  return (
    <div>
      <Link to="/discover">← Back to Discover</Link>
      <div className="detail-hero" style={{ marginTop: 12 }}>
        {anime.coverImage
          ? <img src={anime.coverImage} alt={`${title} cover`} />
          : <div className="cover-fallback" style={{ maxWidth: 220, borderRadius: 14 }}>{title.charAt(0)}</div>}
        <div>
          <h2>{title}</h2>
          {anime.englishTitle && anime.englishTitle !== anime.title && (
            <div style={{ color: 'var(--muted)', fontSize: 14 }}>{anime.englishTitle}</div>
          )}
          <div className="chip-row" style={{ margin: '10px 0' }}>
            {anime.type && <span className="chip">{anime.type}</span>}
            {anime.status && <span className="chip violet">{anime.status}</span>}
            {anime.episodes ? <span className="chip">{anime.episodes} episodes</span> : null}
            {anime.score ? <span className="chip gold">★ {anime.score}</span> : null}
          </div>
          {(anime.genres?.length > 0) && (
            <div className="chip-row" style={{ marginBottom: 10 }}>
              {anime.genres.map((g) => <span key={g} className="chip">{g}</span>)}
            </div>
          )}
          <p className="synopsis">{anime.synopsis || 'No synopsis available for this title.'}</p>
          {notice && <div className="form-ok" style={{ marginTop: 10 }}>{notice}</div>}
          <div className="btn-row">
            {inLibrary ? (
              <>
                <span className="chip green">In library · {inLibrary.status}</span>
                <Link className="btn secondary small" to="/library">Open library</Link>
              </>
            ) : (
              <>
                <button type="button" className="btn small" disabled={adding} onClick={() => handleAdd('PLANNED')}>{adding ? 'Adding…' : '+ Plan to Watch'}</button>
                <button type="button" className="btn secondary small" disabled={adding} onClick={() => handleAdd('WATCHING')}>+ Watching</button>
              </>
            )}
            {anime.externalUrl && <a className="btn ghost small" href={anime.externalUrl} target="_blank" rel="noreferrer">MAL page</a>}
          </div>
        </div>
      </div>

      <h3>Related Anime</h3>
      {relations.length === 0 ? (
        <EmptyState title="No related anime" hint="The provider returned no relationships for this title." />
      ) : (
        <div className="grid cards">
          {relations.map((r, i) => (
            <AnimeCard key={r.anime?.externalId || `${r.relationType}-${i}`} anime={r.anime}
              footer={<span className="chip violet">{r.relationType}</span>} />
          ))}
        </div>
      )}
    </div>
  )
}

export default AnimeDetail

