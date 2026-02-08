import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, Debt } from '../services/database';

export default function Debts() {
  const { t, i18n } = useTranslation();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [formData, setFormData] = useState({
    personName: '',
    direction: 'borrow' as 'borrow' | 'lend',
    amount: '',
    description: '',
    dueDate: ''
  });

  useEffect(() => {
    loadDebts();
  }, []);

  async function loadDebts() {
    const allDebts = await db.debts.orderBy('createdAt').reverse().toArray();
    setDebts(allDebts);
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

  const formatDate = (date: Date | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString(i18n.language === 'tr' ? 'tr-TR' : 'en-US');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await db.debts.add({
      lender: formData.direction === 'lend' ? formData.personName : '',
      borrower: formData.direction === 'borrow' ? formData.personName : '',
      amount: parseFloat(formData.amount),
      description: formData.description,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
      status: 'pending',
      createdAt: new Date()
    });

    setShowForm(false);
    setFormData({ personName: '', direction: 'borrow', amount: '', description: '', dueDate: '' });
    loadDebts();
  };

  const markAsSettled = async (debt: Debt) => {
    await db.debts.update(debt.id!, { status: 'paid' });
    loadDebts();
  };

  const deleteDebt = async (debt: Debt) => {
    await db.debts.delete(debt.id!);
    loadDebts();
  };

  // Calculate totals
  const owedToOthers = debts
    .filter(d => d.status === 'pending' && d.lender !== '')
    .reduce((sum, d) => sum + d.amount, 0);
  
  const owedByOthers = debts
    .filter(d => d.status === 'pending' && d.borrower !== '')
    .reduce((sum, d) => sum + d.amount, 0);

  // Filter debts based on active tab
  const filteredDebts = debts.filter(debt => {
    if (activeTab === 'all') return true;
    if (activeTab === 'paid') return debt.status === 'paid';
    return debt.status === 'pending';
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="status-badge status-paid">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t('debts.statusPaid')}
          </span>
        );
      case 'overdue':
        return (
          <span className="status-badge status-overdue">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('debts.statusOverdue')}
          </span>
        );
      default:
        return (
          <span className="status-badge status-pending">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t('debts.statusPending')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('debts.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('debts.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('debts.addDebt')}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="summary-card summary-card-danger">
          <div className="flex items-center gap-3">
            <div className="summary-icon bg-red-100">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <p className="summary-label">{t('debts.totalDebt')}</p>
              <p className="summary-value text-red-600">{formatCurrency(owedToOthers)}</p>
            </div>
          </div>
          <div className="summary-footer">
            <span className="summary-footer-text">{t('debts.owedToOthers')}</span>
          </div>
        </div>

        <div className="summary-card summary-card-success">
          <div className="flex items-center gap-3">
            <div className="summary-icon bg-emerald-100">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="summary-label">{t('debts.totalReceivable')}</p>
              <p className="summary-value text-emerald-600">{formatCurrency(owedByOthers)}</p>
            </div>
          </div>
          <div className="summary-footer">
            <span className="summary-footer-text">{t('debts.owedByOthers')}</span>
          </div>
        </div>
      </div>

      {/* Net Balance */}
      <div className="net-balance-card animate-slide-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{t('debts.netBalance')}</p>
            <p className={`text-2xl font-bold ${owedByOthers - owedToOthers >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(owedByOthers - owedToOthers)}
            </p>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
            owedByOthers - owedToOthers >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
          }`}>
            <svg className={`w-7 h-7 ${owedByOthers - owedToOthers >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Add Debt Form */}
      {showForm && (
        <div className="card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="card-header">
            <h3 className="card-title">{t('debts.addDebt')}</h3>
            <button onClick={() => setShowForm(false)} className="card-close">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Direction Selection */}
            <div className="form-group">
              <label className="form-label">{t('debts.type')}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'borrow' })}
                  className={`direction-btn ${formData.direction === 'borrow' ? 'direction-btn-active' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                  {t('debts.iOwe')}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, direction: 'lend' })}
                  className={`direction-btn ${formData.direction === 'lend' ? 'direction-btn-active' : ''}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {t('debts.owedToMe')}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">
                {formData.direction === 'borrow' ? t('debts.creditorName') : t('debts.debtorName')}
              </label>
              <input
                type="text"
                value={formData.personName}
                onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                className="input"
                placeholder={formData.direction === 'borrow' ? t('debts.placeholderCreditor') : t('debts.placeholderDebtor')}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('transaction.amount')}</label>
              <div className="relative">
                <span className="input-currency">
                  {(() => {
                    const savedCurrency = localStorage.getItem('currency') || 'TRY';
                    const symbols: Record<string, string> = { TRY: '₺', USD: '$', GBP: '£' };
                    return symbols[savedCurrency] || '₺';
                  })()}
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="input input-with-icon"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('transaction.description')}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                placeholder={t('common.placeholder.description')}
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t('debts.dueDate')}</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="input"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary flex-1">
                {t('debts.saveDebt')}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <button
          onClick={() => setActiveTab('all')}
          className={`tab-btn ${activeTab === 'all' ? 'tab-btn-active' : ''}`}
        >
          {t('debts.tabAll')}
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`tab-btn ${activeTab === 'pending' ? 'tab-btn-active' : ''}`}
        >
          {t('debts.tabActive')}
        </button>
        <button
          onClick={() => setActiveTab('paid')}
          className={`tab-btn ${activeTab === 'paid' ? 'tab-btn-active' : ''}`}
        >
          {t('debts.tabSettled')}
        </button>
      </div>

      {/* Debts List */}
      <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        {filteredDebts.length === 0 ? (
          <div className="empty-state">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="empty-state-title">{t('debts.noDebts')}</p>
            <p className="empty-state-description">
              {t('debts.emptyStateDescription')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDebts.map((debt) => (
              <div key={debt.id} className="debt-card">
                <div className="debt-card-header">
                  <div className="debt-avatar">
                    {debt.lender ? debt.lender.charAt(0).toUpperCase() : debt.borrower?.charAt(0).toUpperCase()}
                  </div>
                  <div className="debt-info">
                    <h4 className="debt-person">
                      {debt.lender || debt.borrower}
                    </h4>
                    <p className="debt-description">
                      {debt.description || (debt.lender ? t('debts.borrowedFrom') : t('debts.lentTo'))}
                    </p>
                  </div>
                  {getStatusBadge(debt.status)}
                </div>
                
                <div className="debt-card-body">
                  <div className="debt-amount-section">
                    <span className={`debt-amount ${debt.lender ? 'amount-negative' : 'amount-positive'}`}>
                      {debt.lender ? '-' : '+'}{formatCurrency(debt.amount)}
                    </span>
                    {debt.dueDate && (
                      <div className="debt-due-date">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{t('debts.due')}: {formatDate(debt.dueDate)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {debt.status === 'pending' && (
                  <div className="debt-card-actions">
                    <button
                      onClick={() => markAsSettled(debt)}
                      className="debt-action-btn debt-action-settle"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {t('debts.settle')}
                    </button>
                    <button
                      onClick={() => deleteDebt(debt)}
                      className="debt-action-btn debt-action-delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('common.delete')}
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
