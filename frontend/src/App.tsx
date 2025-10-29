import { Routes, Route } from 'react-router-dom'
import VerificarOportunidadePage from './pages/VerificarOportunidadePage'
import DadosOportunidadesPage from './pages/DadosOportunidadesPage'
import LoginPage from './pages/LoginPage'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<VerificarOportunidadePage />} />
      <Route path="/verificar-oportunidade" element={<VerificarOportunidadePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/dados-oportunidades" 
        element={
          <ProtectedRoute>
            <DadosOportunidadesPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  )
}

export default App


