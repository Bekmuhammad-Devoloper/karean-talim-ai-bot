'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FiUsers, FiCalendar, FiTarget, FiActivity, FiCode, FiExternalLink, FiGlobe, FiSend, FiClock, FiTrendingUp, FiDatabase, FiServer, FiCpu, FiZap } from 'react-icons/fi';

interface ProjectStats {
  name: string;
  slug: string;
  logo: string;
  description: string;
  purpose: string;
  features: string[];
  tech: { name: string; logo: string }[];
  stats: {
    users: number;
    dailyRequests: number;
    uptime: string;
  };
  createdAt: string;
  status: 'active' | 'development' | 'maintenance';
  links: { name: string; url: string; icon: string }[];
  gradient: string;
}

const projectsData: ProjectStats[] = [
  {
    name: 'Hilal AI Bot',
    slug: 'hilal-ai',
    logo: '/Hilal Edu - logo-2.png',
    description: "O'zbek tilidagi grammatik xatolarni tekshiruvchi AI bot. Matn, rasm va audio orqali xatolarni topib, to'g'rilaydi.",
    purpose: "O'zbek tilida yozilgan matnlardagi imloviy va grammatik xatolarni sun'iy intellekt yordamida aniqlash va tuzatish. Ta'lim sifatini oshirish va o'zbek tilini saqlashga hissa qo'shish.",
    features: [
      "📝 Matnli xabarlarni tekshirish",
      "🖼️ Rasmdan matn ajratib tekshirish (OCR)",
      "🎤 Ovozli xabarlarni tekshirish (STT)",
      "🤖 Gemini AI bilan ishlash",
      "📊 Foydalanish statistikasi",
      "🔐 Admin panel",
    ],
    tech: [
      { name: 'NestJS', logo: '/tech/nestjs.svg' },
      { name: 'Gemini AI', logo: '/tech/gemini.svg' },
      { name: 'PostgreSQL', logo: '/tech/postgresql.svg' },
      { name: 'TypeScript', logo: '/tech/typescript.svg' },
      { name: 'Next.js', logo: '/tech/nextjs.svg' },
    ],
    stats: {
      users: 1247,
      dailyRequests: 3500,
      uptime: '99.9%',
    },
    createdAt: '2025-09-15',
    status: 'active',
    links: [
      { name: 'Telegram Bot', url: 'https://t.me/hilal_ai_bot', icon: 'telegram' },
    ],
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    name: 'Bilimdon AI',
    slug: 'bilimdon-ai',
    logo: '/bilimdonai.jpg',
    description: "AI yordamida interaktiv testlar yaratuvchi va bilimni baholovchi bot. Leaderboard, yutuqlar va AI maslahatlar.",
    purpose: "O'quvchilarning bilim darajasini sun'iy intellekt yordamida baholash, shaxsiylashtirilgan testlar yaratish va o'quv jarayonini gamifikatsiya qilish.",
    features: [
      "🧠 AI bilan interaktiv testlar",
      "📊 Natijalar va leaderboard",
      "🏆 Yutuqlar va badges tizimi",
      "💡 AI shaxsiy maslahatlar",
      "📈 O'sish statistikasi",
      "🎯 Maqsadlar va challengelar",
    ],
    tech: [
      { name: 'Gemini AI', logo: '/tech/gemini.svg' },
      { name: 'NestJS', logo: '/tech/nestjs.svg' },
      { name: 'PostgreSQL', logo: '/tech/postgresql.svg' },
      { name: 'React', logo: '/tech/react.svg' },
      { name: 'Next.js', logo: '/tech/nextjs.svg' },
    ],
    stats: {
      users: 2850,
      dailyRequests: 8200,
      uptime: '99.7%',
    },
    createdAt: '2025-06-20',
    status: 'active',
    links: [
      { name: 'Telegram Bot', url: 'https://t.me/Bilimdon_aibot', icon: 'telegram' },
      { name: 'Website', url: 'https://bilimdon-ai.uz', icon: 'web' },
    ],
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
  },
  {
    name: 'Orfan.uz',
    slug: 'orfan',
    logo: '/orfan-logo.svg',
    description: "O'zbekistonda nodir (orfan) kasalliklar bilan og'rigan bemorlarni ro'yxatga olish va kuzatish platformasi.",
    purpose: "Nodir kasalliklar bilan og'rigan bemorlarni markazlashgan holda ro'yxatga olish, statistik tahlil qilish va tibbiy yordamni yaxshilash.",
    features: [
      "📋 Bemorlarni ro'yxatga olish",
      "📊 Statistik tahlillar",
      "🏥 Tibbiy muassasalar bilan bog'lanish",
      "📈 Vizual hisobotlar",
      "🔒 Xavfsiz ma'lumotlar saqlash",
      "👨‍⚕️ Shifokorlar uchun panel",
    ],
    tech: [
      { name: 'React', logo: '/tech/react.svg' },
      { name: 'Next.js', logo: '/tech/nextjs.svg' },
      { name: 'Express', logo: '/tech/express.svg' },
      { name: 'MongoDB', logo: '/tech/mongodb.svg' },
    ],
    stats: {
      users: 450,
      dailyRequests: 1200,
      uptime: '99.5%',
    },
    createdAt: '2025-11-10',
    status: 'development',
    links: [
      { name: 'Website', url: 'https://orfan.uz', icon: 'web' },
    ],
    gradient: 'from-rose-500 via-pink-500 to-red-500',
  },
];

