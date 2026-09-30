import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const timelineInicial = [
  {
    cargo: 'Auxiliar de Implantação',
    empresa: 'Ganso Sistemas',
    inicio: 'Mai 2025',
    fim: 'Jan 2026',
    atual: false,
    descricao: 'Início na área de TI/sistemas. Atuação em instalação, configuração e suporte ao ERP Ganso em clientes dos setores de varejo, oficinas e auto peças.',
    marcos: [
      'Instalação e configuração do ERP em ambientes de produção',
      'Diagnóstico e correção de erros de DLL e estrutura do sistema',
      'Primeiros atendimentos técnicos a clientes',
    ]
  },
  {
    cargo: 'Assistente de Implantação II',
    empresa: 'Ganso Sistemas',
    inicio: 'Fev 2026',
    fim: null,
    atual: true,
    descricao: 'Promoção após menos de 9 meses de empresa. Responsável por implantações completas, customização de relatórios FR3, administração de banco Firebird e suporte técnico avançado.',
    marcos: [
      'Personalização de layouts FR3 e confecção de relatórios sob demanda',
      'Administração de banco Firebird 2.5 via IBExpert',
      'Atendimento autônomo a clientes em múltiplos estados (MS, SP, MG)',
      'Configuração fiscal: NF-e, SEFAZ, CSOSN, boleto, DAS',
    ]
  },
]

const habilidadesInicial = [
  {
    categoria: 'Banco de Dados', icone: '🗄️',
    itens: [
      { nome: 'Firebird 2.5', nivel: 85, descricao: 'Administração via IBExpert, consultas SQL, diagnóstico e correção de inconsistências' },
      { nome: 'IBExpert', nivel: 80, descricao: 'Ferramenta principal para gestão e análise do banco de dados dos clientes' },
    ]
  },
  {
    categoria: 'Relatórios & Layouts', icone: '📊',
    itens: [
      { nome: 'FastReport 3 (FR3)', nivel: 82, descricao: 'Personalização e confecção de relatórios sob demanda para clientes' },
      { nome: 'Layouts personalizados', nivel: 80, descricao: 'NF-e, boletos, cupons, pedidos e outros documentos fiscais' },
    ]
  },
  {
    categoria: 'ERP Ganso', icone: '⚙️',
    itens: [
      { nome: 'Instalação & Configuração', nivel: 90, descricao: 'Deploy completo do sistema em ambiente do cliente, incluindo rede e periféricos' },
      { nome: 'Estrutura do sistema', nivel: 85, descricao: 'Conhecimento sobre DLLs, pastas, dependências e arquitetura do Ganso ERP' },
      { nome: 'Correção de bugs', nivel: 83, descricao: 'Diagnóstico e resolução de erros de sistema, DLLs ausentes e falhas de instalação' },
      { nome: 'GansoPDV', nivel: 80, descricao: 'Configuração e suporte ao módulo de frente de caixa' },
    ]
  },
  {
    categoria: 'Fiscal & Tributário', icone: '📋',
    itens: [
      { nome: 'NF-e / SEFAZ', nivel: 78, descricao: 'Configuração de emissão de nota fiscal eletrônica e integração com SEFAZ' },
      { nome: 'CSOSN / PMZ / DAS', nivel: 75, descricao: 'Configuração tributária para regimes Simples Nacional e outros' },
      { nome: 'Boleto & Financeiro', nivel: 75, descricao: 'Configuração de carteiras de cobrança e integração bancária' },
    ]
  },
  {
    categoria: 'Desenvolvimento', icone: '💻',
    itens: [
      { nome: 'React + Vite', nivel: 65, descricao: 'Desenvolvimento deste portal — aprendizado em andamento' },
      { nome: 'JavaScript', nivel: 60, descricao: 'Lógica de frontend, manipulação de dados e integrações' },
      { nome: 'Firebase / Firestore', nivel: 62, descricao: 'Banco de dados em tempo real e autenticação' },
      { nome: 'Git & GitHub', nivel: 58, descricao: 'Versionamento de código e deploy via Vercel' },
    ]
  },
]

const tiposAtendimento = [
  'Atendimento ao cliente',
  'Treinamento',
  'Importação de relatório',
  'Criação de relatório FR3',
  'Parâmetros do sistema',
  'Configuração de usuário',
  'Configuração avançada',
  'Suporte técnico',
]

