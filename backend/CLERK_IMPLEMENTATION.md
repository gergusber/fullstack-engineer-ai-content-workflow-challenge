# Clerk Authentication Implementation - Backend

## Overview
Complete Clerk authentication and authorization system with user tracking, role-based access control (RBAC), content assignment workflow, and comprehensive activity logging.

## Implementation Summary

### 1. Database Layer

#### Entities Created
- **User Entity** (`src/database/entities/user.entity.ts`)
  - Stores Clerk users with roles and organization tracking
  - Roles: Admin, Content Manager, Copywriter, Reviewer, Viewer
  - Tracks organization membership, last login, activity status

- **ContentAssignment Entity** (`src/database/entities/content-assignment.entity.ts`)
  - Manages task assignments between users
  - Task types: Edit, Review, Translate, Approve
  - Status tracking: Pending, In Progress, Completed, Cancelled
  - Due date management

- **ActivityLog Entity** (`src/database/entities/activity-log.entity.ts`)
  - Comprehensive audit trail for all user actions
  - Tracks: User ID, action type, entity type, metadata
  - Supports filtering by user, organization, entity, date range

#### Updated Entities
- **Campaign Entity** - Added `createdByUserId` and `organizationId`
- **ContentPiece Entity** - Added `createdByUserId` and `lastEditedByUserId`

#### Migration
- **1760720772000-CreateUserAuthenticationTables.ts**
  - Creates users, content_assignments, and activity_logs tables
  - Updates campaigns and content_pieces with user tracking
  - Includes full rollback support

### 2. Authentication Layer

#### Middleware
- **ClerkAuthMiddleware** (`src/common/middleware/clerk-auth.middleware.ts`)
  - Extracts Bearer token from Authorization header
  - Verifies session with Clerk
  - Attaches auth info (userId, sessionId, orgId) to request

- **UserLoaderMiddleware** (`src/common/middleware/user-loader.middleware.ts`)
  - Loads full user entity from database using Clerk ID
  - Attaches user object to request
  - Updates last login timestamp

#### Guards
- **ClerkAuthGuard** (`src/common/guards/clerk-auth.guard.ts`)
  - Global guard enforcing authentication on all routes
  - Respects @Public() decorator for public endpoints
  - Throws UnauthorizedException if not authenticated

- **RolesGuard** (`src/common/guards/roles.guard.ts`)
  - Enforces role-based access control
  - Works with @Roles() decorator
  - Throws ForbiddenException if insufficient permissions

#### Decorators
- **@CurrentUser()** - Extract current user from request
- **@Roles(UserRole.ADMIN, ...)** - Require specific roles
- **@Public()** - Mark endpoint as public (skip authentication)

### 3. Business Logic

#### Users Module
**Service** (`src/modules/users/users.service.ts`)
- `syncUserFromClerk()` - Sync user data from Clerk on login
- `create()` - Manually create user
- `findByClerkId()` - Find user by Clerk ID
- `findByEmail()` - Find user by email
- `findByOrganization()` - Get all users in organization
- `findByRole()` - Get users by role
- `update()` - Update user profile
- `updateRole()` - Update user role (admin only)
- `activate()/deactivate()` - Enable/disable users

**Controller** (`src/modules/users/users.controller.ts`)
- `GET /users/me` - Get current user profile
- `POST /users/sync` - Sync user from Clerk
- `GET /users` - List users (Admin/Content Manager)
- `GET /users/by-role/:role` - Get users by role
- `GET /users/:clerkId` - Get user by ID
- `PATCH /users/:clerkId` - Update user
- `PATCH /users/:clerkId/role` - Update role (Admin)
- `DELETE /users/:clerkId/deactivate` - Deactivate (Admin)
- `POST /users/:clerkId/activate` - Activate (Admin)

