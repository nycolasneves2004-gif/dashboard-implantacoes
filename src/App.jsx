import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'

const timeline = [
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

const habilidades = [
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

const casesIniciais = [
  {
    id: 1,
    titulo: 'Etiqueta Automática com Detecção de Promoção',
    cliente: 'Atacarejo São José',
    tipo: 'Layout FR3',
    descricao: 'Desenvolvimento de layout de etiqueta inteligente que, ao passar o código de barras no leitor, identifica automaticamente se o produto está em promoção e imprime no modelo de etiqueta correto — preço normal ou preço promocional — sem intervenção manual do operador.',
    impacto: 'Eliminou erro humano na impressão de etiquetas e acelerou o processo no estoque',
    tags: ['FR3', 'Automação', 'Varejo'],
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

export default function App() {
  const [implantacoes, setImplantacoes] = useState([])
  const [atendimentos, setAtendimentos] = useState([])
  const [aba, setAba] = useState('visao-geral')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ cliente: '', valor: '', cidade: '', status: 'sucesso', observacao: '', motivoCancelamento: '' })
  const [formAtendimento, setFormAtendimento] = useState({ tipo: tiposAtendimento[0], descricao: '', cliente: '', mes: '' })
  const [mostrarFormAtendimento, setMostrarFormAtendimento] = useState(false)

  useEffect(() => {
    const unsub1 = onSnapshot(collection(db, 'implantacoes'), (snap) => {
      setImplantacoes(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    const unsub2 = onSnapshot(collection(db, 'atendimentos'), (snap) => {
      setAtendimentos(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => { unsub1(); unsub2() }
  }, [])

  const total = implantacoes.length
  const sucesso = implantacoes.filter(i => i.status === 'sucesso').length
  const falha = implantacoes.filter(i => i.status === 'falha').length
  const canceladas = implantacoes.filter(i => i.status === 'cancelado').length
  const taxa = total > 0 ? Math.round((sucesso / total) * 100) : 0
  const receitaTotal = implantacoes.filter(i => i.status === 'sucesso').reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0)

  const filtradas = implantacoes.filter(i =>
    i.cliente?.toLowerCase().includes(busca.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(busca.toLowerCase())
  )

  // Dados para gráfico de pizza
  const dadosPizza = [
    { name: 'Ativas', value: sucesso, color: '#34d399' },
    { name: 'Canceladas', value: canceladas, color: '#f87171' },
    { name: 'Malsucedidas', value: falha, color: '#fb923c' },
  ].filter(d => d.value > 0)

  // Dados para gráfico de atendimentos por tipo
  const dadosAtendimentos = tiposAtendimento.map(tipo => ({
    tipo: tipo.split(' ').slice(0, 2).join(' '),
    total: atendimentos.filter(a => a.tipo === tipo).length,
  })).filter(d => d.total > 0)

  const handleAdicionar = async (e) => {
    e.preventDefault()
    if (!form.cliente || !form.valor) return
    await addDoc(collection(db, 'implantacoes'), {
      ...form,
      valor: parseFloat(form.valor),
      criadoEm: serverTimestamp()
    })
    setForm({ cliente: '', valor: '', cidade: '', status: 'sucesso', observacao: '', motivoCancelamento: '' })
    setAba('visao-geral')
  }

  const handleAdicionarAtendimento = async (e) => {
    e.preventDefault()
    if (!formAtendimento.tipo) return
    await addDoc(collection(db, 'atendimentos'), {
      ...formAtendimento,
      criadoEm: serverTimestamp()
    })
    setFormAtendimento({ tipo: tiposAtendimento[0], descricao: '', cliente: '', mes: '' })
    setMostrarFormAtendimento(false)
  }

  const handleRemover = async (id) => {
    if (confirm('Remover esta implantação?')) await deleteDoc(doc(db, 'implantacoes', id))
  }

  const handleRemoverAtendimento = async (id) => {
    if (confirm('Remover este atendimento?')) await deleteDoc(doc(db, 'atendimentos', id))
  }

  const abas = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'atendimentos', label: 'Atendimentos' },
    { id: 'cases', label: 'Cases' },
    { id: 'carreira', label: 'Carreira' },
    { id: 'habilidades', label: 'Habilidades' },
    { id: 'adicionar', label: '+ Adicionar' },
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
        {/* Métricas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Total</p>
            <p className="text-3xl font-bold">{total}</p>
            <p className="text-xs text-gray-500 mt-1">implantações</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Ativas</p>
            <p className="text-3xl font-bold text-emerald-400">{sucesso}</p>
            <p className="text-xs text-gray-500 mt-1">clientes ativos</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Canceladas</p>
            <p className="text-3xl font-bold text-red-400">{canceladas}</p>
            <p className="text-xs text-gray-500 mt-1">pós-implantação</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-emerald-800 bg-emerald-950">
            <p className="text-xs text-emerald-400 mb-1">Taxa de sucesso</p>
            <p className="text-3xl font-bold text-emerald-400">{taxa}%</p>
            <p className="text-xs text-emerald-600 mt-1">aproveitamento</p>
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
              {/* Pizza */}
              <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                <h3 className="font-semibold mb-4 text-sm text-gray-300">Status das implantações</h3>
                {dadosPizza.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dadosPizza} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name}: ${value}`}>
                        {dadosPizza.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-8">Sem dados</p>
                )}
              </div>

              {/* Taxa */}
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
                    <p className="text-emerald-400 font-bold text-xl">{sucesso}</p>
                    <p className="text-xs text-gray-500">ativas</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-red-400 font-bold text-xl">{canceladas}</p>
                    <p className="text-xs text-gray-500">canceladas</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-orange-400 font-bold text-xl">{falha}</p>
                    <p className="text-xs text-gray-500">falhas</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="font-semibold">Todas as implantações</h2>
              </div>
              {implantacoes.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">Nenhuma implantação registrada.</div>
              )}
              {implantacoes.map(i => (
                <div key={i.id} className="px-5 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i.status === 'sucesso' ? 'bg-emerald-400' : i.status === 'cancelado' ? 'bg-red-400' : 'bg-orange-400'}`}></span>
                    <div>
                      <p className="text-sm font-medium">{i.cliente}</p>
                      <p className="text-xs text-gray-500">{i.cidade}{i.motivoCancelamento ? ` · ${i.motivoCancelamento}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      i.status === 'sucesso' ? 'bg-emerald-950 text-emerald-400' :
                      i.status === 'cancelado' ? 'bg-red-950 text-red-400' : 'bg-orange-950 text-orange-400'
                    }`}>
                      {i.status === 'sucesso' ? 'Ativa' : i.status === 'cancelado' ? 'Cancelada' : 'Falha'}
                    </span>
                    {i.status === 'sucesso' && (
                      <p className="text-sm font-semibold text-emerald-400">
                        R$ {parseFloat(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </p>
                    )}
                    <button onClick={() => handleRemover(i.id)} className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs">✕</button>
                  </div>
                </div>
              ))}
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
              {filtradas.map(i => (
                <div key={i.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-emerald-800 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${i.status === 'sucesso' ? 'bg-emerald-400' : i.status === 'cancelado' ? 'bg-red-400' : 'bg-orange-400'}`}></span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'sucesso' ? 'bg-emerald-950 text-emerald-400' : i.status === 'cancelado' ? 'bg-red-950 text-red-400' : 'bg-orange-950 text-orange-400'}`}>
                      {i.status === 'sucesso' ? 'Ativa' : i.status === 'cancelado' ? 'Cancelada' : 'Falha'}
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{i.cliente}</p>
                  <p className="text-xs text-gray-500 mb-2">{i.cidade}</p>
                  {i.status === 'sucesso' && (
                    <p className="text-lg font-bold text-emerald-400">
                      R$ {parseFloat(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      <span className="text-xs text-gray-500 font-normal">/mês</span>
                    </p>
                  )}
                  {i.motivoCancelamento && <p className="text-xs text-red-400 mt-2 border-t border-gray-800 pt-2">Motivo: {i.motivoCancelamento}</p>}
                  {i.observacao && <p className="text-xs text-gray-500 mt-1">{i.observacao}</p>}
                </div>
              ))}
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
              <button onClick={() => setMostrarFormAtendimento(!mostrarFormAtendimento)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Registrar
              </button>
            </div>

            {mostrarFormAtendimento && (
              <div className="bg-gray-900 rounded-xl p-5 border border-emerald-800">
                <h3 className="font-semibold mb-4 text-sm">Novo atendimento</h3>
                <form onSubmit={handleAdicionarAtendimento} className="space-y-3">
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
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Mês de referência</label>
                    <input type="month" value={formAtendimento.mes} onChange={e => setFormAtendimento({...formAtendimento, mes: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Descrição</label>
                    <textarea value={formAtendimento.descricao} onChange={e => setFormAtendimento({...formAtendimento, descricao: e.target.value})}
                      placeholder="Descreva o caso brevemente..."
                      rows={2} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">Salvar</button>
                    <button type="button" onClick={() => setMostrarFormAtendimento(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2 rounded-lg transition-colors">Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            {/* Gráfico de atendimentos */}
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

            {/* Lista de atendimentos */}
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
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.mes && <span className="text-xs text-gray-500">{a.mes}</span>}
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
            <div>
              <h2 className="text-lg font-bold mb-1">Cases & Projetos</h2>
              <p className="text-sm text-gray-400">Customizações e soluções desenvolvidas para clientes</p>
            </div>
            <div className="space-y-4">
              {casesIniciais.map((c) => (
                <div key={c.id} className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-emerald-800 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-base mb-0.5">{c.titulo}</h3>
                      <p className="text-sm text-emerald-400">{c.cliente}</p>
                    </div>
                    <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full flex-shrink-0">{c.tipo}</span>
                  </div>
                  <p className="text-sm text-gray-300 mb-3 leading-relaxed">{c.descricao}</p>
                  <div className="flex items-start gap-2 bg-emerald-950 rounded-lg p-3 mb-3">
                    <span className="text-emerald-400 text-xs mt-0.5">▸</span>
                    <p className="text-xs text-emerald-300">{c.impacto}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {c.tags.map(tag => (
                      <span key={tag} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="bg-gray-900 rounded-xl p-5 border border-dashed border-gray-700 text-center">
                <p className="text-gray-500 text-sm">Mais cases serão adicionados em breve</p>
                <p className="text-gray-600 text-xs mt-1">Layouts FR3, customizações de banco, automações</p>
              </div>
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
                {timeline.map((item, idx) => (
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
              <p className="text-sm text-gray-400">Competências desenvolvidas na prática com clientes reais</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {habilidades.map((cat, idx) => (
                <div key={idx} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{cat.icone}</span>
                    <h3 className="font-semibold text-sm text-gray-300">{cat.categoria}</h3>
                  </div>
                  <div className="space-y-4">
                    {cat.itens.map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-sm font-medium">{item.nome}</p>
                          <span className="text-xs text-emerald-400 font-semibold">{item.nivel}%</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-1">
                          <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${item.nivel}%` }} />
                        </div>
                        <p className="text-xs text-gray-500">{item.descricao}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Adicionar */}
        {aba === 'adicionar' && (
          <div className="max-w-lg">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="font-semibold mb-5">Nova implantação</h2>
              <form onSubmit={handleAdicionar} className="space-y-4">
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
                    <label className="text-xs text-gray-400 mb-1 block">Status *</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                      <option value="sucesso">Ativa</option>
                      <option value="cancelado">Cancelada</option>
                      <option value="falha">Malsucedida</option>
                    </select>
                  </div>
                </div>
                {form.status === 'cancelado' && (
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Motivo do cancelamento</label>
                    <input type="text" value={form.motivoCancelamento} onChange={e => setForm({...form, motivoCancelamento: e.target.value})}
                      placeholder="Ex: dificuldade financeira do cliente"
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
                <button type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  Adicionar implantação
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}