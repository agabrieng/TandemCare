import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  decimal,
  date,
  index,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - parents/guardians
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Children table
export const children = pgTable("children", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }),
  dateOfBirth: date("date_of_birth"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Junction table for user-children relationships
export const userChildren = pgTable("user_children", {
  userId: varchar("user_id").notNull(),
  childId: uuid("child_id").notNull(),
  relationship: varchar("relationship", { length: 50 }).notNull(), // 'pai', 'mãe', 'guardião'
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  pk: sql`CONSTRAINT user_children_pkey PRIMARY KEY (${table.userId}, ${table.childId})`,
}));

// Expenses table
export const expenses = pgTable("expenses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // who registered the expense
  childId: uuid("child_id").notNull(), // which child the expense relates to
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  expenseDate: date("expense_date").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // 'educação', 'saúde', 'alimentação', etc.
  status: varchar("status", { length: 50 }).notNull().default("pendente"), // 'pendente', 'pago', 'reembolsado'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Receipts/Documents table
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseId: uuid("expense_id").notNull(),
  filePath: varchar("file_path", { length: 255 }).notNull(), // object storage path
  fileType: varchar("file_type", { length: 50 }), // 'image/jpeg', 'application/pdf'
  fileName: varchar("file_name", { length: 255 }),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  userChildren: many(userChildren),
  expenses: many(expenses),
}));

export const childrenRelations = relations(children, ({ many }) => ({
  userChildren: many(userChildren),
  expenses: many(expenses),
}));

export const userChildrenRelations = relations(userChildren, ({ one }) => ({
  user: one(users, {
    fields: [userChildren.userId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [userChildren.childId],
    references: [children.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one, many }) => ({
  user: one(users, {
    fields: [expenses.userId],
    references: [users.id],
  }),
  child: one(children, {
    fields: [expenses.childId],
    references: [children.id],
  }),
  receipts: many(receipts),
}));

export const receiptsRelations = relations(receipts, ({ one }) => ({
  expense: one(expenses, {
    fields: [receipts.expenseId],
    references: [expenses.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChildSchema = createInsertSchema(children).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserChildSchema = createInsertSchema(userChildren).omit({
  createdAt: true,
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  amount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, "Amount must be a positive number"),
});

export const insertReceiptSchema = createInsertSchema(receipts).omit({
  id: true,
  uploadedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertChild = z.infer<typeof insertChildSchema>;
export type Child = typeof children.$inferSelect;
export type InsertUserChild = z.infer<typeof insertUserChildSchema>;
export type UserChild = typeof userChildren.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertReceipt = z.infer<typeof insertReceiptSchema>;
export type Receipt = typeof receipts.$inferSelect;

// Extended types for joined data
export type ExpenseWithDetails = Expense & {
  child: Child;
  user: User;
  receipts: Receipt[];
};

export type ChildWithParents = Child & {
  userChildren: (UserChild & { user: User })[];
};
