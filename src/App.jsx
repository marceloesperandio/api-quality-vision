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
} from 'firebase/firestore'
import { db, hasFirebaseConfig } from './firebase'
import { mockEns, mockBugs, mockLogs } from './mockData'
import qualityVisionFullLogo from './assets/quality-vision-logo-completo.jpeg'
import qualityVisionIcon from './assets/quality-vision-icon.jpeg'
import { APP_NAME, APP_VERSION, COPYRIGHT, baseStatuses, bugStatuses, statusColor, tabs, weeks } from './constants'
import { cx, normalizeDate, uniq } from './utils'
import { Button, Card, ConfigList, EmptyState, Field, inputClass, LimitSelect, LogSection, RecordCard, SectionTitle, SelectField, StatCard } from './components/ui'

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function App() {
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

  const [newEn, setNewEn] = useState({ desc: '', status: 'Pendente', squad: 'Core Fibra', project: 'Portal Comercial B2C', owner: 'Marcelo', week: 'S1', bug: '—' })
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
    if (!hasFirebaseConfig || !db) return undefined

    const unsubEns = onSnapshot(collection(db, 'ens'), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      if (data.length) setEns(data)
    })

    const unsubBugs = onSnapshot(collection(db, 'bugs'), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      if (data.length) setBugs(data)
    })

    const unsubLogs = onSnapshot(query(collection(db, 'logs'), orderBy('createdAt', 'desc')), (snapshot) => {
      const data = snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: normalizeDate(item.data().createdAt) }))
      if (data.length) setLogs(data)
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

  const doughnutData = useMemo(() => ({
    labels: baseStatuses,
    datasets: [{ data: baseStatuses.map((status) => stats[status]), backgroundColor: baseStatuses.map((status) => statusColor[status]), borderWidth: 0 }],
  }), [stats])

  const weeklyData = useMemo(() => ({
    labels: weeks,
    datasets: [{ label: 'Execuções por semana', data: weeks.map((week) => filteredEns.filter((item) => item.week === week).length), backgroundColor: '#2563EB', hoverBackgroundColor: '#1D4ED8', borderRadius: 12 }],
  }), [filteredEns])

  const successData = useMemo(() => ({
    labels: configData.successRates.map((item) => item.project),
    datasets: [{ label: 'Success Rate', data: configData.successRates.map((item) => item.value), backgroundColor: '#111827', borderRadius: 12 }],
  }), [configData.successRates])

  const resetEn = () => {
    setEditingEnId(null)
    setNewEn({ desc: '', status: 'Pendente', squad: squadFilter === 'Todos' ? 'Core Fibra' : squadFilter, project: projectFilter === 'Todos' ? 'Portal Comercial B2C' : projectFilter, owner: qaFilter === 'Todos' ? 'Marcelo' : qaFilter, week: 'S1', bug: '—' })
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
      await setDoc(doc(db, 'ens', editingEnId || `EN-${Date.now()}`), { ...payload, createdAt: editingEnId ? payload.updatedAt : serverTimestamp(), createdBy: 'Marcelo' }, { merge: true })
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
      await setDoc(doc(db, 'bugs', editingBugId || `BUG-${Date.now()}`), { ...payload, createdAt: editingBugId ? payload.updatedAt : serverTimestamp(), createdBy: 'Marcelo' }, { merge: true })
    } else if (editingBugId) {
      setBugs((current) => current.map((item) => item.id === editingBugId ? { ...item, ...payload } : item))
    } else {
      setBugs((current) => [{ id: `BUG-${Date.now()}`, ...payload, createdAt: normalizeDate(), createdBy: 'Marcelo' }, ...current])
    }
    resetBug()
  }

  const saveLog = async () => {
    if (!newLog.trim()) return
    const payload = { message: newLog.trim(), createdAt: hasFirebaseConfig && db ? serverTimestamp() : normalizeDate(), createdBy: 'Marcelo' }
    if (hasFirebaseConfig && db) {
      if (editingLogId) await setDoc(doc(db, 'logs', editingLogId), payload, { merge: true })
      else await addDoc(collection(db, 'logs'), payload)
    } else if (editingLogId) {
      setLogs((current) => current.map((item) => item.id === editingLogId ? { ...item, ...payload } : item))
    } else {
      setLogs((current) => [{ id: `LOG-${Date.now()}`, ...payload }, ...current])
    }
    resetLog()
  }

  const deleteEntity = async (collectionName, id, setter, reset) => {
    if (hasFirebaseConfig && db) await deleteDoc(doc(db, collectionName, id))
    else setter((current) => current.filter((item) => item.id !== id))
    reset()
  }

  const setLimit = (key, value) => setItemsPerPage((current) => ({ ...current, [key]: Number(value) }))

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

  const chartOptions = { maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, usePointStyle: true, color: '#9CA3AF' } } }, scales: { y: { ticks: { precision: 0, color: '#9CA3AF' }, grid: { color: '#1F2937' } }, x: { ticks: { color: '#9CA3AF' }, grid: { display: false } } } }

  return (
    <div className="min-h-screen bg-[#050816] text-[#F9FAFB]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[304px] shrink-0 p-4 xl:block">
          <div className="sticky top-4 flex h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] flex-col rounded-[32px] bg-[#111827] p-5 text-[#F9FAFB] shadow-2xl">
            <button onClick={() => setActiveTab(tabs[0])} className="shrink-0 rounded-[26px] border border-[#1F2937] bg-[#0B0F19]/60 p-4 text-left transition hover:bg-[#1F2937]/70">
              <div className="rounded-[22px] bg-[#0B0F19] p-3 shadow-sm">
                <img src={qualityVisionFullLogo} alt="Quality Vision" className="h-24 w-full rounded-2xl object-contain" />
              </div>
              <div className="mt-5 flex flex-col items-center text-center">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#9CA3AF]">QUALITY INSIGHTS</p>
                <h1 className="text-center text-lg font-semibold leading-tight">Quality Vision</h1>
                <p className="mt-2 max-w-[210px] text-center text-sm leading-relaxed text-[#9CA3AF]">Quality insights for smarter decisions.</p>
              </div>
            </button>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,.18)_transparent]">
              <nav className="space-y-2">
                {tabs.map((item) => (
                  <button key={item} onClick={() => setActiveTab(item)} className={cx('w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition', activeTab === item ? 'bg-[#2563EB] text-[#F9FAFB] shadow-sm shadow-[#2563EB]/20' : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]')}>
                    {item}
                  </button>
                ))}
              </nav>

              <div className="mt-5 space-y-3 rounded-[26px] border border-[#1F2937] bg-[#0B0F19]/60 p-4">
                <SelectField label="Squad" value={squadFilter} onChange={(e) => setSquadFilter(e.target.value)} options={squads} />
                <SelectField label="Projeto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} options={projects} />
                <SelectField label="QA" value={qaFilter} onChange={(e) => setQaFilter(e.target.value)} options={qas} />
                <SelectField label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={['Todos', ...baseStatuses]} />
              </div>
            </div>

            <div className="shrink-0 pt-4">
              <div className="rounded-2xl border border-[#1F2937] bg-[#0B0F19]/70 px-4 py-2.5 text-center text-[11px] font-medium leading-relaxed text-[#9CA3AF]">
                {COPYRIGHT} | {APP_VERSION}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.10),transparent_32%),radial-gradient(circle_at_top_right,rgba(246,195,1,0.06),transparent_28%)]">
          <header className="sticky top-0 z-10 border-b border-[#1F2937] bg-[#050816]/90 px-5 py-5 backdrop-blur-xl md:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="hidden h-16 w-16 items-center justify-center rounded-[22px] border border-[#1F2937] bg-[#111827] p-2 shadow-sm sm:flex">
                  <img src={qualityVisionIcon} alt="Quality Vision" className="h-full w-full object-contain" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[#9CA3AF]">Dashboard Executivo</p>
                  <h2 className="mt-1 text-3xl font-semibold tracking-tight">{APP_NAME}</h2>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar EN, projeto, squad ou responsável" className="h-16 min-w-[280px] rounded-2xl border border-[#1F2937] bg-[#111827] px-4 text-sm text-[#F9FAFB] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/20" />
                <div className="rounded-2xl border border-[#1F2937] bg-[#111827] px-4 py-3 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Dados</p>
                  <p className="text-sm font-semibold">{hasFirebaseConfig ? 'Firebase ativo' : 'Mock local'}</p>
                </div>
                <div className="rounded-2xl bg-[#2563EB] px-4 py-3 text-[#F9FAFB] shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#9CA3AF]">Success Rate</p>
                  <p className="text-sm font-semibold">{stats.successRate}%</p>
                </div>
              </div>
            </div>
          </header>

          <div className="space-y-6 p-5 md:p-8">
            {activeTab === tabs[0] && (
              <>
                <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
                  <StatCard title="Total EN" value={stats.total} sub="Após filtros" />
                  <StatCard title="Finalizado" value={stats.Finalizado} sub={`${stats.successRate}% de sucesso`} />
                  <StatCard title="Em andamento" value={stats['Em andamento']} sub="Execução ativa" />
                  <StatCard title="Bloqueado" value={stats.Bloqueado} sub="Aguardando ação" />
                  <StatCard title="Impactado" value={stats.Impactado} sub="Com dependência" />
                  <StatCard title="Pendente" value={stats.Pendente} sub="Em priorização" />
                  <StatCard title="Total Bugs" value={filteredBugs.length} sub="No contexto atual" />
                </section>

                <section className="grid grid-cols-1 gap-6 2xl:grid-cols-2">
                  <Card>
                    <SectionTitle eyebrow="Distribuição" title="Status das ENs" />
                    <div className="h-[320px]"><Doughnut data={doughnutData} options={chartOptions} /></div>
                  </Card>
                  <Card>
                    <SectionTitle eyebrow="Evolução" title="Execuções por semana" />
                    <div className="h-[320px]"><Bar data={weeklyData} options={chartOptions} /></div>
                  </Card>
                </section>

                <Card>
                  <SectionTitle eyebrow="Últimos registros" title="ENs recentes" action={<LimitSelect value={itemsPerPage.ens} onChange={(e) => setLimit('ens', e.target.value)} />} />
                  <div className="space-y-3">
                    {filteredEns.slice(0, itemsPerPage.ens).map((item) => <RecordCard key={item.id} title={item.desc} status={item.status} meta={`${item.id} • ${item.project} • ${item.squad} • QA: ${item.owner}`} onEdit={() => { setActiveTab(tabs[1]); setEditingEnId(item.id); setNewEn({ desc: item.desc, status: item.status, squad: item.squad, project: item.project, owner: item.owner, week: item.week, bug: item.bug }) }} onDelete={() => deleteEntity('ens', item.id, setEns, resetEn)} />)}
                    {!filteredEns.length && <EmptyState>Nenhum resultado encontrado com os filtros atuais.</EmptyState>}
                  </div>
                </Card>
              </>
            )}

            {activeTab === tabs[1] && (
              <>
                <Card>
                  <SectionTitle eyebrow="Controle de EN" title={editingEnId ? 'Editar EN' : 'Cadastro de nova EN'} action={<LimitSelect value={itemsPerPage.ens} onChange={(e) => setLimit('ens', e.target.value)} />} />
                  <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
                    <Field label="Descrição"><input value={newEn.desc} onChange={(e) => setNewEn((c) => ({ ...c, desc: e.target.value }))} placeholder="Descrição da EN" className={cx(inputClass, 'xl:col-span-3')} /></Field>
                    <SelectField label="Status" value={newEn.status} onChange={(e) => setNewEn((c) => ({ ...c, status: e.target.value }))} options={baseStatuses} />
                    <SelectField label="Squad" value={newEn.squad} onChange={(e) => setNewEn((c) => ({ ...c, squad: e.target.value }))} options={squads.filter((item) => item !== 'Todos')} />
                    <Field label="Projeto"><input value={newEn.project} onChange={(e) => setNewEn((c) => ({ ...c, project: e.target.value }))} placeholder="Projeto" className={inputClass} /></Field>
                    <Field label="Responsável"><input value={newEn.owner} onChange={(e) => setNewEn((c) => ({ ...c, owner: e.target.value }))} placeholder="QA" className={inputClass} /></Field>
                    <SelectField label="Semana" value={newEn.week} onChange={(e) => setNewEn((c) => ({ ...c, week: e.target.value }))} options={weeks} />
                    <Field label="Bug"><input value={newEn.bug} onChange={(e) => setNewEn((c) => ({ ...c, bug: e.target.value }))} placeholder="BUG-000" className={inputClass} /></Field>
                  </div>
                  <div className="mt-4 flex gap-2"><Button onClick={saveEn}>{editingEnId ? 'Salvar' : 'Adicionar'}</Button><Button variant="secondary" onClick={resetEn}>Cancelar</Button></div>
                </Card>
                <Card>
                  <SectionTitle eyebrow="Lista" title="ENs cadastradas" />
                  <div className="space-y-3">
                    {filteredEns.slice(0, itemsPerPage.ens).map((item) => <RecordCard key={item.id} title={item.desc} status={item.status} meta={`${item.project} • ${item.squad} • QA: ${item.owner} • Semana: ${item.week} • Bug: ${item.bug}`} onEdit={() => { setEditingEnId(item.id); setNewEn({ desc: item.desc, status: item.status, squad: item.squad, project: item.project, owner: item.owner, week: item.week, bug: item.bug }) }} onDelete={() => deleteEntity('ens', item.id, setEns, resetEn)} />)}
                    {!filteredEns.length && <EmptyState>Nenhuma EN encontrada.</EmptyState>}
                  </div>
                </Card>
                <LogSection logs={logs} newLog={newLog} setNewLog={setNewLog} editingLogId={editingLogId} setEditingLogId={setEditingLogId} saveLog={saveLog} resetLog={resetLog} deleteEntity={deleteEntity} setLogs={setLogs} itemsPerPage={itemsPerPage.logs} setLimit={setLimit} />
              </>
            )}

            {activeTab === tabs[2] && (
              <Card>
                <SectionTitle eyebrow="Histórico de Bug" title={editingBugId ? 'Editar bug' : 'Cadastro e rastreio de desvios'} action={<LimitSelect value={itemsPerPage.bugs} onChange={(e) => setLimit('bugs', e.target.value)} />} />
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
                  <Field label="Descrição"><input value={newBug.desc} onChange={(e) => setNewBug((c) => ({ ...c, desc: e.target.value }))} placeholder="Descrição do bug" className={inputClass} /></Field>
                  <SelectField label="Status" value={newBug.status} onChange={(e) => setNewBug((c) => ({ ...c, status: e.target.value }))} options={bugStatuses} />
                  <Field label="Frente"><input value={newBug.owner} onChange={(e) => setNewBug((c) => ({ ...c, owner: e.target.value }))} placeholder="Backend, Frontend..." className={inputClass} /></Field>
                  <Field label="Responsável"><input value={newBug.developer} onChange={(e) => setNewBug((c) => ({ ...c, developer: e.target.value }))} placeholder="Desenvolvedor" className={inputClass} /></Field>
                  <SelectField label="Squad" value={newBug.squad} onChange={(e) => setNewBug((c) => ({ ...c, squad: e.target.value }))} options={squads.filter((item) => item !== 'Todos')} />
                </div>
                <div className="mt-4 flex gap-2"><Button onClick={saveBug}>{editingBugId ? 'Salvar' : 'Adicionar'}</Button><Button variant="secondary" onClick={resetBug}>Cancelar</Button></div>
                <div className="mt-5 space-y-3">
                  {filteredBugs.slice(0, itemsPerPage.bugs).map((bug) => <RecordCard key={bug.id} title={bug.desc} status={bug.status} meta={`${bug.id} • ${bug.owner} • Responsável: ${bug.developer || '—'} • ${bug.squad}`} onEdit={() => { setEditingBugId(bug.id); setNewBug({ desc: bug.desc, status: bug.status, owner: bug.owner, developer: bug.developer, squad: bug.squad }) }} onDelete={() => deleteEntity('bugs', bug.id, setBugs, resetBug)} />)}
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
