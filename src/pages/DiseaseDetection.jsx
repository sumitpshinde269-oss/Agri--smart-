import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Microscope, Upload, ImageIcon, CheckCircle, AlertCircle, Shield, X } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';

const PROGRESS_STEPS = [
  'Image received',
  'Processing with AI Vision',
  'Analyzing symptoms',
  'Generating recommendations',
];

export default function DiseaseDetection() {
  const { t } = useTranslation();
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const processFile = (file) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload JPEG, PNG, or WEBP image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
      setImage(e.target.result);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, []);

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const handleAnalyze = async () => {
    if (!image) { toast.error('Please upload an image first.'); return; }
    setLoading(true);
    setStep(0);
    setResult(null);

    const stepInterval = setInterval(() => {
      setStep(s => (s < PROGRESS_STEPS.length - 1 ? s + 1 : s));
    }, 1500);

    try {
      const base64 = image.includes(',') ? image.split(',')[1] : image;
      const { data } = await axios.post(`${API}/api/disease-diagnosis`, { image_base64: base64 });
      clearInterval(stepInterval);
      setResult(data);
      toast.success('Analysis complete!');
    } catch (err) {
      clearInterval(stepInterval);
      toast.error(err.response?.data?.detail || 'Analysis failed. Ensure the backend is running and GEMINI_API_KEY is set.');
    } finally {
      setLoading(false);
    }
  };

  const confidencePct = result ? Math.round(result.confidence * 100) : 0;
  const isHealthy = result?.disease_name?.toLowerCase().includes('healthy');

  return (
    <div>
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <Microscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">{t('diseaseDetection.title')}</h1>
          <p className="text-emerald-200 max-w-2xl mx-auto">{t('diseaseDetection.subtitle')}</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Upload Section */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="card p-8">
              <h2 className="font-heading font-bold text-xl mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-emerald-600" /> Upload Leaf Image
              </h2>

              {/* Drop zone */}
              <div
                className={`drop-zone mb-6 ${dragging ? 'active' : ''}`}
                onClick={() => inputRef.current.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                id="disease-dropzone"
              >
                {preview ? (
                  <div className="relative">
                    <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl object-contain" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreview(null); setImage(null); setResult(null); }}
                      className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                    <p className="font-medium text-stone-500">{t('diseaseDetection.uploadTitle')}</p>
                    <p className="text-sm text-stone-400 mt-1">{t('diseaseDetection.uploadSubtitle')}</p>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => processFile(e.target.files[0])} />

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={!image || loading}
                id="disease-analyze-btn"
                className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('diseaseDetection.analyzing')}</>
                ) : (
                  <><Microscope className="w-5 h-5" /> {t('diseaseDetection.analyze')}</>
                )}
              </button>

              {/* Progress steps */}
              <AnimatePresence>
                {loading && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mt-5 space-y-2 overflow-hidden"
                  >
                    {PROGRESS_STEPS.map((s, i) => (
                      <div key={i} className={`flex items-center gap-3 text-sm transition-all ${i <= step ? 'text-stone-700' : 'text-stone-300'}`}>
                        {i < step ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        ) : i === step ? (
                          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border-2 border-stone-200 flex-shrink-0" />
                        )}
                        {s}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Results */}
          <div>
            <AnimatePresence mode="wait">
              {result ? (
                <motion.div key="result" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="card p-8 space-y-6">
                  {/* Disease header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-1">{t('diseaseDetection.disease')}</p>
                      <h3 className="text-2xl font-heading font-black text-stone-900">{result.disease_name}</h3>
                    </div>
                    <span className={`badge text-sm font-bold ${isHealthy ? 'bg-emerald-100 text-emerald-800' : confidencePct > 70 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                      {isHealthy ? '✓ Healthy' : `⚠ ${confidencePct}% sure`}
                    </span>
                  </div>

                  {/* Confidence bar */}
                  <div>
                    <div className="flex justify-between text-sm text-stone-500 mb-1.5">
                      <span>{t('diseaseDetection.confidence')}</span>
                      <span className="font-semibold">{confidencePct}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2.5">
                      <motion.div
                        className={`h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : confidencePct > 70 ? 'bg-red-500' : 'bg-amber-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${confidencePct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-sm font-semibold text-stone-700 mb-2">{t('diseaseDetection.description')}</h4>
                    <p className="text-sm text-stone-600 leading-relaxed">{result.description}</p>
                  </div>

                  {/* Symptoms */}
                  {result.symptoms?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Visible Symptoms
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.symptoms.map((s, i) => (
                          <span key={i} className="badge-amber">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Treatment */}
                  {result.treatment?.length > 0 && !isHealthy && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-500" /> {t('diseaseDetection.treatment')}
                      </h4>
                      <ol className="space-y-2">
                        {result.treatment.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-stone-600">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Prevention */}
                  {result.prevention_tips?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-stone-700 mb-2 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-blue-500" /> {t('diseaseDetection.prevention')}
                      </h4>
                      <ul className="space-y-1.5">
                        {result.prevention_tips.map((tip, i) => (
                          <li key={i} className="flex gap-2 text-sm text-stone-600">
                            <span className="text-blue-500 flex-shrink-0">•</span>{tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full min-h-80 text-center p-8 border-2 border-dashed border-stone-200 rounded-2xl"
                >
                  <Microscope className="w-16 h-16 text-stone-200 mb-4" />
                  <p className="font-heading font-semibold text-stone-400 text-lg">Disease analysis will appear here</p>
                  <p className="text-stone-400 text-sm mt-2">Upload a clear photo of the affected leaf</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
