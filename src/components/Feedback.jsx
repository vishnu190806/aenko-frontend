export function Loading({ message = 'Loading…' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

export function ErrorMessage({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="error-box" role="alert">
      <div>{message}</div>
      {onRetry && (
        <div className="btn-row">
          <button type="button" className="btn secondary small" onClick={onRetry}>Retry</button>
        </div>
      )}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', hint }) {
  return (
    <div className="empty">
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
      {hint && <div>{hint}</div>}
    </div>
  )
}

export function ProgressBar({ value = 0, variant }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0))
  return (
    <div className={`progress${variant === 'orange' ? ' orange' : ''}`} role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100">
      <div style={{ width: `${pct}%` }} />
    </div>
  )
}
