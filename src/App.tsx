import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PreApprovalPage from '@/pages/PreApprovalPage';
import AdminPage from '@/pages/AdminPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PreApprovalPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<PreApprovalPage />} />
      </Routes>
    </BrowserRouter>
  );
}
