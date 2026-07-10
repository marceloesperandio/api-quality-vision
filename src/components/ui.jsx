import { statusIconStyle, statusStyle } from '../constants'
import { cx, normalizeDate } from '../utils'

export const inputClass = 'w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-hover)] focus:ring-4 focus:ring-black/10'

export function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-[var(--accent)] text-[var(--accent-text)] hover:bg-[var(--accent-hover)] shadow-sm shadow-black/20',
    secondary: 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-muted)]',
    danger: 'bg-[#EF4444]/10 text-[#FCA5A5] hover:bg-[#EF4444]/20',
    ghost: 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
  }

  return (
    <button
      className={cx('rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)}
      {...props}
    >
      {children}
    </button>
  )
}

export function Card({ children, className = '' }) {
  return <section className={cx('rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-soft', className)}>{children}</section>
}

export function SectionTitle({ eyebrow, title, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">{eyebrow}</p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text)]">{title}</h3>
      </div>
      {action}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-medium text-[var(--muted)]">{label}</span>}
      {children}
    </label>
  )
}

export function StatusPill({ status }) {
  return <span className={cx('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', statusStyle[status] || 'bg-[#1F2937] text-[#9CA3AF] ring-[#9CA3AF]/20')}>{status}</span>
}

export function StatCard({ title, value, sub }) {
  const iconClass = statusIconStyle[title] || 'bg-[var(--accent-hover)] shadow-black/20'
  return (
    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{title}</p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <h3 className="text-3xl font-semibold tracking-tight text-[var(--text)]">{value}</h3>
        <div className={cx('h-9 w-9 rounded-2xl shadow-lg', iconClass)} />
      </div>
      <p className="mt-2 text-xs text-[var(--muted)]">{sub}</p>
    </div>
  )
}

export function SelectField({ label, value, onChange, options }) {
  return (
    <Field label={label}>
      <select value={value} onChange={onChange} className={inputClass}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </Field>
  )
}

export function EmptyState({ children }) {
  return <div className="rounded-[20px] border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center text-sm text-[var(--muted)]">{children}</div>
}

export function RecordCard({ title, meta, status, onEdit, onDelete }) {
  const hasActions = onEdit || onDelete

  return (
    <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition hover:bg-[var(--surface)] hover:shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {status && <StatusPill status={status} />}
            <p className="font-medium text-[var(--text)]">{title}</p>
          </div>
          {meta && <p className="mt-2 text-sm text-[var(--muted)]">{meta}</p>}
        </div>
        {hasActions && (
          <div className="flex shrink-0 gap-2">
            {onEdit && <Button variant="secondary" className="px-3 py-2 text-xs" onClick={onEdit}>Editar</Button>}
            {onDelete && <Button variant="danger" className="px-3 py-2 text-xs" onClick={onDelete}>Excluir</Button>}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfigList({ items, onEdit, onDelete }) {
  return (
    <div className="mt-4 space-y-2">
      {items.map((item) => (
        <div key={typeof item === 'string' ? item : item.project} className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2.5">
          <span className="text-sm font-medium text-[var(--text)]">{typeof item === 'string' ? item : `${item.project} — ${item.value}%`}</span>
          <div className="flex gap-2">
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => onEdit(item)}>Editar</Button>
            <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => onDelete(item)}>Excluir</Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function LimitSelect({ value, onChange }) {
  return (
    <select value={value} onChange={onChange} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--accent-hover)]">
      <option value={5}>5 registros</option>
      <option value={10}>10 registros</option>
      <option value={20}>20 registros</option>
    </select>
  )
}

export function LogSection({ logs, newLog, setNewLog, editingLogId, setEditingLogId, saveLog, resetLog, deleteEntity, setLogs, itemsPerPage, setLimit }) {
  return (
    <Card>
      <SectionTitle eyebrow="Log de Execução" title="Últimas atualizações" action={<LimitSelect value={itemsPerPage} onChange={(e) => setLimit('logs', e.target.value)} />} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={newLog} onChange={(e) => setNewLog(e.target.value)} placeholder="Adicionar novo log" className={inputClass} />
        <Button onClick={saveLog}>{editingLogId ? 'Salvar' : 'Adicionar'}</Button>
        <Button variant="secondary" onClick={resetLog}>Cancelar</Button>
      </div>
      <div className="mt-5 space-y-3">
        {logs.slice(0, itemsPerPage).map((log) => <RecordCard key={log.id} title={log.message} meta={normalizeDate(log.createdAt)} onEdit={() => { setEditingLogId(log.id); setNewLog(log.message) }} onDelete={() => deleteEntity('logs', log.id, setLogs, resetLog)} />)}
        {!logs.length && <EmptyState>Nenhum log cadastrado.</EmptyState>}
      </div>
    </Card>
  )
}
