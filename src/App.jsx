import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

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
    descricao: 'Promoção após menos de 1 ano de empresa. Responsável por implantações completas, customização de relatórios FR3, administração de banco Firebird e suporte técnico avançado.',
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
    categoria: 'Banco de Dados',
    icone: '🗄️',
    itens: [
      { nome: 'Firebird 2.5', nivel: 85, descricao: 'Administração via IBExpert, consultas SQL, diagnóstico e correção de inconsistências' },
      { nome: 'IBExpert', nivel: 80, descricao: 'Ferramenta principal para gestão e análise do banco de dados dos clientes' },
    ]
  },
  {
    categoria: 'Relatórios & Layouts',
    icone: '📊',
    itens: [
      { nome: 'FastReport 3 (FR3)', nivel: 82, descricao: 'Personalização e confecção de relatórios sob demanda para clientes' },
      { nome: 'Layouts personalizados', nivel: 80, descricao: 'NF-e, boletos, cupons, pedidos e outros documentos fiscais' },
    ]
  },
  {
    categoria: 'ERP Ganso',
    icone: '⚙️',
    itens: [
      { nome: 'Instalação & Configuração', nivel: 90, descricao: 'Deploy completo do sistema em ambiente do cliente, incluindo rede e periféricos' },
      { nome: 'Estrutura do sistema', nivel: 85, descricao: 'Conhecimento sobre DLLs, pastas, dependências e arquitetura do Ganso ERP' },
      { nome: 'Correção de bugs', nivel: 83, descricao: 'Diagnóstico e resolução de erros de sistema, DLLs ausentes e falhas de instalação' },
      { nome: 'GansoPDV', nivel: 80, descricao: 'Configuração e suporte ao módulo de frente de caixa' },
    ]
  },
  {
    categoria: 'Fiscal & Tributário',
    icone: '📋',
    itens: [
      { nome: 'NF-e / SEFAZ', nivel: 78, descricao: 'Configuração de emissão de nota fiscal eletrônica e integração com SEFAZ' },
      { nome: 'CSOSN / PMZ / DAS', nivel: 75, descricao: 'Configuração tributária para regimes Simples Nacional e outros' },
      { nome: 'Boleto & Financeiro', nivel: 75, descricao: 'Configuração de carteiras de cobrança e integração bancária' },
    ]
  },
  {
    categoria: 'Desenvolvimento',
    icone: '💻',
    itens: [
      { nome: 'React + Vite', nivel: 65, descricao: 'Desenvolvimento deste portal — aprendizado em andamento' },
      { nome: 'JavaScript', nivel: 60, descricao: 'Lógica de frontend, manipulação de dados e integrações' },
      { nome: 'Firebase / Firestore', nivel: 62, descricao: 'Banco de dados em tempo real e autenticação' },
      { nome: 'Git & GitHub', nivel: 58, descricao: 'Versionamento de código e deploy via Vercel' },
    ]
  },
]

