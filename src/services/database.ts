import Dexie, { Table } from 'dexie';

export interface Transaction {
  id?: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  createdAt: Date;
}

export interface Debt {
  id?: number;
  lender: string;
  borrower: string;
  amount: number;
  description: string;
  dueDate?: Date;
  status: 'pending' | 'paid' | 'overdue';
  isInstallment: boolean;
  installmentCount: number;
  paidDate?: Date;
  paidNote?: string;
  createdAt: Date;
}

export interface Goal {
  id?: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  deadline?: Date;
  createdAt: Date;
}

export interface Settings {
  id?: number;
  key: string;
  value: string;
}

class FinanceDatabase extends Dexie {
  transactions!: Table<Transaction>;
  debts!: Table<Debt>;
  goals!: Table<Goal>;
  settings!: Table<Settings>;

  constructor() {
    super('FinanceTrackerDB');
    this.version(1).stores({
      transactions: '++id, type, date, createdAt',
      debts: '++id, status, dueDate, createdAt',
      goals: '++id, category, createdAt',
      settings: 'key'
    });
  }
}

export const db = new FinanceDatabase();
