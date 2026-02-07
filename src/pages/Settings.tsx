import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTranslation as useTranslationReact } from 'react-i18next';
import { db } from '../services/database';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' }
];

export default function Settings() {
  const { t } = useTranslation();
  const { i18n } = useTranslationReact();
  const [language, setLanguage] = useState(i18n.language);
  const [currency, setCurrency] = useState('USD');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const savedCurrency = await db.settings.get('currency');
    if (savedCurrency) {
      setCurrency(savedCurrency.value);
    }
  }

  const handleLanguageChange = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  const handleSave = async () => {
    await db.settings.put({ key: 'currency', value: currency });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('settings.title')}</h2>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.language')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                language === 'en'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              🇺🇸 English
            </button>
            <button
              onClick={() => handleLanguageChange('tr')}
              className={`py-2 px-4 rounded-lg border-2 transition-colors ${
                language === 'tr'
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              🇹🇷 Türkçe
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.currency')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => setCurrency(curr.code)}
                className={`py-2 px-4 rounded-lg border-2 transition-colors text-left ${
                  currency === curr.code
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="font-medium">{curr.symbol} {curr.code}</span>
                <span className="text-xs text-gray-500 block">{curr.name}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={handleSave} className="btn btn-primary w-full">
          {saved ? '✓ Saved!' : t('settings.save')}
        </button>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">About</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>Version:</strong> 0.1.0</p>
          <p><strong>Built with:</strong> React 19, Vite, TypeScript</p>
          <p><strong>Features:</strong></p>
          <ul className="list-disc list-inside ml-2">
            <li>Transaction tracking</li>
            <li>Debt management</li>
            <li>Savings goals</li>
            <li>Offline support (PWA)</li>
            <li>Multi-language (EN/TR)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
