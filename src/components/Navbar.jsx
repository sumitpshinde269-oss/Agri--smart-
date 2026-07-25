import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Menu, X, Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const links = [
    { to: '/',                    key: 'nav.home' },
    { to: '/crop-recommendation', key: 'nav.cropRecommendation' },
    { to: '/disease-detection',   key: 'nav.diseaseDetection' },
    { to: '/assistant',           key: 'nav.aiAssistant' },
    { to: '/marketplace',         key: 'nav.marketplace' },
    { to: '/news',                key: 'nav.news' },
  ];

  const activeClass = 'text-emerald-700 font-semibold';
  const inactiveClass = 'text-stone-600 hover:text-emerald-700';

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-100 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading font-bold text-xl text-emerald-700">
          <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="hidden sm:inline">AgriSmart</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-6">
          {links.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors duration-200 ${isActive ? activeClass : inactiveClass}`
              }
              end={to === '/'}
            >
              {t(key)}
            </NavLink>
          ))}
        </div>

        {/* Language + Mobile toggle */}
        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-all text-sm font-medium"
              id="lang-toggle"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{LANGUAGES.find(l => l.code === i18n.language)?.native || 'EN'}</span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-stone-100 py-1 z-50"
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLang(lang.code)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <span>{lang.native}</span>
                      {i18n.language === lang.code && <Check className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            id="mobile-menu-toggle"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-stone-100 bg-white"
          >
            <div className="px-4 py-3 space-y-1">
              {links.map(({ to, key }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-emerald-50 text-emerald-700' : 'text-stone-600 hover:bg-stone-50'
                    }`
                  }
                >
                  {t(key)}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
