
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/utils/trpc';
import type { User, AttendanceStats, MonthlyStats } from '../../../server/src/schema';

interface AttendanceRecapProps {
  user: User;
}

export function AttendanceRecap({ user }: AttendanceRecapProps) {
  const [currentStats, setCurrentStats] = useState<AttendanceStats | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsResult, monthlyResult] = await Promise.all([
        trpc.getAttendanceStats.query({}),
        trpc.getMonthlyAttendanceStats.query({ 
          year: selectedYear, 
          month: selectedMonth || undefined 
        })
      ]);
      
      setCurrentStats(statsResult);
      setMonthlyStats(Array.isArray(monthlyResult) ? monthlyResult : [monthlyResult]);
    } catch (error) {
      console.error('Failed to load attendance stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const getAttendancePercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hadir': return 'text-green-600 bg-green-100';
      case 'sakit': return 'text-yellow-600 bg-yellow-100';
      case 'izin': return 'text-blue-600 bg-blue-100';
      case 'alfa': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">📊 Memuat statistik kehadiran...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-100 border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-purple-800">
            🎯 Filter Statistik Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📅 Tahun
              </label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value: string) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-48">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📆 Bulan (Opsional)
              </label>
              <Select
                value={selectedMonth?.toString() || 'all'}
                onValueChange={(value: string) => 
                  setSelectedMonth(value === 'all' ? null : parseInt(value))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Bulan</SelectItem>
                  <SelectItem value="1">Januari</SelectItem>
                  <SelectItem value="2">Februari</SelectItem>
                  <SelectItem value="3">Maret</SelectItem>
                  <SelectItem value="4">April</SelectItem>
                  <SelectItem value="5">Mei</SelectItem>
                  <SelectItem value="6">Juni</SelectItem>
                  <SelectItem value="7">Juli</SelectItem>
                  <SelectItem value="8">Agustus</SelectItem>
                  <SelectItem value="9">September</SelectItem>
                  <SelectItem value="10">Oktober</SelectItem>
                  <SelectItem value="11">November</SelectItem>
                  <SelectItem value="12">Desember</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Period Statistics */}
      {currentStats && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-blue-800">
              📊 Statistik Kehadiran Periode {currentStats.periode}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="bg-white p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {currentStats.total_generus}
                </div>
                <div className="text-sm text-gray-600">👥 Total Generus</div>
              </Card>
              
              <Card className={`p-4 text-center ${getStatusColor('hadir')}`}>
                <div className="text-2xl font-bold">
                  {currentStats.hadir}
                </div>
                <div className="text-sm">✅ Hadir</div>
                <div className="text-xs mt-1">
                  {getAttendancePercentage(currentStats.hadir, currentStats.total_generus)}%
                </div>
              </Card>
              
              <Card className={`p-4 text-center ${getStatusColor('sakit')}`}>
                <div className="text-2xl font-bold">
                  {currentStats.sakit}
                </div>
                <div className="text-sm">🤒 Sakit</div>
                <div className="text-xs mt-1">
                  {getAttendancePercentage(currentStats.sakit, currentStats.total_generus)}%
                </div>
              </Card>
              
              <Card className={`p-4 text-center ${getStatusColor('izin')}`}>
                <div className="text-2xl font-bold">
                  {currentStats.izin}
                </div>
                <div className="text-sm">📝 Izin</div>
                <div className="text-xs mt-1">
                  {getAttendancePercentage(currentStats.izin, currentStats.total_generus)}%
                </div>
              </Card>
              
              <Card className={`p-4 text-center ${getStatusColor('alfa')}`}>
                <div className="text-2xl font-bold">
                  {currentStats.alfa}
                </div>
                <div className="text-sm">❌ Alfa</div>
                <div className="text-xs mt-1">
                  {getAttendancePercentage(currentStats.alfa, currentStats.total_generus)}%
                </div>
              </Card>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>✅ Tingkat Kehadiran</span>
                  <span>{getAttendancePercentage(currentStats.hadir, currentStats.total_generus)}%</span>
                </div>
                <Progress 
                  value={getAttendancePercentage(currentStats.hadir, currentStats.total_generus)} 
                  className="h-3"
                />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>❌ Tingkat Ketidakhadiran</span>
                  <span>{getAttendancePercentage(currentStats.alfa, currentStats.total_generus)}%</span>
                </div>
                <Progress 
                  value={getAttendancePercentage(currentStats.alfa, currentStats.total_generus)} 
                  className="h-3"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Statistics */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-800">
            📈 Statistik Bulanan Tahun {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyStats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              📈 Belum ada data statistik untuk periode yang dipilih.
            </div>
          ) : (
            <div className="space-y-4">
              {monthlyStats.map((stat: MonthlyStats) => (
                <Card key={`${stat.year}-${stat.month}`} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 mb-2">
                          📅 {stat.month} {stat.year}
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">📚 Total KBM:</span>
                            <span className="font-medium ml-2">{stat.total_kbm}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">📊 Rata-rata Kehadiran:</span>
                            <span className="font-medium ml-2">{stat.avg_attendance.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Weekly Data */}
                      {stat.weekly_data.length > 0 && (
                        <div className="flex gap-2">
                          {stat.weekly_data.map((week) => (
                            <Badge key={week.week} variant="outline" className="text-xs">
                              W{week.week}: {Math.round((week.attendance_count / week.total_generus) * 100)}%
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Coordinator Additional Features */}
      {user.role === 'koordinator' && (
        <Card className="bg-gradient-to-br from-orange-50 to-red-100 border-orange-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-orange-800">
              👑 Fitur Khusus Koordinator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-white p-4">
                <h4 className="font-semibold text-gray-800 mb-2">📋 Laporan Komprehensif</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Akses laporan kehadiran yang lebih detail dan menyeluruh untuk semua guru dan generus.
                </p>
                <Badge className="bg-orange-100 text-orange-800">
                  🔄 Fitur dalam pengembangan
                </Badge>
              </Card>
              
              <Card className="bg-white p-4">
                <h4 className="font-semibold text-gray-800 mb-2">📊 Analisis Mendalam</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Grafik dan statistik yang lebih kompleks dengan perbandingan periode dan trend analysis.
                </p>
                <Badge className="bg-orange-100 text-orange-800">
                  🔄 Fitur dalam pengembangan
                </Badge>
              </Card>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
