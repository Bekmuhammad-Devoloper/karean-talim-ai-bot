'use client';

import { useEffect, useState } from 'react';
import { statsApi } from '@/lib/api';
import { FiUsers, FiMessageSquare, FiMic, FiImage } from 'react-icons/fi';

interface TopUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  totalRequests: number;
  textRequests: number;
  voiceRequests: number;
  imageRequests: number;
  joinedAt: string;
}

export default function StatsPage() {
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
      const topRes = await statsApi.getKoreanTopUsers(20);
      setTopUsers(topRes || []);
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Foydalanuvchilar</h1>
          <p className="text-gray-500 mt-1">🇰🇷 Korean Talim Bot foydalanuvchilari ro'yxati</p>
        </div>
        <div className="flex items-center gap-2">
          <FiUsers className="h-5 w-5 text-blue-500" />
          <span className="text-lg font-semibold text-gray-700">{topUsers.length} ta</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {topUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiUsers className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Hali foydalanuvchilar yoq</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium">#</th>
                  <th className="px-6 py-4 font-medium">Foydalanuvchi</th>
                  <th className="px-6 py-4 font-medium">Jami</th>
                  <th className="px-6 py-4 font-medium">Matn</th>
                  <th className="px-6 py-4 font-medium">Ovoz</th>
                  <th className="px-6 py-4 font-medium">Rasm</th>
                  <th className="px-6 py-4 font-medium">Qoshilgan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                        {user.username && <p className="text-sm text-gray-500">@{user.username}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold">{user.totalRequests}</td>
                    <td className="px-6 py-4 text-blue-600">{user.textRequests}</td>
                    <td className="px-6 py-4 text-purple-600">{user.voiceRequests}</td>
                    <td className="px-6 py-4 text-green-600">{user.imageRequests}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('uz-UZ') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FiUsers className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Jami</p>
              <p className="text-xl font-bold text-gray-900">{topUsers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg"><FiMessageSquare className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Matn</p>
              <p className="text-xl font-bold text-gray-900">{topUsers.reduce((sum, u) => sum + (u.textRequests || 0), 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg"><FiMic className="h-5 w-5 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Ovoz</p>
              <p className="text-xl font-bold text-gray-900">{topUsers.reduce((sum, u) => sum + (u.voiceRequests || 0), 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg"><FiImage className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Rasm</p>
              <p className="text-xl font-bold text-gray-900">{topUsers.reduce((sum, u) => sum + (u.imageRequests || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
