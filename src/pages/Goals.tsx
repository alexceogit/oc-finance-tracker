import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { db, Goal } from '../services/database';

const goalCategories = ['Emergency Fund', 'Vacation', 'Car', 'Home', 'Education', 'Other'];

export default function Goals() {
  const { t } = useTranslation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    category: '',
    deadline: ''
  });

  useEffect(() => {
    loadGoals();
  }, []);

  async function loadGoals() {
    const allGoals = await db.goals.toArray();
    setGoals(allGoals);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await db.goals.add({
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount),
      category: formData.category,
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
      createdAt: new Date()
    });

    setShowForm(false);
    setFormData({ name: '', targetAmount: '', currentAmount: '0', category: '', deadline: '' });
    loadGoals();
  };

  const updateProgress = async (goal: Goal, additionalAmount: number) => {
    const newAmount = Math.min(goal.currentAmount + additionalAmount, goal.targetAmount);
    await db.goals.update(goal.id!, { currentAmount: newAmount });
    loadGoals();
  };

  const deleteGoal = async (goal: Goal) => {
    await db.goals.delete(goal.id!);
    loadGoals();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{t('goals.title')}</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          {t('goals.addGoal')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., New Car"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('goals.target')}</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('goals.current')}</label>
            <input
              type="number"
              step="0.01"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
              className="input"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="input"
              required
            >
              <option value="">Select category</option>
              {goalCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline (optional)</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="input"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-gray-500">{t('goals.noGoals')}</p>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            const remaining = goal.targetAmount - goal.currentAmount;
            
            return (
              <div key={goal.id} className="card">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{goal.name}</h3>
                    <p className="text-sm text-gray-500">{goal.category}</p>
                  </div>
                  <button onClick={() => deleteGoal(goal)} className="text-red-500 text-sm">
                    Delete
                  </button>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>${goal.currentAmount.toFixed(2)}</span>
                    <span>${goal.targetAmount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{progress.toFixed(1)}% complete</p>
                </div>

                {remaining > 0 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateProgress(goal, 100)}
                      className="btn btn-secondary text-sm flex-1"
                    >
                      + $100
                    </button>
                    <button 
                      onClick={() => updateProgress(goal, 500)}
                      className="btn btn-secondary text-sm flex-1"
                    >
                      + $500
                    </button>
                    <button 
                      onClick={() => updateProgress(goal, remaining)}
                      className="btn btn-primary text-sm flex-1"
                    >
                      Complete
                    </button>
                  </div>
                )}

                {goal.deadline && (
                  <p className="text-xs text-gray-500 mt-2">
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
