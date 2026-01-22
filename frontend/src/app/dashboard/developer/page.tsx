'use client';

import { FiGithub, FiInstagram, FiSend, FiGlobe, FiCode, FiExternalLink, FiLayers, FiServer } from 'react-icons/fi';

const skills = [
  { name: 'TypeScript', level: 95, color: 'from-blue-500 to-blue-600' },
  { name: 'JavaScript', level: 93, color: 'from-yellow-400 to-yellow-500' },
  { name: 'React / Next.js', level: 92, color: 'from-cyan-500 to-cyan-600' },
  { name: 'Node.js / NestJS', level: 90, color: 'from-green-500 to-green-600' },
  { name: 'Express.js', level: 88, color: 'from-gray-600 to-gray-700' },
  { name: 'PostgreSQL / MongoDB', level: 88, color: 'from-purple-500 to-purple-600' },
  { name: 'Telegram Bot API', level: 95, color: 'from-blue-400 to-blue-500' },
  { name: 'Docker / DevOps', level: 80, color: 'from-indigo-500 to-indigo-600' },
  { name: 'AI / Machine Learning', level: 75, color: 'from-pink-500 to-pink-600' },
];

const projects = [
  {
    name: 'Hilal AI Bot',
    description: 'Grammatik xatolarni tekshiruvchi AI bot. Matn, rasm va audio orqali xatolarni topadi.',
    tech: [
      { name: 'NestJS', logo: '/tech/nestjs.svg' },
      { name: 'Gemini AI', logo: '/tech/gemini.svg' },
      { name: 'PostgreSQL', logo: '/tech/postgresql.svg' },
      { name: 'TypeScript', logo: '/tech/typescript.svg' },
    ],
    logo: '/Hilal Edu - logo-2.png',
    color: 'from-emerald-500 to-teal-600',
    links: [
      { name: 'Telegram Bot', url: 'https://t.me/hilal_ai_bot' },
    ],
  },
  {
    name: 'Bilimdon AI',
    description: '🧠 AI bilan interaktiv testlar, 📊 Natijalar va leaderboard, 🏆 Yutuqlar tizimi, 💡 AI maslahatlar',
    tech: [
      { name: 'Gemini AI', logo: '/tech/gemini.svg' },
      { name: 'NestJS', logo: '/tech/nestjs.svg' },
      { name: 'PostgreSQL', logo: '/tech/postgresql.svg' },
      { name: 'React', logo: '/tech/react.svg' },
      { name: 'Next.js', logo: '/tech/nextjs.svg' },
    ],
    logo: '/bilimdonai.jpg',
    color: 'from-violet-500 to-purple-600',
    links: [
      { name: 'Telegram Bot', url: 'https://t.me/Bilimdon_aibot' },
      { name: 'Website', url: 'https://bilimdon-ai.uz' },
    ],
  },
  {
    name: 'Orfan.uz',
    description: "O'zbekistonda nodir (orfan) kasalliklar bilan og'rigan bemorlarni markazlashgan holda ro'yxatga olish, kuzatib borish va statistik tahlil qilish platformasi.",
    tech: [
      { name: 'React', logo: '/tech/react.svg' },
      { name: 'Next.js', logo: '/tech/nextjs.svg' },
      { name: 'Express', logo: '/tech/express.svg' },
      { name: 'MongoDB', logo: '/tech/mongodb.svg' },
    ],
    logo: '/orfan-logo.svg',
    color: 'from-rose-500 to-pink-600',
    links: [
      { name: 'Website', url: 'https://orfan.uz' },
    ],
  },
];

const technologies = [
  { name: 'React', logo: '/tech/react.svg', color: 'bg-cyan-50 hover:bg-cyan-100' },
  { name: 'Next.js', logo: '/tech/nextjs.svg', color: 'bg-gray-50 hover:bg-gray-100' },
  { name: 'NestJS', logo: '/tech/nestjs.svg', color: 'bg-red-50 hover:bg-red-100' },
  { name: 'Node.js', logo: '/tech/nodejs.svg', color: 'bg-green-50 hover:bg-green-100' },
  { name: 'TypeScript', logo: '/tech/typescript.svg', color: 'bg-blue-50 hover:bg-blue-100' },
  { name: 'PostgreSQL', logo: '/tech/postgresql.svg', color: 'bg-indigo-50 hover:bg-indigo-100' },
  { name: 'MongoDB', logo: '/tech/mongodb.svg', color: 'bg-green-50 hover:bg-green-100' },
  { name: 'Express', logo: '/tech/express.svg', color: 'bg-gray-50 hover:bg-gray-100' },
  { name: 'Gemini AI', logo: '/tech/gemini.svg', color: 'bg-blue-50 hover:bg-blue-100' },
  { name: 'Docker', logo: '/tech/docker.svg', color: 'bg-cyan-50 hover:bg-cyan-100' },
  { name: 'Git', logo: '/tech/git.svg', color: 'bg-orange-50 hover:bg-orange-100' },
  { name: 'Telegram', logo: '/tech/telegram.svg', color: 'bg-blue-50 hover:bg-blue-100' },
];

