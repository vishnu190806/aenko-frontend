import { useCallback, useEffect, useState } from 'react'
import { listAchievements } from '../../services/achievementApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { AchievementBadge } from '../../components/Cards.jsx'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'

export function Achievements() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setItems(await listAchievements())
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load achievements.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const shown = items.filter((a) => filter === 'all' || (filter === 'unlocked' ? a.unlocked : !a.unlocked))
  const unlockedCount = items.filter((a) => a.unlocked).length

  return (
    <div>
      <div className="page-head">
        <h2>Achievements 🏆</h2>
        <p>{items.length ? `${unlockedCount} of ${items.length} unlocked — awarded by the backend only.` : 'Badges awarded by the backend for your milestones.'}</p>
      </div>
      <div className="toolbar">
        {['all', 'unlocked', 'locked'].map((f) => (
          <button key={f} type="button" className={`btn small ${filter === f ? '' : 'secondary'}`} onClick={() => setFilter(f)}>
            {f[0].toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {loading && <Loading message="Loading achievements…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && shown.length === 0 && <EmptyState title="No achievements here" hint="Try a different filter." />}
      <div className="badge-grid">
        {shown.map((a) => <AchievementBadge key={a.id} achievement={a} />)}
      </div>
    </div>
  )
}

export default Achievements

