
import { useState, useCallback } from 'react';
import { Login } from '@/components/Login';
import { Dashboard } from '@/components/Dashboard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import type { User } from '../../server/src/schema';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-800 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {!currentUser ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Dashboard user={currentUser} onLogout={handleLogout} />
        )}
      </main>
      
      <Footer />
    </div>
  );
}

export default App;
