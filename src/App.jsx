import { useState } from 'react'

const implantacoes = [
  { id: 1, cliente: 'Top Lar Depósito e Utilidades', valor: 853.30, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { id: 2, cliente: 'Supermercado Serve Bem', valor: 3391.60, cidade: 'Sidrolândia - MS', status: 'sucesso' },
  { id: 3, cliente: 'Supermercado Beija Flor', valor: 1268.60, cidade: 'Patrocínio - MG', status: 'sucesso' },
  { id: 4, cliente: 'Mercado Santa Edwiges', valor: 763.80, cidade: 'Presidente Prudente - SP', status: 'sucesso' },
  { id: 5, cliente: 'Mercearia Santa Helena', valor: 966.00, cidade: 'Presidente Prudente - SP', status: 'sucesso' },
  { id: 6, cliente: 'Casa Mix Chapadão do Sul', valor: 660.60, cidade: 'Chapadão do Sul - MS', status: 'sucesso' },
  { id: 7, cliente: "D'Car Pioneiros - Matriz", valor: 1378.45, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { id: 8, cliente: 'Tucho Auto Peças', valor: 421.60, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { id: 9, cliente: 'Atacarejo São José', valor: 2544.95, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { id: 10, cliente: 'GR8 Distribuidora de Peças', valor: 1137.00, cidade: 'Campo Grande - MS', status: 'sucesso' },
]

export default function App() {
  const [aba, setAba] = useState('visao-geral')
  const [busca, setBusca] = useState('')

  const total = implantacoes.length
  const sucesso = implantacoes.filter(i => i.status === 'sucesso').length
  const falha = implantacoes.filter(i => i.status === 'falha').length
  const taxa = Math.round((sucesso / total) * 100)
  const receitaTotal = implantacoes.reduce((acc, i) => acc + i.valor, 0)

  const filtradas = implantacoes.filter(i =>
    i.cliente.toLowerCase().includes(busca.toLowerCase()) ||
    i.cidade.toLowerCase().includes(busca.toLowerCase())
  )

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

        {/* Conteúdo */}
        {aba === 'visao-geral' && (
          <div className="space-y-6">
            {/* Barra de progresso */}
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-400">Taxa de aproveitamento</span>
                <span className="text-emerald-400 font-bold">{taxa}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-3">
                <div
                  className="bg-emerald-400 h-3 rounded-full transition-all"
                  style={{ width: `${taxa}%` }}
                />
              </div>
            </div>

            {/* Lista resumida */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="font-semibold">Implantações por cliente</h2>
              </div>
              {implantacoes.map(i => (
                <div key={i.id} className="px-5 py-3 border-b border-gray-800 flex items-center justify-between hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                    <div>
                      <p className="text-sm font-medium">{i.cliente}</p>
                      <p className="text-xs text-gray-500">{i.cidade}</p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-emerald-400">
                    R$ {i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {aba === 'clientes' && (
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
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0"></span>
                    <span className="text-xs bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full">Ativo</span>
                  </div>
                  <p className="font-semibold text-sm mb-1">{i.cliente}</p>
                  <p className="text-xs text-gray-500 mb-3">{i.cidade}</p>
                  <p className="text-lg font-bold text-emerald-400">
                    R$ {i.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-gray-500 font-normal">/mês</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}