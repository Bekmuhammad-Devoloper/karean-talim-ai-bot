const messages = {
  welcome: (name: string) =>
    `안녕하세요 ${name}! 👋\n\n🇰🇷 저는 한국어 학습 도우미 봇입니다!\n\n텍스트를 보내주시면 문법 오류를 확인해 드릴게요.`,

  help: `*도움말* 📚\n\n📝 텍스트 메시지 보내기\n🎤 음성 메시지 보내기\n🖼 이미지 보내기\n\n*명령어:*\n/start - 시작\n/help - 도움말\n/stats - 통계`,

  processing: '⏳ 확인 중입니다...',
  processingVoice: '🎤 음성 메시지 처리 중...',
  processingImage: '🖼 이미지 처리 중...',
  processingVideo: '🎬 비디오 처리 중...',
  noErrors: '✅ 문법 오류가 없습니다! 텍스트가 정확합니다.',

  result: (data: any) => {
    if (data.hasErrors) {
      return `📝 *원본:*\n${data.original}\n\n✅ *수정됨:*\n${data.corrected}`;
    }
    return `📝 *텍스트:*\n${data.original}`;
  },

  stats: (data: any) =>
    `📊 *통계*\n\n📝 텍스트: ${data.textRequests}\n🎤 음성: ${data.voiceRequests}\n🖼 이미지: ${data.imageRequests}`,

  errorProcessing: '❌ 오류가 발생했습니다. 다시 시도해 주세요.',
  errorVoice: '❌ 음성 메시지 처리 오류.',
  errorImage: '❌ 이미지 처리 오류.',
  errorVideo: '❌ 비디오 처리 오류.',
  errorNoText: '⚠️ 이미지에서 텍스트를 찾을 수 없습니다.',

  subscribeFirst: '📢 채널을 구독해 주세요:',
  checkSubscription: '✅ 구독 확인',
  subscriptionConfirmed: '✅ 구독이 확인되었습니다!',
  notSubscribed: '⚠️ 아직 구독하지 않았습니다!',

  adminOnly: '⛔ 이 명령어는 관리자 전용입니다.',
  adminPanel: '*관리자 패널*\n/admin\n/adminstats\n/broadcast [메시지]\n/channels',

  adminStats: (data: any) =>
    `📊 *통계*\n\n👥 사용자: ${data.totalUsers}\n📅 오늘: ${data.todayUsers}\n✅ 활성: ${data.activeUsers}\n📝 총 요청: ${data.totalRequests}`,

  noChannels: '필수 채널이 없습니다.',
  broadcastNoText: '메시지를 입력하세요: /broadcast 안녕하세요!',
  broadcastSending: '📤 전송 중...',
  broadcastResult: (sent: number, failed: number) =>
    `✅ 전송됨: ${sent}, ❌ 오류: ${failed}`,
};

export function t(key: string, ...args: any[]): string {
  const msg = (messages as any)[key];
  if (!msg) return key;
  if (typeof msg === 'function') return msg(...args);
  return msg;
}
