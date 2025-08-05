
import { db } from '../db';
import { attendanceTable, generusTable, kbmReportsTable } from '../db/schema';
import { type AttendanceStats, type MonthlyStats, type Attendance } from '../schema';
import { eq, and, gte, lte, count, sql, SQL } from 'drizzle-orm';

export async function getAttendanceStats(startDate?: string, endDate?: string): Promise<AttendanceStats> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];
    if (startDate) {
      conditions.push(gte(kbmReportsTable.tanggal, startDate));
    }
    if (endDate) {
      conditions.push(lte(kbmReportsTable.tanggal, endDate));
    }

    // Build query for status counts
    const statusQuery = db
      .select({
        status: attendanceTable.status,
        count: count()
      })
      .from(attendanceTable)
      .innerJoin(kbmReportsTable, eq(attendanceTable.kbm_report_id, kbmReportsTable.id))
      .$dynamic();

    const finalStatusQuery = conditions.length > 0 
      ? statusQuery.where(and(...conditions)).groupBy(attendanceTable.status)
      : statusQuery.groupBy(attendanceTable.status);

    const results = await finalStatusQuery.execute();

    // Build query for total unique generus count
    const totalGenerusQuery = db
      .select({
        count: sql<number>`COUNT(DISTINCT ${attendanceTable.generus_id})`
      })
      .from(attendanceTable)
      .innerJoin(kbmReportsTable, eq(attendanceTable.kbm_report_id, kbmReportsTable.id))
      .$dynamic();

    const finalTotalQuery = conditions.length > 0 
      ? totalGenerusQuery.where(and(...conditions))
      : totalGenerusQuery;

    const totalGenerusResult = await finalTotalQuery.execute();
    const totalGenerus = Number(totalGenerusResult[0]?.count) || 0;

    // Initialize counters
    let hadir = 0;
    let sakit = 0;
    let izin = 0;
    let alfa = 0;

    // Process results - convert counts to numbers
    results.forEach(result => {
      const countValue = Number(result.count);
      switch (result.status) {
        case 'Hadir':
          hadir = countValue;
          break;
        case 'Sakit':
          sakit = countValue;
          break;
        case 'Izin':
          izin = countValue;
          break;
        case 'Tidak Hadir/Alfa':
          alfa = countValue;
          break;
      }
    });

    return {
      total_generus: totalGenerus,
      hadir,
      sakit,
      izin,
      alfa,
      periode: `${startDate || 'N/A'} - ${endDate || 'N/A'}`
    };
  } catch (error) {
    console.error('Failed to get attendance stats:', error);
    throw error;
  }
}

export async function getMonthlyAttendanceStats(year: number, month?: number): Promise<MonthlyStats[]> {
  try {
    const months = month ? [month] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const results: MonthlyStats[] = [];

    for (const monthNum of months) {
      // Calculate date range for the month
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0); // Last day of month
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Get total KBM reports for the month
      const kbmCountResult = await db
        .select({ count: count() })
        .from(kbmReportsTable)
        .where(
          and(
            gte(kbmReportsTable.tanggal, startDateStr),
            lte(kbmReportsTable.tanggal, endDateStr)
          )
        )
        .execute();

      const totalKbm = Number(kbmCountResult[0]?.count) || 0;

      // Get attendance data for the month
      const attendanceResult = await db
        .select({
          total_attendance: count(),
          total_generus: sql<number>`COUNT(DISTINCT ${attendanceTable.generus_id})`
        })
        .from(attendanceTable)
        .innerJoin(kbmReportsTable, eq(attendanceTable.kbm_report_id, kbmReportsTable.id))
        .where(
          and(
            gte(kbmReportsTable.tanggal, startDateStr),
            lte(kbmReportsTable.tanggal, endDateStr),
            eq(attendanceTable.status, 'Hadir')
          )
        )
        .execute();

      const totalAttendance = Number(attendanceResult[0]?.total_attendance) || 0;
      const totalGenerus = Number(attendanceResult[0]?.total_generus) || 0;
      const avgAttendance = totalKbm > 0 ? totalAttendance / totalKbm : 0;

      // Generate weekly data (simplified - just divide month into 4 weeks)
      const weeklyData = [];
      for (let week = 1; week <= 4; week++) {
        const weekStart = new Date(year, monthNum - 1, (week - 1) * 7 + 1);
        const weekEnd = new Date(year, monthNum - 1, week * 7);
        
        // Don't go beyond month end
        if (weekEnd > endDate) {
          weekEnd.setTime(endDate.getTime());
        }

        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        const weekAttendanceResult = await db
          .select({
            attendance_count: count(),
            total_generus: sql<number>`COUNT(DISTINCT ${attendanceTable.generus_id})`
          })
          .from(attendanceTable)
          .innerJoin(kbmReportsTable, eq(attendanceTable.kbm_report_id, kbmReportsTable.id))
          .where(
            and(
              gte(kbmReportsTable.tanggal, weekStartStr),
              lte(kbmReportsTable.tanggal, weekEndStr),
              eq(attendanceTable.status, 'Hadir')
            )
          )
          .execute();

        weeklyData.push({
          week,
          attendance_count: Number(weekAttendanceResult[0]?.attendance_count) || 0,
          total_generus: Number(weekAttendanceResult[0]?.total_generus) || 0
        });
      }

      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      results.push({
        month: monthNames[monthNum - 1],
        year,
        total_kbm: totalKbm,
        avg_attendance: Math.round(avgAttendance * 100) / 100,
        weekly_data: weeklyData
      });
    }

    return results;
  } catch (error) {
    console.error('Failed to get monthly attendance stats:', error);
    throw error;
  }
}

export async function getAttendanceByGenerus(generusId: number, startDate?: string, endDate?: string): Promise<Attendance[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [eq(attendanceTable.generus_id, generusId)];
    if (startDate) {
      conditions.push(gte(kbmReportsTable.tanggal, startDate));
    }
    if (endDate) {
      conditions.push(lte(kbmReportsTable.tanggal, endDate));
    }

    // Build and execute query
    const results = await db
      .select()
      .from(attendanceTable)
      .innerJoin(kbmReportsTable, eq(attendanceTable.kbm_report_id, kbmReportsTable.id))
      .where(and(...conditions))
      .execute();

    // Transform results to match Attendance type
    return results.map(result => ({
      id: result.attendance.id,
      generus_id: result.attendance.generus_id,
      kbm_report_id: result.attendance.kbm_report_id,
      status: result.attendance.status,
      created_at: result.attendance.created_at
    }));
  } catch (error) {
    console.error('Failed to get attendance by generus:', error);
    throw error;
  }
}

export async function getAttendanceByKBMReport(kbmReportId: number): Promise<Attendance[]> {
  try {
    const results = await db
      .select()
      .from(attendanceTable)
      .where(eq(attendanceTable.kbm_report_id, kbmReportId))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to get attendance by KBM report:', error);
    throw error;
  }
}
