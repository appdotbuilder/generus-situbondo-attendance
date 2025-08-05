
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { User, CreateKBMReportInput, KBMReport, AttendanceInput } from '../../../server/src/schema';

interface ManualAttendanceEntry {
  name: string;
  status: AttendanceInput['status'];
}

interface KBMReportsProps {
  user: User;
}

export function KBMReports({ user }: KBMReportsProps) {
  const [myReports, setMyReports] = useState<KBMReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<CreateKBMReportInput, 'attendances'>>({
    tanggal: new Date().toISOString().split('T')[0],
    hari: '',
    nama_pengajar: '',
    materi: '',
    keterangan: null
  });

  // Manual attendance entries state
  const [manualAttendanceEntries, setManualAttendanceEntries] = useState<ManualAttendanceEntry[]>([
    { name: '', status: 'Hadir' }
  ]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const reportsResult = await trpc.getKBMReportsByUser.query({ userId: user.id });
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

  const addManualAttendanceEntry = () => {
    setManualAttendanceEntries((prev: ManualAttendanceEntry[]) => [
      ...prev,
      { name: '', status: 'Hadir' }
    ]);
  };

  const removeManualAttendanceEntry = (index: number) => {
    setManualAttendanceEntries((prev: ManualAttendanceEntry[]) => 
      prev.filter((_, i) => i !== index)
    );
  };

  const updateManualAttendanceEntry = (index: number, field: keyof ManualAttendanceEntry, value: string) => {
    setManualAttendanceEntries((prev: ManualAttendanceEntry[]) => 
      prev.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Filter out empty names and prepare attendance data
      const attendances: AttendanceInput[] = manualAttendanceEntries
        .filter((entry: ManualAttendanceEntry) => entry.name.trim() !== '')
        .map((entry: ManualAttendanceEntry) => ({
          generus_name: entry.name.trim(),
          status: entry.status
        }));

      if (attendances.length === 0) {
        setSubmitError('Minimal satu nama generus harus diisi.');
        return;
      }

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
        nama_pengajar: '',
        materi: '',
        keterangan: null
      });
      setManualAttendanceEntries([{ name: '', status: 'Hadir' }]);

      // Reload reports
      await loadData();
    } catch (error) {
      console.error('Failed to create KBM report:', error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Terjadi kesalahan saat menyimpan laporan. Silakan coba lagi.');
      }
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

            {/* Manual Attendance Entry */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  👥 Input Manual Nama Generus dan Status Kehadiran
                </label>
                <Button
                  type="button"
                  onClick={addManualAttendanceEntry}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  ➕ Tambah Generus
                </Button>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {manualAttendanceEntries.map((entry: ManualAttendanceEntry, index: number) => (
                  <Card key={index} className="p-3 bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <Input
                          value={entry.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            updateManualAttendanceEntry(index, 'name', e.target.value)
                          }
                          placeholder="Masukkan nama lengkap generus..."
                          className="w-full"
                        />
                      </div>
                      
                      <Select
                        value={entry.status}
                        onValueChange={(value: AttendanceInput['status']) => 
                          updateManualAttendanceEntry(index, 'status', value)
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Hadir">✅ Hadir</SelectItem>
                          <SelectItem value="Sakit">🤒 Sakit</SelectItem>
                          <SelectItem value="Izin">📝 Izin</SelectItem>
                          <SelectItem value="Tidak Hadir/Alfa">❌ Alfa</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {manualAttendanceEntries.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => removeManualAttendanceEntry(index)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          🗑️
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tips:</strong> Masukkan nama lengkap generus sesuai dengan yang ada di data. 
                  Jika nama tidak ditemukan, sistem akan memberikan pesan error dan Anda perlu menambahkan data generus tersebut terlebih dahulu di tab "Data Generus".
                </p>
              </div>
            </div>

            {submitError && (
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <p className="text-red-700 text-sm">
                    ❌ <strong>Error:</strong> {submitError}
                  </p>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting}
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
