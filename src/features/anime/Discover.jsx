import { useCallback, useEffect, useState } from 'react'
import { searchAnime, rankingAnime } from '../../services/animeApi.js'
import { apiErrorMessage, isProviderConfigError } from '../../services/apiClient.js'
import { AnimeCard } from '../../components/Cards.jsx'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'

const PAGE_SIZE = 12

export function Discover() {
  const [mode, setMode] = useState('search')
  const [query, setQuery] = useState('naruto')
  const [submitted, setSubmitted] = useState('naruto')
  const [rankingType, setRankingType] = useState('all')
  const [page, setPage] = useState(0)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [providerDown, setProviderDown] = useState('')

  const load = useCallback(async (q, m, rt, p) => {
    setLoading(true)
    setError('')
    setProviderDown('')
    try {
      const data = m === 'ranking' ? await rankingAnime(rt, p, PAGE_SIZE) : await searchAnime(q, p, PAGE_SIZE)
      setResult(data)
    } catch (err) {
      if (isProviderConfigError(err)) {
        setProviderDown(apiErrorMessage(err))
        setResult(null)
      } else {
        setError(apiErrorMessage(err, 'Anime search failed.'))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(submitted, mode, rankingType, page) }, [submitted, mode, rankingType, page, load])

  function submitSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setPage(0)
    setSubmitted(query.trim())
    setMode('search')
  }

  return (
    <div>
      <div className="page-head">
        <h2>Discover Anime 🔍</h2>
        <p>Search powered by AENKO&apos;s backend provider layer — never called directly from the browser.</p>
      </div>

      <form onSubmit={submitSearch} className="toolbar" role="search">
        <input className="input" style={{ maxWidth: 320 }} placeholder="Search by title…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Anime title" />
        <button type="submit" className="btn" disabled={loading}>Search</button>
        <div className="spacer" />
        <select className="select" style={{ maxWidth: 220 }} value={mode} onChange={(e) => { setMode(e.target.value); setPage(0) }} aria-label="Discovery mode">
          <option value="search">Search results</option>
          <option value="ranking">Top ranking</option>
        </select>
        {mode === 'ranking' && (
          <select className="select" style={{ maxWidth: 200 }} value={rankingType} onChange={(e) => { setRankingType(e.target.value); setPage(0) }} aria-label="Ranking type">
            {['all', 'airing', 'upcoming', 'tv', 'movie', 'ova', 'special', 'bypopularity', 'favorite'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </form>

      {loading && <Loading message="Searching the anime verse…" />}
      {error && <ErrorMessage message={error} onRetry={() => load(submitted, mode, rankingType, page)} />}
      {providerDown && (
        <div className="error-box" role="alert">
          <strong>Anime search is temporarily unavailable.</strong>
          <div style={{ marginTop: 4 }}>{providerDown}</div>
          <div style={{ marginTop: 4, color: 'var(--muted)' }}>The backend needs a MyAnimeList client ID (MAL_CLIENT_ID). Library, quests, guilds and profile keep working.</div>
        </div>
      )}

      {!loading && !error && !providerDown && (!result?.content || result.content.length === 0) && (
        <EmptyState title="No anime found" hint="Try a different title, e.g. “One Piece” or “Frieren”." />
      )}

      {result?.content?.length > 0 && (
        <>
          <div className="grid cards">
            {result.content.map((a, i) => (
              <AnimeCard key={a.externalId || a.id || `${a.title}-${i}`} anime={a} />
            ))}
          </div>
          <div className="pagination">
            <button type="button" className="btn secondary small" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Prev</button>
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>Page {page + 1}</span>
            <button type="button" className="btn secondary small" disabled={!result.hasNext || loading} onClick={() => setPage((p) => p + 1)}>Next →</button>
          </div>
        </>
      )}
    </div>
  )
}

export default Discover

