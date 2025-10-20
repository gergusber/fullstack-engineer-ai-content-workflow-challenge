# Clerk Authentication & Workflow Implementation Plan

**Goal:** Implement Clerk authentication with organization support and role-based content workflow

---

## Overview

### Requirements
1. **User Authentication** via Clerk
2. **Organization Support** - Users belong to organizations
3. **Role-Based Access** - Different roles within organizations
4. **Workflow Tracking** - Track who creates, updates, reviews content
5. **Assignment System** - Assign content to specific users for review/editing

### Workflow Example
```
Creator (Marketing Manager)
  → Creates Campaign & Content
  → Assigns to Copywriter for editing
  → Copywriter updates content
  → Submits for review to Content Manager
  → Content Manager approves/rejects
```

---

## Architecture

### Roles Hierarchy
```typescript
enum UserRole {
  ADMIN = 'admin',           // Full access, manage org
  CONTENT_MANAGER = 'content_manager',  // Approve/reject, assign tasks
  COPYWRITER = 'copywriter',            // Create/edit content
  REVIEWER = 'reviewer',                // Review content only
  VIEWER = 'viewer'                     // Read-only access
}
```

### Permissions Matrix
| Action | Admin | Content Manager | Copywriter | Reviewer | Viewer |
|--------|-------|----------------|------------|----------|--------|
| Create Campaign | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Content | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Own Content | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit Others' Content | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign Tasks | ✅ | ✅ | ❌ | ❌ | ❌ |
| Submit for Review | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/Reject | ✅ | ✅ | ❌ | ✅ | ❌ |
| Translate Content | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Content | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## Implementation Steps

### Phase 1: Backend Setup

#### 1.1 Install Clerk SDK
```bash
cd backend
npm install @clerk/clerk-sdk-node @clerk/express
```

#### 1.2 Create User Entity
```typescript
// backend/src/database/entities/user.entity.ts
@Entity('users')
export class User {
  @PrimaryColumn()
  clerkId: string  // Clerk user ID

  @Column()
  email: string

  @Column()
  firstName: string

  @Column()
  lastName: string

  @Column()
  organizationId: string  // Clerk organization ID

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.COPYWRITER
  })
  role: UserRole

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    avatar?: string
    phone?: string
    department?: string
  }

  @Column({ default: true })
  isActive: boolean

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date

  // Relations
  @OneToMany(() => Campaign, campaign => campaign.createdByUser)
  campaigns: Campaign[]

  @OneToMany(() => ContentPiece, content => content.createdByUser)
  contentPieces: ContentPiece[]

  @OneToMany(() => ContentAssignment, assignment => assignment.assignedTo)
  assignedTasks: ContentAssignment[]
}
```

#### 1.3 Create Content Assignment Entity
```typescript
// backend/src/database/entities/content-assignment.entity.ts
@Entity('content_assignments')
export class ContentAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  contentPieceId: string

  @ManyToOne(() => ContentPiece)
  contentPiece: ContentPiece

  @Column()
  assignedToUserId: string

  @ManyToOne(() => User)
  assignedTo: User

  @Column()
  assignedByUserId: string

  @ManyToOne(() => User)
  assignedBy: User

  @Column({
    type: 'enum',
    enum: ['pending', 'in_progress', 'completed', 'cancelled']
  })
  status: string

  @Column({
    type: 'enum',
    enum: ['edit', 'review', 'translate', 'approve']
  })
  taskType: string

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ type: 'timestamp', nullable: true })
  dueDate: Date

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
```

#### 1.4 Update Campaign Entity
```typescript
// Add to backend/src/database/entities/campaign.entity.ts
@Column()
createdByUserId: string

@ManyToOne(() => User, user => user.campaigns)
@JoinColumn({ name: 'created_by_user_id' })
createdByUser: User

@Column({ nullable: true })
organizationId: string  // Clerk organization ID
```

#### 1.5 Update ContentPiece Entity
```typescript
// Add to backend/src/database/entities/content-piece.entity.ts
@Column()
createdByUserId: string

@ManyToOne(() => User, user => user.contentPieces)
@JoinColumn({ name: 'created_by_user_id' })
createdByUser: User

@Column({ nullable: true })
lastEditedByUserId: string

@ManyToOne(() => User)
@JoinColumn({ name: 'last_edited_by_user_id' })
lastEditedByUser: User

@OneToMany(() => ContentAssignment, assignment => assignment.contentPiece)
assignments: ContentAssignment[]
```

#### 1.6 Create Clerk Middleware
```typescript
// backend/src/common/middleware/clerk-auth.middleware.ts
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'
import { Injectable, NestMiddleware } from '@nestjs/common'

@Injectable()
export class ClerkAuthMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    return ClerkExpressWithAuth()(req, res, next)
  }
}
```

