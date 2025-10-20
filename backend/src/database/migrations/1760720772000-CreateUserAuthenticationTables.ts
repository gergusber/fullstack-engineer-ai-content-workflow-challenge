import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserAuthenticationTables1760720772000 implements MigrationInterface {
    name = 'CreateUserAuthenticationTables1760720772000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('Creating user authentication and workflow tables...');

        // Create user_role enum
        await queryRunner.query(`
            CREATE TYPE "public"."user_role_enum" AS ENUM(
                'admin',
                'content_manager',
                'copywriter',
                'reviewer',
                'viewer'
            )
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "clerk_id" character varying NOT NULL,
                "email" character varying NOT NULL UNIQUE,
                "first_name" character varying,
                "last_name" character varying,
                "organization_id" character varying,
                "role" "public"."user_role_enum" NOT NULL DEFAULT 'copywriter',
                "metadata" jsonb,
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "last_login_at" TIMESTAMP,
                CONSTRAINT "PK_users_clerk_id" PRIMARY KEY ("clerk_id")
            )
        `);

        // Create indexes for users
        await queryRunner.query(`CREATE INDEX "IDX_users_organization_id" ON "users" ("organization_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);

        console.log('Users table created');

        // Create assignment_status enum
        await queryRunner.query(`
            CREATE TYPE "public"."assignment_status_enum" AS ENUM(
                'pending',
                'in_progress',
                'completed',
                'cancelled'
            )
        `);

        // Create assignment_task_type enum
        await queryRunner.query(`
            CREATE TYPE "public"."assignment_task_type_enum" AS ENUM(
                'edit',
                'review',
                'translate',
                'approve'
            )
        `);

        // Create content_assignments table
        await queryRunner.query(`
            CREATE TABLE "content_assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "content_piece_id" uuid NOT NULL,
                "assigned_to_user_id" character varying NOT NULL,
                "assigned_by_user_id" character varying NOT NULL,
                "status" "public"."assignment_status_enum" NOT NULL DEFAULT 'pending',
                "task_type" "public"."assignment_task_type_enum" NOT NULL,
                "notes" text,
                "due_date" TIMESTAMP,
                "completed_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_content_assignments" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for content_assignments
        await queryRunner.query(`CREATE INDEX "IDX_assignments_content_status" ON "content_assignments" ("content_piece_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_assignments_user_status" ON "content_assignments" ("assigned_to_user_id", "status")`);

        // Add foreign keys for content_assignments
        await queryRunner.query(`
            ALTER TABLE "content_assignments"
            ADD CONSTRAINT "FK_assignments_content_piece"
            FOREIGN KEY ("content_piece_id")
            REFERENCES "content_pieces"("id")
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "content_assignments"
            ADD CONSTRAINT "FK_assignments_assigned_to_user"
            FOREIGN KEY ("assigned_to_user_id")
            REFERENCES "users"("clerk_id")
            ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "content_assignments"
            ADD CONSTRAINT "FK_assignments_assigned_by_user"
            FOREIGN KEY ("assigned_by_user_id")
            REFERENCES "users"("clerk_id")
            ON DELETE CASCADE
        `);

        console.log('Content assignments table created');

        // Create activity_action enum
        await queryRunner.query(`
            CREATE TYPE "public"."activity_action_enum" AS ENUM(
                'created',
                'updated',
                'deleted',
                'approved',
                'rejected',
                'assigned',
                'submitted',
                'translated',
                'reviewed'
            )
        `);

        // Create activity_entity_type enum
        await queryRunner.query(`
            CREATE TYPE "public"."activity_entity_type_enum" AS ENUM(
                'campaign',
                'content',
                'translation',
                'review',
                'assignment'
            )
        `);

        // Create activity_logs table
        await queryRunner.query(`
            CREATE TABLE "activity_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" character varying NOT NULL,
                "organization_id" character varying,
                "action" "public"."activity_action_enum" NOT NULL,
                "entity_type" "public"."activity_entity_type_enum" NOT NULL,
                "entity_id" character varying NOT NULL,
                "entity_name" character varying,
                "metadata" jsonb,
                "ip_address" character varying,
                "user_agent" text,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for activity_logs
        await queryRunner.query(`CREATE INDEX "IDX_activity_user_created" ON "activity_logs" ("user_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_activity_entity" ON "activity_logs" ("entity_type", "entity_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_activity_org_created" ON "activity_logs" ("organization_id", "created_at")`);

        // Add foreign key for activity_logs
        await queryRunner.query(`
            ALTER TABLE "activity_logs"
            ADD CONSTRAINT "FK_activity_logs_user"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("clerk_id")
            ON DELETE CASCADE
        `);

        console.log('Activity logs table created');

        // Add user columns to campaigns table
        await queryRunner.query(`
            ALTER TABLE "campaigns"
            ADD COLUMN "created_by_user_id" character varying,
            ADD COLUMN "organization_id" character varying
        `);

        await queryRunner.query(`
            ALTER TABLE "campaigns"
            ADD CONSTRAINT "FK_campaigns_created_by_user"
            FOREIGN KEY ("created_by_user_id")
            REFERENCES "users"("clerk_id")
            ON DELETE SET NULL
        `);

        console.log('Campaigns table updated with user tracking');

        // Add user columns to content_pieces table
        await queryRunner.query(`
            ALTER TABLE "content_pieces"
            ADD COLUMN "created_by_user_id" character varying,
            ADD COLUMN "last_edited_by_user_id" character varying
        `);

        await queryRunner.query(`
            ALTER TABLE "content_pieces"
            ADD CONSTRAINT "FK_content_created_by_user"
            FOREIGN KEY ("created_by_user_id")
            REFERENCES "users"("clerk_id")
            ON DELETE SET NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "content_pieces"
            ADD CONSTRAINT "FK_content_last_edited_by_user"
            FOREIGN KEY ("last_edited_by_user_id")
            REFERENCES "users"("clerk_id")
            ON DELETE SET NULL
        `);

        console.log('Content pieces table updated with user tracking');
        console.log('User authentication tables migration completed!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('Rolling back user authentication tables...');

        // Drop foreign keys from content_pieces
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP CONSTRAINT IF EXISTS "FK_content_last_edited_by_user"`);
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP CONSTRAINT IF EXISTS "FK_content_created_by_user"`);
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP COLUMN IF EXISTS "last_edited_by_user_id"`);
        await queryRunner.query(`ALTER TABLE "content_pieces" DROP COLUMN IF EXISTS "created_by_user_id"`);

        // Drop foreign keys from campaigns
        await queryRunner.query(`ALTER TABLE "campaigns" DROP CONSTRAINT IF EXISTS "FK_campaigns_created_by_user"`);
        await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "organization_id"`);
        await queryRunner.query(`ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "created_by_user_id"`);

        // Drop activity_logs
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_org_created"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_entity"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_activity_user_created"`);
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT IF EXISTS "FK_activity_logs_user"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."activity_entity_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."activity_action_enum"`);

        // Drop content_assignments
        await queryRunner.query(`ALTER TABLE "content_assignments" DROP CONSTRAINT IF EXISTS "FK_assignments_assigned_by_user"`);
        await queryRunner.query(`ALTER TABLE "content_assignments" DROP CONSTRAINT IF EXISTS "FK_assignments_assigned_to_user"`);
        await queryRunner.query(`ALTER TABLE "content_assignments" DROP CONSTRAINT IF EXISTS "FK_assignments_content_piece"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assignments_user_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_assignments_content_status"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "content_assignments"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."assignment_task_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."assignment_status_enum"`);

        // Drop users
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_organization_id"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."user_role_enum"`);

        console.log('Rollback completed');
    }
}
