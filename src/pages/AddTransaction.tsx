import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../services/database';
import { TransactionType } from '../types';

const categoryKeys = {
  income: ['salary', 'freelance', 'investment', 'gift', 'other'] as const,
  expense: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'healthcare', 'other'] as const
};

export default function AddTransaction() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: 'expense' as TransactionType,
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleTypeChange = (type: TransactionType) => {
    setFormData({ ...formData, type, category: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await db.transactions.add({
      type: formData.type,
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: formData.category,
      date: new Date(formData.date),
      createdAt: new Date()
    });

    navigate('/');
  };

  const currentCategoryKeys = categoryKeys[formData.type];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('transaction.title')}</h2>
      
      <div className="flex gap-2 mb-4">
        {(['income', 'expense'] as TransactionType[]).map((type) => (
          <button
            key={type}
            onClick={() => handleTypeChange(type)}
            className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
              formData.type === type
                ? type === 'income' 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' 
                  : 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t(`transaction.${type}`)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('transaction.amount')}
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="input"
            placeholder={t('common.placeholder.amount')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('transaction.description')}
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input"
            placeholder={t('common.placeholder.description')}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('transaction.category')}
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input"
            required
          >
            <option value="">{t('common.select')}</option>
            {currentCategoryKeys.map((cat) => (
              <option key={cat} value={cat}>
                {t(`categories.${formData.type}.${cat}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('transaction.date')}
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="input"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          {t('transaction.save')}
        </button>
      </form>
    </div>
  );
}
