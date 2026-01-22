'use client';

import { useState, useEffect } from 'react';
import { channelsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiHash, FiUsers, FiLink, FiSearch } from 'react-icons/fi';

interface Channel {
  id: number;
  channelId: string;
  channelUsername: string;
  title: string;
  photoUrl?: string;
  isMandatory: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);
  const [formData, setFormData] = useState({ 
    title: '', 
    channelUsername: '', 
    channelId: '',
    photoUrl: '',
    isMandatory: true 
  });

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      console.log('Fetching channels...');
      const data = await channelsApi.getAll();
      console.log('Channels data:', data);
      setChannels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Fetch channels error:', error);
      toast.error("Kanallarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  // Telegram dan kanal ma'lumotlarini olish
  const fetchChannelInfo = async (username: string) => {
    if (!username || username.length < 3) return;
    
    setLoadingInfo(true);
    try {
      console.log('Fetching channel info for:', username);
      const info = await channelsApi.getInfo(username);
      console.log('Channel info:', info);
      
      if (info && !info.error) {
        setFormData(prev => ({
          ...prev,
          title: info.title || prev.title,
          photoUrl: info.photoUrl || prev.photoUrl,
          channelId: info.channelId || prev.channelId,
        }));
        toast.success("Kanal ma'lumotlari yuklandi!");
      }
    } catch (error) {
      console.error('Fetch channel info error:', error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // channelId ni username dan olamiz agar bo'sh bo'lsa
      const submitData = {
        ...formData,
        channelId: formData.channelId || `@${formData.channelUsername}`,
      };
      console.log('Submitting channel:', submitData);
      
      if (editingChannel) {
        await channelsApi.update(editingChannel.id, submitData);
        toast.success("Kanal yangilandi!");
      } else {
        await channelsApi.create(submitData);
        toast.success("Kanal qo'shildi!");
      }
      fetchChannels();
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Xatolik yuz berdi!");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Kanalni o'chirmoqchimisiz?")) return;
    try {
      await channelsApi.delete(id);
      toast.success("Kanal o'chirildi!");
      fetchChannels();
    } catch {
      toast.error("O'chirishda xatolik!");
    }
  };

  const openModal = (channel?: Channel) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({ 
        title: channel.title, 
        channelUsername: channel.channelUsername, 
        channelId: channel.channelId,
        photoUrl: channel.photoUrl || '',
        isMandatory: channel.isMandatory 
      });
    } else {
      setEditingChannel(null);
      setFormData({ title: '', channelUsername: '', channelId: '', photoUrl: '', isMandatory: true });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingChannel(null);
    setFormData({ title: '', channelUsername: '', channelId: '', photoUrl: '', isMandatory: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  const channelsArray = Array.isArray(channels) ? channels : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiHash className="w-8 h-8" />
              Kanallar Boshqaruvi
            </h1>
            <p className="text-emerald-100 mt-2">Majburiy obuna kanallarini boshqaring</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">{channelsArray.length}</div>
              <div className="text-xs text-emerald-100">Jami kanallar</div>
            </div>
            <button onClick={() => openModal()} className="bg-white text-emerald-600 px-5 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-all flex items-center gap-2 shadow-lg">
              <FiPlus className="w-5 h-5" />
              Yangi kanal
            </button>
          </div>
        </div>
      </div>

      {/* Channels Grid */}
      {channelsArray.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <FiHash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Kanallar yo'q</h3>
          <p className="text-gray-400 mt-2">Yangi kanal qo'shish uchun tugmani bosing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channelsArray.map((channel) => (
            <div key={channel.id} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all border border-gray-100 group">
              <div className="flex items-start justify-between mb-4">
                {channel.photoUrl ? (
                  <img 
                    src={channel.photoUrl} 
                    alt={channel.title} 
                    className="w-14 h-14 rounded-xl object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {channel.title.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(channel)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Tahrirlash">
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(channel.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="O'chirish">
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{channel.title}</h3>
              <a href={`https://t.me/${channel.channelUsername}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mb-4">
                <FiLink className="w-4 h-4" />
                @{channel.channelUsername}
              </a>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${channel.isMandatory ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                  {channel.isMandatory ? 'Majburiy' : 'Ixtiyoriy'}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(channel.createdAt).toLocaleDateString('uz-UZ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">{editingChannel ? 'Kanalni tahrirlash' : 'Yangi kanal'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Yopish">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                    <input 
                      type="text" 
                      value={formData.channelUsername} 
                      onChange={(e) => setFormData({ ...formData, channelUsername: e.target.value })} 
                      className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" 
                      placeholder="username" 
                      required 
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => fetchChannelInfo(formData.channelUsername)}
                    disabled={loadingInfo || !formData.channelUsername}
                    className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Telegram dan ma'lumotlarni yuklash"
                  >
                    {loadingInfo ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FiSearch className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Username kiritib, tugmani bosing - kanal ma'lumotlari avtomatik yuklanadi</p>
              </div>
              
              {/* Preview */}
              {(formData.photoUrl || formData.title) && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  {formData.photoUrl ? (
                    <img src={formData.photoUrl} alt="Channel" className="w-14 h-14 rounded-xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                      {formData.title.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-gray-800">{formData.title || 'Kanal nomi'}</div>
                    <div className="text-sm text-gray-500">@{formData.channelUsername || 'username'}</div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Kanal nomi</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" placeholder="Masalan: Hilal Edu" required />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-800">Majburiy obuna</div>
                  <div className="text-sm text-gray-500">Botdan foydalanish uchun obuna shart</div>
                </div>
                <button type="button" onClick={() => setFormData({ ...formData, isMandatory: !formData.isMandatory })} className={`relative w-14 h-8 rounded-full transition-colors ${formData.isMandatory ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${formData.isMandatory ? 'right-1' : 'left-1'}`}></span>
                </button>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Bekor qilish
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium">
                  {editingChannel ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}