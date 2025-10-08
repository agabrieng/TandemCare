import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, objectStorageClient, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertChildSchema, insertExpenseSchema, insertReceiptSchema, insertLawyerSchema, insertLegalCaseSchema, insertCategorySchema, insertParentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getDashboardStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Children routes
  app.get('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const children = await storage.getChildren(userId);
      res.json(children);
    } catch (error) {
      console.error("Error fetching children:", error);
      res.status(500).json({ message: "Failed to fetch children" });
    }
  });

  app.post('/api/children', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const childData = insertChildSchema.parse(req.body);
      
      // Create child
      const child = await storage.createChild(childData);
      
      // Add user-child relationship
      await storage.addUserChild({
        userId,
        childId: child.id,
        relationship: req.body.relationship || 'pai/mãe',
      });
      
      res.status(201).json(child);
    } catch (error) {
      console.error("Error creating child:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create child" });
      }
    }
  });

  app.put('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const childData = insertChildSchema.partial().parse(req.body);
      const updatedChild = await storage.updateChild(id, childData);
      res.json(updatedChild);
    } catch (error) {
      console.error("Error updating child:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update child" });
      }
    }
  });

  app.delete('/api/children/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteChild(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting child:", error);
      res.status(500).json({ message: "Failed to delete child" });
    }
  });

  // Parents routes
  app.get('/api/parents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parents = await storage.getParents(userId);
      res.json(parents);
    } catch (error) {
      console.error("Error fetching parents:", error);
      res.status(500).json({ message: "Failed to fetch parents" });
    }
  });

  app.post('/api/parents', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertParentSchema.parse(req.body);
      const parentData = { ...validatedData, userId };
      
      const parent = await storage.createParent(parentData);
      res.status(201).json(parent);
    } catch (error) {
      console.error("Error creating parent:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create parent" });
      }
    }
  });

  app.put('/api/parents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar se o parent pertence ao usuário
      const existingParent = await storage.getParentById(id);
      if (!existingParent || existingParent.userId !== userId) {
        return res.status(404).json({ message: "Parent not found" });
      }
      
      // Remover userId do payload para prevenir alteração de ownership
      const { userId: _, ...updateData } = req.body;
      const parentData = insertParentSchema.partial().parse(updateData);
      
      const updatedParent = await storage.updateParent(id, parentData);
      res.json(updatedParent);
    } catch (error) {
      console.error("Error updating parent:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update parent" });
      }
    }
  });

  app.delete('/api/parents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verificar se o parent pertence ao usuário
      const existingParent = await storage.getParentById(id);
      if (!existingParent || existingParent.userId !== userId) {
        return res.status(404).json({ message: "Parent not found" });
      }
      
      await storage.deleteParent(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting parent:", error);
      res.status(500).json({ message: "Failed to delete parent" });
    }
  });

  app.get('/api/parents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      const parent = await storage.getParentById(id);
      if (!parent || parent.userId !== userId) {
        return res.status(404).json({ message: "Parent not found" });
      }
      
      res.json(parent);
    } catch (error) {
      console.error("Error fetching parent:", error);
      res.status(500).json({ message: "Failed to fetch parent" });
    }
  });

  // Expenses routes
  app.get('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { childId, category, status, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (childId) filters.childId = childId;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (startDate) filters.startDate = startDate as string;
      if (endDate) filters.endDate = endDate as string;
      
      const expenses = await storage.getExpenses(userId, filters);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Sanitize expenseDate to ensure it's YYYY-MM-DD format
      let sanitizedBody = { ...req.body };
      if (sanitizedBody.expenseDate && typeof sanitizedBody.expenseDate === 'string' && sanitizedBody.expenseDate.includes('T')) {
        sanitizedBody.expenseDate = sanitizedBody.expenseDate.slice(0, 10);
      }
      
      const expenseData = insertExpenseSchema.parse({
        ...sanitizedBody,
        userId,
      });
      
      const expense = await storage.createExpense(expenseData);
      
      res.status(201).json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create expense" });
      }
    }
  });

  app.put('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const expenseData = insertExpenseSchema.partial().parse(req.body);
      const updatedExpense = await storage.updateExpense(id, expenseData);
      res.json(updatedExpense);
    } catch (error) {
      console.error("Error updating expense:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update expense" });
      }
    }
  });

  app.delete('/api/expenses/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteExpense(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  // Receipt/Object storage routes
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      if (!canAccess) {
        return res.sendStatus(401);
      }
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error checking object access:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const { userId, childId, expenseDate } = req.body;
      
      // Validate organization parameters if provided
      let organizationParams;
      if (userId && childId && expenseDate) {
        // Validate userId matches the authenticated user
        if (userId !== (req as any).user.claims.sub) {
          return res.status(403).json({ error: "Cannot upload files for other users" });
        }
        
        // Validate expenseDate format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(expenseDate)) {
          return res.status(400).json({ error: "Invalid expenseDate format. Use YYYY-MM-DD" });
        }
        
        // Validate that the date is not in the future
        const expense = new Date(expenseDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Set to end of today
        if (expense > today) {
          return res.status(400).json({ error: "Expense date cannot be in the future" });
        }
        
        organizationParams = { userId, childId, expenseDate };
      }
      
      const uploadURL = await objectStorageService.getObjectEntityUploadURL(organizationParams);
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Profile photo management
  app.post('/api/profile-photos', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.body.photoURL) {
        return res.status(400).json({ error: "photoURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.photoURL,
        {
          owner: userId,
          visibility: "private", // Profile photos should be private to the owner
        },
      );

      res.status(201).json({ objectPath });
    } catch (error) {
      console.error("Error creating profile photo:", error);
      res.status(500).json({ message: "Failed to create profile photo" });
    }
  });

  // Receipt management
  app.post('/api/receipts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.body.receiptURL || !req.body.expenseId) {
        return res.status(400).json({ error: "receiptURL and expenseId are required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.receiptURL,
        {
          owner: userId,
          visibility: "private", // Receipts should be private
        },
      );

      // Create receipt record
      const receiptData = insertReceiptSchema.parse({
        expenseId: req.body.expenseId,
        filePath: objectPath,
        fileType: req.body.fileType || 'application/pdf',
        fileName: req.body.fileName || 'receipt',
        originalFileName: req.body.originalFileName || null,
        originalFileType: req.body.originalFileType || null,
      });

      const receipt = await storage.createReceipt(receiptData);
      res.status(201).json({ receipt, objectPath });
    } catch (error) {
      console.error("Error creating receipt:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create receipt" });
      }
    }
  });

  app.get('/api/receipts/:expenseId', isAuthenticated, async (req: any, res) => {
    try {
      const { expenseId } = req.params;
      const receipts = await storage.getReceipts(expenseId);
      res.json(receipts);
    } catch (error) {
      console.error("Error fetching receipts:", error);
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.delete('/api/receipts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteReceipt(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting receipt:", error);
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  // Object Storage image endpoint
  app.get('/api/object-storage/image', isAuthenticated, async (req: any, res) => {
    try {
      const { path: filePath } = req.query;
      
      if (!filePath) {
        return res.status(400).json({ message: "File path is required" });
      }

      const userId = req.user.claims.sub;
      const objectStorageService = new ObjectStorageService();
      
      try {
        const objectFile = await objectStorageService.getObjectEntityFile(filePath);
        
        // Verificar permissões de acesso
        const canAccess = await objectStorageService.canAccessObjectEntity({
          objectFile,
          userId: userId,
          requestedPermission: ObjectPermission.READ,
        });
        
        if (!canAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
        
        // Download da imagem e envio como stream
        await objectStorageService.downloadObject(objectFile, res);
        
      } catch (error) {
        if (error instanceof ObjectNotFoundError) {
          return res.status(404).json({ message: "Image not found" });
        }
        throw error;
      }
      
    } catch (error) {
      console.error("Error serving image from object storage:", error);
      res.status(500).json({ message: "Failed to serve image" });
    }
  });

  // Lawyers routes
  app.get('/api/lawyers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lawyers = await storage.getLawyers(userId);
      res.json(lawyers);
    } catch (error) {
      console.error("Error fetching lawyers:", error);
      res.status(500).json({ message: "Failed to fetch lawyers" });
    }
  });

  app.post('/api/lawyers', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const lawyerData = insertLawyerSchema.parse({
        ...req.body,
        userId,
      });
      
      const lawyer = await storage.createLawyer(lawyerData);
      res.status(201).json(lawyer);
    } catch (error) {
      console.error("Error creating lawyer:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create lawyer" });
      }
    }
  });

  app.put('/api/lawyers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const lawyerData = insertLawyerSchema.partial().parse(req.body);
      const updatedLawyer = await storage.updateLawyer(id, lawyerData);
      res.json(updatedLawyer);
    } catch (error) {
      console.error("Error updating lawyer:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update lawyer" });
      }
    }
  });

  app.delete('/api/lawyers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLawyer(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting lawyer:", error);
      res.status(500).json({ message: "Failed to delete lawyer" });
    }
  });

  // Legal Cases routes
  app.get('/api/legal-cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const legalCases = await storage.getLegalCases(userId);
      res.json(legalCases);
    } catch (error) {
      console.error("Error fetching legal cases:", error);
      res.status(500).json({ message: "Failed to fetch legal cases" });
    }
  });

  app.post('/api/legal-cases', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const legalCaseData = insertLegalCaseSchema.parse({
        ...req.body,
        userId,
      });
      
      const legalCase = await storage.createLegalCase(legalCaseData);
      res.status(201).json(legalCase);
    } catch (error) {
      console.error("Error creating legal case:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create legal case" });
      }
    }
  });

  app.put('/api/legal-cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const legalCaseData = insertLegalCaseSchema.partial().parse(req.body);
      const updatedLegalCase = await storage.updateLegalCase(id, legalCaseData);
      res.json(updatedLegalCase);
    } catch (error) {
      console.error("Error updating legal case:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update legal case" });
      }
    }
  });

  app.delete('/api/legal-cases/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteLegalCase(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting legal case:", error);
      res.status(500).json({ message: "Failed to delete legal case" });
    }
  });

  // Categories routes
  app.get('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categoryData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  app.put('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify category belongs to user
      const existingCategory = await storage.getCategoryById(id, userId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      const categoryData = insertCategorySchema.omit({ userId: true }).partial().parse(req.body);
      const updatedCategory = await storage.updateCategory(id, categoryData, userId);
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      
      // Verify category belongs to user
      const existingCategory = await storage.getCategoryById(id, userId);
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }

      await storage.deleteCategory(id, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Generate PDF on server (for mobile devices)
  // Define schema for PDF generation filters
  const pdfFiltersSchema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal('')),
    childId: z.string().optional(),
    status: z.string().optional(),
    categoryId: z.string().optional(),
  });

  app.post('/api/reports/generate-pdf-server', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { filters: rawFilters, fileName } = req.body;
      
      if (!rawFilters || !fileName) {
        return res.status(400).json({ message: "Filters and fileName are required" });
      }

      // Validate and sanitize filters - SECURITY: Prevent malformed input from causing DoS
      let filters;
      try {
        filters = pdfFiltersSchema.parse(rawFilters);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ 
            message: "Invalid filters", 
            errors: error.errors 
          });
        }
        throw error;
      }

      // Import required modules
      const jsPDF = (await import('jspdf')).default;
      const { createCanvas, loadImage } = await import('canvas');
      const { Chart, registerables } = await import('chart.js');
      const { format, parse, subDays, subMonths, subYears, startOfYear } = await import('date-fns');
      const { ptBR } = await import('date-fns/locale');
      
      // Register Chart.js components
      Chart.register(...registerables);

      // Fetch ALL data from storage using authenticated userId - SECURITY: No client-provided paths
      const [expenses, children, parents, lawyers, legalCases, categories] = await Promise.all([
        storage.getExpenses(userId),
        storage.getChildren(userId),
        storage.getParents(userId),
        storage.getLawyers(userId),
        storage.getLegalCases(userId),
        storage.getCategories(userId)
      ]);

      // Apply filters SERVER-SIDE using validated data
      const parseLocalDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const normalizeStart = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      };

      const normalizeEnd = (date: Date): Date => {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
      };

      // Determine date range from filters with defensive error handling
      const now = new Date();
      let start: Date, end: Date;
      
      try {
        if (filters.startDate && filters.endDate) {
          start = normalizeStart(parseLocalDate(filters.startDate));
          end = normalizeEnd(parseLocalDate(filters.endDate));
        } else {
          // Default to last 30 days
          start = subDays(now, 30);
          end = now;
        }
      } catch (error) {
        // If date parsing fails, fall back to default range
        console.error("Error parsing filter dates:", error);
        start = subDays(now, 30);
        end = now;
      }

      // Filter expenses SERVER-SIDE
      const filteredExpenses = expenses.filter((expense: any) => {
        const expenseDate = typeof expense.expenseDate === 'string' && expense.expenseDate.match(/^\d{4}-\d{2}-\d{2}$/)
          ? parseLocalDate(expense.expenseDate)
          : new Date(expense.expenseDate);
        
        const dateInRange = expenseDate >= start && expenseDate <= end;
        const childMatch = !filters.childId || filters.childId === 'all' || expense.childId === filters.childId;
        const statusMatch = !filters.status || filters.status === 'all' || expense.status === filters.status;
        const categoryMatch = !filters.categoryId || filters.categoryId === 'all' || expense.categoryId === filters.categoryId;
        
        return dateInRange && childMatch && statusMatch && categoryMatch;
      });

      // Build report data from SERVER-VALIDATED expenses
      const totalAmount = filteredExpenses.reduce((sum: number, exp: any) => sum + parseFloat(exp.amount), 0);
      const categoryTotals = filteredExpenses.reduce((acc: any, exp: any) => {
        acc[exp.category] = (acc[exp.category] || 0) + parseFloat(exp.amount);
        return acc;
      }, {});
      const childTotals = filteredExpenses.reduce((acc: any, exp: any) => {
        const childName = exp.child?.firstName || 'Sem nome';
        acc[childName] = (acc[childName] || 0) + parseFloat(exp.amount);
        return acc;
      }, {});
      const statusTotals = filteredExpenses.reduce((acc: any, exp: any) => {
        acc[exp.status] = (acc[exp.status] || 0) + parseFloat(exp.amount);
        return acc;
      }, {});

      const reportData = {
        filteredExpenses,
        totalAmount,
        categoryTotals,
        childTotals,
        statusTotals,
        period: { start, end },
        expenseCount: filteredExpenses.length,
        receiptCount: filteredExpenses.reduce((count: number, exp: any) => count + (exp.receipts?.length || 0), 0)
      };

      // Helper functions
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(value);
      };

      const formatReportPeriodDate = (date: Date) => {
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        return format(normalizedDate, 'dd/MM/yyyy', { locale: ptBR });
      };

      // Load image from object storage
      const loadImageFromStorage = async (filePath: string): Promise<Buffer | null> => {
        try {
          const objectStorage = new ObjectStorageService();
          const file = await objectStorage.getObjectEntityFile(filePath);
          const [fileBuffer] = await file.download();
          return fileBuffer;
        } catch (error) {
          console.error(`Error loading image ${filePath}:`, error);
          return null;
        }
      };

      // Generate pie chart
      const generatePieChart = async (categoryTotals: Record<string, number>): Promise<string> => {
        const canvas = createCanvas(1600, 1200);
        const ctx = canvas.getContext('2d');
        
        const labels = Object.keys(categoryTotals);
        const data = Object.values(categoryTotals);
        
        const colors = [
          '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6',
          '#EF4444', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
        ];
        
        const chart = new Chart(ctx as any, {
          type: 'pie',
          data: {
            labels: labels.map(label => label.charAt(0).toUpperCase() + label.slice(1)),
            datasets: [{
              data: data,
              backgroundColor: colors.slice(0, labels.length),
              borderWidth: 5,
              borderColor: '#ffffff'
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  font: { size: 26, family: 'Times, serif', weight: 500 as any },
                  padding: 25,
                  usePointStyle: true,
                  pointStyle: 'circle',
                  generateLabels: function(chart: any) {
                    const data = chart.data;
                    if (data.labels && data.labels.length && data.datasets.length) {
                      const dataset = data.datasets[0];
                      const total = dataset.data.reduce((sum: number, value: number) => sum + (value || 0), 0);
                      
                      return data.labels.map((label: string, i: number) => {
                        const value = dataset.data[i] || 0;
                        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                        const amount = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                        
                        return {
                          text: `${label}: ${amount} (${percentage}%)`,
                          fillStyle: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor,
                          strokeStyle: dataset.borderColor,
                          lineWidth: dataset.borderWidth,
                          pointStyle: 'circle' as const,
                          hidden: false,
                          index: i
                        };
                      });
                    }
                    return [];
                  }
                }
              },
              title: {
                display: true,
                text: 'Distribuição por Categoria',
                font: { size: 32, weight: 'bold' as any, family: 'Times, serif' },
                padding: { top: 10, bottom: 20 },
                color: '#000000'
              }
            },
            layout: { padding: 30 }
          }
        });
        
        const imageData = canvas.toDataURL('image/png');
        chart.destroy();
        return imageData;
      };

      // Generate line chart
      const generateAccumulatedLineChart = async (expenses: any[]): Promise<string> => {
        const canvas = createCanvas(1800, 1000);
        const ctx = canvas.getContext('2d');
        
        const monthlyData: Record<string, number> = {};
        const sortedExpenses = expenses.sort((a, b) => 
          new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime()
        );
        
        let accumulated = 0;
        sortedExpenses.forEach(expense => {
          const date = new Date(expense.expenseDate);
          const monthKey = format(date, 'MMM/yyyy', { locale: ptBR });
          accumulated += parseFloat(expense.amount);
          monthlyData[monthKey] = accumulated;
        });
        
        const labels = Object.keys(monthlyData);
        const data = Object.values(monthlyData);
        
        const gradient = ctx.createLinearGradient(0, 0, 0, 400) as any;
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
        
        const chart = new Chart(ctx as any, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Acumulado (R$)',
              data: data,
              borderColor: '#000080',
              backgroundColor: gradient,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: '#000080',
              pointBorderColor: '#ffffff',
              pointBorderWidth: 4,
              pointRadius: 7,
              borderWidth: 5
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  font: { size: 26, family: 'Times, serif', weight: 500 as any },
                  padding: 25,
                  usePointStyle: true
                }
              },
              title: {
                display: true,
                text: 'Acumulado Anual de Despesas',
                font: { size: 32, weight: 'bold' as any, family: 'Times, serif' },
                padding: { top: 10, bottom: 20 },
                color: '#000000'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.2)', lineWidth: 1 },
                ticks: {
                  font: { size: 22, family: 'Times, serif' },
                  color: '#000000',
                  padding: 15,
                  callback: function(value: any) {
                    return 'R$ ' + value.toLocaleString('pt-BR');
                  }
                }
              },
              x: {
                grid: { color: 'rgba(0, 0, 0, 0.15)', lineWidth: 1 },
                ticks: {
                  font: { size: 22, family: 'Times, serif' },
                  color: '#000000',
                  maxRotation: 45,
                  padding: 8
                }
              }
            },
            layout: { padding: 30 }
          }
        });
        
        const imageData = canvas.toDataURL('image/png');
        chart.destroy();
        return imageData;
      };

      // Generate monthly bar chart
      const generateMonthlyBarChart = async (expenses: any[]): Promise<string> => {
        const canvas = createCanvas(1800, 1000);
        const ctx = canvas.getContext('2d');
        
        const monthlyData: Record<string, number> = {};
        
        expenses.forEach(expense => {
          const date = new Date(expense.expenseDate);
          const monthKey = format(date, 'MMM/yyyy', { locale: ptBR });
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(expense.amount);
        });
        
        const sortedEntries = Object.entries(monthlyData).sort((a, b) => {
          const dateA = parse(a[0], 'MMM/yyyy', new Date(), { locale: ptBR });
          const dateB = parse(b[0], 'MMM/yyyy', new Date(), { locale: ptBR });
          return dateA.getTime() - dateB.getTime();
        });
        
        const labels = sortedEntries.map(([month]) => month);
        const data = sortedEntries.map(([, amount]) => amount);
        
        const chart = new Chart(ctx as any, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Gastos Mensais (R$)',
              data: data,
              backgroundColor: '#4B5563',
              borderColor: '#000000',
              borderWidth: 2,
              borderRadius: 3,
              borderSkipped: false
            }]
          },
          options: {
            responsive: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  font: { size: 26, family: 'Times, serif', weight: 500 as any },
                  padding: 25,
                  usePointStyle: true
                }
              },
              title: {
                display: true,
                text: 'Despesas por Mês',
                font: { size: 32, weight: 'bold' as any, family: 'Times, serif' },
                padding: { top: 10, bottom: 20 },
                color: '#000000'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.2)', lineWidth: 1 },
                ticks: {
                  font: { size: 22, family: 'Times, serif' },
                  color: '#000000',
                  padding: 15,
                  callback: function(value: any) {
                    return 'R$ ' + value.toLocaleString('pt-BR');
                  }
                }
              },
              x: {
                grid: { display: false },
                ticks: {
                  font: { size: 22, family: 'Times, serif' },
                  color: '#000000',
                  maxRotation: 45,
                  padding: 8
                }
              }
            },
            layout: { padding: 30 }
          }
        });
        
        const imageData = canvas.toDataURL('image/png');
        chart.destroy();
        return imageData;
      };

      // Generate trend chart
      const generateTrendChart = async (expenses: any[]): Promise<string> => {
        const canvas = createCanvas(1800, 1000);
        const ctx = canvas.getContext('2d');
        
        const monthlyData: Record<string, number> = {};
        
        expenses.forEach(expense => {
          const date = new Date(expense.expenseDate);
          const monthKey = format(date, 'MMM/yyyy', { locale: ptBR });
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(expense.amount);
        });
        
        const sortedEntries = Object.entries(monthlyData).sort((a, b) => {
          const dateA = parse(a[0], 'MMM/yyyy', new Date(), { locale: ptBR });
          const dateB = parse(b[0], 'MMM/yyyy', new Date(), { locale: ptBR });
          return dateA.getTime() - dateB.getTime();
        });
        
        const labels = sortedEntries.map(([month]) => month);
        const data = sortedEntries.map(([, amount]) => amount);
        
        const movingAverage = data.map((_, index) => {
          if (index < 2) return data[index];
          const sum = data[index] + data[index - 1] + data[index - 2];
          return sum / 3;
        });
        
        const chart = new Chart(ctx as any, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Gastos Mensais (R$)',
                data: data,
                borderColor: '#000000',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                fill: false,
                tension: 0.3,
                pointRadius: 7,
                pointBackgroundColor: '#000000',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                borderWidth: 5,
                pointStyle: 'circle'
              },
              {
                label: 'Tendência (Média Móvel 3 meses)',
                data: movingAverage,
                borderColor: '#4B5563',
                backgroundColor: 'rgba(75, 85, 99, 0.05)',
                fill: false,
                tension: 0.3,
                pointRadius: 6,
                pointBackgroundColor: '#4B5563',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 3,
                borderWidth: 5,
                borderDash: [8, 4],
                pointStyle: 'triangle'
              }
            ]
          },
          options: {
            responsive: false,
            plugins: {
              legend: {
                display: true,
                position: 'top',
                labels: {
                  font: { size: 26, family: 'Times, serif', weight: 500 as any },
                  padding: 25,
                  usePointStyle: true
                }
              },
              title: {
                display: true,
                text: 'Tendência de Gastos Mensais',
                font: { size: 32, weight: 'bold' as any, family: 'Times, serif' },
                padding: { top: 10, bottom: 20 },
                color: '#000000'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(0, 0, 0, 0.2)', lineWidth: 1 },
                ticks: {
                  font: { size: 22, family: 'Times, serif' },
                  color: '#000000',
                  padding: 15,
                  callback: function(value: any) {
                    return 'R$ ' + value.toLocaleString('pt-BR');
                  }
                }
              },
              x: {
                grid: { color: 'rgba(0, 0, 0, 0.15)', lineWidth: 1 },
                ticks: {
                  font: { size: 22, family: 'Times, serif' },
                  color: '#000000',
                  maxRotation: 45,
                  padding: 8
                }
              }
            },
            layout: { padding: 30 }
          }
        });
        
        const imageData = canvas.toDataURL('image/png');
        chart.destroy();
        return imageData;
      };

      // Start PDF generation
      const pdf = new jsPDF('p', 'mm', 'A4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const margins = { top: 20, bottom: 15, left: 30, right: 20 };
      const contentWidth = pageWidth - margins.left - margins.right;
      let yPosition = margins.top;
      let pageNumber = 1;

      const sectionPageMap: Record<string, number> = {};

      const addPageNumberOnly = (pageNum: number) => {
        pdf.setFontSize(10);
        pdf.setFont("times", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(pageNum.toString(), pageWidth - margins.right - 10, 20, { align: "right" });
      };

      // ===== COVER PAGE =====
      pdf.setFont("times", "bold");
      pdf.setFontSize(14);
      
      yPosition = 50;
      pdf.text("SISTEMA DE GESTÃO FINANCEIRA", pageWidth / 2, yPosition, { align: "center" });
      pdf.text("PARA FILHOS & FILHAS", pageWidth / 2, yPosition + 7, { align: "center" });
      
      yPosition = 110;
      pdf.setFontSize(16);
      pdf.text("RELATÓRIO DE PRESTAÇÃO DE CONTAS", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 12;
      pdf.setFontSize(12);
      pdf.text("DESPESAS OBRIGATÓRIAS E NÃO OBRIGATÓRIAS", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 10;
      pdf.setFontSize(8);
      pdf.setFont("times", "normal");
      pdf.text("Conforme boas práticas contábeis", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition = 160;
      pdf.setFontSize(12);
      const periodStart = new Date(reportData.period.start);
      const periodEnd = new Date(reportData.period.end);
      pdf.text(`Período analisado: ${formatReportPeriodDate(periodStart)} a ${formatReportPeriodDate(periodEnd)}`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;
      pdf.setFontSize(10);
      pdf.text(`Data e hora de geração: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPosition, { align: "center" });
      
      yPosition = 260;
      pdf.text(`${format(new Date(), 'MMMM/yyyy', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: "center" });

      // ===== CHILDREN INFORMATION PAGE =====
      pdf.addPage();
      pageNumber = 2;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(16);
      pdf.setFont("times", "bold");
      pdf.text("INFORMAÇÕES DOS FILHOS ENVOLVIDOS NO RELATÓRIO", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 35;
      
      // Use simple text listing instead of cards for server-side generation
      const reportChildren = children;
      
      reportChildren.forEach((child: any, index: number) => {
        if (yPosition > pageHeight - margins.bottom - 40) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.setFontSize(12);
        pdf.text(`${index + 1}. ${child.firstName} ${child.lastName || ''}`, margins.left, yPosition);
        yPosition += 8;
        
        pdf.setFont("times", "normal");
        pdf.setFontSize(10);
        
        const father = parents.find((p: any) => p.id === child.fatherId);
        const mother = parents.find((p: any) => p.id === child.motherId);
        
        if (father) {
          pdf.text(`Pai: ${father.fullName}${father.cpf ? ` (CPF: ${father.cpf})` : ''}`, margins.left + 5, yPosition);
          yPosition += 6;
        }
        
        if (mother) {
          pdf.text(`Mãe: ${mother.fullName}${mother.cpf ? ` (CPF: ${mother.cpf})` : ''}`, margins.left + 5, yPosition);
          yPosition += 6;
        }
        
        yPosition += 10;
      });

      // ===== LEGAL CONTEXT =====
      pdf.addPage();
      pageNumber++;
      sectionPageMap["CONTEXTO LEGAL"] = pageNumber;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("1 CONTEXTO LEGAL E ACORDO DE PENSÃO ALIMENTÍCIA", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const activeLegalCase = legalCases.find((lc: any) => lc.status === 'em_andamento' || lc.status === 'ativo') || legalCases[0];
      const associatedLawyer = activeLegalCase?.lawyerId ? lawyers.find((l: any) => l.id === activeLegalCase.lawyerId) : null;
      
      let contextualInfo = [];
      
      if (activeLegalCase) {
        contextualInfo = [
          `Número do Processo: ${activeLegalCase.caseNumber || '[Não informado]'}`,
          `Status: ${activeLegalCase.status?.charAt(0).toUpperCase() + activeLegalCase.status?.slice(1) || '[Não informado]'}`,
          activeLegalCase.court ? `Tribunal: ${activeLegalCase.court}` : `Tribunal: [Não informado]`,
          activeLegalCase.judgeName ? `Juiz Responsável: ${activeLegalCase.judgeName}` : `Juiz Responsável: [Nome do Juiz]`,
          activeLegalCase.description ? `Observações: ${activeLegalCase.description}` : ''
        ].filter(Boolean);
      } else {
        contextualInfo = [
          'Número do Processo: [Informação não cadastrada]',
          'Status: [Aguardando cadastro]',
          'Tribunal: [Informação não disponível]',
          'Juiz Responsável: [Informação não disponível]'
        ];
      }
      
      contextualInfo.forEach((info) => {
        const lines = pdf.splitTextToSize(info, contentWidth);
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - margins.bottom - 20) {
            pdf.addPage();
            pageNumber++;
            yPosition = margins.top + 20;
          }
          pdf.text(line, margins.left, yPosition);
          yPosition += 6;
        });
      });

      // ===== EXECUTIVE SUMMARY =====
      pdf.addPage();
      pageNumber++;
      sectionPageMap["RESUMO EXECUTIVO"] = pageNumber;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("2 RESUMO EXECUTIVO", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const summaryInfo = [
        `• Total de despesas no período: ${reportData.expenseCount}`,
        `• Valor total gasto: ${formatCurrency(reportData.totalAmount)}`,
        `• Total de comprovantes: ${reportData.receiptCount}`,
        `• Período analisado: ${formatReportPeriodDate(periodStart)} a ${formatReportPeriodDate(periodEnd)}`
      ];
      
      summaryInfo.forEach((info) => {
        pdf.text(info, margins.left, yPosition);
        yPosition += 8;
      });

      // ===== FINANCIAL ANALYSIS =====
      pdf.addPage();
      pageNumber++;
      sectionPageMap["ANÁLISE FINANCEIRA"] = pageNumber;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("3 ANÁLISE FINANCEIRA", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      // Category breakdown
      pdf.setFont("times", "bold");
      pdf.text("3.1 Distribuição por categoria", margins.left, yPosition);
      yPosition += 10;
      pdf.setFont("times", "normal");
      
      Object.entries(reportData.categoryTotals).forEach(([category, amount]: [string, any]) => {
        const percentage = reportData.totalAmount > 0 ? ((amount / reportData.totalAmount) * 100).toFixed(1) : '0.0';
        pdf.text(`• ${category.charAt(0).toUpperCase() + category.slice(1)}: ${formatCurrency(amount)} (${percentage}%)`, margins.left + 5, yPosition);
        yPosition += 6;
      });

      // ===== CHARTS AND INSIGHTS =====
      pdf.addPage();
      pageNumber++;
      sectionPageMap["GRÁFICOS E INSIGHTS"] = pageNumber;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("4 GRÁFICOS E INSIGHTS", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const insightsText = "Esta seção apresenta análises visuais das despesas para facilitar a compreensão dos padrões de gastos e tendências ao longo do período analisado.";
      const insightsLines = pdf.splitTextToSize(insightsText, contentWidth);
      insightsLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });
      
      yPosition += 10;
      
      // Generate and add charts
      try {
        pdf.setFont("times", "bold");
        pdf.text("4.1 Distribuição por Categoria", margins.left, yPosition);
        yPosition += 10;
        
        const pieChartImage = await generatePieChart(reportData.categoryTotals);
        const pieChartWidth = 120;
        const pieChartHeight = 90;
        
        if (yPosition + pieChartHeight > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
        }
        
        const pieChartX = margins.left + (contentWidth - pieChartWidth) / 2;
        pdf.addImage(pieChartImage, 'PNG', pieChartX, yPosition, pieChartWidth, pieChartHeight);
        yPosition += pieChartHeight + 15;
      } catch (error) {
        console.error("Error generating pie chart:", error);
      }

      // Line chart - Accumulated annual
      try {
        if (yPosition + 110 > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.text("4.2 Acumulado Anual de Despesas", margins.left, yPosition);
        yPosition += 10;
        
        const lineChartImage = await generateAccumulatedLineChart(reportData.filteredExpenses);
        const lineChartWidth = 140;
        const lineChartHeight = 84;
        
        const lineChartX = margins.left + (contentWidth - lineChartWidth) / 2;
        pdf.addImage(lineChartImage, 'PNG', lineChartX, yPosition, lineChartWidth, lineChartHeight);
        yPosition += lineChartHeight + 15;
      } catch (error) {
        console.error("Error generating line chart:", error);
      }

      // Bar chart - Monthly expenses
      try {
        if (yPosition + 110 > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.text("4.3 Despesas por Mês", margins.left, yPosition);
        yPosition += 10;
        
        const barChartImage = await generateMonthlyBarChart(reportData.filteredExpenses);
        const barChartWidth = 140;
        const barChartHeight = 84;
        
        const barChartX = margins.left + (contentWidth - barChartWidth) / 2;
        pdf.addImage(barChartImage, 'PNG', barChartX, yPosition, barChartWidth, barChartHeight);
        yPosition += barChartHeight + 15;
      } catch (error) {
        console.error("Error generating bar chart:", error);
      }

      // Trend chart
      try {
        if (yPosition + 110 > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
        }
        
        pdf.setFont("times", "bold");
        pdf.text("4.4 Tendência de Gastos Mensais", margins.left, yPosition);
        yPosition += 10;
        
        const trendChartImage = await generateTrendChart(reportData.filteredExpenses);
        const trendChartWidth = 140;
        const trendChartHeight = 84;
        
        const trendChartX = margins.left + (contentWidth - trendChartWidth) / 2;
        pdf.addImage(trendChartImage, 'PNG', trendChartX, yPosition, trendChartWidth, trendChartHeight);
        yPosition += trendChartHeight + 15;
      } catch (error) {
        console.error("Error generating trend chart:", error);
      }

      // ===== EXPENSE DETAILS =====
      pdf.addPage();
      pageNumber++;
      sectionPageMap["DETALHAMENTO DAS DESPESAS"] = pageNumber;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("5 DETALHAMENTO DAS DESPESAS", margins.left, yPosition);
      
      yPosition += 8;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const detailIntro = "Esta seção lista cada despesa individualmente, com referência clara aos seus comprovantes, seguindo o padrão exigido para análise judicial.";
      const detailLines = pdf.splitTextToSize(detailIntro, contentWidth);
      detailLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });
      
      yPosition += 21;
      pdf.setFontSize(10);
      
      // Table header
      const tableHeaders = ["Data", "Descrição", "Beneficiário", "Categoria", "Valor", "Status", "Doc."];
      const tableColWidths = [18, 45, 26, 28, 24, 18, 13];
      let xPos = margins.left;
      
      pdf.setFont("times", "bold");
      tableHeaders.forEach((header, index) => {
        pdf.rect(xPos, yPosition - 5, tableColWidths[index], 8);
        pdf.text(header, xPos + 2, yPosition);
        xPos += tableColWidths[index];
      });
      
      yPosition += 8;
      
      // Table data
      const sortedExpenses = reportData.filteredExpenses.sort((a: any, b: any) => 
        new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime()
      );
      
      pdf.setFont("times", "normal");
      
      sortedExpenses.forEach((expense: any) => {
        const descriptionLines = pdf.splitTextToSize(expense.description, tableColWidths[1] - 4);
        const categoryLines = pdf.splitTextToSize(expense.category, tableColWidths[3] - 4);
        const childNameLines = pdf.splitTextToSize(expense.child.firstName, tableColWidths[2] - 4);
        
        const maxLines = Math.max(descriptionLines.length, categoryLines.length, childNameLines.length);
        const rowHeight = Math.max(8, maxLines * 4.5 + 3);
        
        if (yPosition + rowHeight > pageHeight - margins.bottom - 20) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
          
          // Recreate header
          xPos = margins.left;
          pdf.setFont("times", "bold");
          tableHeaders.forEach((header, index) => {
            pdf.rect(xPos, yPosition - 5, tableColWidths[index], 8);
            pdf.text(header, xPos + 2, yPosition);
            xPos += tableColWidths[index];
          });
          yPosition += 8;
          pdf.setFont("times", "normal");
        }

        xPos = margins.left;
        
        const cellData = [
          [format(new Date(expense.expenseDate), 'dd/MM/yy')],
          descriptionLines,
          childNameLines,
          categoryLines,
          [formatCurrency(parseFloat(expense.amount))],
          [expense.status.substring(0, 6)],
          [expense.receipts?.length ? `${expense.receipts.length}` : "0"]
        ];
        
        cellData.forEach((_, index) => {
          pdf.rect(xPos, yPosition - 5, tableColWidths[index], rowHeight);
          xPos += tableColWidths[index];
        });
        
        xPos = margins.left;
        
        cellData.forEach((lines, index) => {
          const cellX = xPos + 2;
          let cellY = yPosition;
          
          if (lines.length < maxLines) {
            const extraSpace = (maxLines - lines.length) * 4.5;
            cellY += extraSpace / 2;
          }
          
          pdf.setTextColor(0, 0, 0);
          
          lines.forEach((line: string, lineIndex: number) => {
            pdf.text(line, cellX, cellY + (lineIndex * 4.5));
          });
          
          xPos += tableColWidths[index];
        });
        
        yPosition += rowHeight;
      });

      // ===== EXPENSE RECEIPTS =====
      pdf.addPage();
      pageNumber++;
      sectionPageMap["EXTRATO DE DESPESAS COM COMPROVANTES"] = pageNumber;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("6 EXTRATO DE DESPESAS COM COMPROVANTES", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const extratoText = "Esta seção apresenta cada despesa de forma detalhada, incluindo todos os comprovantes anexados para fins de auditoria e transparência.";
      const extratoLines = pdf.splitTextToSize(extratoText, contentWidth);
      extratoLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });
      
      yPosition += 15;

      // Process each expense with receipts
      for (let index = 0; index < Math.min(sortedExpenses.length, 20); index++) {
        const expense = sortedExpenses[index];
        
        if (index > 0) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
        }
        
        if (yPosition > pageHeight - margins.bottom - 100) {
          pdf.addPage();
          pageNumber++;
          yPosition = margins.top + 20;
        }

        pdf.setFontSize(12);
        pdf.setFont("times", "bold");
        pdf.text(`6.${index + 1} DESPESA #${index + 1}`, margins.left, yPosition);
        yPosition += 12;
        
        pdf.setFontSize(10);
        pdf.setFont("times", "normal");
        
        const expenseDetails = [
          `Data: ${format(new Date(expense.expenseDate), 'dd/MM/yyyy')}`,
          `Descrição: ${expense.description}`,
          `Beneficiário: ${expense.child.firstName} ${expense.child.lastName || ''}`,
          `Categoria: ${expense.category}`,
          `Valor: ${formatCurrency(parseFloat(expense.amount))}`,
          `Status: ${expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}`
        ];
        
        expenseDetails.forEach((detail) => {
          pdf.rect(margins.left, yPosition - 5, contentWidth, 8);
          pdf.text(detail, margins.left + 3, yPosition);
          yPosition += 8;
        });
        
        yPosition += 8;
        
        if (expense.receipts && expense.receipts.length > 0) {
          pdf.setFont("times", "bold");
          pdf.text(`Comprovantes anexados: ${expense.receipts.length}`, margins.left, yPosition);
          yPosition += 10;
          
          pdf.setFont("times", "normal");
          
          for (let receiptIndex = 0; receiptIndex < Math.min(expense.receipts.length, 3); receiptIndex++) {
            const receipt = expense.receipts[receiptIndex];
            
            if (yPosition > pageHeight - margins.bottom - 20) {
              pdf.addPage();
              pageNumber++;
              yPosition = margins.top + 20;
            }
            
            pdf.text(`• Comprovante ${receiptIndex + 1}:`, margins.left + 5, yPosition);
            yPosition += 6;
            
            if (receipt.fileName) {
              pdf.text(`  Nome: ${receipt.fileName}`, margins.left + 10, yPosition);
              yPosition += 6;
            }
            
            if (receipt.fileType) {
              pdf.text(`  Tipo: ${receipt.fileType}`, margins.left + 10, yPosition);
              yPosition += 6;
            }
            
            if (receipt.uploadedAt) {
              pdf.text(`  Upload: ${format(new Date(receipt.uploadedAt), 'dd/MM/yyyy HH:mm')}`, margins.left + 10, yPosition);
              yPosition += 6;
            }

            // Load and add receipt image
            if (receipt.filePath) {
              try {
                const imageBuffer = await loadImageFromStorage(receipt.filePath);
                
                if (imageBuffer && receipt.fileType && receipt.fileType.startsWith('image/')) {
                  const imageBase64 = `data:${receipt.fileType};base64,${imageBuffer.toString('base64')}`;
                  
                  // Add new page for each receipt image
                  pdf.addPage();
                  pageNumber++;
                  yPosition = margins.top;
                  
                  // Use maximum available space with minimal margins (5mm on all sides)
                  const receiptMargins = {
                    top: 5,
                    bottom: 5,
                    left: 5,
                    right: 5
                  };
                  
                  const maxWidth = pageWidth - receiptMargins.left - receiptMargins.right;
                  const maxHeight = pageHeight - receiptMargins.top - receiptMargins.bottom;
                  let imgWidth = maxWidth;
                  let imgHeight = maxHeight;
                  
                  try {
                    // Load image to get real dimensions and maintain aspect ratio
                    const img = await loadImage(imageBuffer);
                    const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
                    imgWidth = img.width * ratio;
                    imgHeight = img.height * ratio;
                  } catch (dimError) {
                    // Fallback to using maximum dimensions if dimension detection fails
                    console.warn('Could not detect image dimensions, using maximum size:', dimError);
                    imgWidth = maxWidth;
                    imgHeight = maxHeight;
                  }
                  
                  // Center image both horizontally and vertically on the page
                  const imgX = (pageWidth - imgWidth) / 2;
                  const imgY = (pageHeight - imgHeight) / 2;
                  pdf.addImage(imageBase64, 'JPEG', imgX, imgY, imgWidth, imgHeight, undefined, 'FAST');
                }
              } catch (error) {
                console.error(`Error loading receipt image:`, error);
              }
            }
            
            yPosition += 5;
          }
        }
      }

      // ===== CONCLUSIONS =====
      pdf.addPage();
      pageNumber++;
      sectionPageMap["CONCLUSÕES E RECOMENDAÇÕES"] = pageNumber;
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("7 CONCLUSÕES E RECOMENDAÇÕES", margins.left, yPosition);
      
      yPosition += 15;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const conclusionText = `Este relatório apresenta um resumo completo das despesas realizadas no período de ${formatReportPeriodDate(periodStart)} a ${formatReportPeriodDate(periodEnd)}. O total de despesas foi de ${formatCurrency(reportData.totalAmount)}, distribuídas em ${reportData.expenseCount} lançamentos, com ${reportData.receiptCount} comprovantes anexados.`;
      const conclusionLines = pdf.splitTextToSize(conclusionText, contentWidth);
      conclusionLines.forEach((line: string) => {
        pdf.text(line, margins.left, yPosition);
        yPosition += 6;
      });

      // ===== SIGNATURES =====
      yPosition += 15;
      
      if (yPosition > pageHeight - margins.bottom - 30) {
        pdf.addPage();
        pageNumber++;
        yPosition = margins.top + 20;
      }
      
      pdf.setFont("times", "italic");
      pdf.text("Documento gerado eletronicamente pelo Sistema de Gestão Financeira", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;
      pdf.text("para Filhos de Pais Divorciados", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
      pdf.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy \'às\' HH:mm \'h\'', { locale: ptBR })}`, pageWidth / 2, yPosition, { align: "center" });

      // ===== INSERT SUMMARY =====
      const totalPagesBeforeSummary = pdf.getNumberOfPages();
      const contextualLegalPageIndex = sectionPageMap["CONTEXTO LEGAL"] - 1;
      const summaryPageIndex = contextualLegalPageIndex;
      
      pdf.insertPage(summaryPageIndex + 1);
      
      const adjustedSectionPageMap: Record<string, number> = {};
      for (const [section, originalPage] of Object.entries(sectionPageMap)) {
        adjustedSectionPageMap[section] = originalPage + 1;
      }
      
      pdf.setPage(summaryPageIndex + 1);
      yPosition = margins.top + 10;
      
      pdf.setFontSize(14);
      pdf.setFont("times", "bold");
      pdf.text("SUMÁRIO", pageWidth / 2, yPosition, { align: "center" });
      
      yPosition += 20;
      pdf.setFontSize(12);
      pdf.setFont("times", "normal");
      
      const firstNumberedPageForSummary = adjustedSectionPageMap["CONTEXTO LEGAL"];
      
      const calculateDisplayPage = (absolutePage: number) => {
        if (!absolutePage || absolutePage < firstNumberedPageForSummary) {
          return null;
        }
        return absolutePage - firstNumberedPageForSummary + 1;
      };
      
      const summaryItemsWithCorrectPages = [
        { text: "1 CONTEXTO LEGAL E ACORDO DE PENSÃO ALIMENTÍCIA", page: calculateDisplayPage(adjustedSectionPageMap["CONTEXTO LEGAL"]) },
        { text: "2 RESUMO EXECUTIVO", page: calculateDisplayPage(adjustedSectionPageMap["RESUMO EXECUTIVO"]) },
        { text: "3 ANÁLISE FINANCEIRA", page: calculateDisplayPage(adjustedSectionPageMap["ANÁLISE FINANCEIRA"]) },
        { text: "4 GRÁFICOS E INSIGHTS", page: calculateDisplayPage(adjustedSectionPageMap["GRÁFICOS E INSIGHTS"]) },
        { text: "5 DETALHAMENTO DAS DESPESAS", page: calculateDisplayPage(adjustedSectionPageMap["DETALHAMENTO DAS DESPESAS"]) },
        { text: "6 EXTRATO DE DESPESAS COM COMPROVANTES", page: calculateDisplayPage(adjustedSectionPageMap["EXTRATO DE DESPESAS COM COMPROVANTES"]) },
        { text: "7 CONCLUSÕES E RECOMENDAÇÕES", page: calculateDisplayPage(adjustedSectionPageMap["CONCLUSÕES E RECOMENDAÇÕES"]) }
      ].filter(item => item.page !== null);
      
      summaryItemsWithCorrectPages.forEach((item) => {
        pdf.text(item.text, margins.left, yPosition);
        
        const textWidth = pdf.getTextWidth(item.text);
        const pageStr = item.page!.toString();
        const pageNumWidth = pdf.getTextWidth(pageStr);
        const availableSpace = contentWidth - textWidth - pageNumWidth - 4;
        const dotCount = Math.floor(availableSpace / pdf.getTextWidth('.'));
        const dots = '.'.repeat(Math.max(dotCount, 3));
        
        pdf.text(dots, margins.left + textWidth + 2, yPosition);
        pdf.text(pageStr, margins.left + contentWidth - pageNumWidth, yPosition);
        
        yPosition += 8;
      });

      // ===== APPLY PAGE NUMBERS =====
      const totalPages = pdf.getNumberOfPages();
      const firstNumberedPageAbsolute = adjustedSectionPageMap["CONTEXTO LEGAL"];
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(pageWidth - margins.right - 25, 10, 25, 15, 'F');
      }
      
      for (let i = firstNumberedPageAbsolute; i <= totalPages; i++) {
        pdf.setPage(i);
        const displayPageNumber = i - firstNumberedPageAbsolute + 1;
        addPageNumberOnly(displayPageNumber);
      }

      // Generate PDF buffer
      const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));
      
      // Save to object storage
      const objectStorage = new ObjectStorageService();
      const privateDir = objectStorage.getPrivateObjectDir();
      const pdfPath = `${privateDir}/reports/${userId}/${fileName}`;
      const { bucketName, objectName } = parseObjectPath(pdfPath);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
        },
      });
      
      // Generate download URL
      const downloadUrl = `/api/reports/download-pdf/${encodeURIComponent(fileName)}`;
      
      res.json({ downloadUrl, fileName });
    } catch (error) {
      console.error("Error generating PDF on server:", error);
      res.status(500).json({ message: "Failed to generate PDF on server", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Download PDF from object storage
  app.get('/api/reports/download-pdf/:fileName', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { fileName } = req.params;
      
      const objectStorage = new ObjectStorageService();
      const privateDir = objectStorage.getPrivateObjectDir();
      
      const pdfPath = `${privateDir}/reports/${userId}/${decodeURIComponent(fileName)}`;
      const { bucketName, objectName } = parseObjectPath(pdfPath);
      
      const bucket = objectStorageClient.bucket(bucketName);
      const file = bucket.file(objectName);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: "PDF not found" });
      }
      
      // Download file
      const [fileBuffer] = await file.download();
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${decodeURIComponent(fileName)}"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      res.status(500).json({ message: "Failed to download PDF" });
    }
  });

  // Helper function to parse object path
  function parseObjectPath(path: string): { bucketName: string; objectName: string } {
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    const pathParts = path.split("/");
    if (pathParts.length < 3) {
      throw new Error("Invalid path: must contain at least a bucket name");
    }

    const bucketName = pathParts[1];
    const objectName = pathParts.slice(2).join("/");

    return {
      bucketName,
      objectName,
    };
  }

  const httpServer = createServer(app);
  return httpServer;
}
