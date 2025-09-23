import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1732308000000 implements MigrationInterface {
    name = 'InitialSchema1732308000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types first
        await queryRunner.query(`CREATE TYPE "public"."campaign_status_enum" AS ENUM('draft', 'active', 'paused', 'completed', 'archived')`);
        await queryRunner.query(`CREATE TYPE "public"."content_type_enum" AS ENUM('headline', 'description', 'social_post', 'email_subject', 'blog_post', 'ad_copy', 'product_desc', 'landing_page')`);
        await queryRunner.query(`CREATE TYPE "public"."review_state_enum" AS ENUM('draft', 'ai_generated', 'pending_review', 'under_review', 'needs_revision', 'approved', 'rejected', 'published')`);
        await queryRunner.query(`CREATE TYPE "public"."priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')`);
        await queryRunner.query(`CREATE TYPE "public"."ai_model_enum" AS ENUM('openai_gpt4', 'openai_gpt35', 'claude_3_sonnet', 'claude_3_haiku', 'claude_3_opus', 'claude', 'openai')`);
        await queryRunner.query(`CREATE TYPE "public"."generation_type_enum" AS ENUM('original', 'variation', 'improvement', 'translation', 'summary')`);
        await queryRunner.query(`CREATE TYPE "public"."review_type_enum" AS ENUM('content_review', 'translation_review', 'quality_check', 'final_approval')`);
        await queryRunner.query(`CREATE TYPE "public"."review_action_enum" AS ENUM('approve', 'reject', 'request_revision', 'edit', 'escalate')`);

        // Create campaigns table
        await queryRunner.query(`CREATE TABLE "campaigns" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "name" character varying(255) NOT NULL,
            "description" text,
            "status" "public"."campaign_status_enum" NOT NULL DEFAULT 'draft',
            "created_by" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_campaigns" PRIMARY KEY ("id")
        )`);

        // Create content_pieces table
        await queryRunner.query(`CREATE TABLE "content_pieces" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "campaign_id" uuid NOT NULL,
            "title" character varying(500),
            "description" text,
            "content_type" "public"."content_type_enum" NOT NULL,
            "target_language" character varying NOT NULL DEFAULT 'en',
            "source_language" character varying NOT NULL DEFAULT 'en',
            "review_state" "public"."review_state_enum" NOT NULL DEFAULT 'draft',
            "priority" "public"."priority_enum" NOT NULL DEFAULT 'medium',
            "original_prompt" text,
            "content_metadata" jsonb,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
            "published_at" TIMESTAMP,
            CONSTRAINT "PK_content_pieces" PRIMARY KEY ("id")
        )`);

        // Create ai_drafts table
        await queryRunner.query(`CREATE TABLE "ai_drafts" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "content_piece_id" uuid NOT NULL,
            "model_used" "public"."ai_model_enum" NOT NULL,
            "model_version" character varying,
            "generation_type" "public"."generation_type_enum" NOT NULL,
            "generated_title" text,
            "generated_desc" text,
            "generated_content" jsonb,
            "prompt" text NOT NULL,
            "temperature" double precision,
            "max_tokens" integer,
            "response_time" integer,
            "token_count" integer,
            "cost" double precision,
            "quality_score" double precision,
            "user_rating" integer,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_ai_drafts" PRIMARY KEY ("id")
        )`);

        // Create reviews table
        await queryRunner.query(`CREATE TABLE "reviews" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "content_piece_id" uuid,
            "campaign_id" uuid,
            "review_type" "public"."review_type_enum" NOT NULL,
            "action" "public"."review_action_enum" NOT NULL,
            "previous_state" "public"."review_state_enum",
            "new_state" "public"."review_state_enum" NOT NULL,
            "comments" text,
            "suggestions" text,
            "edited_content" jsonb,
            "reviewer_id" character varying,
            "reviewer_name" character varying,
            "reviewer_role" character varying,
            "created_at" TIMESTAMP NOT NULL DEFAULT now(),
            CONSTRAINT "PK_reviews" PRIMARY KEY ("id")
        )`);

        // Add foreign key constraints
        await queryRunner.query(`ALTER TABLE "content_pieces" ADD CONSTRAINT "FK_content_pieces_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "ai_drafts" ADD CONSTRAINT "FK_ai_drafts_content_piece" FOREIGN KEY ("content_piece_id") REFERENCES "content_pieces"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_content_piece" FOREIGN KEY ("content_piece_id") REFERENCES "content_pieces"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "reviews" ADD CONSTRAINT "FK_reviews_campaign" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE`);

        // Add indexes
        await queryRunner.query(`CREATE INDEX "IDX_campaigns_status_created_at" ON "campaigns" ("status", "created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_campaigns_created_by" ON "campaigns" ("created_by")`);
        await queryRunner.query(`CREATE INDEX "IDX_content_pieces_campaign_review_state" ON "content_pieces" ("campaign_id", "review_state")`);
        await queryRunner.query(`CREATE INDEX "IDX_content_pieces_content_type_target_language" ON "content_pieces" ("content_type", "target_language")`);
        await queryRunner.query(`CREATE INDEX "IDX_content_pieces_review_state_priority" ON "content_pieces" ("review_state", "priority")`);
        await queryRunner.query(`CREATE INDEX "IDX_ai_drafts_content_piece_created_at" ON "ai_drafts" ("content_piece_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_ai_drafts_model_generation_type" ON "ai_drafts" ("model_used", "generation_type")`);
        await queryRunner.query(`CREATE INDEX "IDX_ai_drafts_quality_score" ON "ai_drafts" ("quality_score")`);
        await queryRunner.query(`CREATE INDEX "IDX_reviews_content_piece_created_at" ON "reviews" ("content_piece_id", "created_at")`);
        await queryRunner.query(`CREATE INDEX "IDX_reviews_review_type_action" ON "reviews" ("review_type", "action")`);
        await queryRunner.query(`CREATE INDEX "IDX_reviews_reviewer_id" ON "reviews" ("reviewer_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables first
        await queryRunner.query(`DROP TABLE "reviews"`);
        await queryRunner.query(`DROP TABLE "ai_drafts"`);
        await queryRunner.query(`DROP TABLE "content_pieces"`);
        await queryRunner.query(`DROP TABLE "campaigns"`);

        // Drop enum types
        await queryRunner.query(`DROP TYPE "public"."review_action_enum"`);
        await queryRunner.query(`DROP TYPE "public"."review_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."generation_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ai_model_enum"`);
        await queryRunner.query(`DROP TYPE "public"."priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."review_state_enum"`);
        await queryRunner.query(`DROP TYPE "public"."content_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."campaign_status_enum"`);
    }
}