const estadosAtivos = [
  { uf: 'MS', nome: 'Mato Grosso do Sul', clientes: 7, cx: 310, cy: 390 },
  { uf: 'SP', nome: 'São Paulo', clientes: 2, cx: 390, cy: 430 },
  { uf: 'MG', nome: 'Minas Gerais', clientes: 1, cx: 420, cy: 360 },
]

const statusConfig = {
  lider:     { label: 'Ativa - Analista Líder',    cor: 'bg-emerald-400', badge: 'bg-emerald-950 text-emerald-400' },
  auxiliar:  { label: 'Ativa - Analista Auxiliar', cor: 'bg-blue-400',    badge: 'bg-blue-950 text-blue-400' },
  cancelado: { label: 'Cancelada',                 cor: 'bg-red-400',     badge: 'bg-red-950 text-red-400' },
  // compatibilidade registros antigos
  sucesso:   { label: 'Ativa - Analista Líder',    cor: 'bg-emerald-400', badge: 'bg-emerald-950 text-emerald-400' },
  inativo:   { label: 'Cancelada',                 cor: 'bg-red-400',     badge: 'bg-red-950 text-red-400' },
  falha:     { label: 'Cancelada',                 cor: 'bg-red-400',     badge: 'bg-red-950 text-red-400' },
}

