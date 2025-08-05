
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import type { User, UserRole } from '../../../server/src/schema';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setShowDialog(true);
    setUsername('');
    setPassword('');
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await trpc.login.mutate({
        username,
        password,
        role: selectedRole
      });

      if (result) {
        onLogin(result);
        setShowDialog(false);
      } else {
        setError('Username atau Kode Masuk tidak valid');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Terjadi kesalahan saat login');
    } finally {
      setIsLoading(false);
    }
  };

  const getDialogTitle = () => {
    return selectedRole === 'guru' ? 'Login Guru Pengajar' : 'Login Koordinator';
  };

  const getUsernameLabel = () => {
    return selectedRole === 'guru' ? 'Username' : 'Nama Koordinator';
  };

  const getUsernamePlaceholder = () => {
    return selectedRole === 'guru' ? 'guru0001 - guru0050' : 'Ahmad Faqih Fajrin / Koordinator 1-10';
  };

  const getPasswordPlaceholder = () => {
    return selectedRole === 'guru' ? 'guru1234567890' : 'Ahfin2615039798 / koord1234567890';
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-2xl bg-white/95 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="text-center pb-8">
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            🚪 Akses Masuk Dashboard
          </CardTitle>
          <p className="text-lg text-gray-600">
            Pilih peran Anda untuk mengakses sistem
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Guru Pengajar Card */}
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200"
              onClick={() => handleRoleSelect('guru')}
            >
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">👨‍🏫</div>
                <h3 className="text-2xl font-bold text-green-700 mb-2">
                  Guru Pengajar
                </h3>
                <p className="text-green-600 mb-4">
                  Akses untuk mencatat laporan KBM dan kehadiran
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3">
                  Login sebagai Guru
                </Button>
              </CardContent>
            </Card>

            {/* Koordinator Card */}
            <Card 
              className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-blue-200"
              onClick={() => handleRoleSelect('koordinator')}
            >
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">👨‍💼</div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">
                  Koordinator
                </h3>
                <p className="text-blue-600 mb-4">
                  Akses penuh untuk manajemen dan statistik
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3">
                  Login sebagai Koordinator
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Login Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {getDialogTitle()}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {getUsernameLabel()}
              </label>
              <Input
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                placeholder={getUsernamePlaceholder()}
                required
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kode Masuk
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                placeholder={getPasswordPlaceholder()}
                required
                className="w-full"
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Memverifikasi...' : 'Masuk'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
