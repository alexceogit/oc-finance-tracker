import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../services/database';
import { Transaction, Debt } from '../types';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const allTransactions = await db.transactions.toArray();
    
    const income = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    setTransactions(allTransactions.slice(-10).reverse());
    setStats({
      balance: income - expenses,
      totalIncome: income,
      totalExpenses: expenses
    });
  }

  const formatCurrency = (amount: number) => {
    const currency = i18n.language === 'tr' ? '₺' : '$';
    return `${currency}${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;
  };

  const getCategoryLabel = (category: string, type: string) => {
    return t(`categories.${type}.${category}`) || category;
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Balance Card */}
      <div className="balance-card animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="balance-card-label">{t('dashboard.balance')}</p>
            <p className="balance-card-value">{formatCurrency(stats.balance)}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-sm text-slate-400">{t('dashboard.income')}</p>
            <p className="text-lg font-semibold text-emerald-400">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('dashboard.expenses')}</p>
            <p className="text-lg font-semibold text-rose-400">{formatCurrency(stats.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.income')}</p>
            <p className="font-semibold text-gray-900">{formatCurrency(stats.totalIncome)}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.expenses')}</p>
            <p className="font-semibold text-gray-900">{formatCurrency(stats.totalExpenses)}</p>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="section-header">
          <h3 className="section-title">{t('dashboard.recentTransactions')}</h3>
        </div>

        {transactions.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="empty-state-title">{t('dashboard.noTransactions')}</p>
            <p className="empty-state-description">
              İlk işlemini eklemek için aşağıdaki + butonunu kullan
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="transaction-item group">
                <div className={`transaction-icon ${
                  transaction.type === 'income' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : transaction.type === 'expense'
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-amber-100 text-amber-600'
                }`}>
                  {transaction.type === 'income' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                    </svg>
                  )}
                </div>
                
                <div className="transaction-details">
                  <p className="transaction-title">{transaction.description}</p>
                  <p className="transaction-subtitle">
                    {getCategoryLabel(transaction.category, transaction.type)}
                  </p>
                </div>
                
                <div className="transaction-amount">
                  <span className={transaction.type === 'income' ? 'amount-positive' : 'amount-negative'}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
