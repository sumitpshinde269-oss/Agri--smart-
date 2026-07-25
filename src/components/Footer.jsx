import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Leaf, Mail, Phone, Share2, MessageSquare, Play } from 'lucide-react';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl text-white">AgriSmart Connect</span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed">{t('footer.tagline')}</p>
            <div className="flex items-center gap-3 mt-5">
              {[Share2, MessageSquare, Play].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 rounded-full bg-stone-800 flex items-center justify-center hover:bg-emerald-700 transition-colors">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
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

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold text-white mb-4">{t('footer.contact')}</h3>
            <div className="space-y-3">
              <a href="mailto:support@agrismart.com" className="flex items-center gap-3 text-sm text-stone-400 hover:text-emerald-400 transition-colors">
                <Mail className="w-4 h-4 flex-shrink-0" />
                support@agrismart.com
              </a>
              <a href="tel:+911800FARMING" className="flex items-center gap-3 text-sm text-stone-400 hover:text-emerald-400 transition-colors">
                <Phone className="w-4 h-4 flex-shrink-0" />
                +91 1800-FARMING
              </a>
            </div>
            <div className="mt-6 p-4 bg-emerald-900/30 rounded-xl border border-emerald-800/30">
              <p className="text-xs text-emerald-400 font-medium">🌱 Free for all farmers</p>
              <p className="text-xs text-stone-400 mt-1">No subscription required</p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 text-center">
          <p className="text-xs text-stone-500">{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
}
