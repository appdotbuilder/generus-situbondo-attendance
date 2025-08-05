
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { KBMReports } from '@/components/KBMReports';
import { AttendanceRecap } from '@/components/AttendanceRecap';
import { GenerusData } from '@/components/GenerusData';
import { MaterialsInfo } from '@/components/MaterialsInfo';
import { GenerusIdCard } from '@/components/GenerusIdCard';
import type { User } from '../../../server/src/schema';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('kbm-reports');

  const isKoordinator = user.role === 'koordinator';

  return (
    <div className="space-y-6">
      {/* User Info Header */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl">
                {isKoordinator ? '👨‍💼' : '👨‍🏫'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {user.full_name}
                </h2>
                <Badge variant={isKoordinator ? 'default' : 'secondary'} className="mt-1">
                  {isKoordinator ? '👑 Koordinator' : '📚 Guru Pengajar'}
                </Badge>
              </div>
            </div>
            
            <Button 
              onClick={onLogout}
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
            >
              🚪 Keluar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📊 Dashboard {isKoordinator ? 'Koordinator' : 'Guru Pengajar'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-1 h-auto p-1">
              <TabsTrigger value="kbm-reports" className="text-xs lg:text-sm py-3">
                📝 Laporan KBM
              </TabsTrigger>
              <TabsTrigger value="attendance-recap" className="text-xs lg:text-sm py-3">
                📈 Rekapan Laporan
              </TabsTrigger>
              <TabsTrigger value="generus-data" className="text-xs lg:text-sm py-3">
                👥 Data Generus
              </TabsTrigger>
              <TabsTrigger value="materials" className="text-xs lg:text-sm py-3">
                📚 Info Materi
              </TabsTrigger>
              <TabsTrigger value="id-cards" className="text-xs lg:text-sm py-3">
                🆔 Kartu ID
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <TabsContent value="kbm-reports" className="space-y-6">
                <KBMReports user={user} />
              </TabsContent>

              <TabsContent value="attendance-recap" className="space-y-6">
                <AttendanceRecap user={user} />
              </TabsContent>

              <TabsContent value="generus-data" className="space-y-6">
                <GenerusData />
              </TabsContent>

              <TabsContent value="materials" className="space-y-6">
                <MaterialsInfo user={user} />
              </TabsContent>

              <TabsContent value="id-cards" className="space-y-6">
                <GenerusIdCard />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
