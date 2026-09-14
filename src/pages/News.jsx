import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Newspaper, Clock, Filter } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
const CATS = ['All', 'Technology', 'Market Prices', 'Trends', 'Government Schemes'];

const CAT_COLORS = {
  Technology: 'badge bg-blue-100 text-blue-800',
  'Market Prices': 'badge bg-orange-100 text-orange-800',
  Trends: 'badge bg-purple-100 text-purple-800',
  'Government Schemes': 'badge-emerald',
};

function readTime(content) {
  return Math.max(1, Math.ceil(content.split(' ').length / 200));
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function News() {
  const { t } = useTranslation();
  const [articles, setArticles] = useState([]);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/api/news`, { params: cat !== 'All' ? { category: cat } : {} });
        setArticles(data);
      } catch { setArticles([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [cat]);

  return (
    <div>
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <Newspaper className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">{t('news.title')}</h1>
          <p className="text-emerald-200 max-w-2xl mx-auto">{t('news.subtitle')}</p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <Filter className="w-4 h-4 text-stone-400" />
          {CATS.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                cat === c
                  ? 'bg-emerald-700 text-white shadow'
                  : 'bg-white text-stone-600 border border-stone-200 hover:border-emerald-400 hover:text-emerald-700'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-0 overflow-hidden animate-pulse">
                <div className="bg-stone-200 h-48" />
                <div className="p-5 space-y-3">
                  <div className="h-3 bg-stone-200 rounded w-1/3" />
                  <div className="h-5 bg-stone-200 rounded w-full" />
                  <div className="h-3 bg-stone-100 rounded w-full" />
                  <div className="h-3 bg-stone-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-medium">{t('common.noResults')}</p>
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {articles.map((article, i) => (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="card overflow-hidden group cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className={`absolute top-3 left-3 ${CAT_COLORS[article.category] || 'badge-stone'}`}>
                      {article.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <div className="flex items-center gap-3 text-xs text-stone-400 mb-3">
                      <span>{formatDate(article.published_at)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {readTime(article.content)} {t('news.minRead')}
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-stone-900 leading-snug mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed line-clamp-3 mb-4">
                      {article.content.split('\n')[0]}
                    </p>
                    <button className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 transition-colors inline-flex items-center gap-1">
                      {t('news.readMore')} →
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
