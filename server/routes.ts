import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { insertChildSchema, insertExpenseSchema, insertReceiptSchema, insertLawyerSchema, insertLegalCaseSchema } from "@shared/schema";
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

  // Expenses routes
  app.get('/api/expenses', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { childId, category, status, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (childId) filters.childId = childId;
      if (category) filters.category = category;
      if (status) filters.status = status;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      
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
      const expenseData = insertExpenseSchema.parse({
        ...req.body,
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

  const httpServer = createServer(app);
  return httpServer;
}
