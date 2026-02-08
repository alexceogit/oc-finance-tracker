import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, Goal } from '../services/database';

// Goal category icons mapping
const goalIcons: Record<string, string> = {
  'Emergency Fund': '🛡️',
  'Vacation': '✈️',
  'Car': '🚗',
  'Home': '🏠',
  'Education': '📚',
  'Other': '🎯',
  'Debt Payoff': '💳',
  'Investment': '📈',
  'Wedding': '💒',
  'Electronics': '📱',
  'Retirement': '🏖️',
};

export default function Goals() {
  const { t, i18n } = useTranslation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [completingGoal, setCompletingGoal] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    category: 'Other',
    deadline: ''
  });

  const goalCategories = [
    'Emergency Fund', 'Vacation', 'Car', 'Home', 'Education', 
    'Debt Payoff', 'Investment', 'Wedding', 'Electronics', 'Retirement', 'Other'
  ];

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    const allGoals = await db.goals.orderBy('createdAt').reverse().toArray();
    setGoals(allGoals);
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

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const getDaysRemaining = (deadline?: Date) => {
    if (!deadline) return null;
    const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await db.goals.add({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount) || 0,
      category: formData.category,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      createdAt: new Date()
    });

    setShowForm(false);
    setFormData({ name: '', targetAmount: '', currentAmount: '0', category: 'Other', deadline: '' });
    loadGoals();
  };

  const updateProgress = async (goal: Goal, additionalAmount: number) => {
    if (!goal.id) return;
    
    const newAmount = Math.min(goal.currentAmount + additionalAmount, goal.targetAmount);
    const wasIncomplete = goal.currentAmount < goal.targetAmount;
    
    await db.goals.update(goal.id, { currentAmount: newAmount });
    
    if (wasIncomplete && newAmount >= goal.targetAmount) {
      setCompletingGoal(goal.id!);
      setTimeout(() => setCompletingGoal(null), 3000);
    }
    
    loadGoals();
  };

  const markAsComplete = async (goal: Goal) => {
    if (!goal.id) return;
    
    await db.goals.update(goal.id, { currentAmount: goal.targetAmount });
    setCompletingGoal(goal.id!);
    setTimeout(() => setCompletingGoal(null), 3000);
    loadGoals();
  };

  const deleteGoal = async (goal: Goal) => {
    if (!goal.id) return;
    await db.goals.delete(goal.id);
    loadGoals();
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-emerald-500';
    if (progress >= 75) return 'bg-emerald-400';
    if (progress >= 50) return 'bg-amber-400';
    if (progress >= 25) return 'bg-orange-400';
    return 'bg-rose-400';
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('goals.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {goals.filter(g => g.currentAmount >= g.targetAmount).length}/{goals.length} {t('goals.completed')}
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('goals.addGoal')}
        </button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <div className="card animate-fade-in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('goals.goalName')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder={t('goals.goalNamePlaceholder') || 'e.g., New Car'}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('goals.target')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  className="input"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('goals.current')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  className="input"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('goals.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                required
              >
                {goalCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {goalIcons[cat] || '🎯'} {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('goals.deadline')} ({t('common.optional')})
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="input"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn btn-primary flex-1">
                {t('goals.saveGoal')}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)} 
                className="btn btn-secondary"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="empty-state animate-slide-up">
            <svg className="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="empty-state-title">{t('goals.noGoals')}</p>
            <p className="empty-state-description">
              {t('goals.noGoalsDescription')}
            </p>
            <button 
              onClick={() => setShowForm(true)}
              className="btn btn-primary mt-4"
            >
              {t('goals.addFirstGoal')}
            </button>
          </div>
        ) : (
          goals.map((goal, index) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysRemaining = getDaysRemaining(goal.deadline);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const isCelebrating = completingGoal === goal.id;

            return (
              <div 
                key={goal.id} 
                className={`card card-hover animate-slide-up ${isCelebrating ? 'ring-2 ring-emerald-400 ring-offset-2' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Celebration Overlay */}
                {isCelebrating && (
                  <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl pointer-events-none overflow-hidden">
                    <div className="celebration-container">
                      <span className="celebration-emoji" style={{ '--delay': '0s' }}>🎉</span>
                      <span className="celebration-emoji" style={{ '--delay': '0.2s' }}>🏆</span>
                      <span className="celebration-emoji" style={{ '--delay': '0.4s' }}>✨</span>
                      <span className="celebration-emoji" style={{ '--delay': '0.6s' }}>🎊</span>
                      <span className="celebration-emoji" style={{ '--delay': '0.8s' }}>⭐</span>
                    </div>
                  </div>
                )}

                <div className="relative">
                  {/* Goal Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-gray-100 rounded-xl flex items-center justify-center text-2xl">
                        {goalIcons[goal.category] || '🎯'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">{goal.name}</h3>
                        <p className="text-sm text-gray-500">{goal.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isCompleted ? (
                        <span className="badge badge-success">
                          <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {t('goals.completed')}
                        </span>
                      ) : (
                        <button
                          onClick={() => markAsComplete(goal)}
                          className="btn btn-ghost text-emerald-600 text-sm p-2"
                          title={t('goals.markComplete')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm(t('goals.deleteConfirm'))) {
                            deleteGoal(goal);
                          }
                        }}
                        className="btn btn-ghost text-gray-400 hover:text-rose-500 p-2"
                        title={t('common.delete')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-sm text-gray-500">{t('goals.progress')}</p>
                        <p className={`text-2xl font-bold ${isCompleted ? 'text-emerald-600' : 'text-gray-900'}`}>
                          {formatCurrency(goal.currentAmount)}
                          <span className="text-sm font-normal text-gray-400 mx-1">
                            / {formatCurrency(goal.targetAmount)}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600">
                          {progress.toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress)} ${isCompleted ? 'animate-progress-complete' : ''}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick Add Progress */}
                  {!isCompleted && (
                    <div className="flex gap-2 mb-3">
                      {[100, 500, 1000].map((amount) => {
                        const savedCurrency = localStorage.getItem('currency') || 'TRY';
                        const symbols: Record<string, string> = { TRY: '₺', USD: '$', GBP: '£' };
                        const symbol = symbols[savedCurrency] || '₺';
                        const label = `+${symbol}${amount.toLocaleString()}`;
                        return (
                          <button
                            key={amount}
                            onClick={() => updateProgress(goal, amount)}
                            className="btn btn-secondary text-xs flex-1 py-2"
                            disabled={remaining < amount}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      {!isCompleted && remaining > 0 && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{formatCurrency(remaining)}</span> {t('goals.remaining')}
                        </p>
                      )}
                      
                      {goal.deadline && daysRemaining !== null && (
                        <p className={`text-sm ${daysRemaining < 0 ? 'text-rose-500' : daysRemaining < 7 ? 'text-amber-500' : 'text-gray-500'}`}>
                          {daysRemaining < 0 
                            ? t('goals.deadlinePassed')
                            : daysRemaining === 0 
                              ? t('goals.deadlineToday')
                              : t('goals.deadlineDays', { count: daysRemaining })
                          }
                        </p>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      {t('goals.createdOn', { date: new Date(goal.createdAt).toLocaleDateString(i18n.language) })}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Completion Celebration Styles */}
      <style>{`
        @keyframes celebration-bounce {
          0%, 100% { transform: translateY(0) rotate(0); opacity: 1; }
          25% { transform: translateY(-20px) rotate(-10deg); }
          50% { transform: translateY(-10px) rotate(5deg); }
          75% { transform: translateY(-15px) rotate(-5deg); }
        }
        
        .celebration-container {
          position: absolute;
          inset: 0;
          display: flex;
          justify-center items-center;
          gap: 0.5rem;
        }
        
        .celebration-emoji {
          font-size: 1.5rem;
          animation: celebration-bounce 0.6s ease-in-out infinite;
          animation-delay: var(--delay);
        }
        
        @keyframes progress-complete-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
        }
        
        .animate-progress-complete {
          animation: progress-complete-pulse 1s ease-out infinite;
        }
      `}</style>
    </div>
  );
}