#### Assignments Module
**Service** (`src/modules/assignments/assignments.service.ts`)
- `create()` - Create new assignment
- `findByUser()` - Get user's assignments
- `findByUserAndStatus()` - Filter by status
- `findByContentPiece()` - Get assignments for content
- `start()` - Start assignment (pending → in_progress)
- `complete()` - Complete assignment
- `cancel()` - Cancel assignment
- `findOverdue()` - Get overdue assignments
- `getStatistics()` - Get assignment statistics for user

**Controller** (`src/modules/assignments/assignments.controller.ts`)
- `POST /assignments` - Create assignment (Admin/Content Manager)
- `GET /assignments/me` - My assignments
- `GET /assignments/me/statistics` - My statistics
- `GET /assignments/me/status/:status` - My assignments by status
- `GET /assignments/content/:contentPieceId` - Assignments for content
- `GET /assignments/created-by-me` - Assignments I created
- `GET /assignments/overdue` - Overdue assignments (Admin/Content Manager)
- `GET /assignments/:id` - Get assignment
- `PATCH /assignments/:id` - Update assignment
- `POST /assignments/:id/start` - Start assignment
- `POST /assignments/:id/complete` - Complete assignment
- `POST /assignments/:id/cancel` - Cancel assignment (Admin/Content Manager)
- `DELETE /assignments/:id` - Delete assignment (Admin)

#### Activity Module
**Service** (`src/modules/activity/activity.service.ts`)
- `log()` - Generic activity logging
- `logCampaign()` - Log campaign activity
- `logContent()` - Log content activity
- `logTranslation()` - Log translation activity
- `logAssignment()` - Log assignment activity
- `findByUser()` - Get user's activity
- `findByOrganization()` - Get organization activity
- `findByEntity()` - Get activity for specific entity
- `getRecentActivity()` - Get recent activity for dashboard
- `getOrganizationStatistics()` - Get org statistics
- `getUserStatistics()` - Get user statistics

**Controller** (`src/modules/activity/activity.controller.ts`)
- `GET /activity/me` - My activity logs
- `GET /activity/me/statistics` - My activity statistics
- `GET /activity/organization` - Organization activity (Admin/Content Manager)
- `GET /activity/organization/recent` - Recent activity (Admin/Content Manager)
- `GET /activity/organization/statistics` - Org statistics (Admin/Content Manager)
- `GET /activity/entity/:entityType/:entityId` - Entity activity
- `GET /activity/action/:action` - Activity by action (Admin)
- `GET /activity/date-range` - Activity by date range (Admin/Content Manager)

### 4. Integration with Existing Services

#### ContentService Updates
- Added optional `userId` parameter to `create()`, `update()`, and `updateReviewState()`
- Automatically tracks user who created/edited content
- Logs activities: CREATED, UPDATED, APPROVED, REJECTED, REVIEWED

#### CampaignsService Updates
- Added optional `userId` and `organizationId` parameters to `create()` and `update()`
- Tracks campaign creator and organization
- Logs activities: CREATED, UPDATED

#### Module Integration
- ContentModule imports ActivityModule (forwardRef)
- CampaignsModule imports ActivityModule (forwardRef)
- All new modules registered in AppModule

### 5. Configuration

