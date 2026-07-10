export const APP_VERSION = 'v1.43.0'
export const COPYRIGHT = '© veltrix, 2026'

export const tabs = ['Home', 'Cadastro de Tarefas']
export const baseStatuses = ['Finalizado', 'Em andamento', 'Bloqueado', 'Impactado', 'Pendente']
export const bugStatuses = ['Novo', 'Em análise', 'Corrigido', 'Crítico']

export const statusStyle = {
  Finalizado: 'bg-[#10B981]/10 text-[#10B981] ring-[#10B981]/20',
  'Em andamento': 'bg-[var(--surface-muted)] text-[var(--text)] ring-[var(--border)]',
  Bloqueado: 'bg-[#EF4444]/10 text-[#FCA5A5] ring-[#EF4444]/25',
  Impactado: 'bg-[#F59E0B]/10 text-[#FCD34D] ring-[#F59E0B]/25',
  Pendente: 'bg-[var(--surface-muted)] text-[var(--muted)] ring-[var(--border)]',
  Novo: 'bg-[var(--surface-muted)] text-[var(--text)] ring-[var(--border)]',
  'Em análise': 'bg-[var(--surface-muted)] text-[var(--text)] ring-[var(--border)]',
  Corrigido: 'bg-[#10B981]/10 text-[#10B981] ring-[#10B981]/20',
  Crítico: 'bg-[#EF4444]/10 text-[#FCA5A5] ring-[#EF4444]/25',
}

export const statusColor = {
  Finalizado: '#10B981',
  'Em andamento': '#B8BDC7',
  Bloqueado: '#EF4444',
  Impactado: '#F59E0B',
  Pendente: '#969BA5',
}

export const statusIconStyle = {
  Finalizado: 'bg-[#10B981] shadow-[#10B981]/25',
  'Em andamento': 'bg-[var(--accent-hover)] shadow-black/20',
  Bloqueado: 'bg-[#EF4444] shadow-[#EF4444]/25',
  Impactado: 'bg-[#F59E0B] shadow-[#F59E0B]/25',
  Pendente: 'bg-[var(--muted)] shadow-black/20',
  'Total EN': 'bg-[var(--accent)] shadow-black/20',
  'Total Bugs': 'bg-[#7C828D] shadow-black/30',
}
