import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  const links = [
    { to: '/',                    key: 'nav.home' },
    { to: '/crop-recommendation', key: 'nav.cropRecommendation' },
    { to: '/disease-detection',   key: 'nav.diseaseDetection' },
    { to: '/assistant',           key: 'nav.aiAssistant' },
    { to: '/marketplace',         key: 'nav.marketplace' },
    { to: '/news',                key: 'nav.news' },
  ];

  return (
    <footer className="bg-stone-950 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">AgriSmart Connect</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-md">{t('footer.tagline')}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-2">
              {links.map(({ to, key }) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-stone-400 hover:text-emerald-400 transition-colors">
                    {t(key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 text-center">
          <p className="text-xs text-stone-500">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
