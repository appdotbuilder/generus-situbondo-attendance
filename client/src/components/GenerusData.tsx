
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { Generus, CreateGenerusInput } from '../../../server/src/schema';

export function GenerusData() {
  const [allGenerus, setAllGenerus] = useState<Generus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for manual input
  const [formData, setFormData] = useState<CreateGenerusInput>({
    nama_lengkap: '',
    tempat_lahir: '',
    tanggal_lahir: '',
    kelompok_sambung: '',
    jenis_kelamin: 'Laki-laki',
    jenjang: 'SD',
    status: 'Aktif',
    profesi: null,
    keahlian: null,
    keterangan: null,
    foto_url: null
  });

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const loadGenerus = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getAllGenerus.query();
      setAllGenerus(result);
    } catch (error) {
      console.error('Failed to load generus data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGenerus();
  }, [loadGenerus]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await trpc.createGenerus.mutate(formData);
      setAllGenerus((prev: Generus[]) => [...prev, result]);
      
      // Reset form
      setFormData({
        nama_lengkap: '',
        tempat_lahir: '',
        tanggal_lahir: '',
        kelompok_sambung: '',
        jenis_kelamin: 'Laki-laki',
        jenjang: 'SD',
        status: 'Aktif',
        profesi: null,
        keahlian: null,
        keterangan: null,
        foto_url: null
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to create generus:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setIsSubmitting(true);
    setUploadStatus('📤 Mengunggah file...');

    try {
      // This is a stub implementation - actual file parsing would be implemented in the handler
      setUploadStatus('⚠️ Fitur parsing file otomatis masih dalam pengembangan. Silakan input data secara manual.');
      
      // TODO: Implement file parsing when handler is ready
      // const result = await trpc.uploadGenerusData.mutate({ file: uploadFile });
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadStatus('❌ Gagal mengunggah file');
    } finally {
      setIsSubmitting(false);
      setUploadFile(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-green-100 text-green-800';
      case 'Tidak Aktif': return 'bg-yellow-100 text-yellow-800';
      case 'Alumni': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getJenjangIcon = (jenjang: string) => {
    switch (jenjang) {
      case 'SD': return '🎒';
      case 'SMP': return '📚';
      case 'SMA': return '🎓';
      case 'Kuliah': return '🏛️';
      default: return '📖';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">👥 Memuat data generus...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-100 border-indigo-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-indigo-800">
              👥 Data Lengkap Generus Pra-Remaja ({allGenerus.length})
            </CardTitle>
            <Button 
              onClick={() => setShowAddDialog(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              ➕ Tambah Generus
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Generus List */}
      <div className="grid gap-4">
        {allGenerus.length === 0 ? (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                Belum Ada Data Generus
              </h3>
              <p className="text-yellow-700 mb-4">
                Mulai tambahkan data generus untuk mengelola kehadiran dan informasi mereka.
              </p>
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                ➕ Tambah Generus Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          allGenerus.map((generus: Generus) => (
            <Card key={generus.id} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {generus.foto_url ? (
                      <img 
                        src={generus.foto_url} 
                        alt={generus.nama_lengkap}
                        className="w-24 h-24 rounded-full object-cover border-4 border-indigo-200"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-3xl border-4 border-indigo-200">
                        {generus.jenis_kelamin === 'Laki-laki' ? '👦' : '👧'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {generus.nama_lengkap}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={getStatusBadgeColor(generus.status)}>
                          {generus.status}
                        </Badge>
                        <Badge variant="outline">
                          {getJenjangIcon(generus.jenjang)} {generus.jenjang}
                        </Badge>
                        <Badge variant="outline">
                          {generus.jenis_kelamin === 'Laki-laki' ? '👨' : '👩'} {generus.jenis_kelamin}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">📍 Tempat, Tanggal Lahir:</span>
                        <div className="font-medium">
                          {generus.tempat_lahir}, {generus.tanggal_lahir.toLocaleDateString('id-ID')}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-gray-600">🏢 Kelompok Sambung:</span>
                        <div className="font-medium">{generus.kelompok_sambung}</div>
                      </div>
                      
                      {generus.profesi && (
                        <div>
                          <span className="text-gray-600">💼 Profesi:</span>
                          <div className="font-medium">{generus.profesi}</div>
                        </div>
                      )}
                      
                      {generus.keahlian && (
                        <div>
                          <span className="text-gray-600">⭐ Keahlian:</span>
                          <div className="font-medium">{generus.keahlian}</div>
                        </div>
                      )}
                    </div>

                    {generus.keterangan && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 text-sm">📝 Keterangan:</span>
                        <div className="text-sm mt-1">{generus.keterangan}</div>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-gray-500">
                      📅 Ditambahkan: {generus.created_at.toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Generus Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              ➕ Tambah Data Generus Baru
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">✍️ Input Manual</TabsTrigger>
              <TabsTrigger value="upload">📁 Upload File</TabsTrigger>
            </TabsList>

            {/* Manual Input Tab */}
            <TabsContent value="manual" className="mt-6">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Nama Lengkap *
                    </label>
                    <Input
                      value={formData.nama_lengkap}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGenerusInput) => ({ ...prev, nama_lengkap: e.target.value }))
                      }
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Tempat Lahir *
                    </label>
                    <Input
                      value={formData.tempat_lahir}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGenerusInput) => ({ ...prev, tempat_lahir: e.target.value }))
                      }
                      placeholder="Masukkan tempat lahir"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Tanggal Lahir *
                    </label>
                    <Input
                      type="date"
                      value={formData.tanggal_lahir}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGenerusInput) => ({ ...prev, tanggal_lahir: e.target.value }))
                      }
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🏢 Kelompok Sambung *
                    </label>
                    <Input
                      value={formData.kelompok_sambung}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGenerusInput) => ({ ...prev, kelompok_sambung: e.target.value }))
                      }
                      placeholder="Masukkan kelompok sambung"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👨👩 Jenis Kelamin *
                    </label>
                    <Select
                      value={formData.jenis_kelamin || 'Laki-laki'}
                      onValueChange={(value: 'Laki-laki' | 'Perempuan') =>
                        setFormData((prev: CreateGenerusInput) => ({ ...prev, jenis_kelamin: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laki-laki">👨 Laki-laki</SelectItem>
                        <SelectItem value="Perempuan">👩 Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎓 Jenjang *
                    </label>
                    <Select
                      value={formData.jenjang || 'SD'}
                      onValueChange={(value: 'SD' | 'SMP' | 'SMA' | 'Kuliah') =>
                        setFormData((prev: CreateGenerusInput) => ({ ...prev, jenjang: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SD">🎒 SD</SelectItem>
                        <SelectItem value="SMP">📚 SMP</SelectItem>
                        <SelectItem value="SMA">🎓 SMA</SelectItem>
                        <SelectItem value="Kuliah">🏛️ Kuliah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📊 Status *
                    </label>
                    <Select
                      value={formData.status || 'Aktif'}
                      onValueChange={(value: 'Aktif' | 'Tidak Aktif' | 'Alumni') =>
                        setFormData((prev: CreateGenerusInput) => ({ ...prev, status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Aktif">✅ Aktif</SelectItem>
                        <SelectItem value="Tidak Aktif">⏸️ Tidak Aktif</SelectItem>
                        <SelectItem value="Alumni">🎓 Alumni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💼 Profesi (Opsional)
                    </label>
                    <Input
                      value={formData.profesi || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGenerusInput) => ({
                          ...prev,
                          profesi: e.target.value || null
                        }))
                      }
                      placeholder="Masukkan profesi"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ⭐ Keahlian (Opsional)
                    </label>
                    <Input
                      value={formData.keahlian || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateGenerusInput) => ({
                          ...prev,
                          keahlian: e.target.value || null
                        }))
                      }
                      placeholder="Masukkan keahlian"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Keterangan (Opsional)
                  </label>
                  <Textarea
                    value={formData.keterangan || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateGenerusInput) => ({
                        ...prev,
                        keterangan: e.target.value || null
                      }))
                    }
                    placeholder="Masukkan keterangan tambahan"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📷 URL Foto (Opsional)
                  </label>
                  <Input
                    type="url"
                    value={formData.foto_url || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateGenerusInput) => ({
                        ...prev,
                        foto_url: e.target.value || null
                      }))
                    }
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    ❌ Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isSubmitting ? '💾 Menyimpan...' : '✅ Simpan Data'}
                  </Button>
                </div>
              </form>
            </TabsContent>

            {/* File Upload Tab */}
            <TabsContent value="upload" className="mt-6">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">📁</div>
                    <h3 className="text-xl font-semibold text-blue-800 mb-2">
                      Upload File Data Generus
                    </h3>
                    <p className="text-blue-600 mb-4">
                      Mendukung format: PDF, DOC, DOCX, XLSX, XLS
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Input
                        type="file"
                        accept=".pdf,.doc,.docx,.xlsx,.xls"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0];
                          setUploadFile(file || null);
                          setUploadStatus('');
                        }}
                        className="w-full"
                      />
                    </div>

                    {uploadStatus && (
                      <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded">
                        {uploadStatus}
                      </div>
                    )}

                    <Button
                      onClick={handleFileUpload}
                      disabled={!uploadFile || isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? '📤 Mengunggah...' : '📤 Upload & Parse Data'}
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Catatan Penting:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Fitur parsing file otomatis masih dalam pengembangan</li>
                      <li>• Saat ini, silakan gunakan input manual untuk menambah data</li>
                      <li>• File yang diunggah akan diproses secara otomatis di versi mendatang</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
