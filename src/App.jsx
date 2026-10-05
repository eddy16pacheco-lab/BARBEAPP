import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import Layout, { Protected } from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import Promotions from './pages/Promotions.jsx';
import Booking from './pages/Booking.jsx';
import Profile from './pages/Profile.jsx';
import { Login, Register, Recover, ResetPassword } from './pages/Auth.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminAppointments from './pages/admin/Appointments.jsx';
import AdminPayments from './pages/admin/Payments.jsx';
import { AdminServices, AdminBarbers, AdminPromos, AdminSettings } from './pages/admin/Catalog.jsx';

// HashRouter: funciona en GitHub Pages sin configurar redirecciones del servidor.
export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="servicios" element={<Services />} />
              <Route path="promociones" element={<Promotions />} />
              <Route path="reservar" element={<Booking />} />
              <Route path="login" element={<Login />} />
              <Route path="registro" element={<Register />} />
              <Route path="recuperar" element={<Recover />} />
              <Route path="restablecer/:token" element={<ResetPassword />} />
              <Route path="perfil" element={<Protected><Profile /></Protected>} />
              <Route path="admin" element={<Protected admin><AdminLayout /></Protected>}>
                <Route index element={<Dashboard />} />
                <Route path="citas" element={<AdminAppointments />} />
                <Route path="pagos" element={<AdminPayments />} />
                <Route path="servicios" element={<AdminServices />} />
                <Route path="barberos" element={<AdminBarbers />} />
                <Route path="promociones" element={<AdminPromos />} />
                <Route path="ajustes" element={<AdminSettings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
