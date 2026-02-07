export type TransactionType = 'income' | 'expense' | 'debt';
export type DebtStatus = 'pending' | 'paid' | 'overdue';

export interface TransactionFormData {
  type: TransactionType;
  amount: number;
  description: string;
  category: string;
  date: Date;
}

export interface DebtFormData {
  lender: string;
  borrower: string;
  amount: number;
  description: string;
  dueDate?: Date;
}

export interface GoalFormData {
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline?: Date;
}

export interface DashboardStats {
  balance: number;
  totalIncome: number;
  totalExpenses: number;
  upcomingPayments: number;
}
