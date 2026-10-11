import { Link } from 'react-router-dom'
import { displayTitle } from '../utils/format.js'

function Cover({ anime, title }) {
  if (anime?.coverImage) {
    return <img src={anime.coverImage} alt={`${title} cover`} loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none' }} />
  }
  return <div className="cover-fallback" aria-hidden="true">{(title || '?').charAt(0)}</div>
}

export function AnimeCard({ anime, linkTo, footer }) {
  const title = displayTitle(anime)
  const key = anime?.externalId ? String(anime.externalId) : String(anime?.id ?? '')
  const to = linkTo || (key ? `/anime/${encodeURIComponent(key)}` : undefined)
  const card = (
    <article className="card anime-card">
      <Cover anime={anime} title={title} />
      <div className="body">
        <div className="title">{title}</div>
        <div className="meta">
          {[anime?.type, anime?.status, anime?.episodes ? `${anime.episodes} ep` : null, anime?.score ? `★ ${anime.score}` : null]
            .filter(Boolean).join(' · ') || '—'}
        </div>
        {(anime?.genres?.length > 0) && (
          <div className="chip-row">
            {anime.genres.slice(0, 3).map((g) => <span key={g} className="chip">{g}</span>)}
          </div>
        )}
        {footer}
      </div>
    </article>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{card}</Link> : card
}

export function QuestCard({ quest, onStart, onComplete, busy }) {
  const pct = quest?.targetValue ? Math.min(100, Math.round(((quest.progress || 0) / quest.targetValue) * 100)) : 0
  return (
    <div className="card">
      <h3>{quest.name}</h3>
      <p>{quest.description}</p>
      <div className="chip-row" style={{ margin: '8px 0' }}>
        {quest.type && <span className="chip violet">{quest.type}</span>}
        {quest.difficulty && <span className="chip gold">{quest.difficulty}</span>}
        <span className="chip orange">+{quest.xpReward} XP</span>
        {quest.status && <span className="chip green">{quest.status}</span>}
      </div>
      <div className="quest-progress">Progress: {quest.progress ?? 0} / {quest.targetValue}</div>
      <div style={{ margin: '6px 0 4px' }}>
        <div className="progress"><div style={{ width: `${pct}%` }} /></div>
      </div>
      {(onStart || onComplete) && (
        <div className="btn-row">
          {onStart && !quest.status && (
            <button type="button" className="btn small" disabled={busy} onClick={() => onStart(quest)}>Start quest</button>
          )}
          {onComplete && quest.status && quest.status !== 'COMPLETED' && (
            <button type="button" className="btn small" disabled={busy} onClick={() => onComplete(quest)}>Claim completion</button>
          )}
          {quest.status === 'COMPLETED' && <span className="chip green">Completed</span>}
        </div>
      )}
    </div>
  )
}

export function GuildCard({ guild }) {
  return (
    <Link to={`/guilds/${guild.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div className="card">
        <h3>{guild.tag ? `[${guild.tag}] ` : ''}{guild.name}</h3>
        <p>{guild.description || 'No description.'}</p>
        <div className="chip-row" style={{ marginTop: 8 }}>
          <span className="chip">{guild.memberCount ?? 0} members</span>
          <span className="chip orange">{guild.totalXp ?? 0} XP</span>
          {guild.privacy && <span className="chip violet">{guild.privacy}</span>}
        </div>
      </div>
    </Link>
  )
}

export function AchievementBadge({ achievement }) {
  const unlocked = Boolean(achievement.unlocked)
  return (
    <div className={`card badge-card${unlocked ? '' : ' locked'}`}>
      <div className="badge-icon" aria-hidden="true">{unlocked ? '🏆' : '🔒'}</div>
      <h3 style={{ marginTop: 8 }}>{achievement.name}</h3>
      <p>{achievement.description}</p>
      <div className="chip-row" style={{ justifyContent: 'center', marginTop: 8 }}>
        <span className="chip orange">+{achievement.xpReward} XP</span>
        <span className={`chip ${unlocked ? 'green' : ''}`}>{unlocked ? 'Unlocked' : 'Locked'}</span>
      </div>
      {achievement.requirementType && (
        <div className="quest-progress" style={{ marginTop: 6 }}>
          {achievement.requirementType} × {achievement.requirementValue}
        </div>
      )}
    </div>
  )
}
