import { useState, useEffect } from 'react'
import { db, auth } from './firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// ─── DADOS ESTÁTICOS ────────────────────────────────────────────────────────

const timelineInicial = [
  {
    cargo: 'Auxiliar de Implantação', empresa: 'Ganso Sistemas',
    inicio: 'Mai 2025', fim: 'Jan 2026', atual: false,
    descricao: 'Início na área de TI/sistemas. Atuação em instalação, configuração e suporte ao ERP Ganso em clientes dos setores de varejo, oficinas e auto peças.',
    marcos: ['Instalação e configuração do ERP em ambientes de produção','Diagnóstico e correção de erros de DLL e estrutura do sistema','Primeiros atendimentos técnicos a clientes']
  },
  {
    cargo: 'Assistente de Implantação II', empresa: 'Ganso Sistemas',
    inicio: 'Fev 2026', fim: null, atual: true,
    descricao: 'Promoção após menos de 9 meses de empresa. Responsável por implantações completas, customização de relatórios FR3, administração de banco Firebird e suporte técnico avançado.',
    marcos: ['Personalização de layouts FR3 e confecção de relatórios sob demanda','Administração de banco Firebird 2.5 via IBExpert','Atendimento autônomo a clientes em múltiplos estados (MS, SP, MG)','Configuração fiscal: NF-e, SEFAZ, CSOSN, boleto, DAS']
  },
]

const habilidadesInicial = [
  { categoria: 'Banco de Dados', icone: '🗄️', itens: [
    { nome: 'Firebird 2.5', nivel: 85, descricao: 'Administração via IBExpert, consultas SQL, diagnóstico e correção de inconsistências' },
    { nome: 'IBExpert', nivel: 80, descricao: 'Ferramenta principal para gestão e análise do banco de dados dos clientes' },
  ]},
  { categoria: 'Relatórios & Layouts', icone: '📊', itens: [
    { nome: 'FastReport 3 (FR3)', nivel: 82, descricao: 'Personalização e confecção de relatórios sob demanda para clientes' },
    { nome: 'Layouts personalizados', nivel: 80, descricao: 'NF-e, boletos, cupons, pedidos e outros documentos fiscais' },
  ]},
  { categoria: 'ERP Ganso', icone: '⚙️', itens: [
    { nome: 'Instalação & Configuração', nivel: 90, descricao: 'Deploy completo do sistema em ambiente do cliente' },
    { nome: 'Estrutura do sistema', nivel: 85, descricao: 'Conhecimento sobre DLLs, pastas, dependências e arquitetura' },
    { nome: 'Correção de bugs', nivel: 83, descricao: 'Diagnóstico e resolução de erros de sistema' },
    { nome: 'GansoPDV', nivel: 80, descricao: 'Configuração e suporte ao módulo de frente de caixa' },
  ]},
  { categoria: 'Fiscal & Tributário', icone: '📋', itens: [
    { nome: 'NF-e / SEFAZ', nivel: 78, descricao: 'Configuração de emissão de nota fiscal eletrônica' },
    { nome: 'CSOSN / PMZ / DAS', nivel: 75, descricao: 'Configuração tributária para regimes Simples Nacional' },
    { nome: 'Boleto & Financeiro', nivel: 75, descricao: 'Configuração de carteiras de cobrança e integração bancária' },
  ]},
  { categoria: 'Desenvolvimento', icone: '💻', itens: [
    { nome: 'React + Vite', nivel: 65, descricao: 'Desenvolvimento deste portal' },
    { nome: 'JavaScript', nivel: 60, descricao: 'Lógica de frontend, manipulação de dados' },
    { nome: 'Firebase / Firestore', nivel: 62, descricao: 'Banco de dados em tempo real e autenticação' },
    { nome: 'Git & GitHub', nivel: 58, descricao: 'Versionamento de código e deploy via Vercel' },
  ]},
]

const tiposAtendimento = [
  'Atendimento ao cliente','Treinamento','Importação de relatório',
  'Criação de relatório FR3','Parâmetros do sistema','Configuração de usuário',
  'Configuração avançada','Suporte técnico',
]

const statusConfig = {
  lider:     { label: 'Ativa - Analista Líder',    cor: '#19B887', badge: 'bg-[#19B887]/10 text-[#19B887] border-[#19B887]/25' },
  auxiliar:  { label: 'Ativa - Analista Auxiliar', cor: '#4F8CFF', badge: 'bg-[#4F8CFF]/10 text-[#4F8CFF] border-[#4F8CFF]/25' },
  cancelado: { label: 'Cancelada',                 cor: '#E85D6A', badge: 'bg-[#E85D6A]/10 text-[#E85D6A] border-[#E85D6A]/25' },
  sucesso:   { label: 'Ativa - Analista Líder',    cor: '#19B887', badge: 'bg-[#19B887]/10 text-[#19B887] border-[#19B887]/25' },
  inativo:   { label: 'Cancelada',                 cor: '#E85D6A', badge: 'bg-[#E85D6A]/10 text-[#E85D6A] border-[#E85D6A]/25' },
  falha:     { label: 'Cancelada',                 cor: '#E85D6A', badge: 'bg-[#E85D6A]/10 text-[#E85D6A] border-[#E85D6A]/25' },
}

// ─── TELA DE LOGIN ──────────────────────────────────────────────────────────

