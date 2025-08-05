
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import seed function
import { seedUsers } from './handlers/seed';

// Import schemas
import { 
  loginInputSchema, 
  createGenerusInputSchema, 
  updateGenerusInputSchema,
  createKBMReportInputSchema,
  createMaterialInputSchema
} from './schema';

// Import handlers
import { login, getCurrentUser } from './handlers/auth';
import { 
  createGenerus, 
  getAllGenerus, 
  getGenerusById, 
  updateGenerus, 
  deleteGenerus,
  uploadGenerusData 
} from './handlers/generus';
import { 
  createKBMReport, 
  getAllKBMReports, 
  getKBMReportsByUser, 
  getKBMReportById, 
  deleteKBMReport 
} from './handlers/kbm_reports';
import { 
  getAttendanceStats, 
  getMonthlyAttendanceStats, 
  getAttendanceByGenerus, 
  getAttendanceByKBMReport 
} from './handlers/attendance';
import { 
  createMaterial, 
  getAllMaterials, 
  getMaterialById, 
  updateMaterial, 
  deleteMaterial,
  uploadMaterialFile 
} from './handlers/materials';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Authentication
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),
  
  getCurrentUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getCurrentUser(input.userId)),

  // Generus management
  createGenerus: publicProcedure
    .input(createGenerusInputSchema)
    .mutation(({ input }) => createGenerus(input)),
  
  getAllGenerus: publicProcedure
    .query(() => getAllGenerus()),
  
  getGenerusById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getGenerusById(input.id)),
  
  updateGenerus: publicProcedure
    .input(updateGenerusInputSchema)
    .mutation(({ input }) => updateGenerus(input)),
  
  deleteGenerus: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteGenerus(input.id)),

  // KBM Reports
  createKBMReport: publicProcedure
    .input(createKBMReportInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => createKBMReport(input, input.userId)),
  
  getAllKBMReports: publicProcedure
    .query(() => getAllKBMReports()),
  
  getKBMReportsByUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getKBMReportsByUser(input.userId)),
  
  getKBMReportById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getKBMReportById(input.id)),
  
  deleteKBMReport: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteKBMReport(input.id)),

  // Attendance & Statistics
  getAttendanceStats: publicProcedure
    .input(z.object({ 
      startDate: z.string().optional(), 
      endDate: z.string().optional() 
    }))
    .query(({ input }) => getAttendanceStats(input.startDate, input.endDate)),
  
  getMonthlyAttendanceStats: publicProcedure
    .input(z.object({ 
      year: z.number(), 
      month: z.number().optional() 
    }))
    .query(({ input }) => getMonthlyAttendanceStats(input.year, input.month)),
  
  getAttendanceByGenerus: publicProcedure
    .input(z.object({ 
      generusId: z.number(),
      startDate: z.string().optional(), 
      endDate: z.string().optional() 
    }))
    .query(({ input }) => getAttendanceByGenerus(input.generusId, input.startDate, input.endDate)),
  
  getAttendanceByKBMReport: publicProcedure
    .input(z.object({ kbmReportId: z.number() }))
    .query(({ input }) => getAttendanceByKBMReport(input.kbmReportId)),

  // Materials
  createMaterial: publicProcedure
    .input(createMaterialInputSchema.extend({ userId: z.number() }))
    .mutation(({ input }) => createMaterial(input, input.userId)),
  
  getAllMaterials: publicProcedure
    .query(() => getAllMaterials()),
  
  getMaterialById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMaterialById(input.id)),
  
  updateMaterial: publicProcedure
    .input(z.object({ 
      id: z.number(),
      data: createMaterialInputSchema.partial(),
      userId: z.number() 
    }))
    .mutation(({ input }) => updateMaterial(input.id, input.data, input.userId)),
  
  deleteMaterial: publicProcedure
    .input(z.object({ id: z.number(), userId: z.number() }))
    .mutation(({ input }) => deleteMaterial(input.id, input.userId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  
  // Seed default users on startup
  await seedUsers();
  
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
