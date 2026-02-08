import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../services/database';

const incomeTypes = [
  { value: 'salary', labelKey: 'income.salary', icon: '💰' },
  { value: 'freelance', labelKey: 'income.freelance', icon: '💼' },
  { value: 'investment', labelKey: 'income.investment', icon: '📈' },
  { value: 'other', labelKey: 'income.other', icon: '💵' }
] as const;

export default function Income() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  
  const [formData, setFormData] = useState({
    type: 'salary' as 'salary' | 'freelance' | 'investment' | 'other',
    amount: '',
    expectedDate: today.toISOString().split('T')[0],
    received: false,
    receivedDate: '',
    month: currentMonth,
    year: currentYear
  });

  const handleReceivedToggle = (received: boolean) => {
    setFormData({
      ...formData,
      received,
      receivedDate: received ? new Date().toISOString().split('T')[0] : ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await db.incomes.add({
      type: formData.type,
      amount: parseFloat(formData.amount),
      expectedDate: formData.expectedDate,
      received: formData.received,
      receivedDate: formData.receivedDate || undefined,
      month: formData.month,
      year: formData.year,
      createdAt: new Date()
    });

    navigate(-1);
  };

  const formatCurrency = (amount: number) => {
    const savedCurrency = localStorage.getItem('currency') || 'TRY';
    const currencySymbols: Record<string, string> = {
      TRY: '₺',
      USD: '$',
      GBP: '£'
    };
    const currency = currencySymbols[savedCurrency] || '₺';
    return `${currency}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('income.title')}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Income Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('income.type')}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {incomeTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, type: type.value })}
                className={`flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-200 ${
                  formData.type === type.value
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-2xl mb-1">{type.icon}</span>
                <span className="text-xs font-medium">{t(type.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('income.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input pr-12"
              placeholder={t('common.placeholder.amount')}
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {localStorage.getItem('currency') === 'USD' ? '$' : localStorage.getItem('currency') === 'GBP' ? '£' : '₺'}
            </span>
          </div>
        </div>

        {/* Expected Date Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('income.expectedDate')}
          </label>
          <input
            type="date"
            value={formData.expectedDate}
            onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
            className="input"
            required
          />
        </div>

        {/* Received Toggle */}
        <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-6 rounded-full transition-colors duration-200 ${
              formData.received ? 'bg-emerald-500' : 'bg-gray-300'
            }`}>
              <button
                type="button"
                onClick={() => handleReceivedToggle(!formData.received)}
                className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-200 mt-0.5 ${
                  formData.received ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              {t('income.received')}
            </span>
          </div>
          {formData.received && (
            <span className="text-sm text-emerald-600 font-medium">
              {t('income.received')}: {new Date(formData.receivedDate || new Date().toISOString().split('T')[0]).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Received Date (auto-filled when received is true) */}
        {formData.received && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('income.receivedDate')}
            </label>
            <input
              type="date"
              value={formData.receivedDate}
              onChange={(e) => setFormData({ ...formData, receivedDate: e.target.value })}
              className="input"
            />
          </div>
        )}

        {/* Month/Year Display */}
        <div className="flex gap-4 py-2">
          <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-center">
            <span className="text-xs text-gray-500 block">{t('income.month')}</span>
            <span className="text-sm font-semibold text-gray-800">{formData.month}</span>
          </div>
          <div className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-center">
            <span className="text-xs text-gray-500 block">{t('income.year')}</span>
            <span className="text-sm font-semibold text-gray-800">{formData.year}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary flex-1">
            {t('income.save')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
