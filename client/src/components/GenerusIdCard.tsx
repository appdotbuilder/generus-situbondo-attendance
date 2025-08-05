
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { Generus } from '../../../server/src/schema';

export function GenerusIdCard() {
  const [allGenerus, setAllGenerus] = useState<Generus[]>([]);
  const [selectedGenerusId, setSelectedGenerusId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadGenerus = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.getAllGenerus.query();
      setAllGenerus(result);
      if (result.length > 0 && !selectedGenerusId) {
        setSelectedGenerusId(result[0].id);
      }
    } catch (error) {
      console.error('Failed to load generus data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedGenerusId]);

  useEffect(() => {
    loadGenerus();
  }, [loadGenerus]);

  const selectedGenerus = allGenerus.find((g: Generus) => g.id === selectedGenerusId);

  const handlePrint = () => {
    if (selectedGenerus) {
      window.print();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aktif': return 'bg-green-600';
      case 'Tidak Aktif': return 'bg-yellow-600';
      case 'Alumni': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-lg">🆔 Memuat data kartu identitas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Selection */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-100 border-purple-200">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-purple-800">
            🆔 Kartu Identitas Generus
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allGenerus.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-purple-800 mb-2">
                Belum Ada Data Generus
              </h3>
              <p className="text-purple-700">
                Tambahkan data generus terlebih dahulu di tab "Data Generus" untuk dapat membuat kartu identitas.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Pilih Generus
                </label>
                <Select
                  value={selectedGenerusId?.toString() || ''}
                  onValueChange={(value: string) => setSelectedGenerusId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih generus untuk ditampilkan" />
                  </SelectTrigger>
                  <SelectContent>
                    {allGenerus.map((generus: Generus) => (
                      <SelectItem key={generus.id} value={generus.id.toString()}>
                        {generus.nama_lengkap} - {generus.kelompok_sambung}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedGenerus && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handlePrint}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    🖨️ Cetak Kartu
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ID Card Display */}
      {selectedGenerus && (
        <div className="flex justify-center">
          <div className="id-card-container">
            {/* Front Side */}
            <Card className="w-96 h-64 bg-gradient-to-br from-emerald-800 via-teal-700 to-cyan-800 text-white shadow-2xl border-4 border-gold-400 relative overflow-hidden">
              {/* Islamic Pattern Background */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDAgTDMwIDEwIEwyMCAyMCBMMTAgMTAgWiIgZmlsbD0iY3VycmVudENvbG9yIiBmaWxsLW9wYWNpdHk9IjAuNSIvPgo8L3N2Zz4K')] repeat"></div>
              </div>
              
              <CardContent className="p-4 h-full flex flex-col relative z-10">
                {/* Header */}
                <div className="text-center mb-3">
                  <div className="text-lg font-bold text-yellow-300 leading-tight">
                    🕌 GENERUS PRA-REMAJA
                  </div>
                  <div className="text-sm font-semibold text-green-200">
                    KELOMPOK SITUBONDO KOTA
                  </div>
                  <div className="text-xs text-blue-200">TAHUN 2025</div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex">
                  {/* Photo */}
                  <div className="flex-shrink-0 mr-4">
                    {selectedGenerus.foto_url ? (
                      <img
                        src={selectedGenerus.foto_url}
                        alt={selectedGenerus.nama_lengkap}
                        className="w-20 h-24 object-cover rounded-lg border-2 border-yellow-300"
                      />
                    ) : (
                      <div className="w-20 h-24 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-lg border-2 border-yellow-300 flex items-center justify-center text-3xl">
                        {selectedGenerus.jenis_kelamin === 'Laki-laki' ? '👦' : '👧'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-xs space-y-1">
                    <div>
                      <div className="text-yellow-300 font-semibold">NAMA LENGKAP</div>
                      <div className="font-bold text-white">{selectedGenerus.nama_lengkap}</div>
                    </div>
                    
                    <div>
                      <div className="text-yellow-300 font-semibold">JENIS KELAMIN</div>
                      <div className="text-white">{selectedGenerus.jenis_kelamin}</div>
                    </div>
                    
                    <div>
                      <div className="text-yellow-300 font-semibold">KELOMPOK SAMBUNG</div>
                      <div className="text-white">{selectedGenerus.kelompok_sambung}</div>
                    </div>
                    
                    <div>
                      <div className="text-yellow-300 font-semibold">JENJANG</div>
                      <div className="text-white">{selectedGenerus.jenjang}</div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end">
                  <div>
                    <Badge className={`${getStatusColor(selectedGenerus.status)} text-white text-xs`}>
                      {selectedGenerus.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-blue-200">
                    ID: {selectedGenerus.id.toString().padStart(6, '0')}
                  </div>
                </div>
              </CardContent>

              {/* Decorative Corners */}
              <div className="absolute top-2 left-2 text-yellow-300 text-xl">✨</div>
              <div className="absolute top-2 right-2 text-yellow-300 text-xl">✨</div>
              <div className="absolute bottom-2 left-2 text-yellow-300 text-xl">🌟</div>
              <div className="absolute bottom-2 right-2 text-yellow-300 text-xl">🌟</div>
            </Card>
          </div>
        </div>
      )}
      
      {/* Card Preview Info */}
      {selectedGenerus && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-4">
            <div className="text-center text-sm text-gray-600 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span>🆔</span>
                <span><strong>Kartu Identitas:</strong> {selectedGenerus.nama_lengkap}</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span>📅</span>
                <span><strong>Tempat, Tanggal Lahir:</strong> {selectedGenerus.tempat_lahir}, {selectedGenerus.tanggal_lahir.toLocaleDateString('id-ID')}</span>
              </div>
              <div className="text-xs text-gray-500 mt-3">
                💡 <strong>Tips:</strong> Gunakan tombol "Cetak Kartu" untuk mencetak kartu identitas ini. 
                Pastikan pengaturan printer dalam mode landscape untuk hasil terbaik.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
