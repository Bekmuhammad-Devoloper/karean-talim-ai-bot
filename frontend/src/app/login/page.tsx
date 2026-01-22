'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import toast from 'react-hot-toast';
import { FiUser, FiLock, FiLogIn, FiSend } from 'react-icons/fi';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Telegram login
  const [showTelegramLogin, setShowTelegramLogin] = useState(false);
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('=== LOGIN DEBUG ===');
      console.log('Username:', username);
      console.log('Password:', password);
      
      const response = await authApi.login(username, password);
      console.log('Login response:', response);
      
      // authApi.login allaqachon res.data qaytaradi
      const { access_token, user } = response;

      console.log('Token:', access_token);
      console.log('User:', user);

      localStorage.setItem('token', access_token);
      setAuth(access_token, user);

      toast.success('Muvaffaqiyatli kirdingiz!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error response:', error.response);
      toast.error(error.response?.data?.message || error.message || 'Login xatoligi');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTelegramLoading(true);

    try {
      console.log('=== TELEGRAM LOGIN DEBUG ===');
      console.log('Code:', telegramCode);
      
      const response = await authApi.telegramLogin(telegramCode);
      console.log('Telegram login response:', response);
      
      // authApi.telegramLogin allaqachon res.data qaytaradi
      const { access_token, user } = response;

      localStorage.setItem('token', access_token);
      setAuth(access_token, user);

      toast.success('Telegram orqali kirdingiz!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Telegram login error:', error);
      toast.error(error.response?.data?.message || 'Kod xato yoki muddati tugagan');
    } finally {
      setTelegramLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-4 overflow-hidden ring-4 ring-white/30">
            <img src="/karean.jpg" alt="Korean Talim" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-white drop-shadow-lg">Korean Talim AI Bot</h1>
          <p className="text-white/80 mt-2 text-lg">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {!showTelegramLogin ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
                Kirish
              </h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Foydalanuvchi nomi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="admin"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parol
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiLogIn className="h-5 w-5" />
                      Kirish
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">yoki</span>
                </div>
              </div>

              <button
                onClick={() => setShowTelegramLogin(true)}
                className="w-full flex items-center justify-center gap-2 bg-[#0088cc] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#0077b5] transition-all"
              >
                <FiSend className="h-5 w-5" />
                Telegram orqali kirish
              </button>

              <p className="text-center text-gray-500 text-sm mt-4">
                Botda <code className="bg-gray-100 px-2 py-1 rounded">/logincode</code> yuboring
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">
                Telegram Login
              </h2>
              <p className="text-gray-500 text-center mb-6 text-sm">
                Botga <code className="bg-gray-100 px-2 py-1 rounded">/logincode</code> yuboring va olingan kodni kiriting
              </p>

              <form onSubmit={handleTelegramLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    6 raqamli kod
                  </label>
                  <input
                    type="text"
                    value={telegramCode}
                    onChange={(e) => setTelegramCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="block w-full text-center text-2xl tracking-[0.5em] py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#0088cc] focus:border-transparent transition-all font-mono"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={telegramLoading || telegramCode.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-[#0088cc] text-white py-3 px-4 rounded-xl font-semibold hover:bg-[#0077b5] transition-all disabled:opacity-50"
                >
                  {telegramLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiLogIn className="h-5 w-5" />
                      Kirish
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTelegramLogin(false)}
                  className="w-full text-gray-500 py-2 hover:text-gray-700 transition-all"
                >
                  ← Orqaga
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-white/60 text-sm mt-6">
          © 2024 Hilal AI Bot. Barcha huquqlar himoyalangan.
        </p>
      </div>
    </div>
  );
}
