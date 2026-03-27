# Migrate Database to NeonTech PostgreSQL

This plan outlines the steps required to cleanly shift all application data from Firebase Firestore to a PostgreSQL database hosted on NeonTech. We will use **Prisma ORM** as it allows for a robust, type-safe, "senior engineer" style database schema definition and seamless migrations.

## User Review Required

> [!IMPORTANT]
> **Authentication vs Database:** Firebase provides two services here: **Auth** and **Firestore** (Database). This plan proposes moving all **Firestore Database** collections to Neon Postgres, but **keeping Firebase Auth** for user login to avoid forcing all existing users to reset passwords. We will pass the Firebase Auth token to our new Neon API for secure data access. *Please confirm if you want to keep Firebase Auth or also migrate Auth to something else.*

> [!WARNING]
> Firebase Firestore provides real-time listeners (`onSnapshot`), which is currently used in the `CommunityPage.tsx` for instant messaging. Since standard Postgres over Vercel serverless functions does not have built-in WebSockets, we will shift this to standard API fetching (with polling if necessary).

## Proposed Changes

### 1. Database Schema & ORM Setup
We will install Prisma ORM and define a `.prisma` schema file representing your data. The Neon connection string provided will be used.

#### [NEW] `prisma/schema.prisma`
This schema will cleanly map the existing NoSQL collections into SQL tables with relations:
- `User` (id, email, role, etc.)
- `Subscription` (1-to-1 with User)
- `Instructor` (id, name, bio)
- `Class` (id, title, videoUrl, instructorId -> references Instructor.id)
- `Asana` (id, englishName, sanskritName)
- `CommunityConversation` & `CommunityMessage` (with foreign keys to User)
- `ContactForm` & `NewsletterSubscriber`
- `Research`
- `AppSetting`

### 2. The API Layer (Vercel Serverless Functions)
Since the frontend (React/Vite) cannot securely connect to PostgreSQL directly, we will build an API layer inside the Vercel `api/` directory.

#### [NEW] `api/trpc` or `api/routes`
We will implement REST endpoints to replace the `getDocs`, `setDoc`, `addDoc`, and `deleteDoc` Firebase calls. Each endpoint will:
1. Extract the Firebase ID token from the `Authorization` header.
2. Verify the token using Firebase Admin SDK to get the `userId`.
3. Perform the Prisma operation on the Neon database.
4. Return the data to the client.

### 3. Frontend Data Fetching Refactor
All components currently importing from `firebase/firestore` (e.g., `AdminDashboard.tsx`, `CommunityPage.tsx`, `Asanas.tsx`) will be refactored to use standard `fetch` API calls to our backend.

#### [MODIFY] Shared DB Utility (`utils/api.ts`)
A new utility will be created to wrap all backend calls:
- `getUsers()`, `getClasses()`, `saveAsana()`, etc.

#### [MODIFY] React Components
- We will replace `collection(db, ...)` and `doc(db, ...)` logic with calls to our new `api.ts` utility. For example, in `Asanas.tsx`, we will replace `getDocs` with `await api.getAsanas()`.

### 4. Cleanup
#### [MODIFY] `.env` & Configuration
- **Add**: `DATABASE_URL` (NeonTech connection string).
- **Remove**: Unnecessary properties from `.env` (like Firebase Firestore-only keys, if they exist independently).
- **Keep**: `GEMINI_API_KEY`, `RAZORPAY_*`, Firebase Auth keys.

## Open Questions

1. **Authentication**: Do you approve of keeping Firebase Auth for the authentication system while only migrating the Database to Neon? (This is standard industry practice).
2. **Realtime Messaging**: Are you okay with the Community chat switching from "instant realtime" to standard fetching (or polling every 3 seconds) since we are moving to Postgres?
3. **Data Migration**: Do you need a migration script to copy your *existing* data from Firebase Firestore into Neon, or are we just setting up the new database to start fresh?

## Verification Plan

### Automated Tests
- Run `npx prisma generate` and `npx prisma db push` to ensure the Neon database accepts the schema without errors.

### Manual Verification
- Start the server (`npm run dev`) and test fetching Admin Dashboard data.
- Ensure the React components successfully interact with the API endpoints instead of Firebase.
- Validate that webhook integrations (like Razorpay) successfully update the Postgres database instead of Firebase.
