import { useEffect, useMemo, useState } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db, hasFirebaseConfig } from './firebase'
import { mockEns, mockBugs, mockLogs } from './mockData'
import qualityVisionFullLogo from './assets/quality-vision-logo-completo.jpeg'
import { APP_VERSION, COPYRIGHT, baseStatuses, bugStatuses, statusColor, tabs } from './constants'
import { cx, normalizeDate, uniq } from './utils'
import { Button, Card, ConfigList, EmptyState, Field, inputClass, LimitSelect, LogSection, RecordCard, SectionTitle, SelectField, StatCard } from './components/ui'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('quality-vision-theme')
    if (savedTheme) return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [activeTab, setActiveTab] = useState(tabs[0])
  const [search, setSearch] = useState('')
  const [squadFilter, setSquadFilter] = useState('Todos')
  const [projectFilter, setProjectFilter] = useState('Todos')
  const [qaFilter, setQaFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [ens, setEns] = useState(mockEns)
  const [bugs, setBugs] = useState(mockBugs)
  const [logs, setLogs] = useState(mockLogs)
  const [itemsPerPage, setItemsPerPage] = useState({ ens: 5, bugs: 5, logs: 5 })

  const [newEn, setNewEn] = useState({ desc: '', status: 'Pendente', squad: 'Core Fibra', project: 'Portal Comercial B2C', owner: 'Marcelo' })
  const [newBug, setNewBug] = useState({ desc: '', status: 'Novo', owner: '', developer: '', squad: 'Core Fibra' })
  const [newLog, setNewLog] = useState('')
  const [editingEnId, setEditingEnId] = useState(null)
  const [editingBugId, setEditingBugId] = useState(null)
  const [editingLogId, setEditingLogId] = useState(null)

  const [configData, setConfigData] = useState({
    statuses: baseStatuses,
    projects: ['Portal Comercial B2C', 'Upgrade Jornada', 'Onboarding App', 'Campanha Flash'],
    squads: ['Core Fibra', 'B2B Digital', 'CX App'],
    successRates: [
      { project: 'Portal Comercial B2C', value: 89 },
      { project: 'Upgrade Jornada', value: 82 },
      { project: 'Onboarding App', value: 91 },
      { project: 'Campanha Flash', value: 76 },
    ],
  })
  const [managerInput, setManagerInput] = useState('')
  const [qaInput, setQaInput] = useState('')
  const [managerList, setManagerList] = useState(['Jane Doe', 'John Doe', 'Emily Carter'])
  const [qaList, setQaList] = useState(['Alex Turner', 'Chris Morgan', 'Taylor Smith'])
  const [configForm, setConfigForm] = useState({ project: '', squad: '', status: '', successProject: '', successValue: '' })
  const [editingConfig, setEditingConfig] = useState({ type: '', value: '' })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#08090B' : '#F3F4F6')
    localStorage.setItem('quality-vision-theme', theme)
  }, [theme])

  useEffect(() => {
    if (!hasFirebaseConfig || !db) return undefined

    const unsubEns = onSnapshot(collection(db, 'ens'), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setEns(data)
    })

    const unsubBugs = onSnapshot(collection(db, 'bugs'), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setBugs(data)
    })

    const unsubLogs = onSnapshot(query(collection(db, 'logs'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: normalizeDate(item.data().createdAt) }))
      setLogs(data)
    })

    return () => [unsubEns, unsubBugs, unsubLogs].forEach((unsubscribe) => unsubscribe())
  }, [])

  const squads = useMemo(() => ['Todos', ...uniq([...configData.squads, ...ens.map((item) => item.squad), ...bugs.map((item) => item.squad)])], [configData.squads, ens, bugs])
  const projects = useMemo(() => ['Todos', ...uniq([...configData.projects, ...ens.map((item) => item.project)])], [configData.projects, ens])
  const qas = useMemo(() => ['Todos', ...uniq([...qaList, ...ens.map((item) => item.owner)])], [qaList, ens])

  const filteredEns = useMemo(() => {
    const term = search.trim().toLowerCase()
    return ens.filter((item) => {
      const matchesSearch = !term || [item.id, item.desc, item.owner, item.project, item.squad].some((value) => value?.toLowerCase().includes(term))
      return matchesSearch &&
        (squadFilter === 'Todos' || item.squad === squadFilter) &&
        (projectFilter === 'Todos' || item.project === projectFilter) &&
        (qaFilter === 'Todos' || item.owner === qaFilter) &&
        (statusFilter === 'Todos' || item.status === statusFilter)
    })
  }, [ens, search, squadFilter, projectFilter, qaFilter, statusFilter])

  const filteredBugs = useMemo(() => bugs.filter((bug) => squadFilter === 'Todos' || bug.squad === squadFilter), [bugs, squadFilter])

  const stats = useMemo(() => {
    const total = filteredEns.length
    const counts = Object.fromEntries(baseStatuses.map((status) => [status, filteredEns.filter((item) => item.status === status).length]))
    const successRate = total ? Math.round((counts.Finalizado / total) * 100) : 0
    return { total, successRate, ...counts }
  }, [filteredEns])

  const taskOverview = useMemo(() => {
    const attention = (stats.Bloqueado || 0) + (stats.Impactado || 0)
    const active = (stats['Em andamento'] || 0) + attention
    const activeFilters = [
      squadFilter !== 'Todos' && `Squad: ${squadFilter}`,
      projectFilter !== 'Todos' && `Projeto: ${projectFilter}`,
      qaFilter !== 'Todos' && `QA: ${qaFilter}`,
      statusFilter !== 'Todos' && `Status: ${statusFilter}`,
      search.trim() && `Busca: ${search.trim()}`,
    ].filter(Boolean)

    return {
      active,
      attention,
      activeFilters,
      hasFilters: activeFilters.length > 0,
    }
  }, [projectFilter, qaFilter, search, squadFilter, stats, statusFilter])

  const homeInsights = useMemo(() => {
    const attentionItems = filteredEns
      .filter((item) => ['Bloqueado', 'Impactado'].includes(item.status))
      .slice(0, 3)

    return {
      completedLabel: `${stats.Finalizado || 0} de ${stats.total || 0} tarefas concluídas`,
      activeFlow: (stats['Em andamento'] || 0) + (stats.Pendente || 0),
      attentionItems,
    }
  }, [filteredEns, stats])

  const canSaveTask = Boolean(newEn.desc.trim() && newEn.owner.trim() && newEn.project.trim())

  const doughnutData = useMemo(() => ({
    labels: baseStatuses,
    datasets: [{ data: baseStatuses.map((status) => stats[status]), backgroundColor: baseStatuses.map((status) => statusColor[status]), borderWidth: 0 }],
  }), [stats])

  const successData = useMemo(() => ({
    labels: configData.successRates.map((item) => item.project),
    datasets: [{ label: 'Success Rate', data: configData.successRates.map((item) => item.value), backgroundColor: theme === 'dark' ? '#D9DCE2' : '#292D34', borderRadius: 12 }],
  }), [configData.successRates, theme])

  const resetEn = () => {
    setEditingEnId(null)
    setNewEn({ desc: '', status: 'Pendente', squad: squadFilter === 'Todos' ? 'Core Fibra' : squadFilter, project: projectFilter === 'Todos' ? 'Portal Comercial B2C' : projectFilter, owner: qaFilter === 'Todos' ? 'Marcelo' : qaFilter })
  }

  const resetBug = () => {
    setEditingBugId(null)
    setNewBug({ desc: '', status: 'Novo', owner: '', developer: '', squad: squadFilter === 'Todos' ? 'Core Fibra' : squadFilter })
  }

  const resetLog = () => {
    setEditingLogId(null)
    setNewLog('')
  }

  const saveEn = async () => {
    if (!newEn.desc.trim() || !newEn.owner.trim()) return
    const payload = { ...newEn, desc: newEn.desc.trim(), owner: newEn.owner.trim(), updatedAt: hasFirebaseConfig && db ? serverTimestamp() : normalizeDate(), updatedBy: 'Marcelo' }
    if (hasFirebaseConfig && db) {
      if (editingEnId) await updateDoc(doc(db, 'ens', editingEnId), payload)
      else await setDoc(doc(db, 'ens', `EN-${Date.now()}`), { ...payload, createdAt: serverTimestamp(), createdBy: 'Marcelo' })
    } else if (editingEnId) {
      setEns((current) => current.map((item) => item.id === editingEnId ? { ...item, ...payload } : item))
    } else {
      setEns((current) => [{ id: `EN-${Date.now()}`, ...payload, createdAt: normalizeDate(), createdBy: 'Marcelo' }, ...current])
    }
    resetEn()
  }

  const saveBug = async () => {
    if (!newBug.desc.trim() || !newBug.owner.trim()) return
    const payload = { ...newBug, desc: newBug.desc.trim(), owner: newBug.owner.trim(), updatedAt: hasFirebaseConfig && db ? serverTimestamp() : normalizeDate(), updatedBy: 'Marcelo' }
    if (hasFirebaseConfig && db) {
      if (editingBugId) await updateDoc(doc(db, 'bugs', editingBugId), payload)
      else await setDoc(doc(db, 'bugs', `BUG-${Date.now()}`), { ...payload, createdAt: serverTimestamp(), createdBy: 'Marcelo' })
    } else if (editingBugId) {
      setBugs((current) => current.map((item) => item.id === editingBugId ? { ...item, ...payload } : item))
    } else {
      setBugs((current) => [{ id: `BUG-${Date.now()}`, ...payload, createdAt: normalizeDate(), createdBy: 'Marcelo' }, ...current])
    }
    resetBug()
  }

  const saveLog = async () => {
    if (!newLog.trim()) return
    const message = newLog.trim()
    if (hasFirebaseConfig && db) {
      if (editingLogId) await updateDoc(doc(db, 'logs', editingLogId), { message })
      else await addDoc(collection(db, 'logs'), { message, createdAt: serverTimestamp(), createdBy: 'Marcelo' })
    } else if (editingLogId) {
      setLogs((current) => current.map((item) => item.id === editingLogId ? { ...item, message } : item))
    } else {
      setLogs((current) => [{ id: `LOG-${Date.now()}`, message, createdAt: normalizeDate(), createdBy: 'Marcelo' }, ...current])
    }
    resetLog()
  }

  const deleteEntity = async (collectionName, id, setter, reset) => {
    if (hasFirebaseConfig && db) await deleteDoc(doc(db, collectionName, id))
    else setter((current) => current.filter((item) => item.id !== id))
    reset()
  }

  const setLimit = (key, value) => setItemsPerPage((current) => ({ ...current, [key]: Number(value) }))

  const clearTaskFilters = () => {
    setSearch('')
    setSquadFilter('Todos')
    setProjectFilter('Todos')
    setQaFilter('Todos')
    setStatusFilter('Todos')
  }

  const saveSimpleList = (key, value, setter) => {
    const clean = value.trim()
    if (!clean) return
    setter((current) => current.includes(clean) ? current : [...current, clean])
  }

  const saveConfigItem = (type) => {
    const map = { project: 'projects', squad: 'squads', status: 'statuses' }
    const key = map[type]
    const value = configForm[type]?.trim()
    if (!value) return
    setConfigData((current) => ({
      ...current,
      [key]: editingConfig.type === type
        ? current[key].map((item) => item === editingConfig.value ? value : item)
        : current[key].includes(value) ? current[key] : [...current[key], value],
    }))
    setConfigForm((current) => ({ ...current, [type]: '' }))
    setEditingConfig({ type: '', value: '' })
  }

  const saveSuccessRate = () => {
    const value = Number(configForm.successValue)
    if (!configForm.successProject || Number.isNaN(value)) return
    setConfigData((current) => {
      const target = editingConfig.value || configForm.successProject
      const exists = current.successRates.some((item) => item.project === target)
      return {
        ...current,
        successRates: exists
          ? current.successRates.map((item) => item.project === target ? { project: configForm.successProject, value } : item)
          : [...current.successRates, { project: configForm.successProject, value }],
      }
    })
    setConfigForm((current) => ({ ...current, successProject: '', successValue: '' }))
    setEditingConfig({ type: '', value: '' })
  }

  const chartOptions = useMemo(() => {
    const muted = theme === 'dark' ? '#969BA5' : '#626874'
    const border = theme === 'dark' ? '#282B31' : '#D1D5DB'
    return { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, color: muted } } }, scales: { y: { ticks: { precision: 0, color: muted }, grid: { color: border } }, x: { ticks: { color: muted }, grid: { display: false } } } }
  }, [theme])

  const doughnutOptions = useMemo(() => {
    const muted = theme === 'dark' ? '#969BA5' : '#626874'
    return {
      cutout: '58%',
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 10, usePointStyle: true, color: muted },
        },
      },
    }
  }, [theme])

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors">
      <div className="flex min-h-screen">
        <aside className="hidden w-[304px] shrink-0 p-4 xl:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex-col rounded-[32px] bg-[var(--surface)] p-5 text-[var(--text)] shadow-2xl">
            <button onClick={() => setActiveTab(tabs[0])} className="shrink-0 rounded-[26px] border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-left transition hover:brightness-95">
              <div className="rounded-[22px] bg-[var(--surface-muted)] p-3 shadow-sm">
                <img src={qualityVisionFullLogo} alt="Quality Vision" className="h-24 w-full rounded-2xl object-contain" />
              </div>
            </button>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.18)_transparent]">
              <nav className="space-y-2">
                {tabs.map((item) => (
                  <button key={item} onClick={() => setActiveTab(item)} className={cx('w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition', activeTab === item ? 'bg-[var(--accent)] text-[var(--accent-text)] shadow-sm shadow-black/20' : 'text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]')}>
                    {item}
                  </button>
                ))}
              </nav>

            </div>

            <div className="shrink-0 pt-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2.5 text-center text-[11px] font-medium leading-relaxed text-[var(--muted)]">
                {COPYRIGHT} | {APP_VERSION}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(217,220,226,0.08),transparent_32%),radial-gradient(circle_at_top_right,rgba(150,155,165,0.05),transparent_28%)]">
          <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-5 backdrop-blur-xl md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight">{activeTab === 'Home' ? 'Dashboard' : activeTab}</h2>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar EN, projeto, squad ou responsável" className="h-16 min-w-[280px] rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--accent-hover)] focus:ring-4 focus:ring-black/10" />
                <button
                  type="button"
                  onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')}
                  className="h-16 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:bg-[var(--surface-muted)]"
                  aria-label={`Ativar modo ${theme === 'dark' ? 'claro' : 'noturno'}`}
                  title={`Ativar modo ${theme === 'dark' ? 'claro' : 'noturno'}`}
                >
                  {theme === 'dark' ? '☀ Claro' : '☾ Noturno'}
                </button>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            {activeTab === tabs[0] && (
              <>
                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                  <Card className="overflow-hidden bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-muted)_54%,rgba(217,220,226,0.18)_100%)] p-0">
                    <div className="relative p-6 md:p-8">
                      <div className="absolute right-[-72px] top-[-90px] h-56 w-56 rounded-full bg-[var(--accent-muted)] opacity-20 blur-3xl" />
                      <div className="absolute bottom-[-110px] left-[32%] h-64 w-64 rounded-full bg-[var(--accent)] opacity-10 blur-3xl" />
                      <div className="relative grid gap-6 lg:grid-cols-[1fr_220px] lg:items-center">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Quality Vision</p>
                          <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[var(--text)] md:text-5xl">
                            Painel executivo da qualidade.
                          </h1>
                          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">
                            Acompanhe a saúde das tarefas, pontos de atenção e evolução da entrega em uma tela mais direta para decisão.
                          </p>
                          <div className="mt-6 flex flex-wrap gap-2">
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">{hasFirebaseConfig ? 'Firebase ativo' : 'Mock local'}</span>
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">{homeInsights.completedLabel}</span>
                            <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold text-[var(--text)]">{filteredBugs.length} defeitos no contexto</span>
                          </div>
                        </div>
                        <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-3 shadow-soft">
                          <div
                            className="flex h-full w-full flex-col items-center justify-center rounded-full text-center"
                            style={{ background: `conic-gradient(var(--accent) ${stats.successRate * 3.6}deg, var(--surface-muted) 0deg)` }}
                          >
                            <div className="flex h-[78%] w-[78%] flex-col items-center justify-center rounded-full bg-[var(--surface)]">
                              <span className="text-5xl font-semibold tracking-tight text-[var(--text)]">{stats.successRate}%</span>
                              <span className="mt-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Success Rate</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="flex flex-col justify-between">
                    <SectionTitle eyebrow="Atenção" title="Saúde do fluxo" />
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-[var(--muted)]">Fluxo ativo</span>
                          <span className="font-semibold text-[var(--text)]">{homeInsights.activeFlow}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${stats.total ? Math.min(100, Math.round((homeInsights.activeFlow / stats.total) * 100)) : 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-[var(--muted)]">Bloqueios + impactos</span>
                          <span className="font-semibold text-[var(--text)]">{taskOverview.attention}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                          <div className="h-full rounded-full bg-[#EF4444]" style={{ width: `${stats.total ? Math.min(100, Math.round((taskOverview.attention / stats.total) * 100)) : 0}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Próximo foco</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--text)]">
                        {taskOverview.attention ? 'Priorizar itens bloqueados/impactados antes de puxar novas tarefas.' : 'Fluxo sem bloqueios críticos no recorte atual.'}
                      </p>
                    </div>
                  </Card>
                </section>

                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                  <StatCard title="Total EN" value={stats.total} sub="Tarefas mapeadas" />
                  <StatCard title="Finalizado" value={stats.Finalizado} sub="Concluídas" />
                  <StatCard title="Em andamento" value={stats['Em andamento']} sub="Execução ativa" />
                  <StatCard title="Bloqueado" value={stats.Bloqueado} sub="Aguardando ação" />
                  <StatCard title="Impactado" value={stats.Impactado} sub="Com dependência" />
                  <StatCard title="Pendente" value={stats.Pendente} sub="Em priorização" />
                </section>

                <section className="grid grid-cols-1 gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
                  <Card>
                    <SectionTitle eyebrow="Distribuição" title="Status das tarefas" />
                    <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-center">
                      <div className="h-[320px]"><Doughnut data={doughnutData} options={doughnutOptions} /></div>
                      <div className="space-y-3">
                        {baseStatuses.map((status) => {
                          const value = stats[status] || 0
                          const percent = stats.total ? Math.round((value / stats.total) * 100) : 0
                          return (
                            <div key={status} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                              <div className="flex items-center justify-between gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: statusColor[status] }} />
                                  <span className="font-medium text-[var(--text)]">{status}</span>
                                </div>
                                <span className="text-[var(--muted)]">{value} • {percent}%</span>
                              </div>
                              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: statusColor[status] }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>

                  <Card>
                    <SectionTitle eyebrow="Últimos registros" title="Tarefas recentes" action={<LimitSelect value={itemsPerPage.ens} onChange={(e) => setLimit('ens', e.target.value)} />} />
                    <div className="space-y-3">
                      {filteredEns.slice(0, itemsPerPage.ens).map((item) => <RecordCard key={item.id} title={item.desc} status={item.status} meta={`${item.id} • ${item.project} • ${item.squad} • QA: ${item.owner}`} />)}
                      {!filteredEns.length && <EmptyState>Nenhum resultado encontrado com os filtros atuais.</EmptyState>}
                    </div>
                  </Card>
                </section>

                <Card>
                  <SectionTitle eyebrow="Prioridade" title="Itens que pedem atenção" />
                  <div className="grid gap-3 lg:grid-cols-3">
                    {homeInsights.attentionItems.map((item) => (
                      <RecordCard key={item.id} title={item.desc} status={item.status} meta={`${item.id} • ${item.project} • ${item.squad} • QA: ${item.owner}`} />
                    ))}
                    {!homeInsights.attentionItems.length && <EmptyState>Nenhuma tarefa bloqueada ou impactada no momento.</EmptyState>}
                  </div>
                </Card>
              </>
            )}

            {activeTab === tabs[1] && (
              <>
                <Card className="overflow-hidden bg-[linear-gradient(135deg,var(--surface)_0%,var(--surface-muted)_100%)]">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">Operação</p>
                      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text)] md:text-4xl">Cadastro de tarefas</h1>
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                        Registre novas tarefas, atualize status, responsável, semana e vínculo com defeitos para manter a Home sempre atualizada.
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[360px]">
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <p className="text-2xl font-semibold">{stats.total}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Tarefas</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <p className="text-2xl font-semibold">{stats['Em andamento'] || 0}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Ativas</p>
                      </div>
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <p className="text-2xl font-semibold">{taskOverview.attention}</p>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">Atenção</p>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="overflow-hidden">
                  <SectionTitle
                    eyebrow="Controle de tarefa"
                    title={editingEnId ? 'Editar tarefa' : 'Cadastro de nova tarefa'}
                    action={<span className="rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">* campos essenciais</span>}
                  />

                  <div>
                    <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">Dados da tarefa</p>
                          <p className="text-xs text-[var(--muted)]">Preencha o essencial para acompanhar no dashboard.</p>
                        </div>
                        {editingEnId && <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-[var(--accent-text)]">Editando</span>}
                      </div>

                      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <div className="xl:col-span-8">
                          <Field label="Descrição *">
                            <textarea
                              value={newEn.desc}
                              onChange={(e) => setNewEn((c) => ({ ...c, desc: e.target.value }))}
                              placeholder="Ex: Validar fluxo de contratação digital"
                              rows={5}
                              className={cx(inputClass, 'resize-none')}
                            />
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:col-span-4 xl:grid-cols-1">
                          <SelectField label="Status" value={newEn.status} onChange={(e) => setNewEn((c) => ({ ...c, status: e.target.value }))} options={baseStatuses} />
                          <SelectField label="Squad" value={newEn.squad} onChange={(e) => setNewEn((c) => ({ ...c, squad: e.target.value }))} options={squads.filter((item) => item !== 'Todos')} />
                        </div>

                        <div className="xl:col-span-6">
                          <Field label="Projeto *"><input value={newEn.project} onChange={(e) => setNewEn((c) => ({ ...c, project: e.target.value }))} placeholder="Nome do projeto" className={inputClass} /></Field>
                        </div>
                        <div className="xl:col-span-6">
                          <Field label="Responsável QA *"><input value={newEn.owner} onChange={(e) => setNewEn((c) => ({ ...c, owner: e.target.value }))} placeholder="Responsável pela validação" className={inputClass} /></Field>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                        <div className="grid gap-3 text-xs text-[var(--muted)] sm:grid-cols-3">
                          <p><span className="font-semibold text-[var(--text)]">Fluxo:</span> Descrição → Projeto → Responsável</p>
                          <p><span className="font-semibold text-[var(--text)]">Status:</span> Atualize conforme avanço da validação</p>
                          <p><span className="font-semibold text-[var(--text)]">Squad:</span> Agrupa a tarefa no dashboard</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Button onClick={saveEn} disabled={!canSaveTask}>{editingEnId ? 'Salvar alterações' : 'Cadastrar tarefa'}</Button>
                        <Button variant="secondary" onClick={resetEn}>Limpar formulário</Button>
                        {!canSaveTask && <p className="text-xs text-[var(--muted)]">Informe descrição, projeto e responsável para salvar.</p>}
                      </div>
                    </div>
                  </div>
                </Card>
                <Card>
                  <SectionTitle eyebrow="Lista" title="Tarefas cadastradas" action={<Button variant="secondary" onClick={clearTaskFilters}>Limpar busca/filtros</Button>} />
                  <div className="space-y-3">
                    {filteredEns.slice(0, itemsPerPage.ens).map((item) => <RecordCard key={item.id} title={item.desc} status={item.status} meta={`${item.id} • ${item.project} • ${item.squad} • QA: ${item.owner}`} onEdit={() => { setEditingEnId(item.id); setNewEn({ desc: item.desc, status: item.status, squad: item.squad, project: item.project, owner: item.owner }) }} onDelete={() => deleteEntity('ens', item.id, setEns, resetEn)} />)}
                    {!filteredEns.length && <EmptyState>Nenhuma tarefa encontrada com os filtros atuais.</EmptyState>}
                  </div>
                </Card>
              </>
            )}

            {activeTab === tabs[2] && (
              <Card>
                <SectionTitle eyebrow="Histórico de Defeitos" title={editingBugId ? 'Editar bug' : 'Cadastro e rastreio de desvios'} action={<LimitSelect value={itemsPerPage.bugs} onChange={(e) => setLimit('bugs', e.target.value)} />} />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                  <Field label="Descrição"><input value={newBug.desc} onChange={(e) => setNewBug((c) => ({ ...c, desc: e.target.value }))} placeholder="Descrição do bug" className={inputClass} /></Field>
                  <SelectField label="Status" value={newBug.status} onChange={(e) => setNewBug((c) => ({ ...c, status: e.target.value }))} options={bugStatuses} />
                  <Field label="Frente"><input value={newBug.owner} onChange={(e) => setNewBug((c) => ({ ...c, owner: e.target.value }))} placeholder="Backend, Frontend..." className={inputClass} /></Field>
                  <Field label="Responsável"><input value={newBug.developer} onChange={(e) => setNewBug((c) => ({ ...c, developer: e.target.value }))} placeholder="Desenvolvedor" className={inputClass} /></Field>
                  <SelectField label="Squad" value={newBug.squad} onChange={(e) => setNewBug((c) => ({ ...c, squad: e.target.value }))} options={squads.filter((item) => item !== 'Todos')} />
                </div>
                <div className="mt-4 flex gap-2"><Button onClick={saveBug}>{editingBugId ? 'Salvar' : 'Adicionar'}</Button><Button variant="secondary" onClick={resetBug}>Cancelar</Button></div>
                <div className="mt-5 space-y-3">
                  {filteredBugs.slice(0, itemsPerPage.bugs).map((bug) => <RecordCard key={bug.id} title={bug.desc} status={bug.status} meta={`${bug.id} • ${bug.owner} • Responsável: ${bug.developer || '—'} • ${bug.squad}`} onEdit={() => { setEditingBugId(bug.id); setNewBug({ desc: bug.desc, status: bug.status, owner: bug.owner, developer: bug.developer || '', squad: bug.squad }) }} onDelete={() => deleteEntity('bugs', bug.id, setBugs, resetBug)} />)}
                  {!filteredBugs.length && <EmptyState>Nenhum bug encontrado.</EmptyState>}
                </div>
              </Card>
            )}

            {activeTab === tabs[3] && (
              <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <Card>
                  <SectionTitle eyebrow="Cadastros" title="Gestores e QAs" />
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="flex gap-2"><input value={managerInput} onChange={(e) => setManagerInput(e.target.value)} placeholder="Novo Gestor" className={inputClass} /><Button onClick={() => { saveSimpleList('manager', managerInput, setManagerList); setManagerInput('') }}>Adicionar</Button></div>
                      <ConfigList items={managerList} onEdit={(item) => setManagerInput(item)} onDelete={(item) => setManagerList((current) => current.filter((value) => value !== item))} />
                    </div>
                    <div>
                      <div className="flex gap-2"><input value={qaInput} onChange={(e) => setQaInput(e.target.value)} placeholder="Novo Analista" className={inputClass} /><Button onClick={() => { saveSimpleList('qa', qaInput, setQaList); setQaInput('') }}>Adicionar</Button></div>
                      <ConfigList items={qaList} onEdit={(item) => setQaInput(item)} onDelete={(item) => setQaList((current) => current.filter((value) => value !== item))} />
                    </div>
                  </div>
                </Card>

                <Card>
                  <SectionTitle eyebrow="Indicador" title="Success rate por projeto" />
                  <div className="h-[260px]"><Bar data={successData} options={chartOptions} /></div>
                  <div className="mt-4 grid gap-2 md:grid-cols-[1fr_120px_auto]">
                    <select value={configForm.successProject} onChange={(e) => setConfigForm((c) => ({ ...c, successProject: e.target.value }))} className={inputClass}><option value="">Projeto</option>{projects.filter((item) => item !== 'Todos').map((item) => <option key={item} value={item}>{item}</option>)}</select>
                    <input value={configForm.successValue} onChange={(e) => setConfigForm((c) => ({ ...c, successValue: e.target.value }))} placeholder="%" className={inputClass} />
                    <Button onClick={saveSuccessRate}>{editingConfig.type === 'successRate' ? 'Salvar' : 'Adicionar'}</Button>
                  </div>
                  <ConfigList items={configData.successRates} onEdit={(item) => { setEditingConfig({ type: 'successRate', value: item.project }); setConfigForm((c) => ({ ...c, successProject: item.project, successValue: item.value })) }} onDelete={(item) => setConfigData((current) => ({ ...current, successRates: current.successRates.filter((value) => value.project !== item.project) }))} />
                </Card>

                {[
                  ['project', 'Projetos', 'Novo Projeto'],
                  ['squad', 'Squads', 'Novo Squad'],
                  ['status', 'Status', 'Novo Status'],
                ].map(([type, title, placeholder]) => {
                  const key = { project: 'projects', squad: 'squads', status: 'statuses' }[type]
                  return (
                    <Card key={type}>
                      <SectionTitle eyebrow="Configuração" title={title} />
                      <div className="flex gap-2"><input value={configForm[type]} onChange={(e) => setConfigForm((c) => ({ ...c, [type]: e.target.value }))} placeholder={placeholder} className={inputClass} /><Button onClick={() => saveConfigItem(type)}>{editingConfig.type === type ? 'Salvar' : 'Adicionar'}</Button></div>
                      <ConfigList items={configData[key]} onEdit={(item) => { setEditingConfig({ type, value: item }); setConfigForm((c) => ({ ...c, [type]: item })) }} onDelete={(item) => setConfigData((current) => ({ ...current, [key]: current[key].filter((value) => value !== item) }))} />
                    </Card>
                  )
                })}
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
