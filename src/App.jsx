import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import NewReportPage from './pages/NewReportPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/report/:id" element={<ReportPage />} />
        <Route path="/new" element={<NewReportPage />} />
      </Routes>
    </Layout>
  );
}
