import {
  users,
  children,
  userChildren,
  expenses,
  receipts,
  lawyers,
  legalCases,
  type User,
  type UpsertUser,
  type Child,
  type InsertChild,
  type UserChild,
  type InsertUserChild,
  type Expense,
  type InsertExpense,
  type ExpenseWithDetails,
  type Receipt,
  type InsertReceipt,
  type ChildWithParents,
  type Lawyer,
  type InsertLawyer,
  type LegalCase,
  type InsertLegalCase,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, sum, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  upsertUserWithId(id: string, user: UpsertUser): Promise<User>;
  
  // Children operations
  getChildren(userId: string): Promise<ChildWithParents[]>;
  createChild(child: InsertChild): Promise<Child>;
  updateChild(id: string, child: Partial<InsertChild>): Promise<Child>;
  deleteChild(id: string): Promise<void>;
  
  // User-Child relationships
  addUserChild(relationship: InsertUserChild): Promise<UserChild>;
  getUserChildren(userId: string): Promise<UserChild[]>;
  
  // Expense operations
  getExpenses(userId: string, filters?: {
    childId?: string;
    category?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ExpenseWithDetails[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  
  // Receipt operations
  getReceipts(expenseId: string): Promise<Receipt[]>;
  createReceipt(receipt: InsertReceipt): Promise<Receipt>;
  deleteReceipt(id: string): Promise<void>;
  
  // Dashboard statistics
  getDashboardStats(userId: string): Promise<{
    totalSpent: number;
    pendingAmount: number;
    childrenCount: number;
    receiptsCount: number;
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
    recentExpenses: ExpenseWithDetails[];
  }>;

  // Lawyer operations
  getLawyers(userId: string): Promise<Lawyer[]>;
  createLawyer(lawyer: InsertLawyer): Promise<Lawyer>;
  updateLawyer(id: string, lawyer: Partial<InsertLawyer>): Promise<Lawyer>;
  deleteLawyer(id: string): Promise<void>;

  // Legal Case operations
  getLegalCases(userId: string): Promise<(LegalCase & { lawyer?: Lawyer | null })[]>;
  createLegalCase(legalCase: InsertLegalCase): Promise<LegalCase>;
  updateLegalCase(id: string, legalCase: Partial<InsertLegalCase>): Promise<LegalCase>;
  deleteLegalCase(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async upsertUserWithId(id: string, userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({ ...userData, id })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Children operations
  async getChildren(userId: string): Promise<ChildWithParents[]> {
    return await db.query.children.findMany({
      with: {
        userChildren: {
          where: eq(userChildren.userId, userId),
          with: {
            user: true,
          },
        },
      },
    });
  }

  async createChild(child: InsertChild): Promise<Child> {
    const [newChild] = await db
      .insert(children)
      .values(child)
      .returning();
    return newChild;
  }

  async updateChild(id: string, child: Partial<InsertChild>): Promise<Child> {
    const [updatedChild] = await db
      .update(children)
      .set({ ...child, updatedAt: new Date() })
      .where(eq(children.id, id))
      .returning();
    return updatedChild;
  }

  async deleteChild(id: string): Promise<void> {
    await db.delete(children).where(eq(children.id, id));
  }

  // User-Child relationships
  async addUserChild(relationship: InsertUserChild): Promise<UserChild> {
    const [newRelationship] = await db
      .insert(userChildren)
      .values(relationship)
      .returning();
    return newRelationship;
  }

  async getUserChildren(userId: string): Promise<UserChild[]> {
    return await db
      .select()
      .from(userChildren)
      .where(eq(userChildren.userId, userId));
  }

  // Expense operations
  async getExpenses(
    userId: string,
    filters?: {
      childId?: string;
      category?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<ExpenseWithDetails[]> {
    const conditions = [eq(expenses.userId, userId)];
    
    if (filters?.childId) {
      conditions.push(eq(expenses.childId, filters.childId));
    }
    if (filters?.category) {
      conditions.push(eq(expenses.category, filters.category));
    }
    if (filters?.status) {
      conditions.push(eq(expenses.status, filters.status));
    }
    if (filters?.startDate) {
      conditions.push(gte(expenses.expenseDate, filters.startDate.toISOString().split('T')[0]));
    }
    if (filters?.endDate) {
      conditions.push(lte(expenses.expenseDate, filters.endDate.toISOString().split('T')[0]));
    }

    return await db.query.expenses.findMany({
      where: and(...conditions),
      with: {
        child: true,
        user: true,
        receipts: true,
      },
      orderBy: desc(expenses.createdAt),
    });
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const [newExpense] = await db
      .insert(expenses)
      .values(expense)
      .returning();
    return newExpense;
  }

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updatedExpense] = await db
      .update(expenses)
      .set({ ...expense, updatedAt: new Date() })
      .where(eq(expenses.id, id))
      .returning();
    return updatedExpense;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // Receipt operations
  async getReceipts(expenseId: string): Promise<Receipt[]> {
    return await db
      .select()
      .from(receipts)
      .where(eq(receipts.expenseId, expenseId));
  }

  async createReceipt(receipt: InsertReceipt): Promise<Receipt> {
    const [newReceipt] = await db
      .insert(receipts)
      .values(receipt)
      .returning();
    return newReceipt;
  }

  async deleteReceipt(id: string): Promise<void> {
    await db.delete(receipts).where(eq(receipts.id, id));
  }

  // Dashboard statistics
  async getDashboardStats(userId: string): Promise<{
    totalSpent: number;
    pendingAmount: number;
    childrenCount: number;
    receiptsCount: number;
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
    recentExpenses: ExpenseWithDetails[];
  }> {
    // Get total spent
    const totalSpentResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(eq(expenses.userId, userId));
    
    const totalSpent = parseFloat(totalSpentResult[0]?.total || "0");

    // Get pending amount
    const pendingResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(eq(expenses.userId, userId), eq(expenses.status, "pendente")));
    
    const pendingAmount = parseFloat(pendingResult[0]?.total || "0");

    // Get children count
    const childrenCountResult = await db
      .select({ count: count() })
      .from(userChildren)
      .where(eq(userChildren.userId, userId));
    
    const childrenCount = childrenCountResult[0]?.count || 0;

    // Get receipts count
    const receiptsCountResult = await db
      .select({ count: count() })
      .from(receipts)
      .leftJoin(expenses, eq(receipts.expenseId, expenses.id))
      .where(eq(expenses.userId, userId));
    
    const receiptsCount = receiptsCountResult[0]?.count || 0;

    // Get category breakdown
    const categoryResult = await db
      .select({
        category: expenses.category,
        total: sum(expenses.amount),
      })
      .from(expenses)
      .where(eq(expenses.userId, userId))
      .groupBy(expenses.category);

    const categoryBreakdown = categoryResult.map(item => ({
      category: item.category,
      amount: parseFloat(item.total || "0"),
      percentage: totalSpent > 0 ? (parseFloat(item.total || "0") / totalSpent) * 100 : 0,
    }));

    // Get recent expenses
    const recentExpenses = await this.getExpenses(userId);

    return {
      totalSpent,
      pendingAmount,
      childrenCount,
      receiptsCount,
      categoryBreakdown,
      recentExpenses: recentExpenses.slice(0, 10), // Last 10 expenses
    };
  }

  // Lawyer operations
  async getLawyers(userId: string): Promise<Lawyer[]> {
    return await db
      .select()
      .from(lawyers)
      .where(eq(lawyers.userId, userId))
      .orderBy(desc(lawyers.createdAt));
  }

  async createLawyer(lawyer: InsertLawyer): Promise<Lawyer> {
    const [newLawyer] = await db
      .insert(lawyers)
      .values(lawyer)
      .returning();
    return newLawyer;
  }

  async updateLawyer(id: string, lawyer: Partial<InsertLawyer>): Promise<Lawyer> {
    const [updatedLawyer] = await db
      .update(lawyers)
      .set({ ...lawyer, updatedAt: new Date() })
      .where(eq(lawyers.id, id))
      .returning();
    return updatedLawyer;
  }

  async deleteLawyer(id: string): Promise<void> {
    await db.delete(lawyers).where(eq(lawyers.id, id));
  }

  // Legal Case operations
  async getLegalCases(userId: string): Promise<(LegalCase & { lawyer?: Lawyer | null })[]> {
    return await db.query.legalCases.findMany({
      where: eq(legalCases.userId, userId),
      with: {
        lawyer: true,
      },
      orderBy: desc(legalCases.createdAt),
    });
  }

  async createLegalCase(legalCase: InsertLegalCase): Promise<LegalCase> {
    const [newLegalCase] = await db
      .insert(legalCases)
      .values(legalCase)
      .returning();
    return newLegalCase;
  }

  async updateLegalCase(id: string, legalCase: Partial<InsertLegalCase>): Promise<LegalCase> {
    const [updatedLegalCase] = await db
      .update(legalCases)
      .set({ ...legalCase, updatedAt: new Date() })
      .where(eq(legalCases.id, id))
      .returning();
    return updatedLegalCase;
  }

  async deleteLegalCase(id: string): Promise<void> {
    await db.delete(legalCases).where(eq(legalCases.id, id));
  }
}

export const storage = new DatabaseStorage();
