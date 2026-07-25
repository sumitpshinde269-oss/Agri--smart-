import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ShoppingBag, MapPin, Leaf, Filter } from 'lucide-react';

const API = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
const CATS = ['All', 'Seeds', 'Fertilizers', 'Tools', 'Equipment', 'Produce'];

const CAT_COLORS = {
  Seeds: 'badge-emerald', Fertilizers: 'badge-amber',
  Tools: 'badge bg-blue-100 text-blue-800',
  Equipment: 'badge bg-purple-100 text-purple-800',
  Produce: 'badge bg-orange-100 text-orange-800',
};

export default function Marketplace() {
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [cat, setCat] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/api/marketplace`, { params: cat !== 'All' ? { category: cat } : {} });
        setListings(data);
      } catch { setListings([]); }
      finally { setLoading(false); }
    };
    fetch();
  }, [cat]);

  return (
    <div>
      <div className="page-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-4">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white mb-2">{t('marketplace.title')}</h1>
          <p className="text-emerald-200 max-w-2xl mx-auto">{t('marketplace.subtitle')}</p>
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
              {t(`marketplace.${c.toLowerCase()}`) || c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card p-0 overflow-hidden animate-pulse">
                <div className="bg-stone-200 h-52" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-full" />
                  <div className="h-3 bg-stone-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-stone-200 mx-auto mb-4" />
            <p className="text-stone-400 font-medium">{t('common.noResults')}</p>
          </div>
        ) : (
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {listings.map((item, i) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="card overflow-hidden group"
                >
                  {/* Image */}
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={item.image_url || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {item.is_organic && (
                      <span className="absolute top-3 right-3 badge bg-emerald-500 text-white">
                        <Leaf className="w-3 h-3 mr-1" /> {t('marketplace.organic')}
                      </span>
                    )}
                    <span className={`absolute top-3 left-3 ${CAT_COLORS[item.category] || 'badge-stone'}`}>
                      {item.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-heading font-bold text-stone-900 text-base leading-snug mb-1 line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-stone-500 leading-relaxed line-clamp-2 mb-4">{item.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-heading font-black text-emerald-700">
                        ₹{item.price.toLocaleString('en-IN')}
                      </span>
                      <button className="btn-primary py-2 px-4 text-xs">{t('marketplace.viewDetails')}</button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-400">
                      <span className="font-medium text-stone-600">{item.seller_name}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.location}
                      </span>
                    </div>
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