const socialLinks = [
  {
    name: 'Telegram',
    url: 'https://t.me/Shokirjonov_online',
    icon: FiSend,
    color: 'bg-blue-500 hover:bg-blue-600',
    username: '@Shokirjonov_online',
  },
  {
    name: 'Instagram',
    url: 'https://www.instagram.com/shokirjonov__online/',
    icon: FiInstagram,
    color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600',
    username: '@shokirjonov__online',
  },
  {
    name: 'GitHub',
    url: 'https://github.com/Bekmuhammad-Devoloper',
    icon: FiGithub,
    color: 'bg-gray-800 hover:bg-gray-900',
    username: 'Bekmuhammad-Devoloper',
  },
  {
    name: 'Portfolio',
    url: 'https://bekmuhammad.uz',
    icon: FiGlobe,
    color: 'bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600',
    username: 'bekmuhammad.uz',
  },
];

export default function DeveloperPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-8">
          {/* Profile Image */}
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-white/20 backdrop-blur-xl p-2">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center overflow-hidden">
                <img
                  src="/dev.profile.jpg"
                  alt="Developer"
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%234F46E5" width="100" height="100"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="white">BK</text></svg>';
                  }}
                />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
              <span className="text-xl">✓</span>
            </div>
          </div>

          {/* Info */}
          <div className="text-center md:text-left flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Bekmuhammad Shokirjonov</h1>
            <p className="text-xl text-white/80 mb-4">Full Stack Developer & AI Enthusiast</p>
            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-xl">🚀 6+ oy tajriba</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-xl">💼 10+ loyihalar</span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-xl">🌍 O'zbekiston</span>
            </div>
          </div>

          {/* Bot Logo */}
          <div className="absolute top-4 right-4 md:relative md:top-0 md:right-0">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-xl rounded-2xl p-2 flex items-center justify-center">
              <img
                src="/Hilal Edu - logo-2.png"
                alt="Bot Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%2310B981" width="100" height="100" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="50" fill="white">🤖</text></svg>';
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {socialLinks.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${link.color} text-white rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-105 hover:shadow-xl`}
          >
            <link.icon className="h-8 w-8" />
            <div>
              <p className="font-bold">{link.name}</p>
              <p className="text-sm opacity-80">{link.username}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Projects */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
            <FiServer className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Loyihalar</h2>
        </div>

        <div className="grid gap-6">
          {projects.map((project) => (
            <div
              key={project.name}
              className={`bg-gradient-to-br ${project.color} rounded-2xl p-6 text-white relative overflow-hidden`}
            >
              <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
                <img
                  src={project.logo}
                  alt={project.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              
              <div className="relative flex flex-col md:flex-row gap-6">
                {/* Project Logo */}
                <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl p-3 flex-shrink-0">
                  <img
                    src={project.logo}
                    alt={project.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="white" fill-opacity="0.2" width="100" height="100" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="white">📦</text></svg>';
                    }}
                  />
                </div>

                {/* Project Info */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{project.name}</h3>
                  <p className="text-white/90 mb-4">{project.description}</p>
                  
                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tech.map((tech) => (
                      <div
                        key={tech.name}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-full"
                      >
                        <img
                          src={tech.logo}
                          alt={tech.name}
                          className="w-4 h-4"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span className="text-sm font-medium">{tech.name}</span>
                      </div>
                    ))}
                  </div>

                  {/* Links */}
                  {project.links.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {project.links.map((link) => (
                        <a
                          key={link.name}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded-xl font-medium hover:shadow-lg transition-all hover:scale-105"
                        >
                          <FiExternalLink className="h-4 w-4" />
                          {link.name}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl text-white">
            <FiCode className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Ko'nikmalar</h2>
        </div>

        <div className="grid gap-4">
          {skills.map((skill) => (
            <div key={skill.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">{skill.name}</span>
                <span className="text-sm text-gray-500">{skill.level}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${skill.color} rounded-full transition-all duration-1000`}
                  style={{ width: `${skill.level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technologies */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl text-white">
            <FiLayers className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Texnologiyalar</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className={`${tech.color} rounded-2xl p-4 text-center hover:scale-105 transition-all cursor-default flex flex-col items-center gap-2`}
            >
              <img
                src={tech.logo}
                alt={tech.name}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23E5E7EB" width="100" height="100" rx="20"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="40" fill="%239CA3AF">?</text></svg>';
                }}
              />
              <p className="font-medium text-sm text-gray-700">{tech.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Loyiha buyurtma qilmoqchimisiz?</h2>
        <p className="text-gray-300 mb-6">Men bilan bog'laning - g'oyangizni haqiqatga aylantiramiz!</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="https://t.me/Khamidov_online"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <FiSend className="h-5 w-5" />
            Telegram orqali yozish
          </a>
          <a
            href="https://bekmuhammad.uz"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium flex items-center gap-2 transition-colors"
          >
            <FiGlobe className="h-5 w-5" />
            Portfolio ko'rish
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-gray-500 text-sm">
        <p>© 2024-2026 Hilal AI Bot. Barcha huquqlar himoyalangan.</p>
        <p className="mt-1">Developed with ❤️ by <a href="https://bekmuhammad.uz" className="text-primary-600 hover:underline">Bekmuhammad Khamidov</a></p>
      </div>
    </div>
  );
}