export default function APIPage() {
  const [selectedProject, setSelectedProject] = useState<ProjectStats | null>(null);
  const [liveStats, setLiveStats] = useState<{ [key: string]: { users: number; requests: number } }>({});

  useEffect(() => {
    // Simulate real-time stats updates
    const interval = setInterval(() => {
      const newStats: { [key: string]: { users: number; requests: number } } = {};
      projectsData.forEach((project) => {
        newStats[project.slug] = {
          users: project.stats.users + Math.floor(Math.random() * 5),
          requests: project.stats.dailyRequests + Math.floor(Math.random() * 50),
        };
      });
      setLiveStats(newStats);
    }, 3000);

    // Initial stats
    const initialStats: { [key: string]: { users: number; requests: number } } = {};
    projectsData.forEach((project) => {
      initialStats[project.slug] = {
        users: project.stats.users,
        requests: project.stats.dailyRequests,
      };
    });
    setLiveStats(initialStats);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'development':
        return 'bg-amber-100 text-amber-700';
      case 'maintenance':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'development':
        return 'Ishlab chiqilmoqda';
      case 'maintenance':
        return 'Texnik xizmat';
      default:
        return status;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const daysSinceCreation = (dateStr: string) => {
    const created = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <FiCode className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Bekmuhammad API</h1>
            <p className="text-purple-100">Barcha loyihalar haqida real-time ma'lumotlar</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <FiDatabase className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{projectsData.length}</div>
            <div className="text-xs text-purple-100">Jami loyihalar</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <FiUsers className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {Object.values(liveStats).reduce((sum, s) => sum + s.users, 0).toLocaleString()}
            </div>
            <div className="text-xs text-purple-100">Jami foydalanuvchilar</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <FiActivity className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {Object.values(liveStats).reduce((sum, s) => sum + s.requests, 0).toLocaleString()}
            </div>
            <div className="text-xs text-purple-100">Kunlik so'rovlar</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
            <FiZap className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">99.7%</div>
            <div className="text-xs text-purple-100">O'rtacha uptime</div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {projectsData.map((project) => (
          <div
            key={project.slug}
            onClick={() => setSelectedProject(project)}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer border border-gray-100 overflow-hidden group"
          >
            {/* Project Header */}
            <div className={`bg-gradient-to-r ${project.gradient} p-6 text-white`}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-xl p-2 shadow-lg">
                  <Image
                    src={project.logo}
                    alt={project.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-contain rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{project.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs mt-1 ${getStatusColor(project.status)}`}>
                    {getStatusText(project.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6">
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{project.description}</p>
              
              {/* Live Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <FiUsers className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <div className="text-lg font-bold text-gray-800">
                    {(liveStats[project.slug]?.users || project.stats.users).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Foydalanuvchi</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <FiTrendingUp className="w-5 h-5 mx-auto text-green-500 mb-1" />
                  <div className="text-lg font-bold text-gray-800">
                    {(liveStats[project.slug]?.requests || project.stats.dailyRequests).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Kunlik</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <FiClock className="w-5 h-5 mx-auto text-purple-500 mb-1" />
                  <div className="text-lg font-bold text-gray-800">{daysSinceCreation(project.createdAt)}</div>
                  <div className="text-xs text-gray-500">Kun</div>
                </div>
              </div>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tech.slice(0, 4).map((t) => (
                  <div key={t.name} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1">
                    <Image src={t.logo} alt={t.name} width={14} height={14} className="w-3.5 h-3.5" />
                    <span className="text-xs text-gray-600">{t.name}</span>
                  </div>
                ))}
                {project.tech.length > 4 && (
                  <span className="text-xs text-gray-400">+{project.tech.length - 4}</span>
                )}
              </div>

              {/* Links */}
              <div className="flex gap-2">
                {project.links.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {link.icon === 'telegram' ? <FiSend className="w-4 h-4" /> : <FiGlobe className="w-4 h-4" />}
                    {link.name}
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`bg-gradient-to-r ${selectedProject.gradient} p-8 text-white`}>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white rounded-2xl p-3 shadow-lg">
                  <Image
                    src={selectedProject.logo}
                    alt={selectedProject.name}
                    width={72}
                    height={72}
                    className="w-full h-full object-contain rounded-xl"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{selectedProject.name}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(selectedProject.status)}`}>
                      {getStatusText(selectedProject.status)}
                    </span>
                    <span className="text-white/80 text-sm flex items-center gap-1">
                      <FiCalendar className="w-4 h-4" />
                      {formatDate(selectedProject.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-6">
              {/* Purpose */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <FiTarget className="w-5 h-5 text-purple-500" />
                  Maqsadi
                </h3>
                <p className="text-gray-600 leading-relaxed">{selectedProject.purpose}</p>
              </div>

              {/* Live Stats */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <FiActivity className="w-5 h-5 text-green-500" />
                  Real-time Statistika
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                    <FiUsers className="w-8 h-8 mx-auto text-blue-500 mb-2" />
                    <div className="text-3xl font-bold text-blue-700">
                      {(liveStats[selectedProject.slug]?.users || selectedProject.stats.users).toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-600">Foydalanuvchilar</div>
                    <div className="text-xs text-blue-400 mt-1 animate-pulse">● Live</div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                    <FiTrendingUp className="w-8 h-8 mx-auto text-green-500 mb-2" />
                    <div className="text-3xl font-bold text-green-700">
                      {(liveStats[selectedProject.slug]?.requests || selectedProject.stats.dailyRequests).toLocaleString()}
                    </div>
                    <div className="text-sm text-green-600">Kunlik so'rovlar</div>
                    <div className="text-xs text-green-400 mt-1 animate-pulse">● Live</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                    <FiServer className="w-8 h-8 mx-auto text-purple-500 mb-2" />
                    <div className="text-3xl font-bold text-purple-700">{selectedProject.stats.uptime}</div>
                    <div className="text-sm text-purple-600">Uptime</div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <FiCpu className="w-5 h-5 text-orange-500" />
                  Imkoniyatlar
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {selectedProject.features.map((feature, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 text-gray-700">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-3">
                  <FiCode className="w-5 h-5 text-blue-500" />
                  Texnologiyalar
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedProject.tech.map((t) => (
                    <div key={t.name} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-xl px-4 py-2">
                      <Image src={t.logo} alt={t.name} width={24} height={24} className="w-6 h-6" />
                      <span className="font-medium text-gray-700">{t.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="flex gap-4 pt-4 border-t border-gray-100">
                {selectedProject.links.map((link) => (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all ${
                      link.icon === 'telegram' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-800 hover:bg-gray-900'
                    }`}
                  >
                    {link.icon === 'telegram' ? <FiSend className="w-5 h-5" /> : <FiGlobe className="w-5 h-5" />}
                    {link.name}
                    <FiExternalLink className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}