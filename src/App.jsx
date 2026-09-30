import { useState, useEffect } from 'react'
import { db } from './firebase'
import { collection, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'

export default function App() {
  const [implantacoes, setImplantacoes] = useState([])
  const [aba, setAba] = useState('visao-geral')
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ cliente: '', valor: '', cidade: '', status: 'sucesso', observacao: '' })

  // Carrega dados em tempo real do Firestore
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
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
        {/* Cards de métricas */}
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
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {[
            { id: 'visao-geral', label: 'Visão Geral' },
            { id: 'clientes', label: 'Clientes' },
            { id: 'adicionar', label: '+ Adicionar' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                aba === tab.id
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20 text-gray-500">Carregando dados...</div>
        )}

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
                <div className="px-5 py-8 text-center text-gray-500 text-sm">
                  Nenhuma implantação registrada. Clique em "+ Adicionar" para começar.
                </div>
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
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${i.status === 'sucesso' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === 'sucesso' ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                      {i.status === 'sucesso' ? 'Ativo' : 'Inativo'}
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

        {/* Adicionar */}
        {aba === 'adicionar' && (
          <div className="max-w-lg">
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="font-semibold mb-5">Nova implantação</h2>
              <form onSubmit={handleAdicionar} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nome do cliente *</label>
                  <input
                    type="text"
                    value={form.cliente}
                    onChange={e => setForm({...form, cliente: e.target.value})}
                    placeholder="Ex: Supermercado XYZ"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Valor mensal (R$) *</label>
                    <input
                      type="number"
                      value={form.valor}
                      onChange={e => setForm({...form, valor: e.target.value})}
                      placeholder="0,00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Resultado</label>
                    <select
                      value={form.status}
                      onChange={e => setForm({...form, status: e.target.value})}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="sucesso">Bem-sucedida</option>
                      <option value="falha">Malsucedida</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Cidade</label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={e => setForm({...form, cidade: e.target.value})}
                    placeholder="Ex: Campo Grande - MS"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Observação (opcional)</label>
                  <textarea
                    value={form.observacao}
                    onChange={e => setForm({...form, observacao: e.target.value})}
                    placeholder="Ex: cliente do setor alimentício, integração com balança..."
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition-colors"
                >
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