import { pgTable, serial, text, integer, doublePrecision, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table matching the Firebase Authentication UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Unique profile ID
  email: text('email').notNull().unique(),
  password: text('password').default('').notNull(), // Local secure password
  name: text('name').notNull(),
  role: text('role').$type<'student' | 'teacher' | 'superadmin'>().notNull(),
  grade: text('grade'),
  section: text('section'),
  studentCode: text('student_code'),
  teacherName: text('teacher_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('users_uid_idx').on(table.uid),
  index('users_role_idx').on(table.role),
]);

// Sections table managed dynamically by the teacher
export const sections = pgTable('sections', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('sections_name_idx').on(table.name),
]);

// Assessments table representing results of tests
export const assessments = pgTable('assessments', {
  id: serial('id').primaryKey(),
  studentId: text('student_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  studentName: text('student_name').notNull(),
  grade: text('grade').notNull(),
  section: text('section').notNull(),
  componentId: text('component_id').notNull(),
  score: doublePrecision('score').notNull(),
  rawResult: text('raw_result').notNull(),
  validReps: doublePrecision('valid_reps').default(0).notNull(),
  invalidReps: doublePrecision('invalid_reps').default(0).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => [
  index('assessments_student_idx').on(table.studentId),
  index('assessments_grade_section_idx').on(table.grade, table.section),
  index('assessments_timestamp_idx').on(table.timestamp),
]);

// Demonstration & Warm-Up Videos managed by faculty
export const warmupVideos = pgTable('warmup_videos', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').default('Warmup Routine').notNull(),
  type: text('type').$type<'link' | 'upload'>().notNull(),
  url: text('url').notNull(),
  duration: integer('duration').default(15).notNull(),
  createdBy: text('created_by').default('Faculty').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('warmup_videos_category_idx').on(table.category),
]);

// Personal Exercise Goals for Students
export const personalGoals = pgTable('personal_goals', {
  id: serial('id').primaryKey(),
  studentId: text('student_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull(),
  exerciseId: text('exercise_id').notNull(),
  exerciseName: text('exercise_name').notNull(),
  targetReps: integer('target_reps').notNull(),
  currentReps: integer('current_reps').default(0).notNull(),
  unit: text('unit').default('reps').notNull(),
  category: text('category').default('Strength').notNull(),
  targetDate: text('target_date'),
  completed: integer('completed').default(0).notNull(), // 0 = in progress, 1 = completed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('personal_goals_student_idx').on(table.studentId),
  index('personal_goals_exercise_idx').on(table.exerciseId),
]);

// Database relationships
export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
  personalGoals: many(personalGoals),
}));

export const assessmentsRelations = relations(assessments, ({ one }) => ({
  student: one(users, {
    fields: [assessments.studentId],
    references: [users.uid],
  }),
}));

export const personalGoalsRelations = relations(personalGoals, ({ one }) => ({
  student: one(users, {
    fields: [personalGoals.studentId],
    references: [users.uid],
  }),
}));
