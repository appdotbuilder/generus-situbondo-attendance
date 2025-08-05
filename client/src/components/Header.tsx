
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour12: false,
      timeZone: 'Asia/Jakarta'
    }) + ' WIB';
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Jakarta'
    });
  };

  return (
    <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title Section */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
              ✨ Aplikasi Kehadiran Generus ✨
            </h1>
            <h2 className="text-xl lg:text-2xl font-semibold text-blue-100 mb-1">
              🌟 Generasi Penerus Pra-Remaja 🌟
            </h2>
            <h3 className="text-lg lg:text-xl font-medium text-purple-200 mb-1">
              🏛️ Kelompok Situbondo Kota
            </h3>
            <h4 className="text-md lg:text-lg font-medium text-pink-200">
              📅 Tahun 2025
            </h4>
          </div>

          {/* Digital Clock & Calendar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-end">
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 text-center">
              <div className="text-2xl font-mono font-bold text-yellow-300 mb-1">
                🕐 {formatTime(currentTime)}
              </div>
              <div className="text-sm text-blue-200">
                Waktu Indonesia Barat
              </div>
            </Card>
            
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 text-center">
              <div className="text-lg font-semibold text-green-300 mb-1">
                📆 {formatDate(currentTime)}
              </div>
              <div className="text-sm text-purple-200">
                Kalender Dinamis
              </div>
            </Card>
          </div>
        </div>
      </div>
    </header>
  );
}