function MapaBrasil() {
  return (
    <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
      <h3 className="font-semibold mb-1 text-sm text-gray-300">Alcance geográfico</h3>
      <p className="text-xs text-gray-500 mb-4">Estados onde realizei implantações</p>
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative w-full max-w-sm">
          <svg viewBox="0 0 600 620" className="w-full">
            <path d="M210,30 L260,25 L280,60 L250,80 L200,70 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M310,25 L340,20 L355,50 L330,65 L305,55 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M130,60 L250,80 L280,60 L300,90 L330,65 L355,90 L340,140 L290,160 L240,150 L190,170 L140,150 L110,110 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M290,160 L340,140 L355,90 L400,100 L440,120 L450,160 L420,200 L380,210 L330,220 L290,200 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M420,200 L450,160 L480,170 L500,200 L490,230 L460,240 L430,230 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M460,240 L490,230 L510,250 L505,280 L480,290 L455,270 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M490,230 L510,220 L535,235 L540,260 L510,270 L505,280 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M535,235 L555,230 L560,250 L540,260 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M540,260 L560,255 L562,270 L545,275 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M505,280 L545,275 L562,280 L555,295 L505,295 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M545,295 L562,290 L560,308 L542,308 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M542,308 L560,308 L558,322 L540,320 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M430,230 L460,240 L455,270 L480,290 L505,295 L505,280 L505,295 L540,320 L530,370 L490,390 L450,400 L410,380 L390,340 L380,290 L400,260 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M380,210 L420,200 L430,230 L400,260 L380,290 L355,270 L350,230 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M350,270 L380,290 L390,340 L370,370 L340,360 L320,330 L330,290 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M368,318 L378,318 L378,328 L368,328 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M390,340 L410,380 L450,400 L460,430 L430,450 L390,440 L360,420 L340,390 L340,360 L370,370 Z" fill="#064e3b" stroke="#34d399" strokeWidth="1.5"/>
            <path d="M460,390 L490,390 L488,420 L460,415 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M430,450 L460,445 L470,465 L445,475 L425,465 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M340,390 L360,420 L390,440 L430,450 L425,465 L400,480 L360,475 L330,455 L310,425 L320,400 Z" fill="#064e3b" stroke="#34d399" strokeWidth="1.5"/>
            <path d="M260,360 L320,330 L340,360 L340,390 L320,400 L310,425 L280,430 L250,410 L240,380 Z" fill="#065f46" stroke="#34d399" strokeWidth="2"/>
            <path d="M190,170 L240,150 L290,160 L290,200 L330,220 L330,290 L320,330 L260,360 L220,340 L190,300 L170,250 L180,200 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M140,150 L190,170 L180,200 L170,250 L140,250 L120,210 L130,170 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M100,190 L130,170 L140,210 L120,230 L90,215 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M280,430 L310,425 L330,455 L310,470 L280,465 L260,450 L265,430 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M260,465 L310,470 L305,490 L270,490 L255,478 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
            <path d="M255,490 L305,490 L310,530 L280,555 L250,545 L230,515 L235,490 Z" fill="#1f2937" stroke="#374151" strokeWidth="1"/>
          </svg>
          <svg viewBox="0 0 600 620" className="w-full absolute top-0 left-0 pointer-events-none">
            {estadosAtivos.map(e => (
              <g key={e.uf}>
                <circle cx={e.cx} cy={e.cy} r="10" fill="#34d399" opacity="0.25" />
                <circle cx={e.cx} cy={e.cy} r="5" fill="#34d399" />
                <text x={e.cx} y={e.cy - 14} textAnchor="middle" fill="#34d399" fontSize="11" fontWeight="bold">{e.uf}</text>
              </g>
            ))}
          </svg>
        </div>
        <div className="space-y-3 w-full md:w-auto">
          {estadosAtivos.map(e => (
            <div key={e.uf} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3 min-w-48">
              <div className="w-3 h-3 rounded-full bg-emerald-400 flex-shrink-0"></div>
              <div>
                <p className="text-sm font-semibold">{e.nome}</p>
                <p className="text-xs text-gray-400">{e.clientes} {e.clientes === 1 ? 'cliente' : 'clientes'}</p>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
            <div className="w-3 h-3 rounded-full bg-gray-600 flex-shrink-0"></div>
            <p className="text-xs text-gray-500">Demais estados</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [implantacoes, setImplantacoes] = useState([])
  const [atendimentos, setAtendimentos] = useState([])
  const [cases, setCases] = useState([])
  const [aba, setAba] = useState('visao-geral')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [habilidades, setHabilidades] = useState(habilidadesInicial)
  const [editandoHabilidade, setEditandoHabilidade] = useState(null)
  const [formHabilidade, setFormHabilidade] = useState({ nivel: 0, descricao: '' })

  const formImplantacaoVazio = { cliente: '', valor: '', cidade: '', status: 'lider', observacao: '', motivoCancelamento: '', estacoes: '' }
  const [form, setForm] = useState(formImplantacaoVazio)
  const [editandoImplantacao, setEditandoImplantacao] = useState(null)

  const formAtendimentoVazio = { tipo: tiposAtendimento[0], descricao: '', cliente: '', data: '', numeroCaso: '' }
  const [formAtendimento, setFormAtendimento] = useState(formAtendimentoVazio)
  const [editandoAtendimento, setEditandoAtendimento] = useState(null)
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)

  const formCaseVazio = { titulo: '', cliente: '', tipo: 'Layout FR3', descricao: '', impacto: '', tags: '' }
  const [formCase, setFormCase] = useState(formCaseVazio)
  const [editandoCase, setEditandoCase] = useState(null)
  const [mostrarFormCase, setMostrarFormCase] = useState(false)

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'implantacoes'), (snap) => {
      setImplantacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const unsub2 = onSnapshot(collection(db, 'atendimentos'), (snap) => {
      setAtendimentos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    const unsub3 = onSnapshot(collection(db, 'cases'), (snap) => {
      setCases(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2(); unsub3() }
  }, [])

  const lideres    = implantacoes.filter(i => i.status === 'lider' || i.status === 'sucesso').length
  const auxiliares = implantacoes.filter(i => i.status === 'auxiliar').length
  const canceladas = implantacoes.filter(i => ['cancelado','inativo','falha'].includes(i.status)).length
  const total      = implantacoes.length
  const ativas     = lideres + auxiliares
  const taxa       = total > 0 ? Math.round((ativas / total) * 100) : 0
  const receitaTotal = implantacoes
    .filter(i => i.status === 'lider' || i.status === 'sucesso')
    .reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0)

  const filtradas = implantacoes.filter(i =>
    i.cliente?.toLowerCase().includes(busca.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(busca.toLowerCase())
  )

  const dadosPizza = [
    { name: 'Analista Líder',    value: lideres,    color: '#34d399' },
    { name: 'Analista Auxiliar', value: auxiliares, color: '#60a5fa' },
    { name: 'Canceladas',        value: canceladas, color: '#f87171' },
  ].filter(d => d.value > 0)

  const dadosAtendimentos = tiposAtendimento.map(tipo => ({
    tipo: tipo.split(' ').slice(0, 2).join(' '),
    total: atendimentos.filter(a => a.tipo === tipo).length,
  })).filter(d => d.total > 0)

  const handleSalvarImplantacao = async (e) => {
    e.preventDefault()
    if (!form.cliente) return
    const dados = { ...form, valor: parseFloat(form.valor) || 0, estacoes: parseInt(form.estacoes) || 0 }
    if (editandoImplantacao) {
      await updateDoc(doc(db, 'implantacoes', editandoImplantacao), dados)
    } else {
      await addDoc(collection(db, 'implantacoes'), { ...dados, criadoEm: serverTimestamp() })
    }
    setForm(formImplantacaoVazio)
    setEditandoImplantacao(null)
    setAba('visao-geral')
  }

  const handleEditarImplantacao = (i) => {
    const s = i.status === 'sucesso' ? 'lider' : ['inativo','falha'].includes(i.status) ? 'cancelado' : i.status
    setForm({ cliente: i.cliente, valor: i.valor, cidade: i.cidade || '', status: s, observacao: i.observacao || '', motivoCancelamento: i.motivoCancelamento || '', estacoes: i.estacoes || '' })
    setEditandoImplantacao(i.id)
    setAba('adicionar')
  }

  const handleRemover = async (id) => {
    if (confirm('Remover esta implantação?')) await deleteDoc(doc(db, 'implantacoes', id))
  }

  const handleSalvarAtendimento = async (e) => {
    e.preventDefault()
    if (!formAtendimento.tipo) return
    if (editandoAtendimento) {
      await updateDoc(doc(db, 'atendimentos', editandoAtendimento), formAtendimento)
    } else {
      await addDoc(collection(db, 'atendimentos'), { ...formAtendimento, criadoEm: serverTimestamp() })
    }
    setFormAtendimento(formAtendimentoVazio)
    setEditandoAtendimento(null)
    setMostrarFormAtendimento(false)
  }

  const handleEditarAtendimento = (a) => {
    setFormAtendimento({ tipo: a.tipo, descricao: a.descricao || '', cliente: a.cliente || '', data: a.data || '', numeroCaso: a.numeroCaso || '' })
    setEditandoAtendimento(a.id)
    setMostrarFormAtendimento(true)
  }

  const handleRemoverAtendimento = async (id) => {
    if (confirm('Remover este atendimento?')) await deleteDoc(doc(db, 'atendimentos', id))
  }

  const handleSalvarCase = async (e) => {
    e.preventDefault()
    if (!formCase.titulo) return
    if (editandoCase) {
      await updateDoc(doc(db, 'cases', editandoCase), formCase)
    } else {
      await addDoc(collection(db, 'cases'), { ...formCase, criadoEm: serverTimestamp() })
    }
    setFormCase(formCaseVazio)
    setEditandoCase(null)
    setMostrarFormCase(false)
  }

  const handleEditarCase = (c) => {
    setFormCase({ titulo: c.titulo, cliente: c.cliente || '', tipo: c.tipo, descricao: c.descricao, impacto: c.impacto || '', tags: c.tags || '' })
    setEditandoCase(c.id)
    setMostrarFormCase(true)
  }

  const handleRemoverCase = async (id) => {
    if (confirm('Remover este case?')) await deleteDoc(doc(db, 'cases', id))
  }

  const handleEditarHabilidade = (catIdx, itemIdx) => {
    const item = habilidades[catIdx].itens[itemIdx]
    setFormHabilidade({ nivel: item.nivel, descricao: item.descricao })
    setEditandoHabilidade({ catIdx, itemIdx })
  }

  const handleSalvarHabilidade = () => {
    setHabilidades(habilidades.map((cat, ci) => ({
      ...cat,
      itens: cat.itens.map((item, ii) =>
        ci === editandoHabilidade.catIdx && ii === editandoHabilidade.itemIdx
          ? { ...item, nivel: parseInt(formHabilidade.nivel), descricao: formHabilidade.descricao }
          : item
      )
    })))
    setEditandoHabilidade(null)
  }

  const abas = [
    { id: 'visao-geral',   label: 'Visão Geral' },
    { id: 'clientes',      label: 'Clientes' },
    { id: 'atendimentos',  label: 'Atendimentos' },
    { id: 'cases',         label: 'Cases' },
    { id: 'carreira',      label: 'Carreira' },
    { id: 'habilidades',   label: 'Habilidades' },
    { id: 'adicionar',     label: '+ Adicionar' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Portfólio de Implantações</h1>
          <p className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            Nycolas Neves · Ganso Sistemas · Campo Grande MS
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Receita ativa gerada</p>
          <p className="text-2xl font-bold text-emerald-400">
            R$ {receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Métricas — 3 cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-gray-500 mt-1">implantações</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Analista Líder</p>
            <p className="text-3xl font-bold text-emerald-400">{lideres}</p>
            <p className="text-xs text-gray-500 mt-1">implantações ativas</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Analista Auxiliar</p>
            <p className="text-3xl font-bold text-blue-400">{auxiliares}</p>
            <p className="text-xs text-gray-500 mt-1">implantações ativas</p>
          </div>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-6 border-b border-gray-800 overflow-x-auto">
          {abas.map(tab => (
            <button key={tab.id} onClick={() => setAba(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                aba === tab.id ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-gray-400 hover:text-white'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-20 text-gray-500">Carregando dados...</div>}

        {/* Visão Geral */}
        {!loading && aba === 'visao-geral' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="font-semibold mb-4 text-sm text-gray-300">Status das implantações</h3>
                {dadosPizza.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dadosPizza} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {dadosPizza.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">Sem dados</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-400"></span><span className="text-xs text-gray-400">Líder</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400"></span><span className="text-xs text-gray-400">Auxiliar</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400"></span><span className="text-xs text-gray-400">Cancelada</span></div>
                </div>
              </div>
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800 flex flex-col justify-center">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-400">Taxa de aproveitamento</span>
                  <span className="text-emerald-400 font-bold">{taxa}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 mb-6">
                  <div className="bg-emerald-400 h-3 rounded-full" style={{ width: `${taxa}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-emerald-400 font-bold text-xl">{lideres}</p>
                    <p className="text-xs text-gray-500">líder</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-blue-400 font-bold text-xl">{auxiliares}</p>
                    <p className="text-xs text-gray-500">auxiliar</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-red-400 font-bold text-xl">{canceladas}</p>
                    <p className="text-xs text-gray-500">canceladas</p>
                  </div>
                </div>
              </div>
            </div>

            <MapaBrasil />

            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="font-semibold">Todas as implantações</h2>
              </div>
              {implantacoes.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">Nenhuma implantação registrada.</div>
              )}
              {implantacoes.map(i => {
                const cfg = statusConfig[i.status] || statusConfig.cancelado
                return (
                  <div key={i.id} className="px-5 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                    <div className="flex items-center gap-3">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.cor}`}></span>
                      <div>
                        <p className="text-sm font-medium">{i.cliente}</p>
                        <p className="text-xs text-gray-500">
                          {i.cidade}
                          {i.estacoes ? ` · ${i.estacoes} estações` : ''}
                          {i.motivoCancelamento ? ` · ${i.motivoCancelamento}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      {(i.status === 'lider' || i.status === 'sucesso') && (
                        <p className="text-sm font-semibold text-emerald-400">
                          R$ {parseFloat(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                        </p>
                      )}
                      <button onClick={() => handleEditarImplantacao(i)} className="text-gray-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✎</button>
                      <button onClick={() => handleRemover(i.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Clientes */}
        {!loading && aba === 'clientes' && (
          <div className="space-y-4">
            <input type="text" placeholder="Buscar cliente ou cidade..." value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtradas.map(i => {
                const cfg = statusConfig[i.status] || statusConfig.cancelado
                return (
                  <div key={i.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-emerald-800 transition-colors group relative">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 ${cfg.cor}`}></span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                    </div>
                    <p className="font-semibold text-sm mb-1">{i.cliente}</p>
                    <p className="text-xs text-gray-500 mb-1">{i.cidade}</p>
                    {i.estacoes > 0 && (
                      <p className="text-xs text-gray-400 mb-2">🖥️ {i.estacoes} {i.estacoes === 1 ? 'estação' : 'estações'}</p>
                    )}
                    {(i.status === 'lider' || i.status === 'sucesso') && (
                      <p className="text-lg font-bold text-emerald-400">
                        R$ {parseFloat(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        <span className="text-xs text-gray-500 font-normal">/mês</span>
                      </p>
                    )}
                    {i.motivoCancelamento && <p className="text-xs text-red-400 mt-2 border-t border-gray-800 pt-2">Motivo: {i.motivoCancelamento}</p>}
                    {i.observacao && <p className="text-xs text-gray-500 mt-1">{i.observacao}</p>}
                    <button onClick={() => handleEditarImplantacao(i)}
                      className="absolute top-3 right-3 text-gray-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✎</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Atendimentos */}
        {aba === 'atendimentos' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">Registro de Atendimentos</h2>
                <p className="text-sm text-gray-400">{atendimentos.length} casos registrados · média ~10/mês</p>
              </div>
              <button onClick={() => { setMostrarFormAtendimento(!mostrarFormAtendimento); setEditandoAtendimento(null); setFormAtendimento(formAtendimentoVazio) }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Registrar
              </button>
            </div>
            {mostrarFormAtendimento && (
              <div className="bg-gray-900 rounded-xl p-5 border border-emerald-800">
                <h3 className="font-semibold mb-4 text-sm">{editandoAtendimento ? 'Editar atendimento' : 'Novo atendimento'}</h3>
                <form onSubmit={handleSalvarAtendimento} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Tipo *</label>
                      <select value={formAtendimento.tipo} onChange={e => setFormAtendimento({...formAtendimento, tipo: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                        {tiposAtendimento.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Cliente</label>
                      <input type="text" value={formAtendimento.cliente} onChange={e => setFormAtendimento({...formAtendimento, cliente: e.target.value})}
                        placeholder="Nome do cliente"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Data</label>
                      <input type="date" value={formAtendimento.data} onChange={e => setFormAtendimento({...formAtendimento, data: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Nº do Caso (Salesforce)</label>
                      <input type="text" value={formAtendimento.numeroCaso} onChange={e => setFormAtendimento({...formAtendimento, numeroCaso: e.target.value})}
                        placeholder="Ex: 00123456" maxLength={8}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
                    <textarea value={formAtendimento.descricao} onChange={e => setFormAtendimento({...formAtendimento, descricao: e.target.value})}
                      placeholder="Descreva o caso brevemente..."
                      rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      {editandoAtendimento ? 'Salvar alterações' : 'Salvar'}
                    </button>
                    <button type="button" onClick={() => { setMostrarFormAtendimento(false); setEditandoAtendimento(null); setFormAtendimento(formAtendimentoVazio) }}
                      className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancelar</button>
                  </div>
                </form>
              </div>
            )}
            {dadosAtendimentos.length > 0 && (
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="font-semibold mb-4 text-sm text-gray-300">Atendimentos por tipo</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosAtendimentos} layout="vertical">
                    <XAxis type="number" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis type="category" dataKey="tipo" stroke="#4b5563" tick={{ fill: '#9ca3af', fontSize: 11 }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                    <Bar dataKey="total" fill="#34d399" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="font-semibold text-sm">Histórico</h3>
              </div>
              {atendimentos.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">Nenhum atendimento registrado ainda.</div>
              )}
              {atendimentos.map(a => (
                <div key={a.id} className="px-5 py-3 border-b border-gray-800 flex items-start justify-between hover:bg-gray-800 transition-colors group">
                  <div className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                    <div>
                      <p className="text-sm font-medium">{a.tipo}</p>
                      {a.cliente && <p className="text-xs text-gray-500">{a.cliente}</p>}
                      {a.descricao && <p className="text-xs text-gray-400 mt-0.5">{a.descricao}</p>}
                      {a.numeroCaso && <p className="text-xs text-blue-400 mt-0.5">Caso #{a.numeroCaso}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.data && <span className="text-xs text-gray-500">{a.data}</span>}
                    <button onClick={() => handleEditarAtendimento(a)} className="text-gray-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✎</button>
                    <button onClick={() => handleRemoverAtendimento(a.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cases */}
        {aba === 'cases' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold mb-1">Cases & Projetos</h2>
                <p className="text-sm text-gray-400">Customizações e soluções desenvolvidas para clientes</p>
              </div>
              <button onClick={() => { setMostrarFormCase(!mostrarFormCase); setEditandoCase(null); setFormCase(formCaseVazio) }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Adicionar case
              </button>
            </div>
            {mostrarFormCase && (
              <div className="bg-gray-900 rounded-xl p-5 border border-emerald-800">
                <h3 className="font-semibold mb-4 text-sm">{editandoCase ? 'Editar case' : 'Novo case'}</h3>
                <form onSubmit={handleSalvarCase} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Título *</label>
                      <input type="text" value={formCase.titulo} onChange={e => setFormCase({...formCase, titulo: e.target.value})}
                        placeholder="Ex: Etiqueta automática com promoção"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Cliente</label>
                      <input type="text" value={formCase.cliente} onChange={e => setFormCase({...formCase, cliente: e.target.value})}
                        placeholder="Ex: Atacarejo São José"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Tipo</label>
                      <select value={formCase.tipo} onChange={e => setFormCase({...formCase, tipo: e.target.value})}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500">
                        <option>Layout FR3</option>
                        <option>Customização de banco</option>
                        <option>Automação</option>
                        <option>Suporte técnico</option>
                        <option>Configuração fiscal</option>
                        <option>Outro</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Tags (separadas por vírgula)</label>
                      <input type="text" value={formCase.tags} onChange={e => setFormCase({...formCase, tags: e.target.value})}
                        placeholder="Ex: FR3, Automação, Varejo"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Descrição *</label>
                    <textarea value={formCase.descricao} onChange={e => setFormCase({...formCase, descricao: e.target.value})}
                      placeholder="Descreva o que foi desenvolvido..."
                      rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Impacto gerado</label>
                    <input type="text" value={formCase.impacto} onChange={e => setFormCase({...formCase, impacto: e.target.value})}
                      placeholder="Ex: Eliminou erro humano e acelerou o processo"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                      {editandoCase ? 'Salvar alterações' : 'Adicionar case'}
                    </button>
                    <button type="button" onClick={() => { setMostrarFormCase(false); setEditandoCase(null); setFormCase(formCaseVazio) }}
                      className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancelar</button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-4">
              {cases.map((c) => (
                <div key={c.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-emerald-800 transition-colors group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-base mb-0.5">{c.titulo}</h3>
                      <p className="text-sm text-emerald-400">{c.cliente}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{c.tipo}</span>
                      <button onClick={() => handleEditarCase(c)} className="text-gray-600 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✎</button>
                      <button onClick={() => handleRemoverCase(c.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">{c.descricao}</p>
                  {c.impacto && (
                    <div className="flex items-start gap-2 bg-emerald-950 rounded-lg p-3 mb-3">
                      <span className="text-emerald-400 text-xs mt-0.5">▸</span>
                      <p className="text-xs text-emerald-300">{c.impacto}</p>
                    </div>
                  )}
                  {c.tags && (
                    <div className="flex gap-2 flex-wrap">
                      {c.tags.split(',').map(tag => (
                        <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {cases.length === 0 && (
                <div className="bg-gray-900 rounded-xl p-5 border border-dashed border-gray-700 text-center">
                  <p className="text-gray-500 text-sm">Nenhum case registrado ainda</p>
                  <p className="text-gray-600 text-xs mt-1">Clique em "+ Adicionar case" para começar</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Carreira */}
        {aba === 'carreira' && (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-1">Trajetória na Ganso Sistemas</h2>
              <p className="text-sm text-gray-400">Promoção em menos de 9 meses de empresa</p>
            </div>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-800"></div>
              <div className="space-y-6">
                {timelineInicial.map((item, idx) => (
                  <div key={idx} className="relative pl-16">
                    <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-2 ${item.atual ? 'bg-emerald-400 border-emerald-400' : 'bg-gray-700 border-gray-600'}`}></div>
                    {item.atual && <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-30"></div>}
                    <div className={`bg-gray-900 rounded-xl p-5 border ${item.atual ? 'border-emerald-800' : 'border-gray-800'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-base">{item.cargo}</h3>
                          <p className="text-sm text-emerald-400">{item.empresa}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{item.inicio} — {item.fim ?? 'atual'}</p>
                          {item.atual && <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full mt-1 inline-block">atual</span>}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400 mb-4">{item.descricao}</p>
                      <div className="space-y-1.5">
                        {item.marcos.map((marco, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 mt-0.5 flex-shrink-0">▸</span>
                            <p className="text-xs text-gray-300">{marco}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Habilidades */}
        {aba === 'habilidades' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-1">Habilidades Técnicas</h2>
              <p className="text-sm text-gray-400">Clique em qualquer habilidade para editar</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {habilidades.map((cat, catIdx) => (
                <div key={catIdx} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{cat.icone}</span>
                    <h3 className="font-semibold text-sm text-gray-300">{cat.categoria}</h3>
                  </div>
                  <div className="space-y-4">
                    {cat.itens.map((item, itemIdx) => (
                      <div key={itemIdx} className="group">
                        {editandoHabilidade?.catIdx === catIdx && editandoHabilidade?.itemIdx === itemIdx ? (
                          <div className="space-y-2 bg-gray-800 rounded-lg p-3">
                            <p className="text-xs text-gray-400 font-medium">{item.nome}</p>
                            <div className="flex items-center gap-2">
                              <input type="range" min="0" max="100" value={formHabilidade.nivel}
                                onChange={e => setFormHabilidade({...formHabilidade, nivel: e.target.value})}
                                className="flex-1" />
                              <span className="text-xs text-emerald-400 font-bold w-8">{formHabilidade.nivel}%</span>
                            </div>
                            <input type="text" value={formHabilidade.descricao}
                              onChange={e => setFormHabilidade({...formHabilidade, descricao: e.target.value})}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-emerald-500" />
                            <div className="flex gap-2">
                              <button onClick={handleSalvarHabilidade} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded transition-colors">Salvar</button>
                              <button onClick={() => setEditandoHabilidade(null)} className="text-xs text-gray-400 hover:text-white px-3 py-1 rounded transition-colors">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="cursor-pointer" onClick={() => handleEditarHabilidade(catIdx, itemIdx)}>
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-sm font-medium group-hover:text-emerald-400 transition-colors">{item.nome}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-emerald-400 font-semibold">{item.nivel}%</span>
                                <span className="text-gray-600 group-hover:text-emerald-400 text-xs opacity-0 group-hover:opacity-100 transition-all">✎</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1">
                              <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${item.nivel}%` }} />
                            </div>
                            <p className="text-xs text-gray-500">{item.descricao}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adicionar / Editar */}
        {aba === 'adicionar' && (
          <div className="max-w-lg">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="font-semibold mb-5">{editandoImplantacao ? 'Editar implantação' : 'Nova implantação'}</h2>
              <form onSubmit={handleSalvarImplantacao} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nome do cliente *</label>
                  <input type="text" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})}
                    placeholder="Ex: Supermercado XYZ"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Valor mensal (R$)</label>
                    <input type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})}
                      placeholder="0,00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Estações</label>
                    <input type="number" value={form.estacoes} onChange={e => setForm({...form, estacoes: e.target.value})}
                      placeholder="Nº de PCs com o sistema"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Status *</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                    <option value="lider">Ativa - Analista Líder</option>
                    <option value="auxiliar">Ativa - Analista Auxiliar</option>
                    <option value="cancelado">Cancelada</option>
                  </select>
                </div>
                {form.status === 'cancelado' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Motivo do cancelamento</label>
                    <input type="text" value={form.motivoCancelamento} onChange={e => setForm({...form, motivoCancelamento: e.target.value})}
                      placeholder="Ex: instabilidade no sistema, dificuldade financeira..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Cidade</label>
                  <input type="text" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})}
                    placeholder="Ex: Campo Grande - MS"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Observação (opcional)</label>
                  <textarea value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}
                    placeholder="Setor, particularidades da implantação..."
                    rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
                </div>
                <div className="flex gap-3">
                  <button type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-colors">
                    {editandoImplantacao ? 'Salvar alterações' : 'Adicionar implantação'}
                  </button>
                  {editandoImplantacao && (
                    <button type="button" onClick={() => { setEditandoImplantacao(null); setForm(formImplantacaoVazio) }}
                      className="px-4 text-gray-400 hover:text-white text-sm rounded-lg border border-gray-700 transition-colors">
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
