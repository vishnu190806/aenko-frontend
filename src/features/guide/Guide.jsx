import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { animeDetail, animeRelations, searchAnime } from '../../services/animeApi.js'
import { franchiseDetail, franchiseWatchOrders, listFranchises } from '../../services/profileApi.js'
import { apiErrorMessage, isProviderConfigError } from '../../services/apiClient.js'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'
import { displayTitle, humanize } from '../../utils/format.js'

const SEARCH_SIZE = 8

function relationLabel(relationType) {
  if (!relationType) return 'Related'
  return humanize(relationType)
}

function RelatedCard({ item, onExplore }) {
  const anime = item?.anime
  if (!anime) return null
  const title = displayTitle(anime)
  const key = anime.externalId != null ? String(anime.externalId) : null
  return (
    <article className="card anime-card">
      {anime.coverImage
        ? <img src={anime.coverImage} alt={`${title} cover`} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        : <div className="cover-fallback" aria-hidden="true">{(title || '?').charAt(0)}</div>}
      <div className="body">
        <div className="title">{title}</div>
        <div className="meta">
          {[anime.type, anime.status, anime.episodes ? `${anime.episodes} ep` : null, anime.score ? `★ ${anime.score}` : null]
            .filter(Boolean).join(' · ') || '—'}
        </div>
        <div className="chip-row">
          <span className="chip violet">{relationLabel(item.relationType)}</span>
        </div>
        {key && (
          <div className="btn-row">
            <button type="button" className="btn secondary small" onClick={() => onExplore(key)}>
              Explore →
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function SearchResultCard({ anime, onSelect }) {
  const title = displayTitle(anime)
  const key = anime?.externalId != null ? String(anime.externalId) : null
  return (
    <article className="card anime-card">
      {anime?.coverImage
        ? <img src={anime.coverImage} alt={`${title} cover`} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
        : <div className="cover-fallback" aria-hidden="true">{(title || '?').charAt(0)}</div>}
      <div className="body">
        <div className="title">{title}</div>
        <div className="meta">
          {[anime?.type, anime?.status, anime?.episodes ? `${anime.episodes} ep` : null, anime?.score ? `★ ${anime.score}` : null]
            .filter(Boolean).join(' · ') || '—'}
        </div>
        <div className="btn-row">
          <button type="button" className="btn small" disabled={!key} onClick={() => key && onSelect(key)}>
            Open guide
          </button>
        </div>
      </div>
    </article>
  )
}

function WatchOrderSection({ activeExternalId, activeTitle }) {
  const [items, setItems] = useState([])
  const [details, setDetails] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [manualPick, setManualPick] = useState(false)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const list = await listFranchises()
      setItems(list || [])
      setSelectedId((list || []).length > 0 ? list[0].id : null)
      // Resolve each franchise's linked external MAL ids so the selected
      // anime can be matched to its curated guide without title guessing.
      const pairs = await Promise.all(
        (list || []).map(async (f) => {
          try {
            return [f.id, await franchiseDetail(f.id)]
          } catch {
            return [f.id, null]
          }
        }),
      )
      setDetails(Object.fromEntries(pairs))
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load curated watch orders.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const matchedId = activeExternalId
    ? (items.find((f) => (details[f.id]?.media || [])
      .some((m) => m.externalId != null && String(m.externalId) === String(activeExternalId)))?.id ?? null)
    : null

  useEffect(() => {
    if (matchedId != null && !manualPick) setSelectedId(matchedId)
  }, [matchedId, manualPick])

  useEffect(() => {
    if (selectedId == null) {
      setOrders([])
      return
    }
    let cancelled = false
    async function fetchOrders() {
      setDetailLoading(true)
      setDetailError('')
      try {
        const o = await franchiseWatchOrders(selectedId).catch(() => [])
        if (!cancelled) setOrders(o || [])
      } catch (err) {
        if (!cancelled) setDetailError(apiErrorMessage(err, 'Could not load watch orders.'))
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }
    fetchOrders()
    return () => { cancelled = true }
  }, [selectedId])

  return (
    <section style={{ marginTop: 28 }}>
      <h3>Curated Watch Orders</h3>
      <p style={{ color: 'var(--muted)', fontSize: 13.5 }}>
        Hand-curated viewing sequences — never generated from relationship data.
      </p>
      {activeExternalId && matchedId != null && (
        <div className="form-ok" style={{ marginBottom: 12 }}>
          “{activeTitle || 'This title'}” belongs to the curated guide
          “{items.find((f) => f.id === matchedId)?.name}” — showing its watch order below.
        </div>
      )}
      {activeExternalId && !loading && matchedId == null && (
        <EmptyState
          title={`No curated order for “${activeTitle || 'this title'}” yet`}
          hint="No curated watch order currently exists for that specific title. Browse the available guides below."
        />
      )}
      {loading && <Loading message="Loading curated watch orders…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          title="No curated watch orders yet"
          hint="No curated watch order is available for this franchise yet. You can still explore its related anime."
        />
      )}
      {!loading && !error && items.length > 0 && (
        <div className="toolbar">
          <select
            className="select"
            style={{ maxWidth: 320 }}
            value={selectedId ?? ''}
            onChange={(e) => { setManualPick(true); setSelectedId(Number(e.target.value)) }}
            aria-label="Select franchise"
          >
            {items.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>
      )}
      {detailError && <ErrorMessage message={detailError} />}
      {detailLoading && <Loading message="Loading watch orders…" />}
      {!detailLoading && !detailError && selectedId != null && orders.length === 0 && items.length > 0 && (
        <EmptyState
          title="No curated watch order for this franchise"
          hint="No curated watch order is available for this franchise yet. You can still explore its related anime."
        />
      )}
      {!detailLoading && orders.length > 0 && orders.map((o) => (
        <div key={o.id} className="card" style={{ marginBottom: 12 }}>
          <strong>{o.name}</strong>
          {o.description && <div className="quest-progress">{o.description}</div>}
          <div className="step-list" style={{ marginTop: 8 }}>
            {(o.steps || []).slice().sort((a, b) => a.sequenceNumber - b.sequenceNumber).map((s) => (
              <div key={s.sequenceNumber} className="step">
                <div className="step-num">{s.sequenceNumber}</div>
                <div style={{ flex: 1 }}>
                  <strong>{s.title || `Media #${s.mediaId}`}</strong>
                  <div className="chip-row" style={{ margin: '6px 0' }}>
                    {s.stepType === 'OPTIONAL'
                      ? <span className="chip gold">Optional</span>
                      : <span className="chip green">Required</span>}
                  </div>
                  <div className="quest-progress">
                    {s.notes || ''}
                  </div>
                  {(s.externalUrl || s.externalId) && (
                    <div className="btn-row">
                      <a
                        className="btn ghost small"
                        href={s.externalUrl || `https://myanimelist.net/anime/${s.externalId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        MAL page
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

export function Guide() {
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [results, setResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [searchProviderDown, setSearchProviderDown] = useState('')

  const [selectedId, setSelectedId] = useState(null)
  const [history, setHistory] = useState([])
  const [reloadKey, setReloadKey] = useState(0)
  const [detail, setDetail] = useState(null)
  const [relations, setRelations] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [relationsError, setRelationsError] = useState('')
  const [providerDown, setProviderDown] = useState('')

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) return
    setSearchLoading(true)
    setSearchError('')
    setSearchProviderDown('')
    try {
      const data = await searchAnime(q.trim(), 0, SEARCH_SIZE)
      setResults(data?.content || [])
    } catch (err) {
      if (isProviderConfigError(err)) {
        setSearchProviderDown(apiErrorMessage(err))
        setResults([])
      } else {
        setSearchError(apiErrorMessage(err, 'Anime search failed.'))
      }
    } finally {
      setSearchLoading(false)
    }
  }, [])

  function submitSearch(e) {
    e.preventDefault()
    if (!query.trim() || searchLoading) return
    setSubmitted(query.trim())
    runSearch(query.trim())
  }

  // External MAL ids drive the whole guide: no library import is required.
  const openGuide = useCallback((externalId, pushCurrent = false) => {
    const key = externalId != null ? String(externalId) : null
    if (!key) return
    if (pushCurrent && selectedId && selectedId !== key) {
      setHistory((h) => [...h, selectedId])
    }
    if (key !== selectedId) {
      setSelectedId(key)
    } else {
      setReloadKey((k) => k + 1)
    }
  }, [selectedId])

  const retryGuide = useCallback(() => {
    setReloadKey((k) => k + 1)
  }, [])

  const selectDifferent = useCallback(() => {
    setSelectedId(null)
    setHistory([])
    setDetail(null)
    setRelations([])
    setDetailError('')
    setRelationsError('')
    setProviderDown('')
  }, [])

  const goBack = useCallback(() => {
    if (history.length === 0) {
      selectDifferent()
      return
    }
    const prev = history[history.length - 1]
    setHistory(history.slice(0, -1))
    setSelectedId(prev)
  }, [history, selectDifferent])

  useEffect(() => {
    if (selectedId == null) return
    let cancelled = false
    async function fetchGuide() {
      setDetailLoading(true)
      setDetailError('')
      setRelationsError('')
      setProviderDown('')
      try {
        const d = await animeDetail(selectedId)
        if (cancelled) return
        setDetail(d)
        try {
          const rel = await animeRelations(selectedId)
          if (!cancelled) setRelations(rel || [])
        } catch (err) {
          if (!cancelled) {
            if (isProviderConfigError(err)) setProviderDown(apiErrorMessage(err))
            else setRelationsError(apiErrorMessage(err, 'Could not load related anime.'))
            setRelations([])
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (isProviderConfigError(err)) setProviderDown(apiErrorMessage(err))
          else setDetailError(apiErrorMessage(err, 'Could not load anime details.'))
          setDetail(null)
          setRelations([])
        }
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    }
    fetchGuide()
    return () => { cancelled = true }
  }, [selectedId, reloadKey])

  const title = detail ? displayTitle(detail) : ''

  return (
    <div>
      <div className="page-head">
        <h2>Anime Guide 🧭</h2>
        <p>Search any anime and explore its real MyAnimeList relationships — no library import needed.</p>
      </div>

      <form onSubmit={submitSearch} className="toolbar" role="search">
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Search anime by title…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Anime title"
        />
        <button type="submit" className="btn" disabled={searchLoading || !query.trim()}>
          {searchLoading ? 'Searching…' : 'Search'}
        </button>
        {selectedId != null && (
          <>
            <div className="spacer" />
            <button type="button" className="btn secondary small" onClick={selectDifferent}>
              Select different anime
            </button>
          </>
        )}
      </form>

      {searchLoading && <Loading message="Searching anime…" />}
      {searchError && <ErrorMessage message={searchError} onRetry={() => runSearch(submitted)} />}
      {searchProviderDown && (
        <div className="error-box" role="alert">
          <strong>Anime search is temporarily unavailable.</strong>
          <div style={{ marginTop: 4 }}>{searchProviderDown}</div>
          <div style={{ marginTop: 4, color: 'var(--muted)' }}>
            The backend needs a MyAnimeList client ID (MAL_CLIENT_ID). Library, quests, guilds and profile keep working.
          </div>
          <div className="btn-row">
            <button type="button" className="btn secondary small" onClick={() => runSearch(submitted)}>Retry</button>
          </div>
        </div>
      )}
      {!searchLoading && !searchError && !searchProviderDown && submitted && results.length === 0 && selectedId == null && (
        <EmptyState title="No anime found" hint={`No results for “${submitted}”. Try another title.`} />
      )}
      {selectedId == null && results.length > 0 && (
        <div className="grid cards">
          {results.map((a, i) => (
            <SearchResultCard key={a.externalId || a.id || `${a.title}-${i}`} anime={a} onSelect={(key) => openGuide(key)} />
          ))}
        </div>
      )}

      {selectedId != null && (
        <section style={{ marginTop: 8 }}>
          <div className="btn-row" style={{ marginTop: 0, marginBottom: 12 }}>
            {history.length > 0 && (
              <button type="button" className="btn secondary small" onClick={goBack}>← Back</button>
            )}
            <Link className="btn ghost small" to="/discover">Discover anime</Link>
          </div>

          {detailLoading && <Loading message="Loading guide…" />}
          {providerDown && (
            <div className="error-box" role="alert">
              <strong>Guide data is temporarily unavailable.</strong>
              <div style={{ marginTop: 4 }}>{providerDown}</div>
              <div className="btn-row">
                <button type="button" className="btn secondary small" onClick={retryGuide}>Retry</button>
              </div>
            </div>
          )}
          {detailError && <ErrorMessage message={detailError} onRetry={retryGuide} />}

          {!detailLoading && !detailError && !providerDown && detail && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {detail.coverImage
                  ? <img src={detail.coverImage} alt={`${title} cover`} style={{ width: 110, height: 150, objectFit: 'cover', borderRadius: 10 }} loading="lazy" />
                  : <div className="cover-fallback" style={{ width: 110, height: 150, borderRadius: 10, fontSize: 32 }}>{title.charAt(0)}</div>}
                <div>
                  <h3 style={{ fontSize: 20 }}>{title}</h3>
                  {detail.englishTitle && detail.englishTitle !== detail.title && (
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>{detail.englishTitle}</div>
                  )}
                  <div className="chip-row" style={{ margin: '8px 0' }}>
                    {detail.type && <span className="chip">{detail.type}</span>}
                    {detail.status && <span className="chip violet">{detail.status}</span>}
                    {detail.episodes ? <span className="chip">{detail.episodes} episodes</span> : null}
                    {detail.score ? <span className="chip gold">★ {detail.score}</span> : null}
                  </div>
                  {(detail.genres?.length > 0) && (
                    <div className="chip-row">
                      {detail.genres.slice(0, 5).map((g) => <span key={g} className="chip">{g}</span>)}
                    </div>
                  )}
                </div>
              </div>
              <p className="synopsis" style={{ marginTop: 12 }}>{detail.synopsis || 'No synopsis available for this title.'}</p>
            </div>
          )}

          {!detailLoading && !providerDown && (
            <>
              <h3>Related Anime</h3>
              {relationsError && <ErrorMessage message={relationsError} onRetry={retryGuide} />}
              {!relationsError && relations.length === 0 && (
                <EmptyState title="No related anime" hint="MyAnimeList returned no relationships for this title." />
              )}
              {relations.length > 0 && (
                <div className="grid cards">
                  {relations.map((r, i) => (
                    <RelatedCard
                      key={r.anime?.externalId || `${r.relationType}-${i}`}
                      item={r}
                      onExplore={(key) => openGuide(key, true)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      <WatchOrderSection
        activeExternalId={selectedId}
        activeTitle={detail ? displayTitle(detail) : ''}
      />
    </div>
  )
}

export default Guide
