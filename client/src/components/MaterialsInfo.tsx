
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import type { User, Material, CreateMaterialInput } from '../../../server/src/schema';

interface MaterialsInfoProps {
  user: User;
}

export function MaterialsInfo({ user }: MaterialsInfoProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for adding material
  const [formData, setFormData] = useState<CreateMaterialInput>({
    judul: '',
    deskripsi: null,
    file_url: null,
    file_name: null
  });

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const isKoordinator = user.role === 'koordinator';

  const loadMaterials = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getAllMaterials.query();
      setMaterials(result);
    } catch (error) {
      console.error('Failed to load materials:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMaterials();
  }, [loadMaterials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await trpc.createMaterial.mutate({
        ...formData,
        userId: user.id
      });
      
      setMaterials((prev: Material[]) => [...prev, result]);
      
      // Reset form
      setFormData({
        judul: '',
        deskripsi: null,
        file_url: null,
        file_name: null
      });
      
      setShowAddDialog(false);
    } catch (error) {
      console.error('Failed to create material:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setIsSubmitting(true);
    setUploadStatus('📤 Mengunggah file...');

    try {
      // This is a stub implementation - actual file upload would be implemented in the handler
      setUploadStatus('⚠️ Fitur upload file masih dalam pengembangan. Silakan input URL file secara manual.');
      
      // TODO: Implement file upload when handler is ready
      // const result = await trpc.uploadMaterialFile.mutate({ file: uploadFile });
      
    } catch (error) {
      console.error('Failed to upload file:', error);
      setUploadStatus('❌ Gagal mengunggah file');
    } finally {
      setIsSubmitting(false);
      setUploadFile(null);
    }
  };

  const getFileIcon = (fileName: string | null) => {
    if (!fileName) return '📄';
    
    const ext = fileName.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf': return '📕';
      case 'doc':
      case 'docx': return '📘';
      case 'xlsx':
      case 'xls': return '📗';
      case 'ppt':
      case 'pptx': return '📙';
      default: return '📄';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">📚 Memuat materi...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-100 border-green-200">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-2xl font-bold text-green-800">
              📚 Informasi Materi ({materials.length})
            </CardTitle>
            {isKoordinator && (
              <Button 
                onClick={() => setShowAddDialog(true)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ➕ Tambah Materi
              </Button>
            )}
          </div>
        </CardHeader>
        {!isKoordinator && (
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700">
                ℹ️ <strong>Info:</strong> Sebagai Guru Pengajar, Anda dapat melihat dan mengunduh materi yang telah diunggah oleh Koordinator.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Materials List */}
      <div className="grid gap-4">
        {materials.length === 0 ? (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                Belum Ada Materi
              </h3>
              <p className="text-yellow-700 mb-4">
                {isKoordinator 
                  ? 'Mulai tambahkan materi pembelajaran untuk dapat diakses oleh guru pengajar.'
                  : 'Koordinator belum mengunggah materi pembelajaran.'
                }
              </p>
              {isKoordinator && (
                <Button 
                  onClick={() => setShowAddDialog(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  ➕ Tambah Materi Pertama
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          materials.map((material: Material) => (
            <Card key={material.id} className="bg-white border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="text-3xl">
                        {getFileIcon(material.file_name)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {material.judul}
                        </h3>
                        {material.deskripsi && (
                          <p className="text-gray-600 mb-3">
                            {material.deskripsi}
                          </p>
                        )}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {material.file_name && (
                            <Badge variant="outline">
                              📎 {material.file_name}
                            </Badge>
                          )}
                          <Badge variant="secondary">
                            📅 {material.created_at.toLocaleDateString('id-ID')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    {material.file_url && (
                      <Button
                        onClick={() => window.open(material.file_url!, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        📖 Buka/Unduh
                      </Button>
                    )}
                    
                    {isKoordinator && (
                      <Button
                        variant="outline"
                        className="text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        ✏️ Edit
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-gray-500 mt-4">
                  👤 Dibuat oleh: ID User #{material.created_by} • 
                  🕒 {material.created_at.toLocaleDateString('id-ID')} {material.created_at.toLocaleTimeString('id-ID')}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Material Dialog (Koordinator Only) */}
      {isKoordinator && (
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">
                ➕ Tambah Materi Baru
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">✍️ Input Manual</TabsTrigger>
                <TabsTrigger value="upload">📁 Upload File</TabsTrigger>
              </TabsList>

              {/* Manual Input Tab */}
              <TabsContent value="manual" className="mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📚 Judul Materi *
                    </label>
                    <Input
                      value={formData.judul}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMaterialInput) => ({ ...prev, judul: e.target.value }))
                      }
                      placeholder="Masukkan judul materi"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📝 Deskripsi (Opsional)
                    </label>
                    <Textarea
                      value={formData.deskripsi || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateMaterialInput) => ({
                          ...prev,
                          deskripsi: e.target.value || null
                        }))
                      }
                      placeholder="Jelaskan materi pembelajaran ini..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔗 URL File (Opsional)
                    </label>
                    <Input
                      type="url"
                      value={formData.file_url || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMaterialInput) => ({
                          ...prev,
                          file_url: e.target.value || null
                        }))
                      }
                      placeholder="https://example.com/material.pdf"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📎 Nama File (Opsional)
                    </label>
                    <Input
                      value={formData.file_name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateMaterialInput) => ({
                          ...prev,
                          file_name: e.target.value || null
                        }))
                      }
                      placeholder="material-pembelajaran.pdf"
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
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isSubmitting ? '💾 Menyimpan...' : '✅ Simpan Materi'}
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
                        Upload File Materi
                      </h3>
                      <p className="text-blue-600 mb-4">
                        Mendukung format: PDF, DOC, DOCX, XLSX, XLS, PPT, PPTX
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Input
                          type="file"
                          accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
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
                        {isSubmitting ? '📤 Mengunggah...' : '📤 Upload File'}
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                      <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Catatan Penting:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Fitur upload file masih dalam pengembangan</li>
                        <li>• Saat ini, silakan gunakan input manual dengan URL file</li>
                        <li>• File yang diunggah akan dapat diakses langsung di versi mendatang</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