export default function App() {
  const [implantacoes, setImplantacoes] = useState([])
  const [aba, setAba] = useState('visao-geral')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ cliente: '', valor: '', cidade: '', status: 'sucesso', observacao: '' })

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'implantacoes'), (snap) => {
      const dados = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setImplantacoes(dados)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const total = implantacoes.length
  const sucesso = implantacoes.filter(i => i.status === 'sucesso').length
  const falha = implantacoes.filter(i => i.status === 'falha').length
  const taxa = total > 0 ? Math.round((sucesso / total) * 100) : 0
  const receitaTotal = implantacoes.reduce((acc, i) => acc + (parseFloat(i.valor) || 0), 0)
  const filtradas = implantacoes.filter(i =>
    i.cliente?.toLowerCase().includes(busca.toLowerCase()) ||
    i.cidade?.toLowerCase().includes(busca.toLowerCase())
  )

  const handleAdicionar = async (e) => {
    e.preventDefault()
    if (!form.cliente || !form.valor) return
    await addDoc(collection(db, 'implantacoes'), {
      ...form,
      valor: parseFloat(form.valor),
      criadoEm: serverTimestamp()
    })
    setForm({ cliente: '', valor: '', cidade: '', status: 'sucesso', observacao: '' })
    setAba('visao-geral')
  }

  const handleRemover = async (id) => {
    await deleteDoc(doc(db, 'implantacoes', id))
  }

  const abas = [
    { id: 'visao-geral', label: 'Visão Geral' },
    { id: 'clientes', label: 'Clientes' },
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
          <p className="text-xs text-gray-400">Receita gerada</p>
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
            <p className="text-xs text-gray-400 mb-1">Bem-sucedidas</p>
            <p className="text-3xl font-bold text-emerald-400">{sucesso}</p>
            <p className="text-xs text-gray-500 mt-1">clientes ativos</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-400 mb-1">Malsucedidas</p>
            <p className="text-3xl font-bold text-red-400">{falha}</p>
            <p className="text-xs text-gray-500 mt-1">ocorrências</p>
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
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                aba === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && <div className="text-center py-20 text-gray-500">Carregando dados...</div>}

        {/* Visão Geral */}
        {!loading && aba === 'visao-geral' && (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-400">Taxa de aproveitamento</span>
                <span className="text-emerald-400 font-bold">{taxa}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div className="bg-emerald-400 h-3 rounded-full transition-all" style={{ width: `${taxa}%` }} />
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="font-semibold">Implantações por cliente</h2>
              </div>
              {implantacoes.length === 0 && (
                <div className="px-5 py-8 text-center text-gray-500 text-sm">Nenhuma implantação registrada.</div>
              )}
              {implantacoes.map(i => (
                <div key={i.id} className="px-5 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-800 transition-colors group">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${i.status === 'sucesso' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <div>
                      <p className="text-sm font-medium">{i.cliente}</p>
                      <p className="text-xs text-gray-500">{i.cidade}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-emerald-400">
                      R$ {parseFloat(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                    </p>
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
            <input
              type="text"
              placeholder="Buscar cliente ou cidade..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtradas.map(i => (
                <div key={i.id} className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-emerald-800 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`w-2 h-2 rounded-full mt-1.5 ${i.status === 'sucesso' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'sucesso' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                      {i.status === 'sucesso' ? 'Ativo' : 'Encerrado'}
                    </span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{i.cliente}</p>
                  <p className="text-xs text-gray-500 mb-3">{i.cidade}</p>
                  <p className="text-lg font-bold text-emerald-400">
                    R$ {parseFloat(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-gray-500 font-normal">/mês</span>
                  </p>
                  {i.observacao && <p className="text-xs text-gray-500 mt-2 border-t border-gray-800 pt-2">{i.observacao}</p>}
                </div>
              ))}
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
                    {item.atual && (
                      <div className="absolute left-4 top-1 w-4 h-4 rounded-full bg-emerald-400 animate-ping opacity-30"></div>
                    )}
                    <div className={`bg-gray-900 rounded-xl p-5 border ${item.atual ? 'border-emerald-800' : 'border-gray-800'}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-base">{item.cargo}</h3>
                          <p className="text-sm text-emerald-400">{item.empresa}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{item.inicio} — {item.fim ?? 'atual'}</p>
                          {item.atual && (
                            <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full mt-1 inline-block">atual</span>
                          )}
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
                          <div
                            className="bg-emerald-400 h-1.5 rounded-full transition-all"
                            style={{ width: `${item.nivel}%` }}
                          />
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
                    <label className="text-xs text-gray-400 mb-1 block">Valor mensal (R$) *</label>
                    <input type="number" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})}
                      placeholder="0,00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Resultado</label>
                    <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500">
                      <option value="sucesso">Bem-sucedida</option>
                      <option value="falha">Malsucedida</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Cidade</label>
                  <input type="text" value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})}
                    placeholder="Ex: Campo Grande - MS"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Observação (opcional)</label>
                  <textarea value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})}
                    placeholder="Ex: cliente do setor alimentício, integração com balança..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none" />
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