import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'sonner';
import { Sprout, FlaskConical, Thermometer, Droplets, Cloud, Leaf, CheckCircle } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'https://agri-smart-backend-5cp8.onrender.com';

const ICONS = {
  Rice: '🌾', Wheat: '🌿', Maize: '🌽', Cotton: '🪴',
  Tomato: '🍅', Potato: '🥔', Sugarcane: '🎋',
};

const FIELDS = [
  { key: 'nitrogen',    icon: FlaskConical, unit: 'mg/kg', min: 0, max: 300, step: 0.1, placeholder: 'e.g. 80' },
  { key: 'phosphorus',  icon: FlaskConical, unit: 'mg/kg', min: 0, max: 200, step: 0.1, placeholder: 'e.g. 45' },
  { key: 'potassium',   icon: FlaskConical, unit: 'mg/kg', min: 0, max: 300, step: 0.1, placeholder: 'e.g. 40' },
  { key: 'temperature', icon: Thermometer,  unit: '°C',    min: -20, max: 60, step: 0.1, placeholder: 'e.g. 25' },
  { key: 'humidity',    icon: Droplets,     unit: '%',     min: 0, max: 100, step: 0.1, placeholder: 'e.g. 75' },
  { key: 'ph',          icon: FlaskConical, unit: 'pH',    min: 0, max: 14,  step: 0.1, placeholder: 'e.g. 6.5' },
  { key: 'rainfall',    icon: Cloud,        unit: 'mm',    min: 0, max: 500, step: 0.1, placeholder: 'e.g. 150' },
];

export default function CropRecommendation() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ nitrogen: '', phosphorus: '', potassium: '', temperature: '', humidity: '', ph: '', rainfall: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === '' || isNaN(parseFloat(v))) { toast.error(`Please enter a valid value for ${k}`); return; }
      payload[k] = parseFloat(v);
    }
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/api/crop-recommendation`, payload);
      setResults(data.recommendations);
      toast.success('Analysis complete! Top crops identified.');
    } catch (err) {
      toast.error('Failed to get recommendations. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 75) return 'text-emerald-700 bg-emerald-100';
    if (score >= 50) return 'text-amber-700 bg-amber-100';
    return 'text-red-700 bg-red-100';
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <Sprout className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">{t('cropRecommendation.title')}</h1>
          <p className="text-emerald-200 max-w-2xl mx-auto">{t('cropRecommendation.subtitle')}</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-10">
          {/* Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="card p-8">
              <h2 className="font-heading font-bold text-xl text-stone-900 mb-6 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-emerald-600" /> Soil & Climate Parameters
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FIELDS.map(({ key, icon: Icon, unit, min, max, step, placeholder }) => (
                  <div key={key}>
                    <label htmlFor={key} className="block text-sm font-medium text-stone-700 mb-1.5">
                      {t(`cropRecommendation.${key}`)} <span className="text-stone-400 font-normal">({unit})</span>
                    </label>
                    <div className="relative">
                      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        id={key}
                        name={key}
                        type="number"
                        step={step}
                        min={min}
                        max={max}
                        value={form[key]}
                        onChange={handleChange}
                        placeholder={placeholder}
                        className="input-field pl-10"
                        required
                      />
                    </div>
                  </div>
                ))}
                <div className="sm:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    id="crop-analyze-btn"
                    className="btn-primary w-full justify-center py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('cropRecommendation.analyzing')}</>
                    ) : (
                      <><Sprout className="w-5 h-5" /> {t('cropRecommendation.analyze')}</>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick presets */}
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-sm font-medium text-amber-800 mb-2">📌 Try these example values (typical Kharif crop land):</p>
              <button
                onClick={() => setForm({ nitrogen: '82', phosphorus: '48', potassium: '42', temperature: '26', humidity: '78', ph: '6.3', rainfall: '180' })}
                className="text-xs text-amber-700 underline hover:text-amber-900 transition-colors"
              >
                Fill sample values →
              </button>
            </div>
          </motion.div>

          {/* Results */}
          <div>
            <AnimatePresence mode="wait">
              {results ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <h2 className="font-heading font-bold text-xl text-stone-900">{t('cropRecommendation.results')}</h2>
                  {results.map((rec, i) => (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="card p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{ICONS[rec.crop_name] || '🌱'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              {i === 0 && <span className="badge bg-amber-400/20 text-amber-800 text-xs">🏆 Best Match</span>}
                              <h3 className="font-heading font-bold text-lg text-stone-900">{rec.crop_name}</h3>
                            </div>
                            <p className="text-sm text-stone-500 mt-0.5">{rec.reason}</p>
                          </div>
                        </div>
                        <span className={`badge text-sm font-bold ${scoreColor(rec.suitability_score)}`}>
                          {rec.suitability_score}%
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="w-full bg-stone-100 rounded-full h-2 mb-5">
                        <motion.div
                          className="bg-emerald-500 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${rec.suitability_score}%` }}
                          transition={{ delay: i * 0.15 + 0.3, duration: 0.8 }}
                        />
                      </div>

                      <h4 className="text-sm font-semibold text-stone-700 mb-2">{t('cropRecommendation.tips')}:</h4>
                      <ul className="space-y-1.5">
                        {rec.growing_tips.map((tip, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-stone-600">
                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full min-h-80 text-center p-8 border-2 border-dashed border-stone-200 rounded-2xl"
                >
                  <Sprout className="w-16 h-16 text-stone-200 mb-4" />
                  <p className="font-heading font-semibold text-stone-400 text-lg">Your recommendations will appear here</p>
                  <p className="text-stone-400 text-sm mt-2">Fill in your soil and climate data, then click Analyze</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
