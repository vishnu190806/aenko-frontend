import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProfile, fetchActivity } from '../../services/profileApi.js'
import { listLibrary } from '../../services/libraryApi.js'
import { myQuests } from '../../services/questApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { EmptyState, ErrorMessage, Loading, ProgressBar } from '../../components/Feedback.jsx'
import { activityLabel, levelProgress, timeAgo } from '../../utils/format.js'

export function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [watching, setWatching] = useState([])
  const [quests, setQuests] = useState([])
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, lib, q, act] = await Promise.all([
        fetchProfile(),
        listLibrary({ status: 'WATCHING', page: 0, size: 4 }).catch(() => null),
        myQuests().catch(() => []),
        fetchActivity(0, 6).catch(() => null),
      ])
      setProfile(p)
      setWatching(lib?.content ?? [])
      setQuests((q || []).filter((x) => x.status !== 'COMPLETED').slice(0, 4))
      setActivity(act?.content ?? [])
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load dashboard.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Loading message="Loading your journey…" />
  if (error && !profile) return <ErrorMessage message={error} onRetry={load} />

  const stats = profile?.stats
  const cards = stats ? [
    ['Library', stats.totalAnime],
    ['Watching', stats.watching],
    ['Completed', stats.completed],
    ['Episodes', stats.episodesWatched],
    ['Total XP', stats.totalXp],
    ['Level', stats.level],
    ['Quests done', stats.questsCompleted],
    ['Achievements', stats.achievementsCount],
  ] : []

  return (
    <div>
      <div className="page-head">
        <h2>Dashboard ⚔️</h2>
        <p>{profile ? `Welcome back, ${profile.user.username}.` : ''} Here is your anime journey at a glance.</p>
      </div>
      {error && <ErrorMessage message={error} onRetry={load} />}
      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <div key={label} className="stat">
            <div className="label">{label}</div>
            <div className="value">{value ?? '—'}</div>
          </div>
        ))}
      </div>
      {stats && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3>Level {stats.level} · {stats.totalXp} XP</h3>
          <ProgressBar value={levelProgress(stats.totalXp)} variant="orange" />
          <div className="quest-progress" style={{ marginTop: 6 }}>
            {500 - (stats.totalXp % 500)} XP to level {stats.level + 1} · 🔥 {stats.currentStreakDays}-day streak
          </div>
        </div>
      )}

      <div className="grid two">
        <div className="card">
          <h3>Continue Watching</h3>
          {watching.length === 0 ? (
            <EmptyState title="Nothing in progress" hint="Add anime to your library to track it here." />
          ) : (
            <div className="list">
              {watching.map((e) => (
                <Link key={e.mediaId} to={`/library?highlight=${e.mediaId}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  <div className="list-item">
                    {e.coverImage && <img className="thumb" src={e.coverImage} alt="" loading="lazy" />}
                    <div>
                      <strong>{e.title}</strong>
                      <div className="quest-progress">{e.status} · {e.episodes ? `${e.episodes} eps` : ''}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>Active Quests</h3>
          {quests.length === 0 ? (
            <EmptyState title="No active quests" hint="Visit Quests to start your next challenge." />
          ) : (
            <div className="list">
              {quests.map((q) => (
                <div key={q.id} className="list-item">
                  <div className="dot" />
                  <div>
                    <strong>{q.name}</strong>
                    <div className="quest-progress">{q.progress}/{q.targetValue} · +{q.xpReward} XP</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="btn-row"><Link className="btn secondary small" to="/quests">View quests</Link></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Recent Activity</h3>
        {activity.length === 0 ? (
          <EmptyState title="No activity yet" hint="Watch episodes or start quests to fill this feed." />
        ) : (
          <div className="list">
            {activity.slice(0, 5).map((a) => (
              <div key={a.id} className="list-item">
                <div className="dot" />
                <div>
                  <strong>{activityLabel(a)}</strong>
                  <div className="quest-progress">{timeAgo(a.createdAt)}{a.metadata ? ` · ${a.metadata}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard

