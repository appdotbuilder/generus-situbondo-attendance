
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { User, CreateKBMReportInput, KBMReport, Generus, AttendanceInput } from '../../../server/src/schema';

interface KBMReportsProps {
  user: User;
}

export function KBMReports({ user }: KBMReportsProps) {
  const [allGenerus, setAllGenerus] = useState<Generus[]>([]);
  const [myReports, setMyReports] = useState<KBMReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Omit<CreateKBMReportInput, 'attendances'>>({
    tanggal: new Date().toISOString().split('T')[0],
    hari: '',
    nama_pengajar: user.full_name,
    materi: '',
    keterangan: null
  });

  // Attendance state - track which generus are selected and their attendance status
  const [selectedGenerus, setSelectedGenerus] = useState<Set<number>>(new Set());
  const [attendanceData, setAttendanceData] = useState<Map<number, AttendanceInput['status']>>(new Map());

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [generusResult, reportsResult] = await Promise.all([
        trpc.getAllGenerus.query(),
        trpc.getKBMReportsByUser.query({ userId: user.id })
      ]);
      
      setAllGenerus(generusResult);
      setMyReports(reportsResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-set day based on selected date
  useEffect(() => {
    if (formData.tanggal) {
      const date = new Date(formData.tanggal);
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      setFormData((prev: typeof formData) => ({
        ...prev,
        hari: dayNames[date.getDay()]
      }));
    }
  }, [formData.tanggal]);

  const handleGenerusToggle = (generusId: number) => {
    const newSelected = new Set(selectedGenerus);
    const newAttendanceData = new Map(attendanceData);

    if (newSelected.has(generusId)) {
      newSelected.delete(generusId);
      newAttendanceData.delete(generusId);
    } else {
      newSelected.add(generusId);
      newAttendanceData.set(generusId, 'Hadir');
    }

    setSelectedGenerus(newSelected);
    setAttendanceData(newAttendanceData);
  };

  const handleAttendanceChange = (generusId: number, status: AttendanceInput['status']) => {
    const newAttendanceData = new Map(attendanceData);
    newAttendanceData.set(generusId, status);
    setAttendanceData(newAttendanceData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare attendance data
      const attendances: AttendanceInput[] = Array.from(selectedGenerus).map((generusId: number) => ({
        generus_id: generusId,
        status: attendanceData.get(generusId) || 'Hadir'
      }));

      const reportData: CreateKBMReportInput = {
        ...formData,
        attendances
      };

      await trpc.createKBMReport.mutate({
        ...reportData,
        userId: user.id
      });

      // Reset form
      setFormData({
        tanggal: new Date().toISOString().split('T')[0],
        hari: '',
        nama_pengajar: user.full_name,
        materi: '',
        keterangan: null
      });
      setSelectedGenerus(new Set());
      setAttendanceData(new Map());

      // Reload reports
      await loadData();
    } catch (error) {
      console.error('Failed to create KBM report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">📊 Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create KBM Report Form */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800">
            📝 Buat Laporan KBM Baru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📅 Tanggal
                </label>
                <Input
                  type="date"
                  value={formData.tanggal}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: typeof formData) => ({ ...prev, tanggal: e.target.value }))
                  }
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📆 Hari
                </label>
                <Input
                  value={formData.hari}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: typeof formData) => ({ ...prev, hari: e.target.value }))
                  }
                  placeholder="Otomatis terisi berdasarkan tanggal"
                  required
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                👨‍🏫 Nama Pengajar
              </label>
              <Input
                value={formData.nama_pengajar}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: typeof formData) => ({ ...prev, nama_pengajar: e.target.value }))
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📚 Materi yang Disampaikan
              </label>
              <Textarea
                value={formData.materi}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: typeof formData) => ({ ...prev, materi: e.target.value }))
                }
                placeholder="Jelaskan materi yang disampaikan dalam KBM..."
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Keterangan (Opsional)
              </label>
              <Textarea
                value={formData.keterangan || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev: typeof formData) => ({
                    ...prev,
                    keterangan: e.target.value || null
                  }))
                }
                placeholder="Catatan tambahan tentang KBM..."
                rows={2}
              />
            </div>

            {/* Attendance Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                👥 Pilih Generus dan Status Kehadiran
              </label>
              
              {allGenerus.length === 0 ? (
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <p className="text-yellow-700">
                      ⚠️ Belum ada data Generus. Tambahkan data Generus terlebih dahulu di tab "Data Generus".
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {allGenerus.map((generus: Generus) => (
                    <Card key={generus.id} className={`p-3 ${selectedGenerus.has(generus.id) ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedGenerus.has(generus.id)}
                            onChange={() => handleGenerusToggle(generus.id)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <div>
                            <div className="font-medium text-gray-800">
                              {generus.nama_lengkap}
                            </div>
                            <div className="text-sm text-gray-600">
                              {generus.kelompok_sambung} • {generus.jenjang}
                            </div>
                          </div>
                        </div>
                        
                        {selectedGenerus.has(generus.id) && (
                          <Select
                            value={attendanceData.get(generus.id) || 'Hadir'}
                            onValueChange={(value: AttendanceInput['status']) => 
                              handleAttendanceChange(generus.id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Hadir">✅ Hadir</SelectItem>
                              <SelectItem value="Sakit">🤒 Sakit</SelectItem>
                              <SelectItem value="Izin">📝 Izin</SelectItem>
                              <SelectItem value="Tidak Hadir/Alfa">❌ Alfa</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || selectedGenerus.size === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
            >
              {isSubmitting ? '📤 Menyimpan...' : '💾 Simpan Laporan KBM'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* My Reports List */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-800">
            📋 Laporan KBM Saya ({myReports.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myReports.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              📝 Belum ada laporan KBM. Buat laporan pertama Anda!
            </div>
          ) : (
            <div className="space-y-4">
              {myReports.map((report: KBMReport) => (
                <Card key={report.id} className="bg-white border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">
                            📅 {report.tanggal.toLocaleDateString('id-ID')}
                          </Badge>
                          <Badge variant="outline">
                            📆 {report.hari}
                          </Badge>
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1">
                          👨‍🏫 {report.nama_pengajar}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          📚 <strong>Materi:</strong> {report.materi}
                        </p>
                        {report.keterangan && (
                          <p className="text-sm text-gray-600">
                            📝 <strong>Keterangan:</strong> {report.keterangan}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        🕒 {report.created_at.toLocaleDateString('id-ID')} {report.created_at.toLocaleTimeString('id-ID')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
