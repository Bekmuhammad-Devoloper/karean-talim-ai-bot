const messages = {
  welcome: (name: string) =>
    `Merhaba ${name}! 👋\n\n🇹🇷 Ben Hilal Edu türk tili markazining yordamchi assistant botiman!\n\nMetin gönderin, dilbilgisi hatalarını kontrol edeyim.`,

  help: `*Yardım* 📚\n\n📝 Metin mesajı gönderin\n🎤 Sesli mesaj gönderin\n🖼 Resim gönderin\n\n*Komutlar:*\n/start - Başlat\n/help - Yardım\n/stats - İstatistikler`,

  processing: '⏳ Kontrol ediliyor...',
  processingVoice: '🎤 Sesli mesaj işleniyor...',
  processingImage: '🖼 Resim işleniyor...',
  processingVideo: '🎬 Video işleniyor...',
  noErrors: '✅ Dilbilgisi hatası bulunamadı! Metin doğru.',

  result: (data: any) => {
    if (data.hasErrors) {
      return `📝 *Orijinal:*\n${data.original}\n\n✅ *Düzeltilmiş:*\n${data.corrected}`;
    }
    return `📝 *Metin:*\n${data.original}`;
  },

  stats: (data: any) =>
    `📊 *İstatistikler*\n\n📝 Metin: ${data.textRequests}\n🎤 Ses: ${data.voiceRequests}\n🖼 Resim: ${data.imageRequests}`,

  errorProcessing: '❌ Hata oluştu. Tekrar deneyin.',
  errorVoice: '❌ Sesli mesaj işleme hatası.',
  errorImage: '❌ Resim işleme hatası.',
  errorVideo: '❌ Video işleme hatası.',
  errorNoText: '⚠️ Resimde metin bulunamadı.',

  subscribeFirst: '📢 Kanallara abone olun:',
  checkSubscription: '✅ Aboneliği kontrol et',
  subscriptionConfirmed: '✅ Abonelik onaylandı!',
  notSubscribed: '⚠️ Henüz abone olmamışsınız!',

  adminOnly: '⛔ Bu komut yöneticiler içindir.',
  adminPanel: '*Admin Paneli*\n/admin\n/adminstats\n/broadcast [mesaj]\n/channels',

  adminStats: (data: any) =>
    `📊 *İstatistikler*\n\n👥 Kullanıcılar: ${data.totalUsers}\n📅 Bugün: ${data.todayUsers}\n✅ Aktif: ${data.activeUsers}\n📝 Toplam istek: ${data.totalRequests}`,

  noChannels: 'Zorunlu kanal yok.',
  broadcastNoText: 'Mesaj girin: /broadcast Merhaba!',
  broadcastSending: '📤 Gönderiliyor...',
  broadcastResult: (sent: number, failed: number) =>
    `✅ Gönderildi: ${sent}, ❌ Hata: ${failed}`,
};

export function t(key: string, ...args: any[]): string {
  const msg = (messages as any)[key];
  if (!msg) return key;
  if (typeof msg === 'function') return msg(...args);
  return msg;
}
