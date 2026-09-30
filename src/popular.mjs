import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'

const config = {
  apiKey: 'AIzaSyDODHtXWZ_kj50X_EWowuOv5c46rJCv_qY',
  authDomain: 'dashboard-implantacoes.firebaseapp.com',
  projectId: 'dashboard-implantacoes',
}

const app = initializeApp(config)
const db = getFirestore(app)

const dados = [
  { cliente: 'Top Lar Depósito e Utilidades', valor: 853.30, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { cliente: 'Supermercado Serve Bem', valor: 3391.60, cidade: 'Sidrolândia - MS', status: 'sucesso' },
  { cliente: 'Supermercado Beija Flor', valor: 1268.60, cidade: 'Patrocínio - MG', status: 'sucesso' },
  { cliente: 'Mercado Santa Edwiges', valor: 763.80, cidade: 'Presidente Prudente - SP', status: 'sucesso' },
  { cliente: 'Mercearia Santa Helena', valor: 966.00, cidade: 'Presidente Prudente - SP', status: 'sucesso' },
  { cliente: 'Casa Mix Chapadão do Sul', valor: 660.60, cidade: 'Chapadão do Sul - MS', status: 'sucesso' },
  { cliente: "D'Car Pioneiros - Matriz", valor: 1378.45, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { cliente: 'Tucho Auto Peças', valor: 421.60, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { cliente: 'Atacarejo São José', valor: 2544.95, cidade: 'Campo Grande - MS', status: 'sucesso' },
  { cliente: 'GR8 Distribuidora de Peças', valor: 1137.00, cidade: 'Campo Grande - MS', status: 'sucesso' },
]

for (const d of dados) {
  await addDoc(collection(db, 'implantacoes'), d)
  console.log(`✓ ${d.cliente}`)
}

console.log('Pronto! 10 clientes adicionados.')
process.exit(0)