function TelaLogin() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
    } catch {
      setErro('E-mail ou senha incorretos.')
    }
    setCarregando(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{backgroundColor:'#0F1115'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-bold" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A',color:'#19B887',fontFamily:'Space Grotesk'}}>NN</div>
          <h1 className="text-2xl font-bold text-white" style={{fontFamily:'Space Grotesk'}}>Portfólio de Implantações</h1>
          <p className="text-sm mt-1" style={{color:'#707985'}}>Nycolas Neves · Ganso Sistemas</p>
        </div>
        <div className="rounded-2xl p-6" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
          <h2 className="font-semibold mb-5 text-center text-sm uppercase tracking-wider" style={{color:'#A8AFB9',fontFamily:'JetBrains Mono'}}>Acesso Restrito</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs mb-1 block" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>E-mail</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" required
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                style={{backgroundColor:'#1C2028',border:'1px solid #2A303A',color:'#F1F3F5'}}
                onFocus={e=>e.target.style.borderColor='#19B887'} onBlur={e=>e.target.style.borderColor='#2A303A'}/>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>Senha</label>
              <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" required
                className="w-full rounded-xl px-4 py-2.5 text-sm focus:outline-none transition"
                style={{backgroundColor:'#1C2028',border:'1px solid #2A303A',color:'#F1F3F5'}}
                onFocus={e=>e.target.style.borderColor='#19B887'} onBlur={e=>e.target.style.borderColor='#2A303A'}/>
            </div>
            {erro && <p className="text-xs text-center" style={{color:'#E85D6A'}}>{erro}</p>}
            <button type="submit" disabled={carregando}
              className="w-full font-bold py-2.5 rounded-xl transition text-sm"
              style={{backgroundColor:'#19B887',color:'#0F1115',opacity:carregando?0.6:1}}>
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ─── MAPA RADAR ─────────────────────────────────────────────────────────────

function MapaRadar({ implantacoes, onInspecionar }) {
  const [filtro, setFiltro] = useState('all')
  const [busca, setBusca] = useState('')

  const total = implantacoes.length
  const porEstado = {}
  implantacoes.forEach(i => {
    const uf = (i.cidade || '').split('-').pop()?.trim()
    if (uf) porEstado[uf] = (porEstado[uf] || 0) + 1
  })

  const filtradas = implantacoes.filter(i => {
    const texto = (i.cliente + i.cidade).toLowerCase()
    const matchBusca = texto.includes(busca.toLowerCase())
    const matchFiltro = filtro === 'all' || (i.cidade || '').includes(`- ${filtro}`)
    return matchBusca && matchFiltro
  })

  const receitaTotal = implantacoes.filter(i=>i.status==='lider'||i.status==='sucesso').reduce((a,i)=>a+(parseFloat(i.valor)||0),0)

  const getCorPonto = (i) => {
    if (i.status==='lider'||i.status==='sucesso') return '#19B887'
    if (i.status==='auxiliar') return '#4F8CFF'
    return '#E85D6A'
  }

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden flex flex-col" style={{backgroundColor:'#171A21',border:'1px solid #2A303A',minHeight:'520px'}}>
      {/* Header do mapa */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3" style={{borderBottom:'1px solid #2A303A'}}>
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:'#19B887'}}></span>
            <h3 className="text-sm font-bold uppercase tracking-wide" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Alcance Geográfico Operacional</h3>
          </div>
          <p className="text-xs mt-0.5" style={{color:'#707985'}}>Mapeamento em tempo real com radar sweep ativo (Centro-Oeste & Sudeste)</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 rounded-xl text-xs" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A',fontFamily:'JetBrains Mono'}}>
          {[{k:'all',l:`Todos (${total})`},{k:'MS',l:`MS (${porEstado['MS']||0})`},{k:'SP',l:`SP (${porEstado['SP']||0})`},{k:'MG',l:`MG (${porEstado['MG']||0})`}].map(f=>(
            <button key={f.k} onClick={()=>setFiltro(f.k)}
              className="px-2.5 py-1 rounded-lg transition font-mono"
              style={filtro===f.k?{backgroundColor:'#171A21',color:'#19B887',border:'1px solid #2A303A'}:{color:'#707985'}}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* SVG do Mapa */}
      <div className="relative flex-1 flex items-center justify-center py-4 rounded-xl my-2 overflow-hidden" style={{backgroundColor:'#12151B',border:'1px solid rgba(42,48,58,0.6)'}}>
        <svg viewBox="0 0 680 500" className="w-full max-w-xl h-auto" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tacticalGrid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
            </pattern>
            <clipPath id="radarSweepClip"><circle cx="220" cy="260" r="280"/></clipPath>
            <linearGradient id="radarSweepLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#19B887" stopOpacity="0.9"/>
              <stop offset="60%" stopColor="#36D6A0" stopOpacity="0.5"/>
              <stop offset="100%" stopColor="#19B887" stopOpacity="0"/>
            </linearGradient>
            <radialGradient id="hqGlowGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#19B887" stopOpacity="0.3"/>
              <stop offset="50%" stopColor="#19B887" stopOpacity="0.08"/>
              <stop offset="100%" stopColor="#19B887" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="radarWedgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#19B887" stopOpacity="0.22"/>
              <stop offset="50%" stopColor="#36D6A0" stopOpacity="0.08"/>
              <stop offset="100%" stopColor="#19B887" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <rect width="680" height="500" fill="url(#tacticalGrid)"/>
          {/* Rings */}
          <g opacity="0.6">
            <circle cx="220" cy="260" r="75" fill="none" stroke="#2A303A" strokeDasharray="3 3" strokeWidth="1"/>
            <text x="220" y="180" textAnchor="middle" fill="#707985" fontSize="7.5" fontFamily="JetBrains Mono">150 KM</text>
            <circle cx="220" cy="260" r="160" fill="none" stroke="#2A303A" strokeDasharray="4 4" strokeWidth="1"/>
            <text x="220" y="96" textAnchor="middle" fill="#707985" fontSize="7.5" fontFamily="JetBrains Mono">300 KM</text>
            <circle cx="220" cy="260" r="255" fill="none" stroke="#2A303A" strokeDasharray="4 6" strokeWidth="1"/>
            <line x1="220" x2="220" y1="15" y2="485" stroke="#2A303A" strokeDasharray="2 3" strokeWidth="1" opacity="0.4"/>
            <line x1="10" x2="670" y1="260" y2="260" stroke="#2A303A" strokeDasharray="2 3" strokeWidth="1" opacity="0.4"/>
          </g>
          {/* Fundo estados */}
          <g opacity="0.45">
            <polygon points="120,60 270,50 360,90 320,170 190,160 110,130" fill="#1C2028" stroke="#2A303A" strokeWidth="1.2"/>
            <polygon points="170,360 280,350 350,430 250,460 170,410" fill="#1C2028" stroke="#2A303A" strokeWidth="1.2"/>
            <polygon points="460,320 540,300 520,350 440,360" fill="#1C2028" stroke="#2A303A" strokeWidth="1"/>
          </g>
          {/* Estados ativos */}
          <g>
            {/* MG */}
            <polygon points="340,160 480,140 540,210 490,290 390,270 340,210" fill="#36D6A0" fillOpacity="0.10" stroke="#36D6A0" strokeDasharray="4,2" strokeWidth={filtro==='MG'?3:1.5}/>
            <rect x="445" y="195" width="34" height="20" rx="4" fill="#171A21" stroke="#2A303A" strokeWidth="1"/>
            <text x="462" y="209" textAnchor="middle" fill="#36D6A0" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">MG</text>
            {/* MS */}
            <polygon points="160,190 285,180 310,260 260,350 170,340 140,260" fill="#19B887" fillOpacity="0.16" stroke="#19B887" strokeWidth={filtro==='MS'?3:1.8}/>
            <rect x="178" y="215" width="50" height="22" rx="4" fill="#171A21" stroke="#2A303A" strokeWidth="1"/>
            <text x="203" y="230" textAnchor="middle" fill="#19B887" fontSize="11" fontWeight="bold" fontFamily="JetBrains Mono">MS</text>
            <text x="203" y="246" textAnchor="middle" fill="#A8AFB9" fontSize="8" fontFamily="JetBrains Mono">{porEstado['MS']||0} Clientes</text>
            {/* SP */}
            <polygon points="290,270 390,265 440,320 370,370 290,325" fill="#4F8CFF" fillOpacity="0.14" stroke="#4F8CFF" strokeWidth={filtro==='SP'?3:1.5}/>
            <rect x="330" y="305" width="34" height="20" rx="4" fill="#171A21" stroke="#2A303A" strokeWidth="1"/>
            <text x="347" y="319" textAnchor="middle" fill="#4F8CFF" fontSize="10" fontWeight="bold" fontFamily="JetBrains Mono">SP</text>
          </g>
          {/* Radar sweep */}
          <g clipPath="url(#radarSweepClip)">
            <circle cx="220" cy="260" r="180" fill="url(#hqGlowGrad)"/>
            <g className="radar-beam">
              <path d="M 220 260 L 485 200 A 270 270 0 0 0 490 260 Z" fill="url(#radarWedgeGrad)" opacity="0.65"/>
              <path d="M 220 260 L 490 260 A 270 270 0 0 0 470 320 Z" fill="url(#radarWedgeGrad)" opacity="0.3"/>
              <line x1="220" y1="260" x2="490" y2="260" stroke="url(#radarSweepLineGrad)" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="488" cy="260" r="2.5" fill="#36D6A0" opacity="0.8"/>
            </g>
          </g>
          {/* Arcos de conexão */}
          <g opacity="0.5">
            <line x1="220" y1="260" x2="205" y2="285" stroke="#19B887" strokeDasharray="3,3" strokeWidth="1.2"/>
            <path d="M 220 260 Q 265 268 325 295" fill="none" stroke="#4F8CFF" strokeDasharray="5,4" strokeWidth="1.4"/>
            <path d="M 220 260 Q 320 180 440 220" fill="none" stroke="#36D6A0" strokeDasharray="6,4" strokeWidth="1.4"/>
          </g>
          {/* Campo Grande HQ */}
          <g transform="translate(220,260)" className="cursor-pointer" onClick={()=>onInspecionar(null)}>
            <circle r="6" fill="#19B887" stroke="#0F1115" strokeWidth="2"/>
            <circle r="2" fill="#0F1115"/>
            <text x="12" y="4" fill="#F1F3F5" fontSize="11" fontWeight="700" fontFamily="Space Grotesk">Campo Grande (HQ)</text>
            <text x="12" y="16" fill="#19B887" fontSize="9" fontFamily="JetBrains Mono">
              {(porEstado['MS']||0)} Clientes · R$ {implantacoes.filter(i=>(i.cidade||'').includes('MS')&&(i.status==='lider'||i.status==='sucesso')).reduce((a,i)=>a+(parseFloat(i.valor)||0),0).toLocaleString('pt-BR',{minimumFractionDigits:2})}
            </text>
          </g>
          {/* Sidrolândia */}
          <g transform="translate(195,285)" className="cursor-pointer">
            <circle r="5" fill="#19B887" stroke="#0F1115" strokeWidth="1.5"/>
            <text x="-10" y="18" textAnchor="end" fill="#F1F3F5" fontSize="9.5" fontWeight="600" fontFamily="Space Grotesk">Sidrolândia</text>
          </g>
          {/* Presidente Prudente */}
          <g transform="translate(325,295)" className="cursor-pointer">
            <circle r="5" fill="#4F8CFF" stroke="#0F1115" strokeWidth="1.5"/>
            <text x="10" y="-4" fill="#F1F3F5" fontSize="10" fontWeight="600" fontFamily="Space Grotesk">Pres. Prudente</text>
            <text x="10" y="8" fill="#4F8CFF" fontSize="8.5" fontFamily="JetBrains Mono">{porEstado['SP']||0} Clientes</text>
          </g>
          {/* Patrocínio */}
          <g transform="translate(440,220)" className="cursor-pointer">
            <circle r="5" fill="#36D6A0" stroke="#0F1115" strokeWidth="1.5"/>
            <text x="12" y="2" fill="#F1F3F5" fontSize="10" fontWeight="600" fontFamily="Space Grotesk">Patrocínio</text>
          </g>
        </svg>
        {/* Legenda */}
        <div className="absolute bottom-3 left-4 p-2.5 rounded-xl text-xs space-y-1.5" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A',fontFamily:'JetBrains Mono'}}>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor:'#19B887'}}></span><span style={{color:'#A8AFB9'}}>Base Ativa (Líder)</span></div>
          <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{backgroundColor:'#E85D6A'}}></span><span style={{color:'#A8AFB9'}}>Cancelada</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-0.5" style={{backgroundColor:'#4F8CFF'}}></span><span style={{color:'#707985'}}>Rotas de Suporte</span></div>
        </div>
      </div>

      {/* Cards de estado */}
      <div className="grid grid-cols-3 gap-2.5 pt-3" style={{borderTop:'1px solid #2A303A'}}>
        {[{uf:'MS',label:'Mato Grosso do Sul',cor:'#19B887'},{uf:'SP',label:'São Paulo',cor:'#4F8CFF'},{uf:'MG',label:'Minas Gerais',cor:'#36D6A0'}].map(e=>(
          <div key={e.uf} onClick={()=>setFiltro(e.uf)} className="p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition"
            style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
            <div>
              <span className="text-xs font-mono font-semibold" style={{color:e.cor,fontSize:'10px',fontFamily:'JetBrains Mono'}}>{e.label}</span>
              <p className="text-sm font-bold font-mono" style={{color:'#F1F3F5'}}>{porEstado[e.uf]||0} Clientes</p>
            </div>
            <span className="text-xs font-mono" style={{color:e.cor,fontFamily:'JetBrains Mono'}}>
              {total > 0 ? Math.round(((porEstado[e.uf]||0)/total)*100) : 0}%
            </span>
          </div>
        ))}
      </div>

      {/* CSS do radar */}
      <style>{`
        .radar-beam { animation: radarSweepSpin 9s linear infinite; transform-origin: 220px 260px; pointer-events: none; }
        @keyframes radarSweepSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────

export default function App() {
  const [usuario, setUsuario] = useState(undefined)
  const [implantacoes, setImplantacoes] = useState([])
  const [atendimentos, setAtendimentos] = useState([])
  const [cases, setCases] = useState([])
  const [aba, setAba] = useState('visao-geral')
  const [loading, setLoading] = useState(true)
  const [habilidades, setHabilidades] = useState(habilidadesInicial)
  const [editandoHabilidade, setEditandoHabilidade] = useState(null)
  const [formHabilidade, setFormHabilidade] = useState({ nivel: 0, descricao: '' })
  const [clienteInspecionado, setClienteInspecionado] = useState(null)
  const [buscaTabela, setBuscaTabela] = useState('')
  const [mostrarFormAdd, setMostrarFormAdd] = useState(false)

  const formImpVazio = { cliente:'', valor:'', cidade:'', status:'lider', observacao:'', motivoCancelamento:'', estacoes:'' }
  const [form, setForm] = useState(formImpVazio)
  const [editandoImp, setEditandoImp] = useState(null)

  const formAtVazio = { tipo: tiposAtendimento[0], descricao:'', cliente:'', data:'', numeroCaso:'' }
  const [formAt, setFormAt] = useState(formAtVazio)
  const [editandoAt, setEditandoAt] = useState(null)
  const [mostrarFormAt, setMostrarFormAt] = useState(false)

  const formCaseVazio = { titulo:'', cliente:'', tipo:'Layout FR3', descricao:'', impacto:'', tags:'' }
  const [formCase, setFormCase] = useState(formCaseVazio)
  const [editandoCase, setEditandoCase] = useState(null)
  const [mostrarFormCase, setMostrarFormCase] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUsuario(u ?? null))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!usuario) return
    const u1 = onSnapshot(collection(db,'implantacoes'), snap => { setImplantacoes(snap.docs.map(d=>({id:d.id,...d.data()}))); setLoading(false) })
    const u2 = onSnapshot(collection(db,'atendimentos'), snap => setAtendimentos(snap.docs.map(d=>({id:d.id,...d.data()}))))
    const u3 = onSnapshot(collection(db,'cases'), snap => setCases(snap.docs.map(d=>({id:d.id,...d.data()}))))
    return () => { u1(); u2(); u3() }
  }, [usuario])

  if (usuario === undefined) return <div className="min-h-screen flex items-center justify-center" style={{backgroundColor:'#0F1115'}}><p style={{color:'#707985',fontFamily:'JetBrains Mono',fontSize:'12px'}}>Inicializando...</p></div>
  if (usuario === null) return <TelaLogin />

  // métricas
  const lideres    = implantacoes.filter(i=>i.status==='lider'||i.status==='sucesso').length
  const auxiliares = implantacoes.filter(i=>i.status==='auxiliar').length
  const canceladas = implantacoes.filter(i=>['cancelado','inativo','falha'].includes(i.status)).length
  const total      = implantacoes.length
  const taxa       = total > 0 ? Math.round(((lideres+auxiliares)/total)*100) : 0
  const receitaTotal = implantacoes.filter(i=>i.status==='lider'||i.status==='sucesso').reduce((a,i)=>a+(parseFloat(i.valor)||0),0)
  const totalEstacoes = implantacoes.reduce((a,i)=>a+(parseInt(i.estacoes)||0),0)
  const ultimaCancelada = implantacoes.find(i=>['cancelado','inativo','falha'].includes(i.status))

  const porEstado = {}
  implantacoes.forEach(i => { const uf=(i.cidade||'').split('-').pop()?.trim(); if(uf) porEstado[uf]=(porEstado[uf]||0)+1 })
  const qtdEstados = Object.keys(porEstado).filter(k=>k.length===2).length

  const filtradosTabela = implantacoes.filter(i=>{
    const t=(i.cliente+i.cidade).toLowerCase()
    return t.includes(buscaTabela.toLowerCase())
  })

  // handlers
  const salvarImp = async e => {
    e.preventDefault()
    if (!form.cliente) return
    const dados = {...form, valor:parseFloat(form.valor)||0, estacoes:parseInt(form.estacoes)||0}
    if (editandoImp) { await updateDoc(doc(db,'implantacoes',editandoImp),dados) }
    else { await addDoc(collection(db,'implantacoes'),{...dados,criadoEm:serverTimestamp()}) }
    setForm(formImpVazio); setEditandoImp(null); setMostrarFormAdd(false)
  }
  const editarImp = i => {
    const s=i.status==='sucesso'?'lider':['inativo','falha'].includes(i.status)?'cancelado':i.status
    setForm({cliente:i.cliente,valor:i.valor,cidade:i.cidade||'',status:s,observacao:i.observacao||'',motivoCancelamento:i.motivoCancelamento||'',estacoes:i.estacoes||''})
    setEditandoImp(i.id); setMostrarFormAdd(true); setAba('adicionar')
  }
  const removerImp = async id => { if(confirm('Remover?')) await deleteDoc(doc(db,'implantacoes',id)) }

  const salvarAt = async e => {
    e.preventDefault()
    if (editandoAt) { await updateDoc(doc(db,'atendimentos',editandoAt),formAt) }
    else { await addDoc(collection(db,'atendimentos'),{...formAt,criadoEm:serverTimestamp()}) }
    setFormAt(formAtVazio); setEditandoAt(null); setMostrarFormAt(false)
  }
  const removerAt = async id => { if(confirm('Remover?')) await deleteDoc(doc(db,'atendimentos',id)) }

  const salvarCase = async e => {
    e.preventDefault()
    if (!formCase.titulo) return
    if (editandoCase) { await updateDoc(doc(db,'cases',editandoCase),formCase) }
    else { await addDoc(collection(db,'cases'),{...formCase,criadoEm:serverTimestamp()}) }
    setFormCase(formCaseVazio); setEditandoCase(null); setMostrarFormCase(false)
  }
  const removerCase = async id => { if(confirm('Remover?')) await deleteDoc(doc(db,'cases',id)) }

  const salvarHab = () => {
    setHabilidades(habilidades.map((cat,ci)=>({...cat,itens:cat.itens.map((item,ii)=>
      ci===editandoHabilidade.catIdx&&ii===editandoHabilidade.itemIdx?{...item,nivel:parseInt(formHabilidade.nivel),descricao:formHabilidade.descricao}:item
    )})))
    setEditandoHabilidade(null)
  }

  const abas = [
    {id:'visao-geral',label:'Visão Geral',icon:'⊞'},
    {id:'clientes',label:'Clientes',icon:'👥'},
    {id:'atendimentos',label:'Atendimentos',icon:'💬'},
    {id:'cases',label:'Cases',icon:'📁'},
    {id:'carreira',label:'Carreira',icon:'📈'},
    {id:'habilidades',label:'Habilidades',icon:'⚡'},
    {id:'resumo',label:'Resumo Executivo',icon:'📄'},
  ]

  const inputStyle = {backgroundColor:'#1C2028',border:'1px solid #2A303A',color:'#F1F3F5',borderRadius:'12px',padding:'10px 14px',fontSize:'13px',width:'100%',outline:'none'}
  const labelStyle = {color:'#707985',fontSize:'11px',fontFamily:'JetBrains Mono',display:'block',marginBottom:'4px'}

  return (
    <div className="min-h-screen pb-16 antialiased" style={{backgroundColor:'#0F1115',color:'#A8AFB9',fontFamily:'Inter, sans-serif'}}>

      {/* HEADER */}
      <header className="sticky top-0 z-50 px-4 py-3 transition-all" style={{borderBottom:'1px solid #2A303A',backgroundColor:'rgba(15,17,21,0.95)',backdropFilter:'blur(12px)'}}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A',color:'#19B887'}}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{backgroundColor:'#19B887'}}></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Portfólio de Implantações</h1>
                <span className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:'#1C2028',color:'#19B887',border:'1px solid #2A303A',fontFamily:'JetBrains Mono',fontSize:'10px',fontWeight:'bold',letterSpacing:'0.1em'}}>Ganso Sistemas</span>
              </div>
              <div className="flex items-center gap-2 text-xs" style={{color:'#707985'}}>
                <span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:'#19B887'}}></span>
                <span style={{color:'#A8AFB9'}}>Nycolas Neves</span>
                <span style={{color:'#2A303A'}}>•</span>
                <span>Campo Grande, MS</span>
                <span style={{color:'#2A303A'}}>•</span>
                <span style={{color:'#19B887',fontFamily:'JetBrains Mono',fontSize:'11px'}}>HQ Operacional</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between w-full md:w-auto gap-4 rounded-xl px-4 py-2" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
            <div>
              <p style={{fontSize:'10px',color:'#707985',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.05em'}}>Receita Ativa Gerada</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>R$ {receitaTotal.toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                <span style={{fontSize:'11px',color:'#707985',fontFamily:'JetBrains Mono'}}>/mês</span>
              </div>
            </div>
            <div className="w-px h-8 hidden sm:block" style={{backgroundColor:'#2A303A'}}></div>
            <div className="hidden sm:block text-right">
              <p style={{fontSize:'10px',color:'#707985',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.05em'}}>Aproveitamento</p>
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-lg font-bold" style={{color:'#F1F3F5',fontFamily:'JetBrains Mono'}}>{taxa}%</span>
                <span style={{fontSize:'10px',color:'#19B887',backgroundColor:'rgba(25,184,135,0.1)',padding:'2px 6px',borderRadius:'4px',border:'1px solid rgba(25,184,135,0.2)'}}>Taxa Líder</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button onClick={()=>window.print()} className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg transition" style={{backgroundColor:'#1C2028',color:'#F1F3F5',border:'1px solid #2A303A'}}>
              ↓ Exportar PDF
            </button>
            <button onClick={()=>{setAba('adicionar');setMostrarFormAdd(true)}} className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-lg transition" style={{backgroundColor:'#19B887',color:'#0F1115'}}>
              + Nova Implantação
            </button>
            <button onClick={()=>signOut(auth)} className="text-xs px-2.5 py-2 rounded-lg transition" style={{color:'#707985'}}> Sair</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">

        {/* KPI STRIP */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            {label:'Total',valor:total,sub:'Implantações',cor:'#F1F3F5'},
            {label:'Analista Líder',valor:lideres,sub:`${taxa}% ativas no ar`,cor:'#19B887',dot:true},
            {label:'Auxiliar',valor:auxiliares,sub:'Implantações',cor:'#F1F3F5',labelCor:'#4F8CFF'},
            {label:'Canceladas',valor:canceladas,sub:ultimaCancelada?.cliente||'—',cor:'#E85D6A',dot:true,dotCor:'#E85D6A'},
            {label:'Estações',valor:totalEstacoes,sub:'Terminais configurados',cor:'#4F8CFF'},
            {label:'Atendimentos',valor:atendimentos.length,sub:'Chamados pós-go',cor:'#F1F3F5'},
            {label:'Estados',valor:qtdEstados,sub:Object.keys(porEstado).filter(k=>k.length===2).join(', ')||'—',cor:'#F1F3F5',badge:'HUB'},
          ].map((k,i)=>(
            <div key={i} className="p-3.5 rounded-xl flex flex-col justify-between transition" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
              <div className="flex items-center justify-between">
                <span style={{fontSize:'11px',fontFamily:'JetBrains Mono',textTransform:'uppercase',letterSpacing:'0.05em',color:k.labelCor||k.dotCor||'#707985'}}>{k.label}</span>
                {k.dot && <span className="w-2 h-2 rounded-full" style={{backgroundColor:k.dotCor||'#19B887'}}></span>}
                {k.badge && <span style={{fontSize:'10px',fontFamily:'JetBrains Mono',color:'#4F8CFF',backgroundColor:'#1C2028',border:'1px solid #2A303A',padding:'1px 4px',borderRadius:'3px'}}>{k.badge}</span>}
              </div>
              <div className="my-1"><span className="text-2xl font-bold" style={{color:k.cor,fontFamily:'JetBrains Mono'}}>{k.valor}</span></div>
              <span style={{fontSize:'11px',color:'#A8AFB9',fontFamily:k.sub.length>15?'inherit':'JetBrains Mono'}}>{k.sub}</span>
            </div>
          ))}
        </section>

        {/* ABAS */}
        <nav className="p-1.5 rounded-xl flex flex-wrap items-center justify-between gap-2" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
          <div className="flex items-center gap-1 overflow-x-auto py-0.5">
            {abas.map(tab=>(
              <button key={tab.id} onClick={()=>setAba(tab.id)}
                className="px-4 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 whitespace-nowrap"
                style={aba===tab.id?{backgroundColor:'#1C2028',color:'#19B887',border:'1px solid #2A303A'}:{color:'#A8AFB9',border:'1px solid transparent'}}>
                <span>{tab.icon}</span>{tab.label}
                {tab.id==='clientes'&&<span style={{fontSize:'10px',fontFamily:'JetBrains Mono',backgroundColor:'#0F1115',color:'#707985',border:'1px solid #2A303A',padding:'0 4px',borderRadius:'3px'}}>{total}</span>}
              </button>
            ))}
          </div>
          <button onClick={()=>{setAba('adicionar');setEditandoImp(null);setForm(formImpVazio);setMostrarFormAdd(true)}}
            className="text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
            style={{backgroundColor:'#1C2028',color:'#A8AFB9',border:'1px solid #2A303A'}}>
            + Adicionar
          </button>
        </nav>

        {/* ── VISÃO GERAL ── */}
        {aba==='visao-geral'&&(
          <div className="space-y-6">
            {/* Profile Hero */}
            <div className="p-6 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 relative" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                    <span className="text-3xl font-black" style={{color:'#19B887',fontFamily:'Space Grotesk'}}>NN</span>
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full" style={{backgroundColor:'#19B887',border:'2px solid #1C2028'}}></span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-3xl font-bold tracking-tight" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Nycolas Neves</h2>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold" style={{backgroundColor:'#1C2028',color:'#19B887',border:'1px solid #2A303A'}}>Assistente de Implantação II</span>
                    </div>
                    <p className="text-sm font-medium" style={{color:'#A8AFB9'}}>Ganso Sistemas • Campo Grande, MS</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>
                      <span className="flex items-center gap-1.5" style={{color:'#19B887'}}><span className="w-2 h-2 rounded-full" style={{backgroundColor:'#19B887'}}></span>Mai/2025 — presente</span>
                      <span>•</span>
                      <span>Tempo: <strong style={{color:'#F1F3F5'}}>1 ano e 4 meses</strong></span>
                      <span>•</span>
                      <span>Especialidade: <strong style={{color:'#F1F3F5'}}>ERP & Varejo Alimentício / Autopeças</strong></span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={()=>setAba('resumo')} className="px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2" style={{backgroundColor:'#19B887',color:'#0F1115'}}>
                    📄 Dossiê de Performance
                  </button>
                </div>
              </div>
            </div>

            {/* Mapa + Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <MapaRadar implantacoes={implantacoes} onInspecionar={setClienteInspecionado}/>
              </div>
              <div className="lg:col-span-4 space-y-6 flex flex-col">
                {/* Inspector */}
                <div className="p-5 rounded-2xl flex-1" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                  <div className="flex items-center justify-between pb-3" style={{borderBottom:'1px solid #2A303A'}}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full animate-ping" style={{backgroundColor:'#19B887'}}></span>
                      <span className="text-xs font-bold uppercase tracking-wider" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>Inspetor Operacional</span>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded" style={{backgroundColor:'#1C2028',color:'#19B887',border:'1px solid #2A303A',fontFamily:'JetBrains Mono'}}>DESTAQUE TOP 1</span>
                  </div>
                  {clienteInspecionado ? (
                    <div className="mt-4 space-y-3">
                      <div>
                        <span style={{fontSize:'10px',fontFamily:'JetBrains Mono',color:'#707985',textTransform:'uppercase'}}>Cliente em Foco</span>
                        <h4 className="text-lg font-bold leading-tight" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>{clienteInspecionado.cliente}</h4>
                        <p className="text-xs font-medium" style={{color:'#A8AFB9'}}>{clienteInspecionado.cidade}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2.5 rounded-xl" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                          <span style={{fontSize:'10px',fontFamily:'JetBrains Mono',color:'#707985',display:'block'}}>Receita Mensal</span>
                          <span className="text-base font-bold" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>R$ {parseFloat(clienteInspecionado.valor||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                        </div>
                        <div className="p-2.5 rounded-xl" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                          <span style={{fontSize:'10px',fontFamily:'JetBrains Mono',color:'#707985',display:'block'}}>Papel Nycolas</span>
                          <span className="text-xs font-semibold" style={{color:'#F1F3F5'}}>{statusConfig[clienteInspecionado.status]?.label||'—'}</span>
                        </div>
                      </div>
                      <p className="text-xs italic" style={{color:'#707985'}}>Clique em outro cliente na tabela para inspecionar.</p>
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {/* Mostra o top 1 por padrão */}
                      {(() => {
                        const top = [...implantacoes].filter(i=>i.status==='lider'||i.status==='sucesso').sort((a,b)=>(parseFloat(b.valor)||0)-(parseFloat(a.valor)||0))[0]
                        if (!top) return <p className="text-xs" style={{color:'#707985'}}>Nenhum cliente cadastrado.</p>
                        const share = receitaTotal > 0 ? ((parseFloat(top.valor)||0)/receitaTotal*100).toFixed(1) : 0
                        return (
                          <>
                            <div>
                              <span style={{fontSize:'10px',fontFamily:'JetBrains Mono',color:'#707985',textTransform:'uppercase'}}>Cliente em Foco</span>
                              <h4 className="text-lg font-bold" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>{top.cliente}</h4>
                              <p className="text-xs" style={{color:'#A8AFB9'}}>{top.cidade}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-2.5 rounded-xl" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                                <span style={{fontSize:'10px',fontFamily:'JetBrains Mono',color:'#707985',display:'block'}}>Receita Mensal</span>
                                <span className="text-base font-bold" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>R$ {parseFloat(top.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</span>
                              </div>
                              <div className="p-2.5 rounded-xl" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                                <span style={{fontSize:'10px',fontFamily:'JetBrains Mono',color:'#707985',display:'block'}}>Papel Nycolas</span>
                                <span className="text-xs font-semibold" style={{color:'#F1F3F5'}}>Analista Líder</span>
                              </div>
                            </div>
                            <div className="p-3 rounded-xl" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                              <div className="flex justify-between text-xs font-mono mb-1" style={{color:'#707985'}}>
                                <span>Contribuição de Portfólio</span>
                                <span style={{color:'#19B887',fontWeight:'bold'}}>{share}% da Receita</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'#0F1115',border:'1px solid #2A303A'}}>
                                <div className="h-full rounded-full transition-all duration-500" style={{width:`${share}%`,backgroundColor:'#19B887'}}></div>
                              </div>
                            </div>
                            <p className="text-xs italic" style={{color:'#707985'}}>Clique em um cliente na tabela para inspecionar.</p>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
                {/* Donut status */}
                <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                  <div className="flex items-center justify-between pb-2" style={{borderBottom:'1px solid #2A303A'}}>
                    <h4 className="text-xs font-bold uppercase tracking-wider" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Status das Implantações</h4>
                    <span style={{fontSize:'11px',fontFamily:'JetBrains Mono',color:'#707985'}}>{total} Registros</span>
                  </div>
                  <div className="py-4 flex items-center justify-center gap-6">
                    <div className="relative w-32 h-32 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{background:total>0?`conic-gradient(#19B887 0% ${taxa}%, #E85D6A ${taxa}% 100%)`:'#2A303A'}}>
                      <div className="w-20 h-20 rounded-full flex flex-col items-center justify-center" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                        <span className="text-xl font-bold" style={{color:'#F1F3F5',fontFamily:'JetBrains Mono'}}>{taxa}%</span>
                        <span style={{fontSize:'9px',color:'#19B887',fontFamily:'JetBrains Mono',textTransform:'uppercase'}}>Sucesso</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-xs" style={{fontFamily:'JetBrains Mono'}}>
                      {[{cor:'#19B887',label:'Líder',val:lideres},{cor:'#4F8CFF',label:'Auxiliar',val:auxiliares},{cor:'#E85D6A',label:'Canceladas',val:canceladas}].map(s=>(
                        <div key={s.label} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-sm" style={{backgroundColor:s.cor}}></span>
                          <span style={{color:'#A8AFB9'}}>{s.label}: <strong style={{color:'#F1F3F5'}}>{s.val}</strong></span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2" style={{borderTop:'1px solid #2A303A'}}>
                    <div className="flex items-center justify-between text-xs" style={{fontFamily:'JetBrains Mono'}}>
                      <span style={{color:'#707985'}}>Taxa de Aproveitamento</span>
                      <span style={{color:'#19B887',fontWeight:'bold'}}>{taxa}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{backgroundColor:'#0F1115',border:'1px solid #2A303A'}}>
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${taxa}%`,backgroundColor:'#19B887'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela de implantações */}
            <section className="p-5 rounded-2xl space-y-4" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>
                    Todas as Implantações Realizadas
                    <span style={{fontSize:'12px',color:'#707985',fontWeight:'normal',fontFamily:'JetBrains Mono'}}>({total} contratos)</span>
                  </h3>
                  <p style={{fontSize:'12px',color:'#707985'}}>Detalhamento contratual, status em produção e faturamento recorrente mensal (MRR)</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3" style={{color:'#707985'}}>🔍</span>
                  <input type="text" value={buscaTabela} onChange={e=>setBuscaTabela(e.target.value)}
                    placeholder="Buscar por cliente, cidade ou estado..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none transition"
                    style={{backgroundColor:'#1C2028',border:'1px solid #2A303A',color:'#F1F3F5',fontFamily:'JetBrains Mono'}}/>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{borderBottom:'1px solid #2A303A',backgroundColor:'#171A21'}}>
                      {['Cliente / Razão Social','Localidade','Status Operacional','Estações','Receita Mensal (MRR)','Ações'].map(h=>(
                        <th key={h} className="py-3 px-3" style={{fontSize:'11px',fontFamily:'JetBrains Mono',textTransform:'uppercase',color:'#707985'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody style={{fontFamily:'JetBrains Mono',fontSize:'12px'}}>
                    {filtradosTabela.map(i=>{
                      const cfg = statusConfig[i.status]||statusConfig.cancelado
                      const isAtivo = i.status==='lider'||i.status==='sucesso'
                      return (
                        <tr key={i.id} onClick={()=>setClienteInspecionado(i)}
                          className="transition cursor-pointer group"
                          style={{borderBottom:'1px solid #2A303A'}}
                          onMouseEnter={e=>e.currentTarget.style.backgroundColor='#1C2028'}
                          onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:cfg.cor}}></span>
                              <span className="font-bold text-sm" style={{color:'#F1F3F5',fontFamily:'Inter'}}>{i.cliente}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3" style={{color:'#A8AFB9'}}>{i.cidade}</td>
                          <td className="py-3.5 px-3">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${cfg.badge}`}>{cfg.label}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right" style={{color:i.estacoes?'#4F8CFF':'#707985'}}>
                            {i.estacoes ? `${i.estacoes} est.` : 'Padrão'}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-sm" style={{color:isAtivo?cfg.cor:'#707985'}}>
                            {isAtivo ? `R$ ${parseFloat(i.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}/mês` : 'Encerrado'}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={e=>{e.stopPropagation();editarImp(i)}} className="p-1 rounded transition" style={{color:'#707985'}}
                                onMouseEnter={e=>e.currentTarget.style.color='#19B887'} onMouseLeave={e=>e.currentTarget.style.color='#707985'}>✎</button>
                              <button onClick={e=>{e.stopPropagation();removerImp(i.id)}} className="p-1 rounded transition" style={{color:'#707985'}}
                                onMouseEnter={e=>e.currentTarget.style.color='#E85D6A'} onMouseLeave={e=>e.currentTarget.style.color='#707985'}>✕</button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {filtradosTabela.length===0&&(
                      <tr><td colSpan="6" className="py-8 text-center text-sm" style={{color:'#707985'}}>Nenhuma implantação encontrada.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ── CLIENTES ── */}
        {aba==='clientes'&&(
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {implantacoes.map(i=>{
              const cfg=statusConfig[i.status]||statusConfig.cancelado
              const isAtivo=i.status==='lider'||i.status==='sucesso'
              return (
                <div key={i.id} className="p-5 rounded-2xl group relative transition" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(25,184,135,0.4)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='#2A303A'}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="w-2.5 h-2.5 rounded-full mt-1" style={{backgroundColor:cfg.cor}}></span>
                    <span className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${cfg.badge}`}>{cfg.label}</span>
                  </div>
                  <p className="font-bold text-sm mb-1" style={{color:'#F1F3F5'}}>{i.cliente}</p>
                  <p className="text-xs mb-2" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>{i.cidade}</p>
                  {i.estacoes>0&&<p className="text-xs mb-2" style={{color:'#4F8CFF'}}>🖥️ {i.estacoes} estações</p>}
                  {isAtivo&&<p className="text-lg font-bold" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>R$ {parseFloat(i.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}<span className="text-xs font-normal" style={{color:'#707985'}}>/mês</span></p>}
                  {i.motivoCancelamento&&<p className="text-xs mt-2 pt-2" style={{color:'#E85D6A',borderTop:'1px solid #2A303A'}}>Motivo: {i.motivoCancelamento}</p>}
                  <button onClick={()=>editarImp(i)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition" style={{color:'#707985',fontSize:'12px'}}>✎</button>
                </div>
              )
            })}
          </div>
        )}

        {/* ── ATENDIMENTOS ── */}
        {aba==='atendimentos'&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Registro de Atendimentos</h2>
                <p className="text-sm" style={{color:'#707985'}}>{atendimentos.length} casos registrados</p>
              </div>
              <button onClick={()=>setMostrarFormAt(!mostrarFormAt)} className="text-xs font-bold px-4 py-2 rounded-lg" style={{backgroundColor:'#19B887',color:'#0F1115'}}>+ Registrar</button>
            </div>
            {mostrarFormAt&&(
              <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #19B887',borderOpacity:0.4}}>
                <h3 className="font-semibold mb-4 text-sm" style={{color:'#F1F3F5'}}>{editandoAt?'Editar atendimento':'Novo atendimento'}</h3>
                <form onSubmit={salvarAt} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle}>Tipo *</label>
                      <select value={formAt.tipo} onChange={e=>setFormAt({...formAt,tipo:e.target.value})} style={inputStyle}>
                        {tiposAtendimento.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Cliente</label>
                      <input type="text" value={formAt.cliente} onChange={e=>setFormAt({...formAt,cliente:e.target.value})} placeholder="Nome do cliente" style={inputStyle}/>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle}>Data</label>
                      <input type="date" value={formAt.data} onChange={e=>setFormAt({...formAt,data:e.target.value})} style={inputStyle}/>
                    </div>
                    <div>
                      <label style={labelStyle}>Nº do Caso (Salesforce)</label>
                      <input type="text" value={formAt.numeroCaso} onChange={e=>setFormAt({...formAt,numeroCaso:e.target.value})} placeholder="00123456" maxLength={8} style={inputStyle}/>
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Descrição</label>
                    <textarea value={formAt.descricao} onChange={e=>setFormAt({...formAt,descricao:e.target.value})} rows={2} style={{...inputStyle,resize:'none'}}/>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="text-sm font-bold px-4 py-2 rounded-lg" style={{backgroundColor:'#19B887',color:'#0F1115'}}>{editandoAt?'Salvar':'Registrar'}</button>
                    <button type="button" onClick={()=>{setMostrarFormAt(false);setEditandoAt(null);setFormAt(formAtVazio)}} className="text-sm px-4 py-2 rounded-lg" style={{color:'#707985'}}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}
            {atendimentos.length>0&&(
              <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={tiposAtendimento.map(t=>({tipo:t.split(' ').slice(0,2).join(' '),total:atendimentos.filter(a=>a.tipo===t).length})).filter(d=>d.total>0)} layout="vertical">
                    <XAxis type="number" stroke="#2A303A" tick={{fill:'#707985',fontSize:11,fontFamily:'JetBrains Mono'}}/>
                    <YAxis type="category" dataKey="tipo" stroke="#2A303A" tick={{fill:'#707985',fontSize:11}} width={130}/>
                    <Tooltip contentStyle={{backgroundColor:'#1C2028',border:'1px solid #2A303A',borderRadius:'8px',color:'#F1F3F5'}}/>
                    <Bar dataKey="total" fill="#19B887" radius={[0,4,4,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="rounded-2xl overflow-hidden" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
              {atendimentos.length===0?<p className="p-8 text-center text-sm" style={{color:'#707985'}}>Nenhum atendimento registrado ainda.</p>:
                atendimentos.map(a=>(
                  <div key={a.id} className="px-5 py-3 flex items-start justify-between group transition" style={{borderBottom:'1px solid #2A303A'}}
                    onMouseEnter={e=>e.currentTarget.style.backgroundColor='#1C2028'} onMouseLeave={e=>e.currentTarget.style.backgroundColor='transparent'}>
                    <div className="flex items-start gap-3">
                      <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{backgroundColor:'#19B887'}}></span>
                      <div>
                        <p className="text-sm font-medium" style={{color:'#F1F3F5'}}>{a.tipo}</p>
                        {a.cliente&&<p className="text-xs" style={{color:'#707985'}}>{a.cliente}</p>}
                        {a.descricao&&<p className="text-xs" style={{color:'#A8AFB9'}}>{a.descricao}</p>}
                        {a.numeroCaso&&<p className="text-xs" style={{color:'#4F8CFF',fontFamily:'JetBrains Mono'}}>Caso #{a.numeroCaso}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {a.data&&<span className="text-xs" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>{a.data}</span>}
                      <button onClick={()=>{setFormAt({tipo:a.tipo,descricao:a.descricao||'',cliente:a.cliente||'',data:a.data||'',numeroCaso:a.numeroCaso||''});setEditandoAt(a.id);setMostrarFormAt(true)}} className="opacity-0 group-hover:opacity-100 text-xs" style={{color:'#707985'}}>✎</button>
                      <button onClick={()=>removerAt(a.id)} className="opacity-0 group-hover:opacity-100 text-xs" style={{color:'#707985'}}>✕</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ── CASES ── */}
        {aba==='cases'&&(
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Cases & Projetos</h2>
                <p className="text-sm" style={{color:'#707985'}}>Customizações e soluções desenvolvidas para clientes</p>
              </div>
              <button onClick={()=>setMostrarFormCase(!mostrarFormCase)} className="text-xs font-bold px-4 py-2 rounded-lg" style={{backgroundColor:'#19B887',color:'#0F1115'}}>+ Adicionar case</button>
            </div>
            {mostrarFormCase&&(
              <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                <form onSubmit={salvarCase} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label style={labelStyle}>Título *</label><input type="text" value={formCase.titulo} onChange={e=>setFormCase({...formCase,titulo:e.target.value})} placeholder="Ex: Etiqueta automática" style={inputStyle}/></div>
                    <div><label style={labelStyle}>Cliente</label><input type="text" value={formCase.cliente} onChange={e=>setFormCase({...formCase,cliente:e.target.value})} placeholder="Ex: Atacarejo São José" style={inputStyle}/></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label style={labelStyle}>Tipo</label>
                      <select value={formCase.tipo} onChange={e=>setFormCase({...formCase,tipo:e.target.value})} style={inputStyle}>
                        {['Layout FR3','Customização de banco','Automação','Suporte técnico','Configuração fiscal','Outro'].map(t=><option key={t}>{t}</option>)}
                      </select>
                    </div>
                    <div><label style={labelStyle}>Tags (vírgula)</label><input type="text" value={formCase.tags} onChange={e=>setFormCase({...formCase,tags:e.target.value})} placeholder="FR3, Automação" style={inputStyle}/></div>
                  </div>
                  <div><label style={labelStyle}>Descrição *</label><textarea value={formCase.descricao} onChange={e=>setFormCase({...formCase,descricao:e.target.value})} rows={3} style={{...inputStyle,resize:'none'}}/></div>
                  <div><label style={labelStyle}>Impacto gerado</label><input type="text" value={formCase.impacto} onChange={e=>setFormCase({...formCase,impacto:e.target.value})} placeholder="Ex: Eliminou erro humano" style={inputStyle}/></div>
                  <div className="flex gap-2">
                    <button type="submit" className="text-sm font-bold px-4 py-2 rounded-lg" style={{backgroundColor:'#19B887',color:'#0F1115'}}>{editandoCase?'Salvar':'Adicionar'}</button>
                    <button type="button" onClick={()=>{setMostrarFormCase(false);setEditandoCase(null);setFormCase(formCaseVazio)}} className="text-sm px-4 py-2 rounded-lg" style={{color:'#707985'}}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}
            <div className="space-y-4">
              {cases.map(c=>(
                <div key={c.id} className="p-5 rounded-2xl group transition" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='rgba(25,184,135,0.4)'} onMouseLeave={e=>e.currentTarget.style.borderColor='#2A303A'}>
                  <div className="flex items-start justify-between mb-3">
                    <div><h3 className="font-bold text-base" style={{color:'#F1F3F5'}}>{c.titulo}</h3><p className="text-sm" style={{color:'#19B887'}}>{c.cliente}</p></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full" style={{backgroundColor:'#1C2028',color:'#707985',border:'1px solid #2A303A'}}>{c.tipo}</span>
                      <button onClick={()=>{setFormCase({titulo:c.titulo,cliente:c.cliente||'',tipo:c.tipo,descricao:c.descricao,impacto:c.impacto||'',tags:c.tags||''});setEditandoCase(c.id);setMostrarFormCase(true)}} className="opacity-0 group-hover:opacity-100 text-xs" style={{color:'#707985'}}>✎</button>
                      <button onClick={()=>removerCase(c.id)} className="opacity-0 group-hover:opacity-100 text-xs" style={{color:'#707985'}}>✕</button>
                    </div>
                  </div>
                  <p className="text-sm mb-3 leading-relaxed" style={{color:'#A8AFB9'}}>{c.descricao}</p>
                  {c.impacto&&<div className="flex items-start gap-2 p-3 rounded-xl mb-3" style={{backgroundColor:'rgba(25,184,135,0.05)',border:'1px solid rgba(25,184,135,0.15)'}}><span style={{color:'#19B887',fontSize:'12px'}}>▸</span><p className="text-xs" style={{color:'#19B887'}}>{c.impacto}</p></div>}
                  {c.tags&&<div className="flex gap-2 flex-wrap">{c.tags.split(',').map(t=><span key={t} className="text-xs px-2 py-0.5 rounded" style={{backgroundColor:'#1C2028',color:'#707985',border:'1px solid #2A303A'}}>{t.trim()}</span>)}</div>}
                </div>
              ))}
              {cases.length===0&&<div className="p-8 rounded-2xl text-center" style={{backgroundColor:'#171A21',border:'1px dashed #2A303A'}}><p className="text-sm" style={{color:'#707985'}}>Nenhum case registrado ainda</p></div>}
            </div>
          </div>
        )}

        {/* ── CARREIRA ── */}
        {aba==='carreira'&&(
          <div className="space-y-4">
            <div className="mb-6"><h2 className="text-lg font-bold" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Trajetória na Ganso Sistemas</h2><p className="text-sm" style={{color:'#707985'}}>Promoção em menos de 9 meses de empresa</p></div>
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-px" style={{backgroundColor:'#2A303A'}}></div>
              <div className="space-y-6">
                {timelineInicial.map((item,idx)=>(
                  <div key={idx} className="relative pl-16">
                    <div className={`absolute left-4 top-1 w-4 h-4 rounded-full border-2`} style={{backgroundColor:item.atual?'#19B887':'#2A303A',borderColor:item.atual?'#19B887':'#707985'}}></div>
                    {item.atual&&<div className="absolute left-4 top-1 w-4 h-4 rounded-full animate-ping opacity-30" style={{backgroundColor:'#19B887'}}></div>}
                    <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:`1px solid ${item.atual?'rgba(25,184,135,0.4)':'#2A303A'}`}}>
                      <div className="flex items-start justify-between mb-2">
                        <div><h3 className="font-bold text-base" style={{color:'#F1F3F5'}}>{item.cargo}</h3><p className="text-sm" style={{color:'#19B887'}}>{item.empresa}</p></div>
                        <div className="text-right">
                          <p className="text-xs" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>{item.inicio} — {item.fim??'atual'}</p>
                          {item.atual&&<span className="text-xs px-2 py-0.5 rounded-full" style={{backgroundColor:'rgba(25,184,135,0.1)',color:'#19B887',border:'1px solid rgba(25,184,135,0.3)'}}>atual</span>}
                        </div>
                      </div>
                      <p className="text-sm mb-4" style={{color:'#A8AFB9'}}>{item.descricao}</p>
                      <div className="space-y-1.5">
                        {item.marcos.map((m,i)=>(
                          <div key={i} className="flex items-start gap-2">
                            <span style={{color:'#19B887',flexShrink:0}}>▸</span>
                            <p className="text-xs" style={{color:'#A8AFB9'}}>{m}</p>
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

        {/* ── HABILIDADES ── */}
        {aba==='habilidades'&&(
          <div className="space-y-6">
            <div><h2 className="text-lg font-bold" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Habilidades Técnicas</h2><p className="text-sm" style={{color:'#707985'}}>Clique para editar</p></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {habilidades.map((cat,catIdx)=>(
                <div key={catIdx} className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{cat.icone}</span>
                    <h3 className="font-semibold text-sm" style={{color:'#A8AFB9'}}>{cat.categoria}</h3>
                  </div>
                  <div className="space-y-4">
                    {cat.itens.map((item,itemIdx)=>(
                      <div key={itemIdx} className="group">
                        {editandoHabilidade?.catIdx===catIdx&&editandoHabilidade?.itemIdx===itemIdx?(
                          <div className="space-y-2 p-3 rounded-xl" style={{backgroundColor:'#1C2028'}}>
                            <p className="text-xs font-medium" style={{color:'#707985'}}>{item.nome}</p>
                            <div className="flex items-center gap-2">
                              <input type="range" min="0" max="100" value={formHabilidade.nivel} onChange={e=>setFormHabilidade({...formHabilidade,nivel:e.target.value})} className="flex-1"/>
                              <span className="text-xs font-bold w-8" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>{formHabilidade.nivel}%</span>
                            </div>
                            <input type="text" value={formHabilidade.descricao} onChange={e=>setFormHabilidade({...formHabilidade,descricao:e.target.value})} style={{...inputStyle,fontSize:'11px',padding:'6px 10px'}}/>
                            <div className="flex gap-2">
                              <button onClick={salvarHab} className="text-xs px-3 py-1 rounded-lg font-bold" style={{backgroundColor:'#19B887',color:'#0F1115'}}>Salvar</button>
                              <button onClick={()=>setEditandoHabilidade(null)} className="text-xs px-3 py-1 rounded-lg" style={{color:'#707985'}}>Cancelar</button>
                            </div>
                          </div>
                        ):(
                          <div className="cursor-pointer" onClick={()=>{setFormHabilidade({nivel:item.nivel,descricao:item.descricao});setEditandoHabilidade({catIdx,itemIdx})}}>
                            <div className="flex justify-between items-center mb-1">
                              <p className="text-sm font-medium" style={{color:'#A8AFB9'}}>{item.nome}</p>
                              <span className="text-xs font-semibold" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>{item.nivel}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{backgroundColor:'#1C2028'}}>
                              <div className="h-1.5 rounded-full" style={{width:`${item.nivel}%`,backgroundColor:'#19B887'}}/>
                            </div>
                            <p className="text-xs mt-1" style={{color:'#707985'}}>{item.descricao}</p>
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

        {/* ── RESUMO EXECUTIVO ── */}
        {aba==='resumo'&&(
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-lg font-bold" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Resumo Executivo</h2><p className="text-sm" style={{color:'#707985'}}>Dossiê profissional para avaliação de desempenho</p></div>
              <button onClick={()=>window.print()} className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg" style={{backgroundColor:'#19B887',color:'#0F1115'}}>↓ Exportar PDF</button>
            </div>
            <div className="space-y-6">
              <div className="p-8 rounded-2xl" style={{background:'linear-gradient(135deg, rgba(25,184,135,0.15) 0%, rgba(23,26,33,1) 60%)',border:'1px solid rgba(25,184,135,0.3)'}}>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                    <span className="text-3xl font-black" style={{color:'#19B887',fontFamily:'Space Grotesk'}}>NN</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>Nycolas Neves</h1>
                    <p className="font-semibold text-lg mt-1" style={{color:'#19B887'}}>Assistente de Implantação II</p>
                    <p className="text-sm mt-1" style={{color:'#A8AFB9'}}>Ganso Sistemas · Campo Grande, MS</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{backgroundColor:'#19B887'}}></span>
                      <span className="text-xs" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>Mai/2025 — presente · 1 ano e 4 meses</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{v:lideres,l:'Implantações como\nAnalista Líder',c:'#19B887'},{v:auxiliares,l:'Implantações como\nAnalista Auxiliar',c:'#4F8CFF'},{v:`R$${(receitaTotal/1000).toFixed(1)}k`,l:'Receita mensal\ngerada',c:'#19B887'},{v:`${taxa}%`,l:'Taxa de\naproveitamento',c:'#19B887'}].map((m,i)=>(
                  <div key={i} className="p-5 rounded-2xl text-center" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                    <p className="text-4xl font-bold" style={{color:m.c,fontFamily:'JetBrains Mono'}}>{m.v}</p>
                    <p className="text-xs mt-2 whitespace-pre-line" style={{color:'#707985'}}>{m.l}</p>
                  </div>
                ))}
              </div>
              <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                <h3 className="font-semibold mb-4 text-sm" style={{color:'#A8AFB9'}}>Trajetória na empresa</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 p-4 rounded-xl" style={{backgroundColor:'#1C2028',border:'1px solid #2A303A'}}>
                    <p className="text-xs mb-1" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>Mai 2025 — Jan 2026</p>
                    <p className="font-semibold text-sm" style={{color:'#F1F3F5'}}>Auxiliar de Implantação</p>
                  </div>
                  <span style={{color:'#19B887',fontSize:'20px',fontWeight:'bold'}}>→</span>
                  <div className="flex-1 p-4 rounded-xl" style={{backgroundColor:'rgba(25,184,135,0.05)',border:'1px solid rgba(25,184,135,0.3)'}}>
                    <p className="text-xs mb-1" style={{color:'#19B887',fontFamily:'JetBrains Mono'}}>Fev 2026 — atual</p>
                    <p className="font-semibold text-sm" style={{color:'#19B887'}}>Assistente de Implantação II</p>
                    <p className="text-xs" style={{color:'#707985'}}>Promoção em menos de 9 meses</p>
                  </div>
                </div>
              </div>
              {cases.length>0&&(
                <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                  <h3 className="font-semibold mb-4 text-sm" style={{color:'#A8AFB9'}}>Cases & Projetos desenvolvidos</h3>
                  <div className="space-y-3">
                    {cases.slice(0,3).map((c,i)=>(
                      <div key={i} className="flex items-start gap-3 pb-3" style={{borderBottom:'1px solid #2A303A'}}>
                        <span style={{color:'#19B887',fontWeight:'bold',flexShrink:0}}>▸</span>
                        <div><p className="text-sm font-semibold" style={{color:'#F1F3F5'}}>{c.titulo}</p><p className="text-xs" style={{color:'#19B887'}}>{c.cliente} · {c.tipo}</p>{c.impacto&&<p className="text-xs" style={{color:'#707985'}}>{c.impacto}</p>}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="p-5 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
                <h3 className="font-semibold mb-4 text-sm" style={{color:'#A8AFB9'}}>Clientes implantados</h3>
                <div className="grid grid-cols-2 gap-2">
                  {implantacoes.filter(i=>i.status==='lider'||i.status==='sucesso').map((i,idx)=>(
                    <div key={idx} className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{backgroundColor:'#19B887'}}></span><p className="text-xs" style={{color:'#A8AFB9'}}>{i.cliente}</p></div>
                  ))}
                </div>
              </div>
              <div className="text-center py-4" style={{borderTop:'1px solid #2A303A'}}>
                <p className="text-xs" style={{color:'#707985',fontFamily:'JetBrains Mono'}}>Portfólio gerado em {new Date().toLocaleDateString('pt-BR')} · Nycolas Neves · Ganso Sistemas</p>
              </div>
            </div>
          </div>
        )}

        {/* ── ADICIONAR / EDITAR ── */}
        {aba==='adicionar'&&(
          <div className="max-w-lg">
            <div className="p-6 rounded-2xl" style={{backgroundColor:'#171A21',border:'1px solid #2A303A'}}>
              <h2 className="font-semibold mb-5" style={{color:'#F1F3F5',fontFamily:'Space Grotesk'}}>{editandoImp?'Editar implantação':'Nova implantação'}</h2>
              <form onSubmit={salvarImp} className="space-y-4">
                <div><label style={labelStyle}>Nome do cliente *</label><input type="text" value={form.cliente} onChange={e=>setForm({...form,cliente:e.target.value})} placeholder="Ex: Supermercado XYZ" style={inputStyle}/></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label style={labelStyle}>Valor mensal (R$)</label><input type="number" value={form.valor} onChange={e=>setForm({...form,valor:e.target.value})} placeholder="0,00" style={inputStyle}/></div>
                  <div><label style={labelStyle}>Estações</label><input type="number" value={form.estacoes} onChange={e=>setForm({...form,estacoes:e.target.value})} placeholder="Nº de PCs" style={inputStyle}/></div>
                </div>
                <div>
                  <label style={labelStyle}>Status *</label>
                  <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inputStyle}>
                    <option value="lider">Ativa - Analista Líder</option>
                    <option value="auxiliar">Ativa - Analista Auxiliar</option>
                    <option value="cancelado">Cancelada</option>
                  </select>
                </div>
                {form.status==='cancelado'&&<div><label style={labelStyle}>Motivo do cancelamento</label><input type="text" value={form.motivoCancelamento} onChange={e=>setForm({...form,motivoCancelamento:e.target.value})} placeholder="Ex: dificuldade financeira..." style={inputStyle}/></div>}
                <div><label style={labelStyle}>Cidade</label><input type="text" value={form.cidade} onChange={e=>setForm({...form,cidade:e.target.value})} placeholder="Ex: Campo Grande - MS" style={inputStyle}/></div>
                <div><label style={labelStyle}>Observação (opcional)</label><textarea value={form.observacao} onChange={e=>setForm({...form,observacao:e.target.value})} rows={3} style={{...inputStyle,resize:'none'}}/></div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 font-bold py-2.5 rounded-xl text-sm" style={{backgroundColor:'#19B887',color:'#0F1115'}}>{editandoImp?'Salvar alterações':'Adicionar implantação'}</button>
                  {editandoImp&&<button type="button" onClick={()=>{setEditandoImp(null);setForm(formImpVazio)}} className="px-4 text-sm rounded-xl" style={{color:'#707985',border:'1px solid #2A303A'}}>Cancelar</button>}
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @media print {
          header, nav { display: none !important; }
          body { background: white !important; color: black !important; }
        }
      `}</style>
    </div>
  )
}
