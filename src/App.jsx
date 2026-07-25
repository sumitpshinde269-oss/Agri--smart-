import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import AIAssistant from './pages/AIAssistant';
import Marketplace from './pages/Marketplace';
import News from './pages/News';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/crop-recommendation" element={<CropRecommendation />} />
            <Route path="/disease-detection" element={<DiseaseDetection />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/news" element={<News />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
