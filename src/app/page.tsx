'use client';

import { useAuth } from '../context/AuthContext';
import LoginPage from '../components/auth/LoginPage';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen bg-background-dark flex items-center justify-center text-white">Carregando...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  return null; // Will redirect
}
