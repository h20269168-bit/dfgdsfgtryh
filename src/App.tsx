import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeDiary, AnalysisResult } from './services/geminiService';
import { SubtleClickEffect } from './components/ClickEffect';
import ReactMarkdown from 'react-markdown';
import { 
  Music,
  ArrowRight,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Layers,
  Wind,
  Gift,
  Tag,
  Palette,
  Info,
  CircleCheck,
  ChevronRight,
  Heart,
  XCircle,
  Zap,
  Dna
} from 'lucide-react';

type AppState = 
  | 'INTRO'
  | 'MUSIC' 
  | 'JOURNAL' 
  | 'ANALYSING' 
  | 'MOOD_RESULT' 
  | 'PERSONAL_COLOR_START' 
  | 'PERSONAL_COLOR_SELECTOR'
  | 'PERSONAL_COLOR_DIAGNOSIS'
  | 'PC_RESULT'
  | 'CUSTOM_INPUT' 
  | 'FINAL_LOADING'
  | 'FINAL_RESULT' 
  | 'FEEDBACK'
  | 'EXTRA_SCENT'
  | 'EXTRA_COLOR'
  | 'EXTRA_FATE'
  | 'ENDING'
  | 'RE_ANALYSIS_INPUT';

const GoldDust = ({ onComplete }: { onComplete: () => void }) => {
  const [particles] = useState(() => 
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      tx: (Math.random() - 0.5) * 800,
      ty: (Math.random() - 0.5) * 800,
      delay: Math.random() * 0.5,
    }))
  );

  useEffect(() => {
    const timer = setTimeout(onComplete, 1800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="gold-dust-particle"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            x: p.tx, 
            y: p.ty, 
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0] 
          }}
          transition={{ 
            duration: 1.5, 
            delay: p.delay,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
};

const PC_TYPES = [
  { id: 'spring_light', label: '봄 웜 라이트', desc: '화사하고 생기 넘치는 에너지. 맑고 투명한 피부톤에 적합.', color: '#FFD1DC' },
  { id: 'spring_bright', label: '봄 웜 브라이트', desc: '선명하고 통통 튀는 고채도 컬러. 활기찬 에너지.', color: '#FF4500' },
  { id: 'summer_light', label: '여름 쿨 라이트', desc: '청량이 깨끗한 투명함. 뽀얗고 푸른빛이 도는 피부에 최적.', color: '#D0E1F9' },
  { id: 'summer_mute', label: '여름 쿨 뮤트', desc: '부드럽고 차분한 그레이쉬 무드. 지적이고 우아함.', color: '#B0C4DE' },
  { id: 'autumn_mute', label: '가을 웜 뮤트', desc: '차분하고 내추럴한 어스 톤. 포근하고 자연스러운 무드.', color: '#C8A2C8' },
  { id: 'autumn_deep', label: '가을 웜 딥', desc: '깊고 풍부한 우아함. 성숙하고 고급스러운 분위기.', color: '#8B4513' },
  { id: 'winter_bright', label: '겨울 쿨 브라이트', desc: '대비가 선명한 도회적인 이미지. 카리스마 넘치는 선명함.', color: '#0000FF' },
  { id: 'winter_deep', label: '겨울 쿨 딥', desc: '압도적인 농도의 딥 무드. 짙고 강렬한 존재감.', color: '#4B0082' },
];

const DIAGNOSIS_SCENES = [
  // WARM vs COOL (8 questions)
  { q: '본인의 피부 톤이 어느 쪽에 더 가깝나요?', palettes: [{ c: '#FFE4E1', l: 'WARM', type: 'W' }, { c: '#F0F8FF', l: 'COOL', type: 'C' }] },
  { q: '강한 햇빛 아래 피부가 어떻게 변하나요?', palettes: [{ c: '#E6BC5C', l: '붉게 달아오르고 쉽게 탄다 (WARM)', type: 'W' }, { c: '#D473D4', l: '금방 붉게 변하고 타지 않는다 (COOL)', type: 'C' }] },
  { q: '어떤 액세서리가 더 생기를 주나요?', palettes: [{ c: '#FFD700', l: '골드 (GOLD)', type: 'W' }, { c: '#C0C0C0', l: '실버 (SILVER)', type: 'C' }] },
  { q: '어울리는 흰색은 무엇인가요?', palettes: [{ c: '#F5F5DC', l: '아이보리/크림 (WARM)', type: 'W' }, { c: '#FFFFFF', l: '순백색/화이트 (COOL)', type: 'C' }] },
  { q: '가장 잘 어울리는 립 컬러는?', palettes: [{ c: '#FF7F50', l: '코랄 (CORAL)', type: 'W' }, { c: '#FF69B4', l: '핑크 (PINK)', type: 'C' }] },
  { q: '본래의 머리카락 색상은?', palettes: [{ c: '#4B3621', l: '갈색빛이 도는 브라운 (WARM)', type: 'W' }, { c: '#1A1A1A', l: '푸른빛이 감도는 블랙 (COOL)', type: 'C' }] },
  { q: '눈동자의 색상은 어느 쪽인가요?', palettes: [{ c: '#8B4513', l: '밝은 갈색 (WARM)', type: 'W' }, { c: '#2F4F4F', l: '어둡고 짙은 검은색 (COOL)', type: 'C' }] },
  { q: '전체적인 인상은 어떤가요?', palettes: [{ c: '#F4A460', l: '부드럽고 따뜻한 (WARM)', type: 'W' }, { c: '#708090', l: '차갑고 지적인 (COOL)', type: 'C' }] },
  
  // LIGHT vs DEEP (4 questions)
  { q: '어떤 명도의 옷이 더 잘 받나요?', palettes: [{ c: '#FFFFFF', l: '밝고 연한 톤 (LIGHT)', type: 'L' }, { c: '#333333', l: '어둡고 짙은 톤 (DEEP)', type: 'D' }] },
  { q: '이목구비의 대비감이 어떤가요?', palettes: [{ c: '#E0E0E0', l: '흐릿하고 부드러움 (LIGHT)', type: 'L' }, { c: '#000000', l: '뚜렷하고 선명함 (DEEP)', type: 'D' }] },
  { q: '선호하는 스타일은?', palettes: [{ c: '#FFF0F5', l: '화사하고 맑은 분위기 (LIGHT)', type: 'L' }, { c: '#2C3E50', l: '중후하고 카리스마 있는 (DEEP)', type: 'D' }] },
  { q: '주변에서 주로 받는 칭찬은?', palettes: [{ c: '#FFB6C1', l: '밝고 깨끗하다 (LIGHT)', type: 'L' }, { c: '#191970', l: '세련되고 깊이가 있다 (DEEP)', type: 'D' }] },
];

const MOCK_WEATHER = { 
  today: { temp: 21, status: '맑음 (CLEAR)' },
  tomorrow: { temp: 23, status: '구름 (CLOUDY)' },
  date: '2026.04.24' 
};

const MUSIC_GENRES = [
  { label: 'Ballad(발라드)', query: '감성 발라드' },
  { label: 'K-Pop(케이팝)', query: '케이팝' },
  { label: 'Jazz(재즈)', query: '재즈' },
  { label: 'Hiphop(힙합)', query: '힙합' },
  { label: 'R&B(알앤비)', query: '알앤비' },
  { label: 'Classic(클래식)', query: '클래식' }
];

const playThud = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    gain.gain.setValueAtTime(0.2, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioContext.destination);
    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
  } catch (e) {}
};

