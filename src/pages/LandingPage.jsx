import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Sprout, Microscope, MessageCircle, ShoppingBag,
  Newspaper, ArrowRight, CheckCircle, Leaf, TrendingUp, Users,
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
};

const STATS = [
  { value: '10K+', labelKey: 'hero.stat1', icon: Sprout },
  { value: '95%',  labelKey: 'hero.stat2', icon: TrendingUp },
  { value: '3',    labelKey: 'hero.stat3', icon: Users },
];

const BENEFITS = [
  'Real-time AI analysis based on soil data',
  'Instant disease diagnosis from leaf photos',
  'Multilingual support (English, Hindi, Kannada)',
  'Free access for all farmers',
  '24/7 AI expert assistance',
  'Up-to-date market prices and schemes',
];

export default function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: Sprout,
      titleKey: 'features.cropAdvisor.title',
      descKey:  'features.cropAdvisor.desc',
      to: '/crop-recommendation',
      color: 'bg-emerald-100 text-emerald-700',
    },
    {
      icon: Microscope,
      titleKey: 'features.diseaseDetection.title',
      descKey:  'features.diseaseDetection.desc',
      to: '/disease-detection',
      color: 'bg-amber-100 text-amber-700',
    },
    {
      icon: MessageCircle,
      titleKey: 'features.aiAssistant.title',
      descKey:  'features.aiAssistant.desc',
      to: '/assistant',
      color: 'bg-blue-100 text-blue-700',
    },
    {
      icon: ShoppingBag,
      titleKey: 'features.marketplace.title',
      descKey:  'features.marketplace.desc',
      to: '/marketplace',
      color: 'bg-purple-100 text-purple-700',
    },
  ];

  return (
    <div className="overflow-x-hidden">
      {/* ─── Hero ─── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-800 overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #a7f3d0 0%, transparent 50%), radial-gradient(circle at 75% 20%, #fbbf24 0%, transparent 40%)' }}
        />
        <div className="absolute inset-0"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700/50 border border-emerald-600/50 text-emerald-200 text-sm font-medium mb-6"
            >
              <Leaf className="w-4 h-4" />
              {t('hero.badge')}
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-white leading-tight mb-6"
            >
              {t('hero.title')}{' '}
              <span className="text-amber-400">{t('hero.titleHighlight')}</span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-emerald-200 text-lg leading-relaxed mb-8 max-w-xl"
            >
              {t('hero.subtitle')}
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-wrap gap-4"
            >
              <Link to="/crop-recommendation" className="btn-amber text-base px-8 py-4 shadow-xl shadow-amber-900/30">
                {t('hero.ctaPrimary')} <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/disease-detection" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-emerald-400 text-emerald-200 font-semibold text-base hover:bg-emerald-700/30 transition-all duration-200">
                {t('hero.ctaSecondary')}
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="flex gap-8 mt-10 pt-8 border-t border-emerald-700/50"
            >
              {STATS.map(({ value, labelKey, icon: Icon }) => (
                <div key={labelKey} className="text-center">
                  <p className="text-3xl font-heading font-black text-white">{value}</p>
                  <p className="text-xs text-emerald-300 mt-1">{t(labelKey)}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Hero visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="hidden lg:block relative"
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-amber-400/20 rounded-3xl" />
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80"
                alt="Farmer using technology"
                className="w-full h-full object-cover rounded-3xl shadow-2xl"
              />
              {/* Floating card */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Sprout className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">AI Recommendation</p>
                    <p className="text-sm font-semibold text-stone-900">Rice — 92% match</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 4, delay: 1 }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Microscope className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-500">Disease Scan</p>
                    <p className="text-sm font-semibold text-emerald-700">✓ Healthy Leaf</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="section-title mb-4">{t('features.title')}</h2>
            <p className="section-subtitle max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, titleKey, descKey, to, color }, i) => (
              <motion.div
                key={to}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
              >
                <Link to={to} className="card p-6 flex flex-col gap-4 h-full group hover:-translate-y-1 block">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-stone-900 text-lg group-hover:text-emerald-700 transition-colors">
                    {t(titleKey)}
                  </h3>
                  <p className="text-stone-500 text-sm leading-relaxed flex-1">{t(descKey)}</p>
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-sm font-medium">
                    Learn more <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Built for Farmers ─── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            <img
              src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600&q=80"
              alt="Farmer using tablet in field"
              className="rounded-3xl shadow-2xl w-full object-cover aspect-[4/3]"
            />
          </motion.div>
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
          >
            <span className="badge-emerald mb-4 inline-block">Built for Farmers</span>
            <h2 className="section-title mb-6">
              Technology that works <span className="text-emerald-700">for you</span>
            </h2>
            <p className="text-stone-500 mb-8 leading-relaxed">
              AgriSmart Connect is designed from the ground up for Indian farmers — simple to use,
              accurate, and available in your language. No technical expertise required.
            </p>
            <ul className="space-y-3">
              {BENEFITS.map((b, i) => (
                <motion.li
                  key={i}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i * 0.5}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span className="text-stone-700 text-sm">{b}</span>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-20 bg-gradient-to-r from-emerald-700 to-emerald-900">
        <motion.div
          variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="max-w-3xl mx-auto px-4 text-center"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-white mb-4">
            Ready to grow smarter?
          </h2>
          <p className="text-emerald-200 mb-8 text-lg">
            Join thousands of farmers already using AI to improve yields and reduce losses.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/crop-recommendation" className="btn-amber text-base px-8 py-4">
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/assistant" className="inline-flex items-center gap-2 px-8 py-4 rounded-full border-2 border-emerald-300 text-white hover:bg-emerald-600/30 font-semibold transition-all">
              <MessageCircle className="w-5 h-5" /> Chat with AI
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