#### Environment Variables (.env)
```bash
# Clerk Authentication Configuration
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

#### App Module Setup
- ClerkAuthMiddleware applied globally
- UserLoaderMiddleware applied globally (after ClerkAuth)
- ClerkAuthGuard registered as global APP_GUARD
- Middleware execution order: ClerkAuth → UserLoader → Guards → Controllers

## User Roles and Permissions

### Admin
- Full system access
- User management (create, update, delete, assign roles)
- All content and campaign operations
- View all activity logs
- Delete assignments

### Content Manager
- Create and manage campaigns
- Create and assign content tasks
- View organization users and activity
- Manage assignments
- Update user roles (except Admin)

### Copywriter
- Create content
- Work on assigned tasks
- View own assignments and activity
- Default role for new users

### Reviewer
- Review and approve/reject content
- View assigned review tasks
- Access user lists for assignment purposes

### Viewer
- Read-only access to content and campaigns
- Cannot create or modify content

## API Authentication Flow

1. **User Login** (Frontend → Clerk)
   - User logs in through Clerk
   - Frontend receives JWT session token

2. **API Request** (Frontend → Backend)
   - Frontend sends request with `Authorization: Bearer <token>` header

3. **ClerkAuthMiddleware** (Backend)
   - Extracts and verifies token with Clerk
   - Attaches `{ userId, sessionId, orgId }` to request

4. **UserLoaderMiddleware** (Backend)
   - Loads full user entity from database
   - Attaches user object to request
   - Updates last login timestamp

5. **ClerkAuthGuard** (Backend)
   - Checks if user is authenticated
   - Allows public routes to bypass

6. **RolesGuard** (Backend)
   - Checks if user has required role
   - Allows if no roles specified

7. **Controller** (Backend)
   - Access user via `@CurrentUser()` decorator
   - Execute business logic with user context

## Testing Endpoints

### Create a Test User
```bash
curl -X POST http://localhost:3001/users/sync \
  -H "Authorization: Bearer <clerk_token>"
```

### Get Current User
```bash
curl http://localhost:3001/users/me \
  -H "Authorization: Bearer <clerk_token>"
```

### Create Assignment
```bash
curl -X POST http://localhost:3001/assignments \
  -H "Authorization: Bearer <clerk_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "contentPieceId": "uuid",
    "assignedToUserId": "clerk_user_id",
    "taskType": "review",
    "notes": "Please review this content",
    "dueDate": "2024-12-31T23:59:59Z"
  }'
```

### View Activity Logs
```bash
curl http://localhost:3001/activity/me \
  -H "Authorization: Bearer <clerk_token>"
```

## Next Steps (Frontend Integration)

1. **Install Clerk Frontend SDK**
   ```bash
   npm install @clerk/clerk-react
   ```

2. **Wrap App with ClerkProvider**
   ```tsx
   import { ClerkProvider } from '@clerk/clerk-react';

   <ClerkProvider publishableKey={process.env.REACT_APP_CLERK_PUBLISHABLE_KEY}>
     <App />
   </ClerkProvider>
   ```

3. **Add Authentication Components**
   ```tsx
   import { SignIn, SignUp, UserButton } from '@clerk/clerk-react';
   ```

4. **Update API Client**
   - Add Clerk token to all requests
   - Use `useAuth()` hook to get session token
   - Automatically attach to Authorization header

5. **Protect Routes**
   - Use `<SignedIn>` and `<SignedOut>` components
   - Implement role-based route protection
   - Redirect unauthenticated users

6. **Sync User on Login**
   - Call `/users/sync` endpoint after login
   - Store user profile in React context/state

7. **Update UI for Roles**
   - Show/hide features based on user role
   - Display user info and role in header
   - Implement role-based navigation

## Database Migration

To apply the authentication tables:

```bash
# Generate migration if needed
npm run migration:generate -- src/database/migrations/CreateUserAuthenticationTables

# Run migrations
npm run migration:run

# Rollback if needed
npm run migration:revert
```

## Security Notes

1. **Token Verification**: All tokens verified with Clerk on every request
2. **Role Enforcement**: Roles checked at both guard and service level
3. **Organization Isolation**: Data filtered by organization ID where applicable
4. **Activity Logging**: All sensitive actions logged for audit trail
5. **Soft Deletes**: Users deactivated instead of deleted to preserve audit trail

## Troubleshooting

### "User not found in database"
- User needs to be synced on first login
- Call `/users/sync` endpoint after Clerk login

### "Authentication required"
- Missing or invalid Bearer token
- Token expired - refresh from Clerk

### "Insufficient permissions"
- User doesn't have required role
- Check role assignments in database

### "Failed to log activity"
- ActivityService injection issue
- Check forwardRef usage in modules
- Non-critical - doesn't block request
