import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { createGuildQuest, guildDetail, guildLeaderboard, guildMembers, guildQuests, joinGuild, leaveGuild } from '../../services/guildApi.js'
import { apiErrorMessage } from '../../services/apiClient.js'
import { EmptyState, ErrorMessage, Loading, ProgressBar } from '../../components/Feedback.jsx'
import { formatDateTime, humanize } from '../../utils/format.js'
import { useAuth } from '../../context/AuthContext.jsx'

export function GuildDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [guild, setGuild] = useState(null)
  const [members, setMembers] = useState(null)
  const [board, setBoard] = useState(null)
  const [quests, setQuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [qName, setQName] = useState('')
  const [qDesc, setQDesc] = useState('')
  const [qTarget, setQTarget] = useState(10)
  const [qXp, setQXp] = useState(50)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const g = await guildDetail(id)
      setGuild(g)
      const [m, lb, q] = await Promise.all([
        guildMembers(id).catch(() => null),
        guildLeaderboard(id).catch(() => null),
        guildQuests(id).catch(() => []),
      ])
      setMembers(m)
      setBoard(lb)
      setQuests(q || [])
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load guild.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const myMembership = members?.find((m) => m.userId === user?.id)
  const myRole = myMembership?.role
  const canManage = myRole === 'OWNER' || myRole === 'ADMIN'
  const isOwner = guild && user && guild.ownerId === user.id

  async function membership(fn, okMsg) {
    if (busy) return
    setBusy(true)
    setNotice('')
    try {
      await fn(id)
      setNotice(okMsg)
      await load()
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Membership action failed.'))
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateQuest(e) {
    e.preventDefault()
    if (busy) return
    if (!qName.trim()) {
      setNotice('Quest name is required.')
      return
    }
    setBusy(true)
    setNotice('')
    try {
      await createGuildQuest(id, { name: qName.trim(), description: qDesc.trim() || undefined, targetValue: Number(qTarget), xpReward: Number(qXp) })
      setQName('')
      setQDesc('')
      setNotice('Guild quest created.')
      await load()
    } catch (err) {
      setNotice(apiErrorMessage(err, 'Could not create guild quest.'))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading message="Loading guild…" />
  if (error) return <ErrorMessage message={error} onRetry={load} />
  if (!guild) return <EmptyState title="Guild not found" />

  return (
    <div>
      <Link to="/guilds">← All guilds</Link>
      <div className="page-head" style={{ marginTop: 8 }}>
        <h2>{guild.tag ? `[${guild.tag}] ` : ''}{guild.name}</h2>
        <p>{guild.description || 'No description.'}</p>
      </div>
      <div className="chip-row" style={{ marginBottom: 12 }}>
        <span className="chip">{guild.memberCount} members</span>
        <span className="chip orange">{guild.totalXp} guild XP</span>
        {guild.privacy && <span className="chip violet">{guild.privacy}</span>}
        {myRole && <span className="chip green">You: {myRole}</span>}
        {!myRole && <span className="chip">Not a member</span>}
      </div>
      {notice && <div className="form-ok" style={{ marginBottom: 12 }}>{notice}</div>}
      <div className="btn-row" style={{ marginBottom: 16 }}>
        {!myRole && <button type="button" className="btn small" disabled={busy} onClick={() => membership(joinGuild, 'Joined guild. +5 guild XP per watched episode from here on.')}>Join guild</button>}
        {myRole && !(isOwner && myRole === 'OWNER') && <button type="button" className="btn secondary small" disabled={busy} onClick={() => membership(leaveGuild, 'Left guild.')}>Leave guild</button>}
        {isOwner && myRole === 'OWNER' && <span className="quest-progress">Owners cannot leave their own guild.</span>}
      </div>

      <div className="grid two">
        <div className="card">
          <h3>Members {members ? `(${members.length})` : ''}</h3>
          {members === null ? (
            <EmptyState title="Members hidden" hint="Log in as a member to view the roster." />
          ) : members.length === 0 ? (
            <EmptyState title="No members" />
          ) : (
            <div className="list">
              {members.map((m) => (
                <div key={`${m.guildId || ''}-${m.userId}`} className="list-item">
                  <div className="dot" />
                  <div style={{ flex: 1 }}>
                    <strong>{m.username}</strong>
                    <div className="quest-progress">Joined {formatDateTime(m.joinedAt)}</div>
                  </div>
                  <span className={`chip ${m.role === 'OWNER' ? 'gold' : m.role === 'ADMIN' ? 'violet' : ''}`}>{humanize(m.role)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card">
          <h3>XP Leaderboard</h3>
          {board === null ? (
            <EmptyState title="Leaderboard hidden" hint="Log in as a member to view rankings." />
          ) : board.length === 0 ? (
            <EmptyState title="No contributions yet" hint="Watch episodes to earn guild XP." />
          ) : (
            <div className="list">
              {board.map((e, i) => (
                <div key={e.userId} className="list-item">
                  <strong style={{ width: 24 }}>#{i + 1}</strong>
                  <div style={{ flex: 1 }}><strong>{e.username}</strong></div>
                  <span className="chip orange">{e.xp} XP</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Guild Quests</h3>
        {quests.length === 0 ? (
          <EmptyState title="No guild quests" hint={canManage ? 'Create the first guild quest below.' : 'Owners/admins can create guild quests.'} />
        ) : (
          <div className="list">
            {quests.map((q) => (
              <div key={q.id} className="list-item" style={{ display: 'block' }}>
                <strong>{q.name}</strong>
                <div className="quest-progress">{q.description}</div>
                <div style={{ margin: '6px 0' }}><ProgressBar value={q.targetValue ? (q.currentValue / q.targetValue) * 100 : 0} /></div>
                <div className="quest-progress">{q.currentValue}/{q.targetValue} · +{q.xpReward} guild XP · {q.status}</div>
              </div>
            ))}
          </div>
        )}
        {canManage && (
          <form onSubmit={handleCreateQuest} style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <h4 style={{ margin: '0 0 8px' }}>Create guild quest (owner/admin)</h4>
            <div className="form" style={{ maxWidth: '100%' }}>
              <div className="field">
                <label htmlFor="gq-name">Quest name</label>
                <input id="gq-name" className="input" value={qName} onChange={(e) => setQName(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="gq-desc">Description</label>
                <textarea id="gq-desc" className="textarea" value={qDesc} onChange={(e) => setQDesc(e.target.value)} />
              </div>
              <div className="grid two">
                <div className="field">
                  <label htmlFor="gq-target">Target value</label>
                  <input id="gq-target" className="input" type="number" min="1" value={qTarget} onChange={(e) => setQTarget(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="gq-xp">XP reward</label>
                  <input id="gq-xp" className="input" type="number" min="0" value={qXp} onChange={(e) => setQXp(e.target.value)} />
                </div>
              </div>
              <div><button type="submit" className="btn small" disabled={busy}>{busy ? 'Creating…' : 'Create quest'}</button></div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default GuildDetail

