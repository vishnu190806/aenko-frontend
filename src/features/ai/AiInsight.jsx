import { useCallback, useEffect, useState } from 'react'
import { fetchInsight, refreshInsight } from '../../services/profileApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'

export function AiInsight() {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setInsight(await fetchInsight())
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load AI insight.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function refresh() {
    if (refreshing) return
    setRefreshing(true)
    setError('')
    try {
      setInsight(await refreshInsight())
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not refresh insight.'))
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div>
      <div className="page-head">
        <h2>AI Anime Intelligence ✨</h2>
        <p>Advisory-only insights. AI never modifies XP, quests, guilds or your library.</p>
      </div>
      <div className="toolbar">
        <button type="button" className="btn small" disabled={refreshing || loading} onClick={refresh}>
          {refreshing ? 'Consulting the oracle…' : '↻ Generate new insight'}
        </button>
      </div>
      {loading && <Loading message="Reading your anime stars…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && !insight && <EmptyState title="No insight yet" hint="Generate one to get started." />}
      {insight && !loading && (
        <div className="card">
          <div className="chip-row" style={{ marginBottom: 10 }}>
            <span className="chip violet">{insight.type || 'INSIGHT'}</span>
            {insight.personalized
              ? <span className="chip green">AI-generated</span>
              : <span className="chip gold">Local fallback — AI disabled or unavailable</span>}
          </div>
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text)' }}>{insight.content}</p>
          {!insight.personalized && (
            <p className="quest-progress" style={{ marginTop: 10 }}>
              Showing the backend&apos;s fallback guidance, not a live model response. The rest of AENKO works normally.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default AiInsight

