import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, Debt } from '../services/database';

export default function Debts() {
  const { t } = useTranslation();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    lender: '',
    borrower: '',
    amount: '',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    const allDebts = await db.debts.toArray();
    setDebts(allDebts);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await db.debts.add({
      lender: formData.lender,
      borrower: formData.borrower,
      amount: parseFloat(formData.amount),
      description: formData.description,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      status: 'pending',
      createdAt: new Date()
    });

    setShowForm(false);
    setFormData({ lender: '', borrower: '', amount: '', description: '', dueDate: '' });
    loadDebts();
  };

  const markAsPaid = async (debt: Debt) => {
    await db.debts.update(debt.id!, { status: 'paid' });
    loadDebts();
  };

  const deleteDebt = async (debt: Debt) => {
    await db.debts.delete(debt.id!);
    loadDebts();
  };

  const totalDebt = debts.filter(d => d.status === 'pending' && d.lender !== '').reduce((sum, d) => sum + d.amount, 0);
  const totalReceivable = debts.filter(d => d.status === 'pending' && d.borrower !== '').reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('debts.title')}</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {t('debts.addDebt')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card bg-red-50 border-red-100">
          <p className="text-sm text-red-600 font-medium">{t('debts.totalDebt')}</p>
          <p className="text-xl font-bold text-red-700">${totalDebt.toFixed(2)}</p>
        </div>
        <div className="card bg-green-50 border-green-100">
          <p className="text-sm text-green-600 font-medium">{t('debts.totalReceivable')}</p>
          <p className="text-xl font-bold text-green-700">${totalReceivable.toFixed(2)}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('debts.lender')}</label>
            <input
              type="text"
              value={formData.lender}
              onChange={(e) => setFormData({ ...formData, lender: e.target.value })}
              className="input"
              placeholder="Who lent you money?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('debts.borrower')}</label>
            <input
              type="text"
              value={formData.borrower}
              onChange={(e) => setFormData({ ...formData, borrower: e.target.value })}
              className="input"
              placeholder="Who owes you money?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="input"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              placeholder="Enter description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="card">
        {debts.length === 0 ? (
          <p className="text-gray-500 text-center py-4">{t('debts.noDebts')}</p>
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => (
              <div key={debt.id} className="py-3 border-b border-gray-100 last:border-0">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{debt.description || 'Debt'}</p>
                    <p className="text-sm text-gray-500">
                      {debt.lender ? `From: ${debt.lender}` : `To: ${debt.borrower}`}
                    </p>
                    {debt.dueDate && (
                      <p className="text-sm text-gray-500">Due: {new Date(debt.dueDate).toLocaleDateString()}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">${debt.amount.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      debt.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {debt.status}
                    </span>
                  </div>
                </div>
                {debt.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => markAsPaid(debt)} className="btn btn-secondary text-sm flex-1">
                      Mark Paid
                    </button>
                    <button onClick={() => deleteDebt(debt)} className="text-red-500 text-sm px-3">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
