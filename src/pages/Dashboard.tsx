import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db } from '../services/database';
import { Transaction, Debt } from '../services/database';

export default function Dashboard() {
  const { t } = useTranslation();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [stats, setStats] = useState({
    balance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    upcomingPayments: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const allTransactions = await db.transactions.toArray();
    const allDebts = await db.debts
      .where('status')
      .equals('pending')
      .toArray();
    
    const income = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const upcoming = allDebts
      .filter(d => d.dueDate && new Date(d.dueDate) > new Date())
      .reduce((sum, d) => sum + d.amount, 0);

    setTransactions(allTransactions.slice(-5).reverse());
    setDebts(allDebts);
    setStats({
      balance: income - expenses,
      totalIncome: income,
      totalExpenses: expenses,
      upcomingPayments: upcoming
    });
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">{t('dashboard.title')}</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-primary-50 border-primary-100">
          <p className="text-sm text-primary-600 font-medium">{t('dashboard.balance')}</p>
          <p className="text-2xl font-bold text-primary-700">${stats.balance.toFixed(2)}</p>
        </div>
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm text-green-600 font-medium">{t('dashboard.income')}</p>
          <p className="text-2xl font-bold text-green-700">${stats.totalIncome.toFixed(2)}</p>
        </div>
        <div className="card bg-red-50 border-red-100">
          <p className="text-sm text-red-600 font-medium">{t('dashboard.expenses')}</p>
          <p className="text-2xl font-bold text-red-700">${stats.totalExpenses.toFixed(2)}</p>
        </div>
        <div className="card bg-yellow-50 border-yellow-100">
          <p className="text-sm text-yellow-600 font-medium">{t('dashboard.upcomingPayments')}</p>
          <p className="text-2xl font-bold text-yellow-700">${stats.upcomingPayments.toFixed(2)}</p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">{t('dashboard.recentTransactions')}</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t('dashboard.noTransactions')}</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <p className="text-sm text-gray-500">{transaction.category}</p>
                </div>
                <span className={`font-semibold ${
                  transaction.type === 'income' ? 'text-green-600' : 
                  transaction.type === 'expense' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
