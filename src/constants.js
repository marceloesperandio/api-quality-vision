export const APP_NAME = 'Quality Vision'
export const APP_VERSION = 'v1.43.0'
export const COPYRIGHT = 'Quality Vision | © veltrix, 2026'

export const tabs = ['Report do Projeto (Home)', 'Evolução de EN', 'Histórico de Bug', 'Configurações']
export const baseStatuses = ['Finalizado', 'Em andamento', 'Bloqueado', 'Impactado', 'Pendente']
export const bugStatuses = ['Novo', 'Em análise', 'Corrigido', 'Crítico']
export const weeks = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7']

export const statusStyle = {
  Finalizado: 'bg-[#10B981]/10 text-[#10B981] ring-[#10B981]/20',
  'Em andamento': 'bg-[#2563EB]/10 text-[#60A5FA] ring-[#2563EB]/25',
  Bloqueado: 'bg-[#EF4444]/10 text-[#FCA5A5] ring-[#EF4444]/25',
  Impactado: 'bg-[#F59E0B]/10 text-[#FCD34D] ring-[#F59E0B]/25',
  Pendente: 'bg-[#1F2937] text-[#9CA3AF] ring-[#9CA3AF]/20',
  Novo: 'bg-[#2563EB]/10 text-[#93C5FD] ring-[#2563EB]/25',
  'Em análise': 'bg-[#2563EB]/10 text-[#93C5FD] ring-[#2563EB]/25',
  Corrigido: 'bg-[#10B981]/10 text-[#10B981] ring-[#10B981]/20',
  Crítico: 'bg-[#EF4444]/10 text-[#FCA5A5] ring-[#EF4444]/25',
}

export const statusColor = {
  Finalizado: '#10B981',
  'Em andamento': '#2563EB',
  Bloqueado: '#EF4444',
  Impactado: '#F59E0B',
  Pendente: '#9CA3AF',
}

export const statusIconStyle = {
  Finalizado: 'bg-[#10B981] shadow-[#10B981]/25',
  'Em andamento': 'bg-[#2563EB] shadow-[#2563EB]/25',
  Bloqueado: 'bg-[#EF4444] shadow-[#EF4444]/25',
  Impactado: 'bg-[#F59E0B] shadow-[#F59E0B]/25',
  Pendente: 'bg-[#9CA3AF] shadow-[#9CA3AF]/20',
  'Total EN': 'bg-[#2563EB] shadow-[#2563EB]/20',
  'Total Bugs': 'bg-[#F6C301] shadow-[#F6C301]/20',
}
