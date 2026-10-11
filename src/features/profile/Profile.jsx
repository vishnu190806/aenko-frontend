import { useCallback, useEffect, useState } from 'react'
import { fetchActivity, fetchProfile } from '../../services/profileApi.js'
import { myAchievements } from '../../services/achievementApi.js'
import { listGuilds } from '../../services/guildApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { AchievementBadge } from '../../components/Cards.jsx'
import { EmptyState, ErrorMessage, Loading, ProgressBar } from '../../components/Feedback.jsx'
import { levelProgress, timeAgo } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [guilds, setGuilds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [p, a, g] = await Promise.all([
        fetchProfile(),
        myAchievements().catch(() => []),
        listGuilds().catch(() => []),
      ])
      setProfile(p)
      setAchievements(a || [])
      setGuilds(g || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load profile.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) return <Loading message="Loading AnimeVerse profile…" />
  if (error && !profile) return <ErrorMessage message={error} onRetry={load} />

  const stats = profile?.stats
  const topGenres = stats?.topGenres || []
  const myGuilds = user ? guilds.filter((g) => g.ownerId === user.id).slice(0, 3) : []

  return (
    <div>
      <div className="page-head">
        <h2>AnimeVerse Profile ✨</h2>
        <p>Your RPG identity — every number comes from the backend.</p>
      </div>
      {error && <ErrorMessage message={error} onRetry={load} />}
      {profile && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="brand-mark" style={{ width: 64, height: 64, fontSize: 32, borderRadius: 18 }}>
              {(profile.user.username || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <h3 style={{ fontSize: 22 }}>{profile.user.username}</h3>
              <div className="quest-progress">{profile.user.email} · {profile.user.role} · joined {timeAgo(profile.user.createdAt)}</div>
              {stats && (
                <div style={{ marginTop: 8 }}>
                  <ProgressBar value={levelProgress(stats.totalXp)} variant="orange" />
                  <div className="quest-progress" style={{ marginTop: 4 }}>
                    Level {stats.level} · {stats.totalXp} XP · 🔥 {stats.currentStreakDays}-day streak
                  </div>
                </div>
              )}
            </div>
            <div className="chip-row">
              {stats && <span className="chip orange">{stats.totalAnime} anime</span>}
              {stats && <span className="chip">{stats.episodesWatched} episodes</span>}
              {stats && <span className="chip gold">{stats.questsCompleted} quests</span>}
            </div>
          </div>
        </div>
      )}
      {stats && (
        <div className="stat-grid">
          {[
            ['Watching', stats.watching], ['Completed', stats.completed], ['Planned', stats.planned],
            ['On hold', stats.onHold], ['Dropped', stats.dropped], ['Guilds', stats.guildCount],
          ].map(([label, value]) => (
            <div key={label} className="stat"><div className="label">{label}</div><div className="value">{value}</div></div>
          ))}
        </div>
      )}
      <div className="grid two">
        <div className="card">
          <h3>Top genres</h3>
          {topGenres.length === 0 ? (
            <EmptyState title="No genre stats" hint="Add anime to your library to generate genre statistics." />
          ) : (
            <div className="list">
              {topGenres.slice(0, 5).map((g, i) => (
                <div key={i} className="list-item">
                  <div style={{ flex: 1 }}><strong>{String(g.genre ?? g.name ?? `Genre ${i + 1}`)}</strong>
                    <div className="quest-progress">{g.count ?? g.value ?? ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {myGuilds.length > 0 && (
            <>
              <h3 style={{ marginTop: 14 }}>My guilds (owned)</h3>
              <div className="list">
                {myGuilds.map((g) => <div key={g.id} className="list-item"><strong>{g.name}</strong></div>)}
              </div>
            </>
          )}
        </div>
        <div className="card">
          <h3>Achievements ({achievements.length})</h3>
          {achievements.length === 0 ? (
            <EmptyState title="No achievements yet" hint="Watch episodes and complete quests to unlock badges." />
          ) : (
            <div className="badge-grid" style={{ gridTemplateColumns: '1fr' }}>
              {achievements.slice(0, 3).map((a) => (
                <AchievementBadge key={a.id} achievement={{ ...a, unlocked: true }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function Activity() {
  const [data, setData] = useState(null)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await fetchActivity(page, 15))
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load activity.'))
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { load() }, [load])

  return (
    <div>
      <div className="page-head">
        <h2>Activity 📜</h2>
        <p>Your recent journey — episodes, quests, achievements and guild events.</p>
      </div>
      {loading && <Loading message="Loading activity…" />}
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && (!data?.content || data.content.length === 0) && (
        <EmptyState title="No activity yet" hint="Your watched episodes and quest events will appear here." />
      )}
      <div className="list">
        {(data?.content || []).map((a) => (
          <ActivityRow key={a.id} activity={a} />
        ))}
      </div>
      {data && (data.totalPages > 1 || page > 0) && (
        <div className="pagination">
          <button type="button" className="btn secondary small" disabled={page === 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>← Prev</button>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>Page {page + 1}{data.totalPages ? ` of ${data.totalPages}` : ''}</span>
          <button type="button" className="btn secondary small" disabled={(data.totalPages ? page + 1 >= data.totalPages : false) || loading} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  )
}

function ActivityRow({ activity }) {
  return (
    <div className="list-item">
      <div className="dot" />
      <div>
        <strong>{activity.activityType?.replace(/_/g, ' ')}</strong>
        <div className="quest-progress">
          {timeAgo(activity.createdAt)}
          {activity.referenceId ? ` · ref #${activity.referenceId}` : ''}
          {activity.metadata ? ` · ${activity.metadata}` : ''}
        </div>
      </div>
    </div>
  )
}

export default Profile