#### 1.7 Create Auth Guard
```typescript
// backend/src/common/guards/clerk-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common'

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    if (!request.auth?.userId) {
      throw new UnauthorizedException('Authentication required')
    }

    return true
  }
}
```

#### 1.8 Create Role Guard
```typescript
// backend/src/common/guards/role.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UserService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler()
    )

    if (!requiredRoles) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const clerkUserId = request.auth.userId

    const user = await this.userService.findByClerkId(clerkUserId)

    return requiredRoles.includes(user.role)
  }
}
```

#### 1.9 Create User Service
```typescript
// backend/src/modules/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private clerkClient: ClerkClient
  ) {}

  async syncUserFromClerk(clerkUserId: string): Promise<User> {
    // Fetch user from Clerk
    const clerkUser = await this.clerkClient.users.getUser(clerkUserId)

    // Get organization memberships
    const orgMemberships = await this.clerkClient.users.getOrganizationMembershipList({
      userId: clerkUserId
    })

    const primaryOrg = orgMemberships[0]

    // Sync to database
    let user = await this.userRepository.findOne({ where: { clerkId: clerkUserId } })

    if (!user) {
      user = this.userRepository.create({
        clerkId: clerkUserId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        organizationId: primaryOrg?.organization.id,
        role: this.mapClerkRoleToUserRole(primaryOrg?.role),
        metadata: {
          avatar: clerkUser.imageUrl
        }
      })
    } else {
      user.email = clerkUser.emailAddresses[0].emailAddress
      user.firstName = clerkUser.firstName || ''
      user.lastName = clerkUser.lastName || ''
      user.organizationId = primaryOrg?.organization.id
      user.role = this.mapClerkRoleToUserRole(primaryOrg?.role)
      user.metadata = {
        ...user.metadata,
        avatar: clerkUser.imageUrl
      }
    }

    return await this.userRepository.save(user)
  }

  private mapClerkRoleToUserRole(clerkRole?: string): UserRole {
    switch (clerkRole) {
      case 'admin':
        return UserRole.ADMIN
      case 'org:content_manager':
        return UserRole.CONTENT_MANAGER
      case 'org:reviewer':
        return UserRole.REVIEWER
      case 'org:viewer':
        return UserRole.VIEWER
      default:
        return UserRole.COPYWRITER
    }
  }
}
```

---

### Phase 2: Frontend Setup

#### 2.1 Install Clerk React
```bash
cd frontend
npm install @clerk/nextjs
```

#### 2.2 Setup Clerk Provider
```typescript
// frontend/src/app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
```

#### 2.3 Create Middleware
```typescript
// frontend/src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
```

#### 2.4 Update API Client
```typescript
// frontend/src/lib/api/client.ts
import { useAuth } from '@clerk/nextjs'
import axios from 'axios'

export const createAuthenticatedClient = () => {
  const { getToken } = useAuth()

  const client = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL
  })

  client.interceptors.request.use(async (config) => {
    const token = await getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  return client
}
```

---

### Phase 3: Workflow Features

#### 3.1 Assignment System
```typescript
// POST /api/content/:id/assign
{
  assignedToUserId: string
  taskType: 'edit' | 'review' | 'translate' | 'approve'
  notes?: string
  dueDate?: Date
}
```

#### 3.2 Task Dashboard
- Show assigned tasks per user
- Filter by status, task type
- Due date notifications

#### 3.3 Activity Log
```typescript
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  userId: string

  @Column()
  action: string  // 'created', 'updated', 'approved', 'assigned', etc.

  @Column()
  entityType: string  // 'campaign', 'content', 'translation'

  @Column()
  entityId: string

  @Column({ type: 'jsonb' })
  metadata: any

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
```

---

## Migration Plan

### Database Migration
```bash
npm run migration:create -- CreateUserAndAuthTables
```

Content:
1. Create users table
2. Create content_assignments table
3. Create activity_logs table
4. Add user columns to campaigns
5. Add user columns to content_pieces
6. Migrate existing createdBy strings to user references (if needed)

---

## Environment Variables

### Backend (.env)
```env
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## Testing Plan

1. **User Sync** - Test Clerk user sync to database
2. **Role Permissions** - Test each role's access
3. **Assignment Flow** - Test assigning content to users
4. **Workflow** - Test full content creation → review → approval flow
5. **Organization Isolation** - Ensure users only see their org's content

---

## Next Steps

1. Install Clerk packages
2. Create database entities
3. Run migrations
4. Implement authentication middleware
5. Update existing endpoints with auth
6. Implement frontend auth
7. Create assignment system
8. Test workflows

---

**Estimated Time:** 2-3 days
**Priority:** High
