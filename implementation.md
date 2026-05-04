# InvenTrack - Implementation Details

## Overview
InvenTrack is a next-generation enterprise inventory management system designed to address the inefficiencies of legacy ERPs and manual tracking methods. It utilizes a decoupled, API-driven architecture built with modern web technologies to ensure scalability, high-performance, security, and an exceptional user experience.

## Technology Stack
- **Backend:** Node.js, Express.js
- **ORM / Database:** Prisma ORM, SQLite
- **Frontend:** React, Next.js
- **Styling:** Custom CSS Glassmorphism design system

## Key Implementation Features

### 1. Database Architecture & Consolidation
- **UUID Migration:** The system uses Universally Unique Identifiers (UUIDv4) instead of auto-incrementing integers for all primary keys. This eliminates enumeration attacks (protecting business metrics) and prevents locking bottlenecks in distributed setups.
- **Referential Integrity:** A fully normalized relational schema ensures strict foreign key constraints at the database engine level (e.g., preventing the deletion of a `Supplier` who has associated `Product` records).

### 2. Cryptographic Security & Authentication
- **Stateless JWT Architecture:** Implements a dual-token strategy to ensure security and scalability:
  - **Access Token:** Short-lived (15 minutes), containing the user's ID and Role.
  - **Refresh Token:** Long-lived (7 days), containing only the user's ID.
- **Role-Based Access Control (RBAC):** Custom middleware intercepts requests to verify user roles, guaranteeing that unauthorized personnel (e.g., 'STAFF') cannot access 'ADMIN' level endpoints.
- **Password Encryption:** User credentials are mathematically secured using `bcryptjs`.
- **Axios Interceptors:** A robust frontend interceptor seamlessly catches `401 Unauthorized` errors. It queues pending requests, silently refreshes the access token using the refresh token, and then replays the queued requests, resulting in zero user interruption.

### 3. Concurrency & Transactional Safety
- **Prisma Transactions:** To eliminate race conditions (e.g., multiple users buying the last unit simultaneously), order processing and inventory deductions are wrapped inside `$transaction` blocks.
- **ACID Compliance:** The system reads the stock levels within the transaction and aborts the entire process if the requested quantity exceeds available stock, strictly preventing negative inventory balances.

### 4. API Design & Data Aggregation
- **Dashboard Optimization:** The `/reports/dashboard` endpoint calculates aggregate data (such as total inventory value and low-stock count) at the database layer. This drastically reduces the memory footprint on the Node.js server and minimizes the JSON payload sent to the client.

### 5. Frontend UI/UX Design
- **Glassmorphism UI:** Components like cards, sidebars, and modals use `backdrop-filter: blur(16px)` layered over a deep obsidian background (`#060b18`). This provides a dynamic, faux-3D visual hierarchy, tailored to reduce eye strain.
- **Localization:** All monetary values are dynamically localized to the Indian Rupee (INR) via the `Intl.NumberFormat` API, ensuring numbers follow the Indian numbering system format (e.g., `₹10,00,000.00`).
- **Responsive Layout:** Data tables utilize `overflow-x: auto` within flexible grid structures, keeping complex tables functional and visually appealing on lower resolution screens.
- **State Management & Feedback:** Uses React Context API (`AuthContext`) to avoid prop-drilling, combined with React Hot Toast for instant, non-intrusive action feedback.

## Future Scope
- **AI Forecasting:** Integration of Python microservices to predict seasonal demand and draft purchase orders.
- **Mobile Integration:** React Native companion app for warehouse floor scanning (Barcodes/QR codes).
- **SaaS Readiness:** Migration to PostgreSQL with Row-Level Security for multi-tenant SaaS architecture.
