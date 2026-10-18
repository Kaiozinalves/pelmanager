import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { Cadastro } from "./pages/Cadastro";
import { Home } from "./pages/Home";
import { Perfil } from "./pages/Perfil";
import { GrupoDetalhes } from "./pages/GrupoDetalhes";
import { Rodada } from "./pages/Rodada";
import { WrappedRodada } from "./pages/WrappedRodada";
import { PeladasProximas } from "./pages/PeladasProximas"; // NOVO
import { FreeAgents } from "./pages/FreeAgents"; // NOVO

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grupos/:id"
            element={
              <ProtectedRoute>
                <GrupoDetalhes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grupos/:grupoId/rodadas/:rodadaId"
            element={
              <ProtectedRoute>
                <Rodada />
              </ProtectedRoute>
            }
          />
          <Route
            path="/grupos/:grupoId/rodadas/:rodadaId/wrapped"
            element={
              <ProtectedRoute>
                <WrappedRodada />
              </ProtectedRoute>
            }
          />
          {/* NOVO: buscar pelada próxima (UC08) e free agent (UC07) */}
          <Route
            path="/peladas-proximas"
            element={
              <ProtectedRoute>
                <PeladasProximas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/free-agents"
            element={
              <ProtectedRoute>
                <FreeAgents />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
