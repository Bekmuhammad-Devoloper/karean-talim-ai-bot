'use client';

import { useEffect, useState } from 'react';
import { statsApi } from '@/lib/api';
import { FiUsers, FiMessageSquare, FiMic, FiImage, FiActivity, FiGlobe } from 'react-icons/fi';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface KoreanStats {
  bot: { name: string; language: string; telegram: string; status: string };
  users: { total: number; activeToday: number; newToday: number; newThisWeek: number; newThisMonth: number };
  requests: { total: number; text: number; voice: number; image: number };
  timestamp: string;
}

interface TopUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  totalRequests: number;
  textRequests: number;
  voiceRequests: number;
  imageRequests: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<KoreanStats | null>(null);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Real-time yangilanish - har 10 soniyada
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, topUsersRes] = await Promise.all([
        statsApi.getKoreanDashboard(),
        statsApi.getKoreanTopUsers(5),
      ]);
      setStats(statsRes);
      setTopUsers(topUsersRes || []);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const doughnutData = {
    labels: ['Matn', 'Ovoz', 'Rasm'],
    datasets: [{
      data: [stats?.requests.text || 0, stats?.requests.voice || 0, stats?.requests.image || 0],
      backgroundColor: ['rgba(14, 165, 233, 0.8)', 'rgba(168, 85, 247, 0.8)', 'rgba(34, 197, 94, 0.8)'],
      borderWidth: 0,
    }],
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <img src="/karean.jpg" alt="Korean Talim" className="w-12 h-12 rounded-xl object-cover shadow-md" />
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Korean Talim AI Bot</h1>
          <p className="text-gray-500">Koreyscha grammatika tekshirish boti</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Jami foydalanuvchilar</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.users.total || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500 text-white"><FiUsers className="h-6 w-6" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Jami sorovlar</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.requests.total || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500 text-white"><FiMessageSquare className="h-6 w-6" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Bugun faol</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.users.activeToday || 0}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500 text-white"><FiActivity className="h-6 w-6" /></div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Bot</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">Korean Talim AI</p>
            </div>
            <div className="p-3 rounded-xl bg-green-500 text-white"><FiGlobe className="h-6 w-6" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sorov turlari</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top foydalanuvchilar</h3>
          {topUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Hali foydalanuvchilar yoq</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">#</th>
                  <th className="pb-3">Foydalanuvchi</th>
                  <th className="pb-3">Jami</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user, i) => (
                  <tr key={user.id} className="border-b border-gray-50">
                    <td className="py-3">{i + 1}</td>
                    <td className="py-3">{user.firstName} {user.lastName}</td>
                    <td className="py-3 font-bold">{user.totalRequests}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-500 rounded-2xl p-6 text-white">
          <FiMessageSquare className="h-8 w-8 mb-4" />
          <p className="text-4xl font-bold">{stats?.requests.text || 0}</p>
          <p className="opacity-70">Matn sorovlari</p>
        </div>
        <div className="bg-purple-500 rounded-2xl p-6 text-white">
          <FiMic className="h-8 w-8 mb-4" />
          <p className="text-4xl font-bold">{stats?.requests.voice || 0}</p>
          <p className="opacity-70">Ovoz sorovlari</p>
        </div>
        <div className="bg-green-500 rounded-2xl p-6 text-white">
          <FiImage className="h-8 w-8 mb-4" />
          <p className="text-4xl font-bold">{stats?.requests.image || 0}</p>
          <p className="opacity-70">Rasm sorovlari</p>
        </div>
      </div>
    </div>
  );
}
