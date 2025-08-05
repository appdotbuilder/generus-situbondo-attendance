
import { z } from 'zod';

// User schemas
export const userRoleSchema = z.enum(['guru', 'koordinator']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const userSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  role: userRoleSchema,
  full_name: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

export const loginInputSchema = z.object({
  username: z.string(),
  password: z.string(),
  role: userRoleSchema
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Generus (Student) schemas
export const genderSchema = z.enum(['Laki-laki', 'Perempuan']);
export const jenjangSchema = z.enum(['SD', 'SMP', 'SMA', 'Kuliah']);
export const statusSchema = z.enum(['Aktif', 'Tidak Aktif', 'Alumni']);

export const generusSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string(),
  tempat_lahir: z.string(),
  tanggal_lahir: z.coerce.date(),
  kelompok_sambung: z.string(),
  jenis_kelamin: genderSchema,
  jenjang: jenjangSchema,
  status: statusSchema,
  profesi: z.string().nullable(),
  keahlian: z.string().nullable(),
  keterangan: z.string().nullable(),
  foto_url: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Generus = z.infer<typeof generusSchema>;

export const createGenerusInputSchema = z.object({
  nama_lengkap: z.string(),
  tempat_lahir: z.string(),
  tanggal_lahir: z.string(), // Input as string, will be converted to date
  kelompok_sambung: z.string(),
  jenis_kelamin: genderSchema,
  jenjang: jenjangSchema,
  status: statusSchema,
  profesi: z.string().nullable().optional(),
  keahlian: z.string().nullable().optional(),
  keterangan: z.string().nullable().optional(),
  foto_url: z.string().nullable().optional()
});

export type CreateGenerusInput = z.infer<typeof createGenerusInputSchema>;

export const updateGenerusInputSchema = z.object({
  id: z.number(),
  nama_lengkap: z.string().optional(),
  tempat_lahir: z.string().optional(),
  tanggal_lahir: z.string().optional(),
  kelompok_sambung: z.string().optional(),
  jenis_kelamin: genderSchema.optional(),
  jenjang: jenjangSchema.optional(),
  status: statusSchema.optional(),
  profesi: z.string().nullable().optional(),
  keahlian: z.string().nullable().optional(),
  keterangan: z.string().nullable().optional(),
  foto_url: z.string().nullable().optional()
});

export type UpdateGenerusInput = z.infer<typeof updateGenerusInputSchema>;

// Attendance schemas
export const attendanceStatusSchema = z.enum(['Hadir', 'Sakit', 'Izin', 'Tidak Hadir/Alfa']);

export const attendanceSchema = z.object({
  id: z.number(),
  generus_id: z.number(),
  kbm_report_id: z.number(),
  status: attendanceStatusSchema,
  created_at: z.coerce.date()
});

export type Attendance = z.infer<typeof attendanceSchema>;

export const attendanceInputSchema = z.object({
  generus_id: z.number(),
  status: attendanceStatusSchema
});

export type AttendanceInput = z.infer<typeof attendanceInputSchema>;

// KBM Report schemas
export const kbmReportSchema = z.object({
  id: z.number(),
  tanggal: z.coerce.date(),
  hari: z.string(),
  nama_pengajar: z.string(),
  user_id: z.number(),
  materi: z.string(),
  keterangan: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type KBMReport = z.infer<typeof kbmReportSchema>;

export const createKBMReportInputSchema = z.object({
  tanggal: z.string(), // Input as string, will be converted to date
  hari: z.string(),
  nama_pengajar: z.string(),
  materi: z.string(),
  keterangan: z.string().nullable().optional(),
  attendances: z.array(attendanceInputSchema)
});

export type CreateKBMReportInput = z.infer<typeof createKBMReportInputSchema>;

// Material schemas
export const materialSchema = z.object({
  id: z.number(),
  judul: z.string(),
  deskripsi: z.string().nullable(),
  file_url: z.string().nullable(),
  file_name: z.string().nullable(),
  created_by: z.number(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Material = z.infer<typeof materialSchema>;

export const createMaterialInputSchema = z.object({
  judul: z.string(),
  deskripsi: z.string().nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_name: z.string().nullable().optional()
});

export type CreateMaterialInput = z.infer<typeof createMaterialInputSchema>;

// Statistics schemas
export const attendanceStatsSchema = z.object({
  total_generus: z.number(),
  hadir: z.number(),
  sakit: z.number(),
  izin: z.number(),
  alfa: z.number(),
  periode: z.string()
});

export type AttendanceStats = z.infer<typeof attendanceStatsSchema>;

export const monthlyStatsSchema = z.object({
  month: z.string(),
  year: z.number(),
  total_kbm: z.number(),
  avg_attendance: z.number(),
  weekly_data: z.array(z.object({
    week: z.number(),
    attendance_count: z.number(),
    total_generus: z.number()
  }))
});

export type MonthlyStats = z.infer<typeof monthlyStatsSchema>;
