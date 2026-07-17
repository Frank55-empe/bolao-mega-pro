import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import Cadastro from './pages/Cadastro';
import EscolhaNumeros from './pages/EscolhaNumeros';
import Pagamento from './pages/Pagamento';
import Consulta from './pages/Consulta';
import Regulamento from './pages/Regulamento';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminConcursos from './pages/admin/Concursos';
import AdminParticipantes from './pages/admin/Participantes';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/numeros" element={<EscolhaNumeros />} />
          <Route path="/pagamento" element={<Pagamento />} />
          <Route path="/consulta" element={<Consulta />} />
          <Route path="/regulamento" element={<Regulamento />} />

          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/concursos" element={<AdminConcursos />} />
          <Route path="/admin/participantes" element={<AdminParticipantes />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-600 py-6">
        Bolão da Mega PRO · feito com React + Google Sheets
      </footer>
    </div>
  );
}
