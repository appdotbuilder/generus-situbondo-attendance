
import { serial, text, pgTable, timestamp, integer, boolean, date, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['guru', 'koordinator']);
export const genderEnum = pgEnum('gender', ['Laki-laki', 'Perempuan']);
export const jenjangEnum = pgEnum('jenjang', ['SD', 'SMP', 'SMA', 'Kuliah']);
export const statusEnum = pgEnum('status', ['Aktif', 'Tidak Aktif', 'Alumni']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['Hadir', 'Sakit', 'Izin', 'Tidak Hadir/Alfa']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull(),
  full_name: text('full_name').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Generus (Students) table
export const generusTable = pgTable('generus', {
  id: serial('id').primaryKey(),
  nama_lengkap: text('nama_lengkap').notNull(),
  tempat_lahir: text('tempat_lahir').notNull(),
  tanggal_lahir: date('tanggal_lahir').notNull(),
  kelompok_sambung: text('kelompok_sambung').notNull(),
  jenis_kelamin: genderEnum('jenis_kelamin').notNull(),
  jenjang: jenjangEnum('jenjang').notNull(),
  status: statusEnum('status').notNull(),
  profesi: text('profesi'),
  keahlian: text('keahlian'),
  keterangan: text('keterangan'),
  foto_url: text('foto_url'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// KBM Reports table
export const kbmReportsTable = pgTable('kbm_reports', {
  id: serial('id').primaryKey(),
  tanggal: date('tanggal').notNull(),
  hari: text('hari').notNull(),
  nama_pengajar: text('nama_pengajar').notNull(),
  user_id: integer('user_id').references(() => usersTable.id).notNull(),
  materi: text('materi').notNull(),
  keterangan: text('keterangan'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Attendance table
export const attendanceTable = pgTable('attendance', {
  id: serial('id').primaryKey(),
  generus_id: integer('generus_id').references(() => generusTable.id).notNull(),
  kbm_report_id: integer('kbm_report_id').references(() => kbmReportsTable.id).notNull(),
  status: attendanceStatusEnum('status').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Materials table
export const materialsTable = pgTable('materials', {
  id: serial('id').primaryKey(),
  judul: text('judul').notNull(),
  deskripsi: text('deskripsi'),
  file_url: text('file_url'),
  file_name: text('file_name'),
  created_by: integer('created_by').references(() => usersTable.id).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  kbmReports: many(kbmReportsTable),
  materials: many(materialsTable)
}));

export const generusRelations = relations(generusTable, ({ many }) => ({
  attendances: many(attendanceTable)
}));

export const kbmReportsRelations = relations(kbmReportsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [kbmReportsTable.user_id],
    references: [usersTable.id]
  }),
  attendances: many(attendanceTable)
}));

export const attendanceRelations = relations(attendanceTable, ({ one }) => ({
  generus: one(generusTable, {
    fields: [attendanceTable.generus_id],
    references: [generusTable.id]
  }),
  kbmReport: one(kbmReportsTable, {
    fields: [attendanceTable.kbm_report_id],
    references: [kbmReportsTable.id]
  })
}));

export const materialsRelations = relations(materialsTable, ({ one }) => ({
  createdBy: one(usersTable, {
    fields: [materialsTable.created_by],
    references: [usersTable.id]
  })
}));

// Export all tables for queries
export const tables = {
  users: usersTable,
  generus: generusTable,
  kbmReports: kbmReportsTable,
  attendance: attendanceTable,
  materials: materialsTable
};

// TypeScript types
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Generus = typeof generusTable.$inferSelect;
export type NewGenerus = typeof generusTable.$inferInsert;
export type KBMReport = typeof kbmReportsTable.$inferSelect;
export type NewKBMReport = typeof kbmReportsTable.$inferInsert;
export type Attendance = typeof attendanceTable.$inferSelect;
export type NewAttendance = typeof attendanceTable.$inferInsert;
export type Material = typeof materialsTable.$inferSelect;
export type NewMaterial = typeof materialsTable.$inferInsert;
