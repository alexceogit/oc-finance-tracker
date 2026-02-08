import Dexie, { Table } from 'dexie';

export interface Income {
  id?: number;
  type: 'salary' | 'freelance' | 'investment' | 'other';
  amount: number;
  expectedDate: string;
  received: boolean;
  receivedDate?: string;
  month: number;
  year: number;
  createdAt: Date;
}

export interface Expense {
  id?: number;
  category: 'bill' | 'rent' | 'transport' | 'insurance' | 'subscription' | 'other';
  description?: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  paidDate?: string;
  month: number;
  year: number;
  createdAt: Date;
}

export interface Debt {
  id?: number;
  personName: string;
  direction: 'borrow' | 'lend';
  originalAmount: number;
  remainingAmount: number;
  description?: string;
  dueDate?: string;
  status: 'pending' | 'partially_paid' | 'paid';
  createdAt: Date;
}

export interface DebtPayment {
  id?: number;
  debtId: number;
  amount: number;
  paymentDate: string;
  month: number;
  year: number;
  note?: string;
  createdAt: Date;
}

export interface Goal {
  id?: number;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  createdAt: Date;
}

class FinanceDatabase extends Dexie {
  incomes!: Table<Income>;
  expenses!: Table<Expense>;
  debts!: Table<Debt>;
  debtPayments!: Table<DebtPayment>;
  goals!: Table<Goal>;

  constructor() {
    super('FinanceTrackerDB');
    this.version(4).stores({
      incomes: '++id, type, received, month, year, createdAt',
      expenses: '++id, category, paid, month, year, createdAt',
      debts: '++id, personName, direction, status, createdAt',
      debtPayments: '++id, debtId, month, year, createdAt',
      goals: '++id, name, category, deadline, createdAt'
    });
  }
}

export const db = new FinanceDatabase();
