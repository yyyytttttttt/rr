# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 medical appointment booking application with authentication, role-based access control, and a full-page slider interface. The app supports user registration, doctor scheduling, appointment bookings, and payment processing.

**Key Technologies:**
- Next.js 15.3.4 (App Router)
- React 19
- NextAuth.js v4 for authentication
- Prisma ORM with PostgreSQL
- TypeScript + JavaScript (mixed)
- Tailwind CSS v4
- Swiper for full-page vertical scrolling
- Cloudinary for image uploads
- FullCalendar for doctor scheduling

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Prisma commands
npx prisma generate          # Generate Prisma Client
npx prisma db push           # Push schema changes to database
npx prisma migrate dev       # Create and apply migrations
npx prisma studio            # Open Prisma Studio GUI
```

## Architecture

### Authentication System

**File:** `src/lib/auth.ts`

The app uses NextAuth.js with JWT strategy and Prisma adapter. Authentication includes:

- **Credentials provider** with email/password (bcrypt hashing)
- **Email verification** required before login (throws `EMAIL_NOT_VERIFIED` error)
- **Token versioning** (`tokenVersion` field) to invalidate sessions when user changes password
- **Role-based access**: USER, DOCTOR, ADMIN (defined in Prisma schema)

**Important:** Auth requires checking `tokenVersion` in JWT callback to ensure sessions are invalidated after password changes.

### Middleware & Route Protection

**File:** `src/middleware.ts`

Role-based access matrix:
- `/admin/*` → ADMIN, DOCTOR only
- `/doctor/*` → DOCTOR only
- `/profile/*` → USER, DOCTOR, ADMIN

Unauthorized users are redirected to `/Login` with `?from=` parameter for post-login redirect.

### Database Schema

**File:** `prisma/schema.prisma`

Key models and relationships:

**User** → **Doctor** (1:1 via `userId`)
- User has `role`, `tokenVersion`, `emailVerified`, `passwordUpdatedAt`
- Doctor has scheduling config: `slotDurationMin`, `bufferMin`, `tzid`, `minLeadMin`, `gridStepMin`

**Doctor** → **Service** (1:many)
- Services have pricing (`priceCents`, `currency`), duration, and optional buffer override

**Doctor** → **Schedule** (1:many)
- Uses `rrule` format for recurring schedules with timezone support
- `byWeekday` array stores weekdays (0-6)

**Doctor** → **Opening** (1:many)
- Pre-calculated available time slots (`startUtc`, `endUtc`)

**Doctor** → **Exception** (1:many)
- Blocks of time (vacation, breaks) with optional `reason` and `kind`

**Doctor** → **Booking** (1:many)
- User → **Booking** (1:many, optional via `userId` with SetNull onDelete)
- Service → **Booking** (1:many, Restrict onDelete)
- Unique constraint: `[doctorId, startUtc]` prevents double-booking
- Status: PENDING, CONFIRMED, CANCELED, COMPLETED, NO_SHOW

**Booking** → **Payment** (1:1)
- Payment status: REQUIRES_PAYMENT, PAID, REFUNDED, CANCELED

**Critical:** When querying schedules/bookings, always consider timezone (`tzid`) stored in Doctor model.

### Frontend Architecture

**Main Page:** `src/app/page.js`

The homepage uses a full-page vertical Swiper slider with:
- Vertical mousewheel/keyboard navigation
- Slide data in `src/app/components/glav/slides.dataGlav.ts`
- Custom viewport height handling via `--app-vh` CSS variable (set in `layout.js`)
- `SlideRenderer` component renders different slide types
- `Navigation` component for multi-menu overlay system
- `LayoutOverlay` for persistent UI elements

**Navigation System:**

Multi-layered menu system with:
- `TopBar.jsx` - Top navigation
- `BottomNav.jsx` - Bottom navigation
- `LeftMenu.jsx` - Side menu
- `Menu.jsx` - Main menu overlay
- `Menu3cols.jsx` - Three-column menu variant

**Custom Hooks:**
- `useIsMobile.js` - Responsive breakpoint detection
- `usePagedScroll.js` - Custom scroll paging logic
- `useVh100.js` - 100vh mobile viewport fix

### API Routes

Authentication flows:
- `/api/auth/[...nextauth]` - NextAuth handlers
- `/api/register` - User registration with email verification
- `/api/resend` - Resend verification email
- `/api/request-password-reset` - Initiate password reset
- `/api/reset-password` - Complete password reset
- `/api/changePassword` - Change password (logged in users)

Booking system:
- `/api/doctors` - CRUD for doctors
- `/api/doctors/list` - Public doctor list
- `/api/services` - CRUD for services
- `/api/services/list` - Public service list
- `/api/doctor/openings` - Manage available time slots
- `/api/doctor/openings/edit` - Edit openings
- `/api/doctor/exceptions/mutate` - Add/remove exceptions
- `/api/doctor/slots` - Get available booking slots
- `/api/bookings` - Create/manage bookings
- `/api/doctor/bookings/status` - Update booking status
- `/api/doctor/calendar` - Calendar data for doctor view

File uploads:
- `/api/upload-avatar` - Cloudinary avatar uploads

### Important Configuration

**Prisma Client:**
- Import from `src/lib/prizma.ts` (note the typo: "prizma" not "prisma")
- Singleton pattern prevents multiple instances in development

**Image Domains:**
- `lh3.googleusercontent.com` - Google OAuth avatars
- `res.cloudinary.com` - Cloudinary uploads

**Trailing Slashes:**
- Enabled in `next.config.mjs` (`trailingSlash: true`)

**TypeScript:**
- Mixed JS/TS codebase (migrating to TypeScript)
- `tsconfig.json` includes some JS files explicitly

### Email Verification Flow

1. User registers → email with verification token sent
2. User clicks link → `/verify?token=xxx`
3. Token validated → `emailVerified` timestamp set
4. Login fails if `emailVerified` is null

**Models:** `VerificationToken`, `PasswordResetToken`

### Password Reset Flow

1. User requests reset → token generated in `PasswordResetToken`
2. Email sent with reset link
3. User submits new password → token validated
4. Password updated → `tokenVersion` incremented (invalidates all sessions)

### Doctor Calendar System

**Page:** `src/app/doctor/calendar/page.jsx`

Server component checks:
1. User is authenticated
2. User has associated Doctor record
3. Passes `doctorId`, `tzid`, and name to client component

**Client:** `src/app/doctor/calendar/client.jsx` uses FullCalendar with:
- Schedule management (recurring patterns via rrule)
- Exception handling (blocks)
- Opening generation
- Booking visualization
- Timezone-aware date handling

### Styling

- Tailwind CSS v4 with PostCSS
- Custom CSS variables for viewport height (`--app-vh`)
- Global styles in `src/app/globals.css`
- Geist font family (sans and mono)

### File Conventions

Pages with role requirements:
- `/profile/*` - Authenticated users
- `/doctor/*` - DOCTOR role required
- `/admin/*` - ADMIN or DOCTOR role

Public pages:
- `/Login`, `/register`, `/verify`, `/forgetPassword`, `/reset-password`
- `/AboutUS`, `/News`, `/Propuski`

## Development Notes

**Session Management:**
- Sessions expire after 7 days
- Password changes increment `tokenVersion` to invalidate old sessions
- JWT callback validates `tokenVersion` on each request

**Timezone Handling:**
- Doctor's `tzid` field stores timezone (default "UTC")
- Schedule times stored in UTC in database
- Convert to doctor's timezone for display
- Use `date-fns-tz` for timezone conversions

**Booking Constraints:**
- `uniq_doctor_slot` prevents double-booking same time slot
- `minLeadMin` enforces minimum advance booking time
- `bufferMin` adds buffer between appointments (can be overridden per-service)
- `gridStepMin` controls available start times granularity

**Image Uploads:**
- Cloudinary integration via `next-cloudinary`
- Avatar uploads handled in `/api/upload-avatar`
- Upload component: `src/app/components/profile/UploadClient.jsx`

**Form Validation:**
- React Hook Form with Zod resolvers
- Used in registration, login, password reset flows

**Toast Notifications:**
- `react-hot-toast` for user feedback

**Responsive Design:**
- Mobile-first with `react-responsive`
- Custom viewport height handling for mobile browsers
- Full-page vertical swiper optimized for touch
