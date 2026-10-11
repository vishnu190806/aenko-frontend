export function formatDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(value) {
  if (!value) return '—'
  const d = new Date(value).getTime()
  if (Number.isNaN(d)) return '—'
  const diff = Date.now() - d
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

export function displayTitle(anime) {
  if (!anime) return 'Unknown title'
  return anime.title || anime.englishTitle || 'Unknown title'
}

export function xpToNextLevel(totalXp, level) {
  if (totalXp == null || level == null) return null
  const nextThreshold = level * 500
  return Math.max(0, nextThreshold - totalXp)
}

export function levelProgress(totalXp) {
  if (totalXp == null || totalXp < 0) return 0
  return Math.min(100, Math.round(((totalXp % 500) / 500) * 100))
}

export function humanize(value) {
  if (value == null || value === '') return '—'
  return String(value).replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

export function activityLabel(activity) {
  const map = {
    EPISODE_WATCHED: 'Watched an episode',
    ANIME_COMPLETED: 'Completed an anime',
    ADDED_ANIME: 'Added anime to library',
    QUEST_STARTED: 'Started a quest',
    QUEST_COMPLETED: 'Completed a quest',
    ACHIEVEMENT_UNLOCKED: 'Unlocked an achievement',
    GUILD_JOINED: 'Joined a guild',
    GUILD_CREATED: 'Created a guild',
    GUILD_QUEST_COMPLETED: 'Completed a guild quest',
  }
  return map[activity?.activityType] || humanize(activity?.activityType)
}
