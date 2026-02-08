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
  amount: number;
  description?: string;
  dueDate: string;
  status: 'pending' | 'paid';
  paidDate?: string;
  note?: string;
  isInstallment?: boolean;
  installmentCount?: number;
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
  goals!: Table<Goal>;

  constructor() {
    super('FinanceTrackerDB');
    this.version(3).stores({
      incomes: '++id, type, received, month, year, createdAt',
      expenses: '++id, category, paid, month, year, createdAt',
      debts: '++id, personName, direction, status, dueDate, createdAt',
      goals: '++id, name, category, deadline, createdAt'
    });
  }
}

export const db = new FinanceDatabase();
