import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Profile from './pages/Profile.jsx';
import CallLogs from './pages/CallLogs.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';

const Guard = () => (useAuth().client ? <Outlet /> : <Navigate to="/login" replace />);
export default function App() {
  return (
    <BrowserRouter><AuthProvider><Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Guard />}><Route element={<Layout />}>
        <Route index element={<Navigate to="/call-logs" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="call-logs" element={<CallLogs />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
      </Route></Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></AuthProvider></BrowserRouter>
  );
}
