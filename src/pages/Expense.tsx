import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../services/database';
import { Expense } from '../services/database';

type ExpenseCategory = 'bill' | 'rent' | 'transport' | 'insurance' | 'subscription' | 'other';

const expenseCategories = [
  { value: 'bill', label: 'expense.bill', icon: '📄' },
  { value: 'rent', label: 'expense.rent', icon: '🏠' },
  { value: 'transport', label: 'expense.transport', icon: '🚌' },
  { value: 'insurance', label: 'expense.insurance', icon: '🛡️' },
  { value: 'subscription', label: 'expense.subscription', icon: '📱' },
  { value: 'other', label: 'expense.other', icon: '📦' }
] as const;

export default function ExpensePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    category: '' as ExpenseCategory,
    amount: '',
    dueDate: '',
    paid: false,
    paidDate: ''
  });

  const handlePaidToggle = (isPaid: boolean) => {
    setFormData({
      ...formData,
      paid: isPaid,
      paidDate: isPaid ? today : ''
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const [year, month] = formData.dueDate.split('-').map(Number);
    
    const expense: Omit<Expense, 'id'> = {
      category: formData.category as ExpenseCategory,
      amount: parseFloat(formData.amount),
      dueDate: formData.dueDate,
      paid: formData.paid,
      paidDate: formData.paid ? today : undefined,
      month,
      year,
      createdAt: new Date()
    };

    await db.expenses.add(expense);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('expense.title')}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('expense.category')}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {expenseCategories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat.value as ExpenseCategory })}
                className={`py-3 px-3 rounded-xl text-sm font-medium transition-all duration-200 flex flex-col items-center gap-1 ${
                  formData.category === cat.value
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                <span>{t(cat.label)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('expense.amount')}
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input pr-12"
              placeholder="0,00"
              required
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              {localStorage.getItem('currency') === 'USD' ? '$' : localStorage.getItem('currency') === 'GBP' ? '£' : '₺'}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('expense.dueDate')}
          </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            className="input"
            required
          />
        </div>

        {/* Paid Toggle */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t('expense.paid')}
              </label>
              {formData.paid && (
                <p className="text-xs text-emerald-600 mt-1">
                  {t('expense.paidDate')}: {new Date().toLocaleDateString(i18n.language)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handlePaidToggle(!formData.paid)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                formData.paid ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  formData.paid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="submit" className="btn btn-primary flex-1">
            {t('expense.save')}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn btn-secondary"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
