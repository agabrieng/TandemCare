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
  boolean,
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
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
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
  expenseDate: text("expense_date").notNull(), // Store as YYYY-MM-DD string to avoid timezone issues
  category: varchar("category", { length: 100 }).notNull(), // 'educação', 'saúde', 'alimentação', etc.
  status: varchar("status", { length: 50 }).notNull().default("pendente"), // 'pendente', 'pago', 'reembolsado'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Categories table - User-defined expense categories
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // user who created the category
  name: varchar("name", { length: 100 }).notNull(), // category name
  icon: varchar("icon", { length: 50 }), // icon/emoji (optional)
  color: varchar("color", { length: 20 }), // color code (optional)  
  isDefault: boolean("is_default").default(false), // false for custom categories, true for system default
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  uniqueUserCategory: sql`CONSTRAINT categories_user_name_unique UNIQUE (${table.userId}, ${table.name})`,
}));

// Receipts/Documents table
export const receipts = pgTable("receipts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  expenseId: uuid("expense_id").notNull(),
  filePath: varchar("file_path", { length: 255 }).notNull(), // object storage path
  fileType: varchar("file_type", { length: 50 }), // 'image/jpeg', 'application/pdf'
  fileName: varchar("file_name", { length: 255 }),
  originalFileName: varchar("original_file_name", { length: 255 }), // nome original do arquivo (antes da conversão)
  originalFileType: varchar("original_file_type", { length: 50 }), // tipo original do arquivo (ex: 'application/pdf')
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Legal Information - Lawyers/Attorneys table
export const lawyers = pgTable("lawyers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // parent who registered the lawyer
  fullName: varchar("full_name", { length: 200 }).notNull(),
  oabNumber: varchar("oab_number", { length: 50 }), // Ordem dos Advogados do Brasil registration
  oabState: varchar("oab_state", { length: 5 }), // UF do estado da OAB
  lawFirm: varchar("law_firm", { length: 200 }), // nome do escritório
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  specializations: text("specializations").array(), // especialidades (direito de família, etc.)
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Legal Cases - Divorce/Custody proceedings table
export const legalCases = pgTable("legal_cases", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(), // parent who registered the case
  lawyerId: uuid("lawyer_id"), // associated lawyer (optional)
  caseType: varchar("case_type", { length: 100 }).notNull(), // 'divórcio', 'guarda compartilhada', 'pensão alimentícia'
  caseNumber: varchar("case_number", { length: 100 }), // número do processo
  courtName: varchar("court_name", { length: 200 }), // nome da vara/tribunal
  judgeName: varchar("judge_name", { length: 200 }), // nome do juiz
  startDate: date("start_date"), // data de início do processo
  expectedEndDate: date("expected_end_date"), // previsão de conclusão
  status: varchar("status", { length: 50 }).default("em_andamento"), // 'em_andamento', 'concluído', 'suspenso'
  childrenInvolved: uuid("children_involved").array(), // IDs dos filhos envolvidos no processo
  custodyType: varchar("custody_type", { length: 100 }), // 'compartilhada', 'unilateral', etc.
  alimonyAmount: decimal("alimony_amount", { precision: 10, scale: 2 }), // valor da pensão alimentícia
  visitationSchedule: text("visitation_schedule"), // cronograma de visitas
  importantDates: jsonb("important_dates"), // datas importantes do processo
  documents: text("documents").array(), // lista de documentos importantes
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  userChildren: many(userChildren),
  expenses: many(expenses),
  categories: many(categories),
  lawyers: many(lawyers),
  legalCases: many(legalCases),
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

export const categoriesRelations = relations(categories, ({ one }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
}));

export const lawyersRelations = relations(lawyers, ({ one, many }) => ({
  user: one(users, {
    fields: [lawyers.userId],
    references: [users.id],
  }),
  legalCases: many(legalCases),
}));

export const legalCasesRelations = relations(legalCases, ({ one }) => ({
  user: one(users, {
    fields: [legalCases.userId],
    references: [users.id],
  }),
  lawyer: one(lawyers, {
    fields: [legalCases.lawyerId],
    references: [lawyers.id],
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

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().trim().min(1, "Nome da categoria é obrigatório"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido").optional(),
});

export const insertLawyerSchema = createInsertSchema(lawyers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLegalCaseSchema = createInsertSchema(legalCases).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  alimonyAmount: z.string().optional().refine((val) => !val || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0), "Alimony amount must be a positive number or empty"),
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
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;
export type InsertLawyer = z.infer<typeof insertLawyerSchema>;
export type Lawyer = typeof lawyers.$inferSelect;
export type InsertLegalCase = z.infer<typeof insertLegalCaseSchema>;
export type LegalCase = typeof legalCases.$inferSelect;

// Extended types for joined data
export type ExpenseWithDetails = Expense & {
  child: Child;
  user: User;
  receipts: Receipt[];
};

export type ChildWithParents = Child & {
  userChildren: (UserChild & { user: User })[];
};
