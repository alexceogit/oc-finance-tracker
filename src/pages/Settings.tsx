import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../services/database';
import { Transaction, Debt, Goal } from '../types';

const currencies = [
  { code: 'TRY', symbol: '₺', nameEn: 'Turkish Lira', nameTr: 'Türk Lirası' },
  { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameTr: 'ABD Doları' },
  { code: 'GBP', symbol: '£', nameEn: 'British Pound', nameTr: 'İngiliz Sterlini' }
];

const themes = [
  { value: 'light', icon: '☀️', nameEn: 'Light', nameTr: 'Açık' },
  { value: 'dark', icon: '🌙', nameEn: 'Dark', nameTr: 'Koyu' },
  { value: 'system', icon: '💻', nameEn: 'System', nameTr: 'Sistem' }
];

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [language, setLanguage] = useState(i18n.language);
  const [currency, setCurrency] = useState('TRY');
  const [theme, setTheme] = useState('system');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const savedLanguage = localStorage.getItem('language');
    const savedCurrency = localStorage.getItem('currency');
    const savedTheme = localStorage.getItem('theme');

    if (savedLanguage) {
      setLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedTheme) setTheme(savedTheme);
  }

  const handleLanguageChange = (lng: string) => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };

  const handleCurrencyChange = (curr: string) => {
    setCurrency(curr);
    localStorage.setItem('currency', curr);
    showNotification('success', t('settings.saved'));
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    showNotification('success', t('settings.saved'));
  };

  const applyTheme = (themeValue: string) => {
    const root = document.documentElement;
    if (themeValue === 'dark' || (themeValue === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const exportData = async () => {
    try {
      const transactions = await db.transactions.toArray();
      const debts = await db.debts.toArray();
      const goals = await db.goals.toArray();

      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        transactions,
        debts,
        goals
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finance-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showNotification('success', t('settings.exportSuccess'));
    } catch (error) {
      showNotification('error', t('settings.exportError'));
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setShowImportConfirm(true);
  };

  const confirmImport = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      const data = JSON.parse(text);

      if (data.transactions && Array.isArray(data.transactions)) {
        await db.transactions.clear();
        await db.transactions.bulkAdd(data.transactions);
      }
      if (data.debts && Array.isArray(data.debts)) {
        await db.debts.clear();
        await db.debts.bulkAdd(data.debts);
      }
      if (data.goals && Array.isArray(data.goals)) {
        await db.goals.clear();
        await db.goals.bulkAdd(data.goals);
      }

      showNotification('success', t('settings.importSuccess'));
    } catch (error) {
      showNotification('error', t('settings.importError'));
    }
    setShowImportConfirm(false);
    setImportFile(null);
  };

  const clearAllData = async () => {
    try {
      await db.transactions.clear();
      await db.debts.clear();
      await db.goals.clear();
      setShowClearConfirm(false);
      showNotification('success', t('settings.clearSuccess'));
    } catch (error) {
      showNotification('error', t('settings.clearError'));
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg animate-slide-up ${
          notification.type === 'success' 
            ? 'bg-emerald-500 text-white' 
            : 'bg-rose-500 text-white'
        }`}>
          <div className="flex items-center justify-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.subtitle')}</p>
        </div>
      </div>

      {/* Language Selection */}
      <div className="section-header animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <h3 className="section-title">{t('settings.language')}</h3>
        </div>
      </div>
      
      <div className="card animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleLanguageChange('en')}
            className={`setting-option ${language === 'en' ? 'setting-option-active' : ''}`}
          >
            <span className="text-2xl">🇺🇸</span>
            <div className="text-left">
              <span className="font-medium block">English</span>
              <span className="text-xs opacity-70">English</span>
            </div>
          </button>
          
          <button
            onClick={() => handleLanguageChange('tr')}
            className={`setting-option ${language === 'tr' ? 'setting-option-active' : ''}`}
          >
            <span className="text-2xl">🇹🇷</span>
            <div className="text-left">
              <span className="font-medium block">Türkçe</span>
              <span className="text-xs opacity-70">Turkish</span>
            </div>
          </button>
        </div>
      </div>

      {/* Currency Selection */}
      <div className="section-header animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="section-title">{t('settings.currency')}</h3>
        </div>
      </div>
      
      <div className="card animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <div className="grid grid-cols-3 gap-3">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => handleCurrencyChange(curr.code)}
              className={`setting-option justify-center ${currency === curr.code ? 'setting-option-active' : ''}`}
            >
              <span className="text-2xl font-semibold">{curr.symbol}</span>
              <span className="text-sm ml-2">{curr.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Theme Selection */}
      <div className="section-header animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <h3 className="section-title">{t('settings.theme')}</h3>
        </div>
      </div>
      
      <div className="card animate-slide-up" style={{ animationDelay: '0.35s' }}>
        <div className="grid grid-cols-3 gap-3">
          {themes.map((themeOption) => (
            <button
              key={themeOption.value}
              onClick={() => handleThemeChange(themeOption.value)}
              className={`setting-option justify-center ${theme === themeOption.value ? 'setting-option-active' : ''}`}
            >
              <span className="text-xl">{themeOption.icon}</span>
              <span className="text-sm ml-2">
                {i18n.language === 'tr' ? themeOption.nameTr : themeOption.nameEn}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="section-header animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
          <h3 className="section-title">{t('settings.dataManagement')}</h3>
        </div>
      </div>
      
      <div className="card space-y-3 animate-slide-up" style={{ animationDelay: '0.45s' }}>
        {/* Export */}
        <button onClick={exportData} className="setting-option justify-start">
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <span className="font-medium block text-gray-900 dark:text-white">{t('settings.export')}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings.exportDesc')}</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Import */}
        <label className="setting-option justify-start cursor-pointer">
          <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <span className="font-medium block text-gray-900 dark:text-white">{t('settings.import')}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings.importDesc')}</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>

        {/* Clear Data */}
        <button 
          onClick={() => setShowClearConfirm(true)} 
          className="setting-option justify-start"
        >
          <div className="w-10 h-10 bg-rose-50 dark:bg-rose-900/30 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div className="text-left flex-1">
            <span className="font-medium block text-gray-900 dark:text-white">{t('settings.clearData')}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('settings.clearDataDesc')}</span>
          </div>
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* About Section */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.5s' }}>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('settings.about')}
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">{t('settings.version')}</span>
            <span className="font-medium text-gray-900 dark:text-white">0.1.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-gray-500 dark:text-gray-400">{t('settings.pwa')}</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{t('settings.supported')}</span>
          </div>
          <div className="pt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('settings.copyright')}</p>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              {t('settings.clearConfirmTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              {t('settings.clearConfirmDesc')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={clearAllData}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirmation Dialog */}
      {showImportConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
              {t('settings.importConfirmTitle')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
              {t('settings.importConfirmDesc')} {importFile?.name}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowImportConfirm(false);
                  setImportFile(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