export default function App() {
  const [state, setState] = useState<AppState>('INTRO');
  const [isFlashing, setIsFlashing] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [diary, setDiary] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  
  const [personalColor, setPersonalColor] = useState('');
  const [diagnosisStep, setDiagnosisStep] = useState(0);
  const [scores, setScores] = useState({ W: 0, C: 0, L: 0, D: 0 });
  
  const [customTop, setCustomTop] = useState('');
  const [customBottom, setCustomBottom] = useState('');
  const [customShoes, setCustomShoes] = useState('');
  const [customJewelry, setCustomJewelry] = useState('');
  const [reAnalysisOpinion, setReAnalysisOpinion] = useState('');
  
  const [showScentConfirm, setShowScentConfirm] = useState(false);
  const [showColorConfirm, setShowColorConfirm] = useState(false);
  const [showFateConfirm, setShowFateConfirm] = useState(false);

  const triggerFlash = (nextState: AppState, duration = 1500) => {
    setIsFlashing(true);
    setIsExploding(true);
    playThud();
    setTimeout(() => {
      setState(nextState);
    }, duration / 2);
    setTimeout(() => {
      setIsFlashing(false);
    }, duration);
  };

  const startAnalysis = async (reAnalyze = false) => {
    const finalDiary = reAnalyze ? reAnalysisOpinion : diary;
    
    if (!finalDiary.trim()) {
      alert("다시 입력해 주세요. (Please enter your feelings.)");
      return;
    }

    setState('ANALYSING');
    const weatherStr = `${MOCK_WEATHER.today.status} / ${MOCK_WEATHER.today.temp}°C`;
    const userChoices = {
      top: customTop,
      bottom: customBottom,
      shoes: customShoes,
      jewelry: customJewelry
    };

    const analysisStartTime = Date.now();
    
    const transitionAfterMinTime = (data: AnalysisResult | null) => {
      const elapsedTime = Date.now() - analysisStartTime;
      const remainingTime = Math.max(0, 1500 - elapsedTime);
      
      setTimeout(() => {
        if (data) {
          setResult(data);
        } else {
          // Hardened Random Fallback
          const fallbackOptions = [
            {
              moodEmoji: '✨',
              moodText: '고요',
              moodGuide: '기분전환을 위해 화사한 코디를 추천합니다.',
              analysisSummary: '당신은 쉽게 정의 내릴 수 없는 오라를 지니고 있습니다. 그 복잡한 심연을 감싸줄 수 있는 미니멀한 무드를 제안합니다.',
              styleKeywords: ['미니멀(Minimal)', '아카이브(Archive)', '클래식(Classic)', '스트릿(Street)'],
              scent: { title: '조말론 블랙베리 앤 베이', description: '생기 넘치는 블랙베리 향과 신선한 월계수 잎의 향이 조화를 이룹니다.', benefit: '심리적 안정과 자신감을 선사합니다.' },
              color: { name: '에메랄드 그린', hex: '#004D40', benefit: '정서적 균형', effect: '평온함' },
              fate: { item: '은색 나침반', imageEffect: '세련되고 지적인 이미지' },
              extractedWord: '심연',
              recommendedOutfit: { top: '해체주의적 블랙 블레이저', bottom: '와이드 카고 조거 팬츠', shoes: '청키한 컴뱃 부츠', jewelry: '볼드한 실버 초커' }
            }
          ];
          const rnd = Math.floor(Math.random() * fallbackOptions.length);
          setResult(fallbackOptions[rnd] as any);
        }
        setState('MOOD_RESULT');
      }, remainingTime);
    };

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT')), 8000)
      );
      
      const analysisPromise = analyzeDiary(finalDiary, weatherStr, personalColor, userChoices);
      
      const data = await Promise.race([analysisPromise, timeoutPromise]) as AnalysisResult;
      transitionAfterMinTime(data);
    } catch (e) {
      console.error('Analysis failed or timed out, using fallback:', e);
      transitionAfterMinTime(null);
    }
  };

  const handleStateChange = (nextState: AppState) => {
    playThud();
    setState(nextState);
  };

  const openSearch = (keyword: string, engine: 'naver' | 'google') => {
    playThud();
    const baseKeyword = keyword.split('(')[0].trim();
    const url = engine === 'naver'
      ? `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(baseKeyword + ' 코디')}`
      : `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(baseKeyword + ' 코디')}`;
    window.open(url, '_blank');
  };

  const handleFinalCheck = () => {
    setState('FINAL_LOADING');
    setTimeout(() => {
        triggerFlash('FINAL_RESULT');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-brand-black text-off-white font-sans relative overflow-x-hidden">
      <div className="aurora-bg">
        <div className="aurora-layer" />
      </div>

      <SubtleClickEffect />

      <AnimatePresence>
        {isFlashing && (
          <motion.div
            key="flash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.75 }}
            className="flash-screen"
          />
        )}
        {isExploding && (
          <GoldDust onComplete={() => setIsExploding(false)} />
        )}
      </AnimatePresence>

      <div className="max-w-[1440px] mx-auto px-8 md:px-16 py-12 flex flex-col min-h-screen relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 pb-4 border-b border-white/5 gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl font-black italic gold-text tracking-tighter cursor-pointer" onClick={() => window.location.reload()}>KODE</h1>
            <span className="text-brand-gold font-bold tracking-widest text-[7px] mt-1 animate-pulse italic uppercase">당신의 매일(Daily) 숨겨진 감정(Emotion)을 풀어내는 열쇠(Key)</span>
          </div>
          <div className="text-[9px] font-black tracking-[0.3em] text-slate-grey uppercase font-mono">
            CORE_V2 // {MOCK_WEATHER.date}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {state === 'INTRO' && (
            <motion.main key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center gap-8">
               <div className="space-y-2">
                  <motion.h1 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="text-[60px] md:text-[80px] font-black italic gold-text tracking-tighter leading-[0.8] mb-4 shining-gold"
                  >
                    KODE
                  </motion.h1>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="space-y-6"
                  >
                    <div className="space-y-6 max-w-4xl mx-auto px-4">
                      <h2 className="text-xl md:text-3xl font-bold gold-text tracking-tighter">
                        KODE: 당신의 매일(Daily) 숨겨진 감정(Emotion)을 풀어내는 열쇠(Key)
                      </h2>
                      <p className="text-[10px] md:text-xs font-serif gold-text/60 -mt-4">(The Key to Unlocking Your Daily Emotions.)</p>
                      
                      <p className="text-sm md:text-lg text-off-white/90 leading-relaxed max-w-2xl mx-auto font-serif italic">
                        "복잡한 옷장 앞에서 길을 잃은 당신을 위해, KODE가 오늘의 감정과 본연의 색을 연결합니다. 단 몇 분의 기록으로 당신의 숨겨진 페르소나를 깨워보세요. 지금 바로 시작합니다."
                      </p>

                      <div className="h-[1px] w-12 bg-brand-gold/30 mx-auto" />
                    </div>
                  </motion.div>
               </div>
               
               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 1 }}
                 className="mt-6 flex flex-col items-center gap-4"
               >
                 <button onClick={() => triggerFlash('MUSIC')} className="btn-gold !px-16 !py-6 text-xl group relative overflow-hidden">
                    START THE JOURNEY
                    <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-brand-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-700" />
                 </button>
               </motion.div>
            </motion.main>
          )}

          {state === 'MUSIC' && (
            <motion.main key="music" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-4 text-center">
              <div className="mb-10 space-y-4">
                <span className="text-brand-gold font-black tracking-[0.5em] text-[10px] uppercase mb-1 block">Step 01 // SOUND</span>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-[0.9] gold-text">Soundtrack</h2>
                <div className="space-y-3">
                  <p className="text-brand-gold font-bold tracking-[0.1em] text-xs uppercase">"소리로 감각을 깨우고," (Waking up the senses with sound)</p>
                  <p className="text-brand-gold font-serif italic text-base leading-relaxed max-w-2xl mx-auto opacity-80">
                    "음악은 감정의 주파수를 맞추는 가장 섬세한 도구입니다. 선율과 함께 기록된 일기는 당신의 본질(Core)을 더 선명하게 투영하여, 가장 완벽한 형상을 빚어내도록 돕습니다."
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {MUSIC_GENRES.map((g) => (
                  <button key={g.label} onClick={() => { window.open(`https://www.youtube.com/results?search_query=${g.query}+플레이리스트`); handleStateChange('JOURNAL'); }} className="minimal-card flex flex-col items-center gap-4 py-8 group">
                    <Music className="w-5 h-5 text-brand-gold group-hover:scale-125 transition-transform" />
                    <span className="text-xl font-black italic tracking-tighter uppercase">{g.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-8 p-6 bg-brand-gold/10 border border-brand-gold/20 rounded-lg">
                <p className="text-white font-black italic tracking-[0.05em] text-lg md:text-xl uppercase animate-pulse leading-relaxed">
                   "유튜브로 연결됩니다. 원하는 음악을 직접 재생하신 후,<br/>그 음악과 함께 다시 이곳으로 돌아와 주시길 바랍니다."
                </p>
              </div>
            </motion.main>
          )}

          {state === 'JOURNAL' && (
            <motion.main key="journal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col py-4">
              <div className="mb-8">
                <span className="text-brand-gold font-black tracking-[0.5em] text-[10px] uppercase mb-2 block">Step 02 // LOG</span>
                <h2 className="text-5xl font-black italic tracking-tighter uppercase gold-text leading-tight">"글로 마음을 정돈하며,"</h2>
                <p className="text-slate-grey text-xs font-bold tracking-[0.2em] uppercase mt-2">오늘의 기내와 감정, 무드를 상세히 기록해 주세요. (Organizing the mind with writing)</p>
              </div>
              <textarea
                value={diary}
                onChange={(e) => setDiary(e.target.value)}
                placeholder="감정과 순간을 가감 없이 기록해 주세요..."
                className="flex-1 w-full bg-transparent border-none outline-none text-3xl md:text-4xl font-serif font-light italic leading-snug placeholder:text-white/5 resize-none py-6"
                autoFocus
              />
              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <Info className="w-4 h-4 text-brand-gold" />
                  <p className="text-brand-gold font-bold text-[10px] tracking-widest uppercase opacity-70">
                    "기록의 깊이가 당신의 페르소나를 더욱 선명하게 만듭니다."
                  </p>
                </div>
                <div className="bg-white/[0.03] p-4 border-l-2 border-brand-gold italic text-brand-gold-bright opacity-100 text-sm shadow-xl">
                   "예시) 오늘의 기분은 우울해요. 기분전환을 위해 화사하고 밝은 코디를 입고 싶어요."
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => startAnalysis()} className="btn-gold !py-6 !px-16 text-lg flex items-center gap-3">
                  DECODE IDENTITY <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </motion.main>
          )}

          {state === 'ANALYSING' && (
            <motion.main key="analysing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center">
              <div className="rotating-particles flex items-center justify-center mb-16">
                 {Array.from({ length: 12 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="dot h-4 w-4 bg-brand-gold shadow-[0_0_10px_#C5A059]" 
                      style={{ 
                        transform: `rotate(${i * 30}deg) translateY(-80px)`,
                        opacity: 1 - (i * 0.08)
                      }} 
                    />
                 ))}
              </div>
              <h2 className="text-5xl font-black italic tracking-tighter gold-text uppercase text-center leading-tight">
                KODE가 당신의 내면을 읽어냈습니다...<br/>
                <span className="text-slate-grey text-xl block mt-6 font-bold uppercase tracking-[0.3em] opacity-60 italic">"매순간의 감정을 페르소나로 전환하는 중입니다."</span>
              </h2>
            </motion.main>
          )}

          {state === 'MOOD_RESULT' && result && (
            <motion.main key="mood" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto w-full text-center py-6 scale-[0.9] origin-center">
              <span className="text-8xl mb-2 block drop-shadow-2xl">{result.moodEmoji}</span>
              <h3 className="secondary-text text-brand-gold mb-2 italic tracking-widest text-sm uppercase opacity-80">"오늘 당신을 스친 감정은 [{result.moodText}]이군요."</h3>
              <p className="text-brand-gold/80 text-[10px] mb-4 italic">{result.moodGuide || ''}</p>
              <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter gold-text uppercase mb-6">"{result.moodText}"</h2>
              
              <div className="bg-white/[0.02] border border-white/5 p-8 mb-12 backdrop-blur-xl relative text-left md:text-center">
                 <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-brand-gold/30" />
                 <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-brand-gold/30" />
                 <div className="text-xl md:text-2xl font-serif italic text-off-white leading-relaxed">
                    <ReactMarkdown>
                      {`"${result.analysisSummary}"`}
                    </ReactMarkdown>
                 </div>
              </div>

              <div className="w-full">
                 <div className="flex flex-wrap justify-center gap-12">
                    {result.styleKeywords.map(k => (
                      <div key={k} className="flex flex-col gap-3">
                         <div className="flex flex-col gap-1">
                            <span className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase gold-text">{k.split('(')[0].trim()}</span>
                            <span className="text-base text-brand-gold/60 font-bold tracking-widest">{k.match(/\(([^)]+)\)/)?.[1] || ''}</span>
                         </div>
                         <div className="flex gap-2 justify-center">
                            <button onClick={() => openSearch(k, 'naver')} className="px-5 py-2 bg-off-white text-brand-black font-black text-[11px] uppercase hover:bg-brand-gold transition-colors">NAVER</button>
                            <button onClick={() => openSearch(k, 'google')} className="px-5 py-2 border border-off-white/20 font-black text-[11px] uppercase hover:border-brand-gold transition-all">GOOGLE</button>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="mt-12 p-4 border-y border-brand-gold/20">
                <p className="text-brand-gold font-black italic tracking-[0.2em] text-[10px] uppercase opacity-60">
                   "원하는 스타일을 충분히 탐색하신 후, NEXT 버튼을 눌러주세요."
                </p>
              </div>

              <button onClick={() => triggerFlash('PERSONAL_COLOR_START')} className="btn-gold mt-10 !px-16 !py-5 text-lg">NEXT STEP <ArrowRight className="inline ml-2 w-5 h-5" /></button>
            </motion.main>
          )}

          {state === 'PERSONAL_COLOR_START' && (
            <motion.main key="pc_start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-16 text-center px-6">
               <Palette className="w-40 h-40 text-brand-gold animate-pulse mb-8" />
               <div className="space-y-6">
                <span className="text-brand-gold font-black tracking-[0.5em] text-xs uppercase mb-2 block">Step 03 // SPECTRUM</span>
                <h2 className="text-4xl md:text-6xl font-black italic tracking-tighter gold-text uppercase leading-tight px-4">"본인의 퍼스널 컬러를 아시나요?"</h2>
                <p className="text-lg md:text-xl text-slate-grey font-serif italic">(Do you know your Personal Color?)</p>
               </div>
               <div className="flex flex-col md:flex-row gap-8 md:gap-12 w-full justify-center">
                  <button onClick={() => triggerFlash('PERSONAL_COLOR_SELECTOR')} className="btn-gold !px-24 text-xl">YES</button>
                  <button onClick={() => { setDiagnosisStep(0); setScores({W:0,C:0,L:0,D:0}); triggerFlash('PERSONAL_COLOR_DIAGNOSIS'); }} className="btn-gold !px-24 text-xl !bg-white/5 !border-white/10 !text-slate-grey">NO</button>
               </div>
            </motion.main>
          )}

          {state === 'PERSONAL_COLOR_SELECTOR' && (
            <motion.main key="pc_selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center gap-10 py-6">
               <div className="text-center">
                 <h2 className="text-4xl font-black italic tracking-tighter gold-text uppercase">Select Your Code</h2>
                 <p className="text-slate-grey font-bold tracking-widest mt-1 text-sm">본인의 상세 톤을 선택해 주세요.</p>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto w-full">
                 {PC_TYPES.map(type => (
                   <motion.button 
                    key={type.id} 
                    onClick={() => { setPersonalColor(type.label); triggerFlash('CUSTOM_INPUT'); }}
                    className="relative p-6 border border-white/10 flex flex-col items-center justify-center gap-2 group overflow-hidden transition-all hover:border-brand-gold min-h-[160px]"
                   >
                     <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 pointer-events-none" style={{ backgroundColor: type.color }} />
                     <div className="relative z-10 text-center">
                        <span className="text-xl font-black italic tracking-tighter uppercase block group-hover:text-brand-black transition-colors">{type.label}</span>
                        <div className="w-6 h-[1.5px] bg-brand-gold mx-auto my-2 group-hover:bg-brand-black transition-colors" />
                        <p className="text-[9px] text-slate-grey font-bold uppercase tracking-wider group-hover:text-brand-black/80">{type.desc}</p>
                     </div>
                   </motion.button>
                 ))}
               </div>
               <div className="flex justify-center">
                <button onClick={() => { setDiagnosisStep(0); triggerFlash('PERSONAL_COLOR_DIAGNOSIS'); }} className="text-brand-gold font-black italic border-b border-brand-gold/30 pb-1 hover:border-brand-gold transition-all uppercase tracking-widest text-xs">다시 진단 받고 싶어요 (Re-Diagnosis)</button>
               </div>
            </motion.main>
          )}

          {state === 'PERSONAL_COLOR_DIAGNOSIS' && (
            <motion.main key="pc_diag" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-12 md:gap-20">
               <div className="text-center space-y-6 px-6">
                 <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter gold-text uppercase">Self Diagnosis<br/><span className="text-base md:text-lg text-slate-grey font-bold italic tracking-widest non-italic">Step {diagnosisStep + 1} / 12</span></h2>
                 <p className="text-off-white/80 font-serif italic text-xl md:text-3xl leading-relaxed py-4 border-y border-white/5 mx-auto max-w-3xl">"{DIAGNOSIS_SCENES[diagnosisStep].q}"</p>
                 <div className="bg-black/60 backdrop-blur-md px-6 py-2 inline-block rounded-full border border-brand-gold/20">
                    <p className="text-[10px] md:text-[12px] text-brand-gold font-bold uppercase tracking-[0.4em] animate-pulse">"직접 손을 갖다 대어 어울리는 컬러를 선택해주세요."</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-12 w-full max-w-4xl h-[40vh]">
                 {DIAGNOSIS_SCENES[diagnosisStep].palettes.map((p, idx) => (
                   <motion.button
                     key={idx}
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => {
                        const type = (p as any).type;
                        setScores(prev => ({ ...prev, [type]: prev[type as keyof typeof prev] + 1 }));

                        const nextStep = diagnosisStep + 1;
                        if (nextStep < 12) {
                          setDiagnosisStep(nextStep);
                        } else {
                          // Final calculation logic
                            setScores(current => {
                              const isWarm = current.W >= current.C;
                              const isLight = current.L >= current.D;
                              
                              let res = '';
                              if (isWarm) {
                                if (isLight) res = current.L >= 3 ? '봄 웜 라이트' : '봄 웜 브라이트';
                                else res = current.D >= 3 ? '가을 웜 딥' : '가을 웜 뮤트';
                              } else {
                                if (isLight) res = current.L >= 3 ? '여름 쿨 라이트' : '여름 쿨 뮤트';
                                else res = current.D >= 3 ? '겨울 쿨 딥' : '겨울 쿨 브라이트';
                              }
                              
                              setPersonalColor(res);
                              triggerFlash('PC_RESULT');
                              return current;
                            });
                        }
                     }}
                     className="w-full h-full rounded-2xl border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-4 group relative overflow-hidden"
                     style={{ backgroundColor: p.c }}
                   >
                      <div className="absolute inset-0 bg-black/40" />
                      <span className="text-2xl font-black italic text-white relative z-10">{p.l}</span>
                   </motion.button>
                 ))}
               </div>
            </motion.main>
          )}

          {state === 'PC_RESULT' && (
             <motion.main key="pc_res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-6 text-center py-10 scale-[0.75] origin-center">
                <Dna className="w-20 h-20 text-brand-gold animate-bounce mb-2" />
                <div className="space-y-4">
                    <p className="text-2xl md:text-4xl font-black italic gold-text uppercase leading-tight">
                      진단 결과 <br/>
                      당신의 퍼스널 컬러는 <br/>
                      <span className="text-5xl md:text-7xl mt-2 block gold-text shining-gold opacity-100">[{personalColor}]</span> 입니다.
                    </p>
                </div>
                <button onClick={() => triggerFlash('CUSTOM_INPUT')} className="btn-gold !px-14 mt-6 text-base">CONTINUE TO CUSTOM KODE</button>
             </motion.main>
          )}

          {state === 'CUSTOM_INPUT' && (
            <motion.main key="custom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full py-12">
               <div className="mb-16">
                <h2 className="text-4xl font-black italic tracking-tighter gold-text uppercase">Style Keyword Search</h2>
                <p className="text-slate-grey font-bold tracking-widest mt-4 uppercase">"원하는 코디의 느낌과 무드를 상의, 하의, 신발, 쥬얼리 키워드로 상세히 적어주세요."</p>
               </div>
               <div className="space-y-12">
                  {[
                    { label: 'Upper Layer', help: '예시: 차분한 네이비 셔츠', state: customTop, setState: setCustomTop },
                    { label: 'Lower Layer', help: '예시: 매끈한 블랙 슬랙스', state: customBottom, setState: setCustomBottom },
                    { label: 'Shoes', help: '예시: 깔끔한 화이트 스니커즈', state: customShoes, setState: setCustomShoes },
                    { label: 'Jewelry / Accessary', help: '예시: 실버 볼드 링', state: customJewelry, setState: setCustomJewelry },
                  ].map((field) => (
                    <div key={field.label} className="border-b border-white/10 py-6 focus-within:border-brand-gold transition-all">
                      <label className="text-[10px] text-slate-grey font-bold uppercase tracking-[0.4em] mb-4 block">{field.label}</label>
                      <input value={field.state} onChange={e => field.setState(e.target.value)} className="w-full bg-transparent text-5xl font-black italic outline-none placeholder:text-white/5 text-off-white" placeholder="ENTER KEYWORD"/>
                      <p className="text-[12px] text-brand-gold-bright mt-4 italic font-bold tracking-widest" style={{ color: '#E0E0E0' }}>{field.help}</p>
                    </div>
                  ))}
               </div>
               <div className="flex justify-end mt-24">
                <button onClick={handleFinalCheck} disabled={!customTop || !customBottom || !customShoes} className="btn-gold px-24">VERIFY KODE</button>
               </div>
            </motion.main>
          )}

          {state === 'FINAL_LOADING' && (
             <motion.main key="final_l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-12">
                <div className="w-32 h-32 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black italic gold-text tracking-tighter uppercase px-12">당신의 기분과 무드, 진단한 퍼스널 컬러를 바탕으로 <br/>다시 한번 정확한 코디를 추천드립니다.</h2>
                    <p className="text-brand-gold font-bold tracking-[0.4em] uppercase text-xs animate-pulse italic">KODE is refining your absolute persona...</p>
                </div>
             </motion.main>
          )}

          {state === 'FINAL_RESULT' && (
            <motion.main key="res" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col gap-6 py-2 uppercase scale-[0.85] origin-top">
               <div className="border-l-[8px] gold-border border-y-0 border-r-0 pl-8">
                 <span className="text-brand-gold font-black tracking-[0.5em] text-[10px] uppercase mb-1 block">Final // PERSPECTIVE</span>
                 <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter gold-text uppercase leading-none text-balance">"이제, 당신의 완성된 페르소나를 확인해보세요."</h2>
                 <p className="text-brand-gold text-sm font-serif italic tracking-[0.1em] mt-2 opacity-80">{result?.moodGuide || ''}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  {/* LEFT: USER SELECTION */}
                  <div className="bg-white/5 border border-white/10 p-6 flex flex-col gap-4 backdrop-blur-xl">
                     <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-brand-gold font-bold uppercase tracking-[0.3em] opacity-60">Self-View</span>
                        <h3 className="text-lg md:text-xl font-serif italic gold-text">"당신이 원하는 코디"</h3>
                     </div>
                     <div className="space-y-3 pt-3 border-t border-white/5">
                        <div className="space-y-3">
                           {[
                             { l: '상의', v: customTop },
                             { l: '하의', v: customBottom },
                             { l: '신발', v: customShoes },
                             { l: '쥬얼리', v: customJewelry || '미니멀 레이어드' }
                           ].map((item, i) => (
                             <div key={i} className="flex flex-col gap-1 group">
                               <div className="flex items-center justify-between border-b border-white/5 pb-1">
                                 <span className="text-[8px] text-slate-grey font-bold uppercase tracking-widest opacity-50">[{item.l}]</span>
                                 <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openSearch(item.v, 'google')} className="text-[9px] hover:text-brand-gold">GOOGLE</button>
                                    <button onClick={() => openSearch(item.v, 'naver')} className="text-[9px] hover:text-brand-gold">NAVER</button>
                                 </div>
                               </div>
                               <p className="text-xl md:text-2xl font-black italic gold-text tracking-tighter uppercase truncate">
                                 {item.v}
                               </p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* RIGHT: KODE RECOMMENDATION */}
                  <div className="bg-brand-gold/5 border-2 border-brand-gold/30 p-6 flex flex-col gap-4 backdrop-blur-2xl">
                     <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-brand-gold font-bold uppercase tracking-[0.3em] opacity-60">KODE-View</span>
                        <h3 className="text-lg md:text-xl font-serif italic gold-text">"KODE가 추천하는 코디"</h3>
                     </div>
                     <div className="space-y-3 pt-3 border-t border-brand-gold/10">
                        <div className="space-y-3">
                           {[
                             { l: '상의', v: result?.recommendedOutfit.top || '에메랄드 실크 셔츠' },
                             { l: '하의', v: result?.recommendedOutfit.bottom || '테일러드 울 팬츠' },
                             { l: '신발', v: result?.recommendedOutfit.shoes || '클래식 로퍼' },
                             { l: '쥬얼리', v: result?.recommendedOutfit.jewelry || '골드 시그넷 링' }
                           ].map((item, i) => (
                             <div key={i} className="flex flex-col gap-1 group">
                               <div className="flex items-center justify-between border-b border-brand-gold/10 pb-1">
                                 <span className="text-[8px] text-brand-gold/60 font-bold uppercase tracking-widest opacity-50">[{item.l}]</span>
                                 <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openSearch(item.v, 'google')} className="text-[9px] hover:text-white">GOOGLE</button>
                                    <button onClick={() => openSearch(item.v, 'naver')} className="text-[9px] hover:text-white">NAVER</button>
                                 </div>
                               </div>
                               <p className="text-xl md:text-2xl font-black italic tracking-tighter uppercase truncate gold-text shining-gold">
                                 {item.v}
                               </p>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex justify-center mt-6">
                  <button onClick={() => triggerFlash('FEEDBACK')} className="btn-gold !px-24 !py-5 flex items-center gap-4 text-xl uppercase italic shadow-xl">NEXT PROCESS <ChevronRight className="w-6 h-6"/></button>
               </div>
            </motion.main>
          )}

          {state === 'FEEDBACK' && (
            <motion.main key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center gap-16 px-6">
               <div className="space-y-8 max-w-4xl mx-auto">
                 <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter gold-text uppercase leading-tight py-4">KODE가 추천한 코디가 마음에 드셨나요?</h2>
                 <p className="text-xl md:text-2xl text-slate-grey font-serif italic">(Did you like KODE's recommendation?)</p>
               </div>
               <div className="flex flex-col md:flex-row gap-12 w-full justify-center">
                  <button onClick={() => triggerFlash('EXTRA_SCENT')} className="btn-gold !px-32 flex items-center gap-6 text-2xl"><Heart className="w-8 h-8" /> YES</button>
                  <button onClick={() => triggerFlash('RE_ANALYSIS_INPUT')} className="btn-gold !px-32 flex items-center gap-6 text-2xl !bg-white/5 !border-white/20 !text-slate-grey"><XCircle className="w-8 h-8" /> NO</button>
               </div>
            </motion.main>
          )}

          {state === 'EXTRA_SCENT' && result && (
             <motion.main key="scent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-16 py-20 px-6">
                <Wind className="w-40 h-40 text-brand-gold animate-pulse" />
                <AnimatePresence mode="wait">
                  {!showScentConfirm ? (
                    <motion.div key="cfm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
                       <p className="text-brand-gold font-serif italic text-lg opacity-80 px-4">"당신의 오늘의 무드를 시각을 넘어 후각적인 기억으로 완성해 줄 향기입니다."</p>
                       <h2 className="text-4xl md:text-5xl font-black italic gold-text px-4 leading-tight">오늘의 향기를 추천받으시겠습니까?</h2>
                      <div className="flex gap-6 justify-center">
                        <button onClick={() => setShowScentConfirm(true)} className="btn-gold px-12">YES</button>
                        <button onClick={() => triggerFlash('EXTRA_COLOR')} className="btn-gold !bg-white/5 !border-white/10 px-12">NO</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-4xl">
                      <h2 className="text-2xl font-black italic text-brand-gold uppercase tracking-[0.5em]">SCENT CURATION</h2>
                      <div className="bg-white/5 border border-brand-gold/30 p-12 backdrop-blur-3xl">
                          <div className="text-brand-gold font-serif italic text-base mb-6 opacity-80 font-bold">
                            <ReactMarkdown>
                              {`당신의 기분은 ${result.moodText}하니 [${result.scent.title}] 향기로 [${result.scent.benefit}] 기분을 느껴보세요. 이 향은 심리적 긴장을 완화해 줍니다.`}
                            </ReactMarkdown>
                          </div>
                          <h3 className="text-6xl font-black italic gold-text tracking-tighter uppercase mb-4">{result.scent.title}</h3>
                          <div className="text-2xl font-serif italic text-off-white leading-relaxed mb-6">
                            <ReactMarkdown>
                              {result.scent.description}
                            </ReactMarkdown>
                          </div>
                          <div className="inline-block px-8 py-3 bg-brand-gold text-brand-black font-black text-xs uppercase tracking-widest italic">{result.scent.benefit}</div>
                      </div>
                      <button onClick={() => triggerFlash('EXTRA_COLOR')} className="btn-gold mt-12 px-24">CONTINUE</button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </motion.main>
          )}

          {state === 'EXTRA_COLOR' && result && (
             <motion.main key="color" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-16 py-20 px-6">
                <Palette className="w-40 h-40 text-brand-gold animate-pulse" />
                <AnimatePresence mode="wait">
                  {!showColorConfirm ? (
                    <motion.div key="cfm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
                       <p className="text-brand-gold font-serif italic text-lg opacity-80 px-4">"당신의 내면 에너지를 가장 돋보이게 해줄 오늘의 행운의 색입니다."</p>
                       <h2 className="text-4xl md:text-5xl font-black italic gold-text px-4 leading-tight">오늘의 컬러를 추천받으시겠습니까?</h2>
                      <div className="flex gap-6 justify-center">
                        <button onClick={() => setShowColorConfirm(true)} className="btn-gold px-12">YES</button>
                        <button onClick={() => triggerFlash('EXTRA_FATE')} className="btn-gold !bg-white/5 !border-white/10 px-12">NO</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-4xl">
                      <h2 className="text-2xl font-black italic text-brand-gold uppercase tracking-[0.5em]">COLOR THERAPY</h2>
                      <div className="bg-white/5 border border-brand-gold/30 p-12 backdrop-blur-3xl font-serif">
                          <div className="text-brand-gold italic text-base mb-6 opacity-80 font-bold">
                            <ReactMarkdown>
                              {`[${result.color.name}] 색상은 [${result.color.benefit}]을 주는 효능이 있습니다. 이 색상으로 당신의 [${result.moodText}] 기분을 [${result.color.effect}]으로 바꿔보세요.`}
                            </ReactMarkdown>
                          </div>
                          <div className="w-full h-24 mb-6 shadow-2xl" style={{ backgroundColor: result.color.hex }} />
                          <h3 className="text-6xl font-black italic gold-text tracking-tighter uppercase mb-4 font-sans">{result.color.name}</h3>
                          <div className="text-xl italic text-off-white leading-relaxed mb-6">
                            <ReactMarkdown>
                              {`효능: ${result.color.benefit}`}
                            </ReactMarkdown>
                          </div>
                          <div className="p-4 border border-brand-gold/20 italic text-brand-gold-bright text-base mb-6">
                            <ReactMarkdown>
                              {`결과: ${result.color.effect}`}
                            </ReactMarkdown>
                          </div>
                      </div>
                      <button onClick={() => triggerFlash('EXTRA_FATE')} className="btn-gold mt-12 px-24">CONTINUE</button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </motion.main>
          )}

          {state === 'EXTRA_FATE' && result && (
             <motion.main key="fate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-16 py-20 px-6">
                <Zap className="w-40 h-40 text-brand-gold animate-pulse" />
                <AnimatePresence mode="wait">
                  {!showFateConfirm ? (
                    <motion.div key="cfm" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
                       <p className="text-brand-gold font-serif italic text-lg opacity-80 px-4">"당신의 일상에 작은 변화와 행운을 가져다줄 오늘의 오브제입니다."</p>
                       <h2 className="text-4xl md:text-5xl font-black italic gold-text px-4 leading-tight">오늘의 아이템을 추천받으시겠습니까?</h2>
                      <div className="flex gap-6 justify-center">
                        <button onClick={() => setShowFateConfirm(true)} className="btn-gold px-12">YES</button>
                        <button onClick={() => triggerFlash('ENDING')} className="btn-gold !bg-white/5 !border-white/10 px-12">NO</button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div key="res" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-4xl">
                      <h2 className="text-2xl font-black italic text-brand-gold uppercase tracking-[0.5em]">FATE ITEM</h2>
                      <div className="bg-white/5 border border-brand-gold/30 p-12 backdrop-blur-3xl">
                          <div className="text-brand-gold font-serif italic text-base mb-6 opacity-80 font-bold">
                            <ReactMarkdown>
                              {`이 [${result.fate.item}] 아이템은 당신을 [${result.fate.imageEffect}]로 바꿔줄 것입니다.`}
                            </ReactMarkdown>
                          </div>
                          <h3 className="text-6xl font-black italic gold-text tracking-tighter uppercase mb-4">{result.fate.item}</h3>
                          <div className="p-4 border border-brand-gold/20 italic text-brand-gold-bright text-base">"오늘 이 아이템을 품에 지니거나 떠올려 보세요. 귀하의 기운을 보완해 줄 것입니다."</div>
                      </div>
                      <button onClick={() => triggerFlash('ENDING')} className="btn-gold mt-12 px-32 italic font-black uppercase tracking-[0.4em]">ENTER THE ENDING <ChevronRight className="inline ml-4" /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </motion.main>
          )}

          {state === 'ENDING' && (
             <motion.main key="end" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center text-center gap-16 py-20 px-6">
                <div className="space-y-10 group">
                   <h2 className="text-6xl md:text-8xl font-black italic gold-text tracking-tighter uppercase leading-tight animate-pulse font-serif">KODE IS COMPLETE</h2>
                   <p className="text-xl md:text-3xl font-serif italic text-off-white/80 tracking-widest transition-all group-hover:tracking-[0.2em] duration-1000">오늘의 KODE가 끝났습니다. 내일의 KODE가 궁금하시지 않나요?</p>
                </div>
                
                <button onClick={() => window.location.reload()} className="btn-gold !px-24 flex items-center gap-6 text-2xl uppercase italic shadow-[0_0_100px_rgba(197,160,89,0.2)]">REPLAY KODE <RotateCcw className="w-8 h-8"/></button>

                <div className="mt-24 border-t border-white/5 pt-12 w-full flex flex-col items-center gap-4">
                  <p className="text-slate-grey text-sm font-bold uppercase tracking-[0.5em] opacity-40">"당신의 모든 감정은 기록되어 페르소나가 됩니다."</p>
                  <p className="text-brand-gold text-lg font-black italic uppercase tracking-widest animate-bounce">매일 KODE와 함께 해요</p>
                </div>
             </motion.main>
          )}

          {state === 'RE_ANALYSIS_INPUT' && (
            <motion.main key="re" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
               <div className="mb-12 border-l-[12px] gold-border border-y-0 border-r-0 pl-12">
                <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter gold-text uppercase leading-tight">당신이 원할만한 코디로 다시 조합해 드립니다.</h2>
                <p className="text-slate-grey text-xl font-serif italic mt-4 italic">원하는 무드를 더 상세히 적어주세요... (Please provide more details for refinement)</p>
               </div>
               <textarea value={reAnalysisOpinion} onChange={e=>setReAnalysisOpinion(e.target.value)} placeholder="예: 조금 더 밝은 느낌의 힙합 스타일로 추천해줘." className="flex-1 w-full bg-transparent border-none outline-none text-4xl italic text-off-white font-serif placeholder:text-white/5 resize-none py-12" autoFocus />
               <div className="flex justify-end pt-12 border-t border-white/5">
                <button onClick={() => startAnalysis(true)} className="btn-gold px-24 text-2xl italic font-black uppercase tracking-widest">RE-GENERATE CODE <RotateCcw className="inline ml-4" /></button>
               </div>
            </motion.main>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
