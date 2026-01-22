'use client';

import { useState, useEffect, useRef } from 'react';
import { postsApi, getApiUrl } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiFileText, FiSend, FiImage, FiClock, FiCheck, FiUsers, FiRadio, FiVideo, FiLink, FiUpload } from 'react-icons/fi';

interface Post {
  id: number;
  content: string;
  mediaUrl?: string;
  mediaPath?: string;
  type: string;
  buttonText?: string;
  buttonUrl?: string;
  channelId?: string;
  status: string;
  scheduledAt?: string;
  sentAt?: string;
  broadcastToUsers?: boolean;
  createdAt: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [formData, setFormData] = useState({ 
    content: '', 
    mediaUrl: '', 
    type: 'text',
    buttonText: '',
    buttonUrl: '',
    status: 'draft'
  });
  const [scheduleData, setScheduleData] = useState({
    scheduledAt: '',
    broadcastToUsers: true
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{path: string; type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching posts...');
      const postsData = await postsApi.getAll();
      console.log('Posts:', postsData);
      setPosts(Array.isArray(postsData) ? postsData : []);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await postsApi.upload(file);
      console.log('Upload result:', result);
      const fullPath = `${getApiUrl()}${result.path}`;
      setUploadedFile({ path: fullPath, type: result.type });
      setFormData(prev => ({ 
        ...prev, 
        type: result.type,
        mediaUrl: fullPath 
      }));
      toast.success('Fayl yuklandi!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fayl yuklashda xatolik!');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const postData = {
        content: formData.content,
        type: formData.type,
        mediaUrl: uploadedFile?.path || formData.mediaUrl || undefined,
        buttonText: formData.buttonText || undefined,
        buttonUrl: formData.buttonUrl || undefined,
      };
      console.log('Submitting post:', postData);
      if (editingPost) {
        await postsApi.update(editingPost.id, postData);
        toast.success("Post yangilandi!");
      } else {
        await postsApi.create(postData);
        toast.success("Post yaratildi!");
      }
      fetchData();
      closeModal();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error("Xatolik yuz berdi!");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Postni o'chirmoqchimisiz?")) return;
    try {
      await postsApi.delete(id);
      toast.success("Post o'chirildi!");
      fetchData();
    } catch {
      toast.error("O'chirishda xatolik!");
    }
  };

  const handleBroadcast = async () => {
    if (!selectedPost) return;
    setBroadcasting(true);
    try {
      console.log('Broadcasting post:', selectedPost.id);
      const result = await postsApi.broadcast(selectedPost.id);
      console.log('Broadcast result:', result);
      toast.success(`Post ${result.sent} foydalanuvchiga yuborildi! (${result.failed} ta muvaffaqiyatsiz)`);
      fetchData();
      setShowBroadcastModal(false);
      setSelectedPost(null);
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error("Broadcast qilishda xatolik!");
    } finally {
      setBroadcasting(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedPost || !scheduleData.scheduledAt) return;
    try {
      console.log('Scheduling post:', selectedPost.id, scheduleData);
      await postsApi.schedule(selectedPost.id, scheduleData.scheduledAt, scheduleData.broadcastToUsers);
      toast.success("Post rejalashtirildi!");
      fetchData();
      setShowScheduleModal(false);
      setSelectedPost(null);
      setScheduleData({ scheduledAt: '', broadcastToUsers: true });
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error("Rejalashtirishda xatolik!");
    }
  };

  const openModal = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      setFormData({ 
        content: post.content, 
        mediaUrl: post.mediaUrl || '', 
        type: post.type || 'text',
        buttonText: post.buttonText || '',
        buttonUrl: post.buttonUrl || '',
        status: post.status
      });
      if (post.mediaUrl || post.mediaPath) {
        setUploadedFile({ path: post.mediaPath || post.mediaUrl || '', type: post.type });
      }
    } else {
      setEditingPost(null);
      setFormData({ 
        content: '', 
        mediaUrl: '', 
        type: 'text',
        buttonText: '',
        buttonUrl: '',
        status: 'draft'
      });
      setUploadedFile(null);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingPost(null);
    setFormData({ content: '', mediaUrl: '', type: 'text', buttonText: '', buttonUrl: '', status: 'draft' });
    setUploadedFile(null);
  };

  const openBroadcastModal = (post: Post) => {
    setSelectedPost(post);
    setShowBroadcastModal(true);
  };

  const openScheduleModal = (post: Post) => {
    setSelectedPost(post);
    setScheduleData({ scheduledAt: '', broadcastToUsers: true });
    setShowScheduleModal(true);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'sent':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Yuborilgan</span>;
      case 'scheduled':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Rejalashtirilgan</span>;
      case 'failed':
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">Xatolik</span>;
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">Qoralama</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  const postsArray = Array.isArray(posts) ? posts : [];
  const sentCount = postsArray.filter(p => p.status === 'sent').length;
  const draftCount = postsArray.filter(p => p.status === 'draft').length;
  const scheduledCount = postsArray.filter(p => p.status === 'scheduled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FiFileText className="w-8 h-8" />
              Postlar Boshqaruvi
            </h1>
            <p className="text-purple-100 mt-2">Postlarni yarating, broadcast qiling va rejalashtiring</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">{sentCount}</div>
              <div className="text-xs text-purple-100">Yuborilgan</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">{scheduledCount}</div>
              <div className="text-xs text-purple-100">Rejalashtirilgan</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 text-center">
              <div className="text-2xl font-bold">{draftCount}</div>
              <div className="text-xs text-purple-100">Qoralama</div>
            </div>
            <button onClick={() => openModal()} className="bg-white text-purple-600 px-5 py-3 rounded-xl font-semibold hover:bg-purple-50 transition-all flex items-center gap-2 shadow-lg">
              <FiPlus className="w-5 h-5" />
              Yangi post
            </button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {postsArray.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
          <FiFileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600">Postlar yo'q</h3>
          <p className="text-gray-400 mt-2">Yangi post yaratish uchun tugmani bosing</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {postsArray.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all border border-gray-100 overflow-hidden group">
              {(post.mediaUrl || post.mediaPath) && post.type === 'photo' && (
                <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <img src={post.mediaPath || post.mediaUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {(post.mediaUrl || post.mediaPath) && post.type === 'video' && (
                <div className="h-40 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center relative overflow-hidden">
                  <video 
                    src={post.mediaPath || post.mediaUrl} 
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                      <FiVideo className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(post.status)}
                    {post.type === 'photo' && <FiImage className="w-4 h-4 text-green-500" title="Rasm" />}
                    {post.type === 'video' && <FiVideo className="w-4 h-4 text-blue-500" title="Video" />}
                    {post.buttonUrl && <FiLink className="w-4 h-4 text-purple-500" title="Tugma" />}
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(post)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors" title="Tahrirlash">
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors" title="O'chirish">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>
                
                {post.buttonText && post.buttonUrl && (
                  <div className="mb-3">
                    <a href={post.buttonUrl} target="_blank" rel="noreferrer" className="inline-block px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">
                      {post.buttonText}
                    </a>
                  </div>
                )}
                
                {post.scheduledAt && (
                  <div className="text-sm text-blue-600 mb-3 flex items-center gap-1">
                    <FiClock className="w-4 h-4" />
                    {new Date(post.scheduledAt).toLocaleString('uz-UZ')}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
                  {post.status === 'draft' && (
                    <>
                      {/* Broadcast Button */}
                      <button 
                        onClick={() => openBroadcastModal(post)} 
                        className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 font-medium bg-purple-50 px-3 py-1.5 rounded-lg" 
                        title="Barcha foydalanuvchilarga yuborish"
                      >
                        <FiRadio className="w-4 h-4" />
                        Broadcast
                      </button>
                      
                      {/* Schedule Button */}
                      <button 
                        onClick={() => openScheduleModal(post)} 
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg" 
                        title="Rejalashtirish"
                      >
                        <FiClock className="w-4 h-4" />
                        Reja
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">{editingPost ? 'Postni tahrirlash' : 'Yangi post'}</h2>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Yopish">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Post turi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post turi</label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, type: 'text' })} 
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${formData.type === 'text' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <FiFileText className="w-5 h-5" /> Matn
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, type: 'photo' })} 
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${formData.type === 'photo' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <FiImage className="w-5 h-5" /> Rasm
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({ ...formData, type: 'video' })} 
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${formData.type === 'video' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <FiVideo className="w-5 h-5" /> Video
                  </button>
                </div>
              </div>

              {/* Matn */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Post matni</label>
                <textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  rows={5} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none" 
                  placeholder="Post matnini kiriting (HTML qo'llab-quvvatlanadi)..." 
                  required 
                />
              </div>

              {/* Media yuklash (Rasm/Video) */}
              {(formData.type === 'photo' || formData.type === 'video') && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    {formData.type === 'photo' ? '🖼️ Rasm' : '🎬 Video'}
                  </label>
                  
                  {/* File upload */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-purple-400 transition-colors">
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept={formData.type === 'photo' ? 'image/*' : 'video/*'}
                      className="hidden"
                    />
                    {uploadedFile ? (
                      <div className="space-y-2">
                        {formData.type === 'photo' ? (
                          <img src={uploadedFile.path} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                        ) : (
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <FiCheck className="w-5 h-5" />
                            <span>Video yuklandi</span>
                          </div>
                        )}
                        <button 
                          type="button" 
                          onClick={() => { setUploadedFile(null); setFormData({...formData, mediaUrl: ''}); }}
                          className="text-sm text-red-500 hover:underline"
                        >
                          O'chirish
                        </button>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 w-full py-4 text-gray-500 hover:text-purple-600"
                      >
                        {uploading ? (
                          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <FiUpload className="w-6 h-6" />
                            <span>{formData.type === 'photo' ? 'Rasm yuklash' : 'Video yuklash'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* URL orqali */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">yoki URL:</span>
                    <input 
                      type="url" 
                      value={formData.mediaUrl} 
                      onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })} 
                      className="w-full pl-20 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                      placeholder="https://example.com/media..." 
                    />
                  </div>
                </div>
              )}

              {/* Button (havola) */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  <FiLink className="w-4 h-4 inline mr-1" />
                  Tugma (ixtiyoriy)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    value={formData.buttonText} 
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })} 
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                    placeholder="Tugma matni" 
                  />
                  <input 
                    type="url" 
                    value={formData.buttonUrl} 
                    onChange={(e) => setFormData({ ...formData, buttonUrl: e.target.value })} 
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" 
                    placeholder="https://example.com" 
                  />
                </div>
                {formData.buttonText && formData.buttonUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-500">Ko'rinishi:</span>
                    <div className="mt-2">
                      <span className="inline-block px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">{formData.buttonText}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                  Bekor qilish
                </button>
                <button type="submit" className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium">
                  {editingPost ? 'Saqlash' : 'Yaratish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FiRadio className="w-6 h-6 text-purple-600" />
                  Broadcast
                </h2>
                <button onClick={() => setShowBroadcastModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Yopish">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="flex items-center gap-3 text-purple-700">
                  <FiUsers className="w-8 h-8" />
                  <div>
                    <div className="font-semibold">Barcha foydalanuvchilarga yuborish</div>
                    <div className="text-sm text-purple-600">Bu post botdagi barcha foydalanuvchilarga yuboriladi</div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Post matni:</div>
                <p className="text-gray-800 line-clamp-3">{selectedPost.content}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowBroadcastModal(false)} 
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={handleBroadcast} 
                  disabled={broadcasting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {broadcasting ? (
                    <>
                      <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Yuborilmoqda...
                    </>
                  ) : (
                    <>
                      <FiSend className="w-5 h-5" />
                      Yuborish
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <FiClock className="w-6 h-6 text-blue-600" />
                  Rejalashtirish
                </h2>
                <button onClick={() => setShowScheduleModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Yopish">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yuborish vaqti</label>
                <input 
                  type="datetime-local" 
                  value={scheduleData.scheduledAt} 
                  onChange={(e) => setScheduleData({ ...scheduleData, scheduledAt: e.target.value })} 
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  title="Yuborish vaqtini tanlang"
                  required
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-800 flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    Barcha foydalanuvchilarga
                  </div>
                  <div className="text-sm text-gray-500">Broadcast qilish</div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setScheduleData({ ...scheduleData, broadcastToUsers: !scheduleData.broadcastToUsers })} 
                  className={`relative w-14 h-8 rounded-full transition-colors ${scheduleData.broadcastToUsers ? 'bg-blue-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${scheduleData.broadcastToUsers ? 'right-1' : 'left-1'}`}></span>
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="text-sm text-gray-600 mb-2">Post matni:</div>
                <p className="text-gray-800 line-clamp-3">{selectedPost.content}</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowScheduleModal(false)} 
                  className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Bekor qilish
                </button>
                <button 
                  onClick={handleSchedule} 
                  disabled={!scheduleData.scheduledAt}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:opacity-90 transition-opacity font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiCheck className="w-5 h-5" />
                  Rejalashtirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}