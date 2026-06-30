import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ModelosPage }  from './pages/modelos/ModelosPage';
import { OrdensPage }   from './pages/ordens/OrdensPage';
import { ControlePage } from './pages/controle/ControlePage';
import { EmpresasPage } from './pages/empresas/EmpresasPage';
import { LoginPage }    from './pages/auth/LoginPage';
import { Layout }       from './components/Layout';
import { setAuthToken } from './lib/api';
import { useAuthStore } from './store/auth';

function App() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    setAuthToken(user?.accessToken);
  }, [user?.accessToken]);

  if (!user) return <LoginPage />;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/"         element={<Navigate to="/empresas" replace />} />
          <Route path="/empresas" element={<EmpresasPage />} />
          <Route path="/modelos"  element={<ModelosPage />} />
          <Route path="/ordens"   element={<OrdensPage />} />
          <Route path="/controle" element={<ControlePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
