import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { db, Income, Expense } from '../services/database';

export default function Dashboard() {
  const { t, i18n } = useTranslation();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState({
    totalIncome: 0,
    receivedIncome: 0,
    pendingIncome: 0,
    totalExpense: 0,
    paidExpense: 0,
    unpaidExpense: 0,
    netBalance: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const allIncomes = await db.incomes
      .where('month').equals(currentMonth)
      .and(i => i.year === currentYear)
      .toArray();
    
    const allExpenses = await db.expenses
      .where('month').equals(currentMonth)
      .and(e => e.year === currentYear)
      .toArray();

    const totalIncome = allIncomes.reduce((sum, i) => sum + i.amount, 0);
    const receivedIncome = allIncomes.filter(i => i.received).reduce((sum, i) => sum + i.amount, 0);
    const pendingIncome = totalIncome - receivedIncome;

    const totalExpense = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const paidExpense = allExpenses.filter(e => e.paid).reduce((sum, e) => sum + e.amount, 0);
    const unpaidExpense = totalExpense - paidExpense;

    setIncomes(allIncomes.slice(-5).reverse());
    setExpenses(allExpenses.slice(-5).reverse());
    setStats({
      totalIncome,
      receivedIncome,
      pendingIncome,
      totalExpense,
      paidExpense,
      unpaidExpense,
      netBalance: receivedIncome - paidExpense
    });
  }

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
    <div className="space-y-6 pb-24">
      {/* Budget Overview Card */}
      <div className="balance-card animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="balance-card-label">{t('dashboard.netBalance')}</p>
            <p className="balance-card-value">{formatCurrency(stats.netBalance)}</p>
          </div>
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
          <div>
            <p className="text-sm text-slate-400">{t('dashboard.income')} ({t('dashboard.received')})</p>
            <p className="text-lg font-semibold text-emerald-400">{formatCurrency(stats.receivedIncome)}</p>
            {stats.pendingIncome > 0 && (
              <p className="text-xs text-slate-400">{t('dashboard.pending')}: {formatCurrency(stats.pendingIncome)}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-slate-400">{t('dashboard.expenses')} ({t('dashboard.paid')})</p>
            <p className="text-lg font-semibold text-rose-400">{formatCurrency(stats.paidExpense)}</p>
            {stats.unpaidExpense > 0 && (
              <p className="text-xs text-slate-400">{t('dashboard.unpaid')}: {formatCurrency(stats.unpaidExpense)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <h3 className="section-title mb-4">{t('dashboard.thisMonth')}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">{t('dashboard.total')} {t('dashboard.income')}</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalIncome)}</p>
          </div>
          <div className="text-center p-3 bg-rose-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">{t('dashboard.total')} {t('dashboard.expenses')}</p>
            <p className="text-lg font-bold text-rose-600">{formatCurrency(stats.totalExpense)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <Link to="/income" className="card flex items-center gap-3 hover:border-emerald-300 transition-all">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{t('income.title')}</p>
            <p className="text-xs text-gray-500">+ {formatCurrency(stats.pendingIncome)}</p>
          </div>
        </Link>

        <Link to="/expense" className="card flex items-center gap-3 hover:border-rose-300 transition-all">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{t('expense.title')}</p>
            <p className="text-xs text-gray-500">- {formatCurrency(stats.unpaidExpense)}</p>
          </div>
        </Link>
      </div>

      {/* Pending Incomes */}
      {stats.pendingIncome > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="section-header">
            <h3 className="section-title">{t('dashboard.income')} - {t('dashboard.pending')}</h3>
          </div>
          <div className="space-y-2">
            {incomes.filter(i => !i.received).slice(0, 3).map((income) => (
              <div key={income.id} className="card flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t(`income.${income.type}`)}</p>
                    <p className="text-xs text-gray-500">{income.expectedDate}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-amber-600">{formatCurrency(income.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unpaid Expenses */}
      {stats.unpaidExpense > 0 && (
        <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="section-header">
            <h3 className="section-title">{t('dashboard.expenses')} - {t('dashboard.unpaid')}</h3>
          </div>
          <div className="space-y-2">
            {expenses.filter(e => !e.paid).slice(0, 3).map((expense) => (
              <div key={expense.id} className="card flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t(`expense.${expense.category}`)}</p>
                    <p className="text-xs text-gray-500">{expense.dueDate}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-amber-600">{formatCurrency(expense.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {stats.totalIncome === 0 && stats.totalExpense === 0 && (
        <div className="empty-state animate-fade-in">
          <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="empty-state-title">{t('dashboard.noTransactions')}</p>
          <p className="empty-state-description">
            {t('dashboard.emptyStateDescription')}
          </p>
          <div className="flex gap-3 mt-4">
            <Link to="/income" className="btn btn-primary flex-1">
              {t('dashboard.addIncome')}
            </Link>
            <Link to="/expense" className="btn btn-secondary flex-1">
              {t('dashboard.addExpense')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
