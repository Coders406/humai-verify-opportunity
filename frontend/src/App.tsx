import { Routes, Route } from 'react-router-dom'
import VerificarOportunidadePage from './pages/VerificarOportunidadePage'
import DadosOportunidadesPage from './pages/DadosOportunidadesPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<VerificarOportunidadePage />} />
      <Route path="/verificar-oportunidade" element={<VerificarOportunidadePage />} />
      <Route path="/dados-oportunidades" element={<DadosOportunidadesPage />} />
    </Routes>
  )
}

export default App
