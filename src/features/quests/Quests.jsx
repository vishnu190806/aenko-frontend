import { useCallback, useEffect, useState } from 'react'
import { completeQuest, listQuests, myQuests, startQuest } from '../../services/questApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { QuestCard } from '../../components/Cards.jsx'
import { EmptyState, ErrorMessage, Loading } from '../../components/Feedback.jsx'

export function Quests() {
  const [tab, setTab] = useState('available')
  const [all, setAll] = useState([])
  const [mine, setMine] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [a, m] = await Promise.all([listQuests(), myQuests().catch(() => [])])
      setAll(a || [])
      setMine(m || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load quests.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function act(fn, quest, okMsg) {
    if (busyId) return
    setBusyId(quest.id)
    setNotice('')
    try {
      await fn(quest.id)
      setNotice(okMsg)
      await load()
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Quest action failed.'))
    } finally {
      setBusyId(null)
    }
  }

  const startedIds = new Set(mine.map((q) => q.id))
  const available = all.filter((q) => !startedIds.has(q.id))

  return (
    <div>
      <div className="page-head">
        <h2>Quests 🗺️</h2>
        <p>Completion is verified by the backend — XP is only awarded server-side.</p>
      </div>
      <div className="toolbar">
        <button type="button" className={`btn small ${tab === 'available' ? '' : 'secondary'}`} onClick={() => setTab('available')}>Available</button>
        <button type="button" className={`btn small ${tab === 'mine' ? '' : 'secondary'}`} onClick={() => setTab('mine')}>My quests ({mine.length})</button>
      </div>
      {notice && <div className="form-ok" style={{ marginBottom: 12 }}>{notice}</div>}
      {loading && <Loading message="Loading quests…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && tab === 'available' && (
        available.length === 0
          ? <EmptyState title="No new quests" hint="You have started every available quest. Check “My quests”." />
          : <div className="grid two">{available.map((q) => (
            <QuestCard key={q.id} quest={q} busy={busyId === q.id} onStart={(quest) => act(startQuest, quest, `Quest “${quest.name}” started.`)} />
          ))}</div>
      )}
      {!loading && !error && tab === 'mine' && (
        mine.length === 0
          ? <EmptyState title="No quests started" hint="Start a quest from the Available tab." />
          : <div className="grid two">{mine.map((q) => (
            <QuestCard key={q.id} quest={q} busy={busyId === q.id} onComplete={(quest) => act(completeQuest, quest, `Completion claimed for “${quest.name}” — backend verified.`)} />
          ))}</div>
      )}
    </div>
  )
}

export default Quests

