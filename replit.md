# Overview

This is a comprehensive financial management web application designed for divorced parents to track and manage their children's expenses. The system provides a complete solution for documenting expenses, uploading receipts, generating reports, and maintaining transparent financial records that can be used for legal purposes or reimbursement claims.

The application serves as a centralized platform where parents can register expenses, associate them with specific children, upload supporting documentation, and generate detailed financial reports. This addresses the common challenge faced by divorced families in Brazil regarding transparent and organized expense management.

# Recent Changes

## Date: 2025-10-08
- **RESOLVED**: Fixed mobile PDF generation error in production mode
  - Root cause: Server-side PDF generation code was accessing non-existent properties on `legalCase` object
  - Properties `court` and `description` don't exist in schema - correct names are `courtName` and `notes`
  - Fix: Updated server/routes.ts lines 1305 and 1307 to use correct property names from schema
  - Error occurred when generating "CONTEXTO LEGAL" section of PDF reports
  - **Result**: Mobile PDF generation now works correctly in production without server errors

## Date: 2025-09-12
- **COMPLETED**: Implemented major accessibility improvements for PDF report charts
  - **Enhanced font sizes**: Titles increased to 32px, legends to 26px, axis labels to 22px (100% larger than before)
  - **Larger canvas dimensions**: Pie chart 800x600px, other charts 900x500px for better print quality
  - **Improved visual elements**: Larger point markers (7px radius), thicker borders (5px), increased hover effects
  - **Better spacing**: Increased padding throughout charts (30px layout, 25px legend, 15px axis)
  - **Black & white optimization**: High-contrast colors, solid vs dashed line patterns, no gradients
  - **Legal document compliance**: All chart elements now clearly visible when printed in black and white
  - **Fixed month sorting bug**: Corrected chronological ordering using date-fns Portuguese locale parsing
  - **Result**: Charts are now fully accessible and professional for legal documentation use

## Date: 2025-09-11
- **RESOLVED**: Fixed critical date formatting bug across all application screens
  - Root cause: timezone conversion in `new Date().toLocaleDateString()` causing dates to display one day earlier
  - Solution: Implemented direct string-based date formatting using `formatDateForBrazil()` function
  - **Fixed screens**: Expenses list, Dashboard "Atividades Recentes", and Receipts/Comprovantes pages
  - **Result**: Dates stored as "2025-09-11" now correctly display as "11/09/2025" instead of "10/09/2025"
  - Simplified server-side `normalizeExpense()` function to preserve YYYY-MM-DD format without timezone conversions
  - All expense creation, storage, and display functionality preserved without regression

## Date: 2025-09-10  
- **RESOLVED**: Fixed critical React hooks error that prevented application from loading
  - Corrected duplicate `useAuth()` hook calls causing "Invalid hook call" errors
  - Added explicit React imports where missing (App.tsx used React.CSSProperties without import)
  - Refactored Router component to receive authentication state as props instead of calling useAuth directly
  - Application now loads and functions correctly

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using **React 18 with TypeScript** for type safety and modern development practices. The UI leverages **shadcn/ui components** built on top of **Radix UI primitives** for accessibility and **Tailwind CSS** for styling. The application uses **Wouter** for client-side routing and **TanStack Query** (React Query) for state management and server synchronization.

The component architecture follows a modular approach with reusable UI components, custom hooks for business logic, and page-level components for different application sections. The styling system uses CSS variables for theming with support for light/dark modes.

## Backend Architecture

The backend is implemented using **Node.js with Express.js** and TypeScript for the API layer. The server provides RESTful endpoints for all CRUD operations and handles file uploads through integration with cloud storage services.

Authentication is handled through **Replit's OIDC integration** with session management using **express-session** with PostgreSQL session storage. The authentication system provides secure user login and maintains user context across requests.

## Database Design

The system uses **PostgreSQL** (via Neon) as the primary database with **Drizzle ORM** for type-safe database operations. The schema includes:

- **Users table**: Stores parent/guardian information with Replit OIDC integration
- **Children table**: Contains child information with relationships to parents
- **User-Children junction table**: Manages many-to-many relationships between parents and children
- **Expenses table**: Core expense tracking with categories, amounts, dates, and status
- **Receipts table**: File attachments linked to expenses for documentation
- **Sessions table**: Secure session storage for authentication

## File Storage Integration

The application integrates with **Google Cloud Storage** for receipt and document management. The system implements:

- **Object ACL (Access Control List)** system for fine-grained file permissions
- **Uppy file upload** component with progress tracking and validation
- **Secure file access** through presigned URLs and permission validation
- **Custom object storage service** that handles authentication and access control

## State Management

**TanStack Query** manages all server state with automatic caching, background refetching, and optimistic updates. Custom hooks abstract query logic and provide consistent data access patterns across components.

The query client is configured with custom error handling, particularly for authentication errors, and includes request/response interceptors for consistent API communication.

## Security Architecture

- **JWT-based authentication** through Replit's OIDC provider
- **Session management** with secure HTTP-only cookies
- **File access control** through custom ACL system
- **Input validation** using Zod schemas on both client and server
- **CORS configuration** for secure cross-origin requests

## Component Organization

The frontend follows a structured component hierarchy:
- **Page components**: Handle routing and high-level state
- **UI components**: Reusable shadcn/ui components with custom styling
- **Feature components**: Domain-specific components (expense forms, charts, tables)
- **Layout components**: Sidebar, navigation, and structural elements

# External Dependencies

## Authentication & Authorization
- **Replit OIDC**: Primary authentication provider with OpenID Connect integration
- **Passport.js**: Authentication middleware for Express
- **express-session**: Session management with PostgreSQL storage

## Database & ORM
- **Neon**: Serverless PostgreSQL database provider
- **Drizzle ORM**: Type-safe database ORM with migration support
- **Drizzle-kit**: Database migration and schema management tools

## Cloud Storage
- **Google Cloud Storage**: Object storage for file uploads and receipts
- **Custom ACL System**: Fine-grained file access control implementation

## File Upload & Management
- **Uppy**: Modern file uploader with dashboard UI, progress tracking, and cloud storage integration
- **Multer**: Express middleware for handling multipart/form-data

## Frontend Libraries
- **React Query (@tanstack/react-query)**: Server state management and caching
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form state management with validation
- **Hookform/resolvers**: Form validation resolvers for Zod schemas
- **Zod**: Runtime type validation and schema definition

## UI & Styling
- **shadcn/ui**: Modern React component library
- **Radix UI**: Primitive UI components for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library with consistent design
- **Recharts**: Chart library for financial visualizations

## Development Tools
- **TypeScript**: Static type checking for both frontend and backend
- **Vite**: Fast build tool and development server
- **ESBuild**: JavaScript bundler for production builds
- **PostCSS**: CSS processing with Tailwind CSS integration

## Date & Formatting
- **date-fns**: Date manipulation and formatting with Portuguese locale support

## Utility Libraries
- **class-variance-authority**: Utility for managing CSS class variants
- **clsx & tailwind-merge**: CSS class manipulation utilities
- **nanoid**: URL-safe unique ID generation
- **memoizee**: Function memoization for performance optimization