/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Home,
  Share2,
  Settings,
  X,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Music,
  Upload
} from 'lucide-react';

// Visual assets: Valentina and her favorite doll YoYa: Sparkle (permanently integrated)
import yoyaFrontImg from './assets/images/yoya_sparkle_front_1790183065047.jpg';
import yoyaPortraitImg from './assets/images/yoya_sparkle_portrait_1790183121361.jpg';
import yoyaEarmuffsImg from './assets/images/yoya_sparkle_earmuffs_1790183089432.jpg';
import vipPortraitImg from './assets/images/valentina_portrait_vip_1790182204136.jpg';

interface PartyDetails {
  nombre: string;
  edad: number;
  subtitulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  direccion: string;
  dressCode: string;
  regalos: string;
  mensajeEspecial: string;
  detalles: string;
  whatsapp: string;
  whatsappDisplay: string;
  whatsappMessage: string;
  mapsUrl: string;
  countdownDate: string;
  audioUrl?: string;
}

const initialPartyDetails: PartyDetails = {
  nombre: 'VALENTINA',
  edad: 9,
  subtitulo: 'Fashion Birthday · YoYa: Sparkle',
  fecha: 'Sábado 3 de Octubre',
  hora: 'De 17:00 a 20:00 hs',
  lugar: 'Casa de Valentina',
  direccion: 'Calle Manuel Ocampo 2443',
  dressCode: 'Fashion Chic · Toque Denim, Blanco o Plateado 💎',
  regalos: 'Tu presencia es nuestro mejor regalo 🎁',
  mensajeEspecial: 'Porque los 9 años se celebran una sola vez... ¡y queremos que seas parte de este momento especial!',
  detalles: 'Habrá diversión, juegos, risas y muchas sorpresas 🎂🎈✨',
  whatsapp: '5491164270908',
  whatsappDisplay: '11 6427-0908',
  whatsappMessage: '¡Hola! Confirmo con mucha alegría mi asistencia al 9no cumpleaños de Valentina en Calle Manuel Ocampo 2443 🎀🎂🎉',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Calle+Manuel+Ocampo+2443',
  countdownDate: '2026-10-03T17:00:00',
  audioUrl: '/assets/audio/cancion_valentina.mp3',
};

// Reading durations for each slide in milliseconds
const SLIDE_DURATIONS = [
  7000, // Slide 1: Bienvenida & Valentina 9 Años (7s)
  7500, // Slide 2: Diversión & Su muñeca favorita YoYa: Sparkle (7.5s)
  7500, // Slide 3: Estilo & Fotos de estudio (7.5s)
  8500, // Slide 4: Coordenadas de la fiesta (8.5s)
  7500, // Slide 5: Cuenta regresiva en vivo (7.5s)
  12000, // Slide 6: Gran final & Confirmación por WhatsApp (12s)
];

export default function App() {
  const [party, setParty] = useState<PartyDetails>(() => {
    try {
      const saved = localStorage.getItem('valentina_invitation_v7');
      if (saved) {
        return {
          ...initialPartyDetails,
          ...JSON.parse(saved),
          whatsapp: '5491164270908',
          whatsappDisplay: '11 6427-0908',
        };
      }
    } catch (e) {}
    return initialPartyDetails;
  });

  // Presentation State
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [slideProgress, setSlideProgress] = useState<number>(0); // 0 to 100%
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [ambientGlow, setAmbientGlow] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiListRef = useRef<any[]>([]);
  const particlesListRef = useRef<any[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  // Web Audio Synthesizer (Fallback in case MP3 is still loading)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);

  // Active portrait image: Permanently built-in Valentina VIP Portrait
  const activePortrait = vipPortraitImg;

  // Real-time Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('valentina_invitation_v7', JSON.stringify(party));
    } catch (e) {}
  }, [party]);

  // Real-time Countdown calculation
  useEffect(() => {
    const calcCountdown = () => {
      const target = new Date(party.countdownDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    calcCountdown();
    const interval = setInterval(calcCountdown, 1000);
    return () => clearInterval(interval);
  }, [party.countdownDate]);

  // Soft cinematic ambient flare on slide transition
  const triggerSoftTransition = useCallback(() => {
    setAmbientGlow(true);
    setTimeout(() => setAmbientGlow(false), 300);
  }, []);

  // Confetti Particle Burst
  const triggerConfetti = useCallback((amount = 55) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const colors = ['#ffffff', '#f472b6', '#c084fc', '#fcd34d', '#93c5fd', '#fbcfe8'];
    const centerX = canvas.width / 2;
    const centerY = canvas.height * 0.42;

    const pieces = Array.from({ length: amount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6.5 + 2.5;
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.2,
        gravity: 0.14,
        size: Math.random() * 6 + 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.2,
        life: 1.25,
      };
    });
    confettiListRef.current.push(...pieces);
  }, []);

  // Canvas floating sparkles and confetti animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    particlesListRef.current = Array.from({ length: 36 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2.2 + 0.8,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25 - 0.18,
      opacity: Math.random() * 0.7 + 0.3,
      color: Math.random() > 0.4 ? '#ffffff' : Math.random() > 0.5 ? '#f472b6' : '#c084fc',
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Star sparkles
      particlesListRef.current.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.phase += 0.035;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        const currentOpacity = 0.25 + 0.55 * Math.sin(p.phase);

        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0.1, Math.min(1, currentOpacity));
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.fill();
        ctx.restore();
      });

      // Confetti physics
      const conf = confettiListRef.current;
      for (let i = conf.length - 1; i >= 0; i--) {
        const c = conf[i];
        c.x += c.vx;
        c.y += c.vy;
        c.vy += c.gravity;
        c.rotation += c.rotSpeed;
        c.life -= 0.014;

        if (c.life <= 0 || c.y > canvas.height + 20) {
          conf.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, c.life);
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Web Audio Synthesizer (Upbeat Pop Song at 128 BPM - Fallback)
  const initWebAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.connect(ctx.destination);
        audioCtxRef.current = ctx;
        synthGainRef.current = gain;
      }
    } catch (e) {}
  };

  const startSynthCelebration = () => {
    if (synthIntervalRef.current || !audioCtxRef.current || isMuted) return;

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    const melody = [
      392.00, 392.00, 440.00, 392.00, 523.25, 493.88,
      392.00, 392.00, 440.00, 392.00, 587.33, 523.25,
      392.00, 392.00, 783.99, 659.25, 523.25, 493.88, 440.00,
      698.46, 698.46, 659.25, 523.25, 587.33, 523.25
    ];
    let noteStep = 0;

    synthIntervalRef.current = window.setInterval(() => {
      if (isMuted || !audioCtxRef.current || !synthGainRef.current) return;

      const ctx = audioCtxRef.current;
      const t = ctx.currentTime;

      // Sparkle Melody Lead
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = noteStep % 3 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(melody[noteStep % melody.length], t);

      noteGain.gain.setValueAtTime(0.001, t);
      noteGain.gain.exponentialRampToValueAtTime(0.09, t + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);

      osc.connect(noteGain);
      noteGain.connect(synthGainRef.current);

      osc.start(t);
      osc.stop(t + 0.24);

      // Bass Kick
      if (noteStep % 4 === 0) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

        kickGain.gain.setValueAtTime(0.25, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        kickOsc.connect(kickGain);
        kickGain.connect(synthGainRef.current);
        kickOsc.start(t);
        kickOsc.stop(t + 0.15);
      }

      // Snare / Clap
      if (noteStep % 4 === 2) {
        const snareOsc = ctx.createOscillator();
        const snareGain = ctx.createGain();
        snareOsc.type = 'square';
        snareOsc.frequency.setValueAtTime(320, t);
        snareOsc.frequency.exponentialRampToValueAtTime(110, t + 0.08);

        snareGain.gain.setValueAtTime(0.08, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        snareOsc.connect(snareGain);
        snareGain.connect(synthGainRef.current);
        snareOsc.start(t);
        snareOsc.stop(t + 0.1);
      }

      noteStep++;
    }, 200);
  };

  const stopSynthCelebration = () => {
    if (synthIntervalRef.current) {
      clearInterval(synthIntervalRef.current);
      synthIntervalRef.current = null;
    }
  };

  // Play official song
  const playOfficialMusic = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play()
        .then(() => {
          stopSynthCelebration();
        })
        .catch(() => {
          // If HTML5 audio is blocked or file not ready, use synthesizer
          initWebAudio();
          startSynthCelebration();
        });
    } else {
      initWebAudio();
      startSynthCelebration();
    }
  };

  // Toggle Mute / Unmute
  const toggleAudio = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (audioElementRef.current) {
      audioElementRef.current.muted = nextMuted;
    }

    if (synthGainRef.current) {
      synthGainRef.current.gain.value = nextMuted ? 0 : 0.3;
    }

    if (!nextMuted && hasStarted) {
      playOfficialMusic();
    }
  };

  // Automatic Slide Progress Engine
  useEffect(() => {
    if (!hasStarted || isPaused) return;

    const currentDuration = SLIDE_DURATIONS[currentSlide] || 8000;
    const intervalMs = 50;
    const increment = (intervalMs / currentDuration) * 100;

    const timer = setInterval(() => {
      setSlideProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          if (currentSlide < SLIDE_DURATIONS.length - 1) {
            triggerSoftTransition();
            triggerConfetti(30);
            setCurrentSlide((s) => s + 1);
            return 0;
          } else {
            triggerConfetti(50);
            return 100;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasStarted, isPaused, currentSlide, triggerSoftTransition, triggerConfetti]);

  // Jump to specific slide with crossfade
  const goToSlide = (index: number) => {
    triggerSoftTransition();
    triggerConfetti(35);
    setCurrentSlide(index);
    setSlideProgress(0);
  };

  // Start presentation when user clicks the opening button
  const handleStartInvitation = () => {
    triggerSoftTransition();
    setHasStarted(true);
    setCurrentSlide(0);
    setSlideProgress(0);
    triggerConfetti(70);
    playOfficialMusic();
  };

  // Replay presentation from slide 0
  const handleReplay = () => {
    goToSlide(0);
    playOfficialMusic();
  };

  // Admin one-time upload: Saves MP3 file permanently to project server and local state
  const handleSaveAudioFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 1. Send file to Vite dev server to save permanently in public/assets/audio/cancion_valentina.mp3
      await fetch('/api/save-audio', {
        method: 'POST',
        body: file,
      });
    } catch (err) {}

    // 2. Also create blob URL so it plays instantly right now
    const localUrl = URL.createObjectURL(file);
    setParty((prev) => ({ ...prev, audioUrl: localUrl }));

    if (audioElementRef.current) {
      audioElementRef.current.src = localUrl;
      audioElementRef.current.load();
      if (hasStarted) {
        audioElementRef.current.play().catch(() => {});
      }
    }

    setUploadSuccess(true);
    triggerConfetti(50);
    setTimeout(() => setUploadSuccess(false), 3500);
  };

  // WhatsApp confirmation: Direct link to 1164270908 (+5491164270908)
  const handleWhatsApp = () => {
    const phone = '5491164270908';
    const msg = encodeURIComponent(party.whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  // Google Maps
  const handleMaps = () => {
    window.open(party.mapsUrl, '_blank');
  };

  // Google Calendar
  const handleCalendar = () => {
    const title = encodeURIComponent(`Cumpleaños de ${party.nombre} (9 Años) 🎀`);
    const details = encodeURIComponent(
      `¡Celebración de los 9 años de ${party.nombre}! ${party.detalles}. ${party.mensajeEspecial}`
    );
    const location = encodeURIComponent(`${party.lugar}, ${party.direccion}`);
    const dates = '20261003T170000/20261003T200000';
    const gcalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    window.open(gcalUrl, '_blank');
  };

  // Share invitation
  const handleShare = async () => {
    const shareText = `🎉✨ ¡ESTÁS INVITADO/A! ✨🎉\n💖 VALENTINA CUMPLE 9 AÑOS 💖\n📅 ${party.fecha}\n⏰ ${party.hora}\n🏠 ${party.lugar} - ${party.direccion}\n📱 Confirmar al: ${party.whatsappDisplay}\n🎈 ¡No faltes!`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invitación: ${party.nombre} Cumple 9 Años 🎀`,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch (e) {}
    }
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="relative w-full h-screen bg-[#040508] flex items-center justify-center overflow-hidden select-none">
      {/* Permanent Audio Element playing Valentina's Official Birthday Song */}
      <audio
        ref={audioElementRef}
        src={party.audioUrl || '/assets/audio/cancion_valentina.mp3'}
        loop
        preload="auto"
      />

      {/* Hidden file input for one-click admin audio persistence */}
      <input
        type="file"
        ref={audioInputRef}
        onChange={handleSaveAudioFile}
        accept="audio/*"
        className="hidden"
      />

      {/* Mobile-first Phone Container */}
      <div className="relative w-full h-full max-w-[430px] max-h-[920px] sm:h-[94vh] sm:rounded-[38px] bg-gradient-to-b from-[#0b0d14] via-[#090b10] to-[#040508] overflow-hidden border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Animated Studio Background Glow */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-96 rounded-full bg-radial from-white/20 via-pink-500/10 to-transparent blur-3xl animate-pulse" />
          <div className="absolute top-1/4 -right-20 w-80 h-96 rounded-full bg-radial from-purple-500/20 via-pink-400/10 to-transparent blur-3xl" />
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-72 h-80 rounded-full bg-radial from-white/15 via-blue-400/10 to-transparent blur-3xl" />

          {/* Perspective Studio Grid Line Floor */}
          <div
            className="absolute bottom-0 left-[-20%] w-[140%] h-[35%] opacity-25"
            style={{
              background:
                'linear-gradient(to top, rgba(255,255,255,0.08) 0%, transparent 100%)',
              transform: 'perspective(280px) rotateX(60deg)',
              transformOrigin: 'bottom center',
            }}
          />
        </div>

        {/* 2D Canvas for Sparkling Floating Particles & Confetti */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* Soft Cinematic Ambient Flare Overlay for Crossfade Transitions */}
        <div
          className={`absolute inset-0 bg-radial from-white/35 via-pink-300/15 to-transparent pointer-events-none z-45 transition-opacity duration-500 ease-out ${
            ambientGlow ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* =========================================================
            TOP STORY PROGRESS BAR (ACTIVE WHEN PRESENTATION STARTS)
            ========================================================= */}
        {hasStarted && (
          <div className="absolute top-3 left-3 right-3 z-40 flex gap-1.5 transition-opacity duration-500">
            {SLIDE_DURATIONS.map((_, idx) => {
              let width = '0%';
              if (idx < currentSlide) width = '100%';
              else if (idx === currentSlide) width = `${slideProgress}%`;

              return (
                <div
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer backdrop-blur-xs"
                >
                  <div
                    className="h-full bg-gradient-to-r from-white to-pink-300 shadow-[0_0_8px_#ffffff] transition-all duration-75"
                    style={{ width }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================
            HEADER TOOLBAR (CLEAN & SLEEK FOR GUESTS)
            ========================================================= */}
        <div className="absolute top-6 left-3 right-3 z-40 flex items-center justify-between pointer-events-auto">
          {/* Sound Toggle + Animated Equalizer */}
          <button
            onClick={toggleAudio}
            aria-label="Silenciar o Activar Música"
            className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-2 text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-zinc-400" />
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-pink-400 animate-pulse" />
                <span className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-2 bg-pink-400 animate-pulse" />
                  <span className="w-0.5 h-3 bg-white animate-bounce" />
                  <span className="w-0.5 h-1.5 bg-pink-300 animate-pulse" />
                </span>
              </>
            )}
          </button>

          {/* Pause / Resume Slideshow (When running) */}
          {hasStarted && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              aria-label={isPaused ? 'Reanudar presentación' : 'Pausar presentación'}
              className="px-2.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center gap-1.5 text-xs text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-300">Pausado</span>
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-300" />
                  <span className="text-[10px] font-bold text-slate-300">Auto</span>
                </>
              )}
            </button>
          )}

          {/* Right Action Icons (Share & Discrete Settings) */}
          <div className="flex items-center gap-1.5">
            {/* Share Link */}
            <button
              onClick={handleShare}
              title="Compartir por WhatsApp"
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-200" />
            </button>

            {/* Discrete Settings for Admin */}
            <button
              onClick={() => setShowSettings(true)}
              title="Ajustes"
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform cursor-pointer opacity-70 hover:opacity-100"
            >
              <Settings className="w-3.5 h-3.5 text-slate-200" />
            </button>
          </div>
        </div>

        {/* =========================================================
            MAIN STAGE WITH CINEMATIC CROSSFADE (FUNDIDO CRUZADO)
            ========================================================= */}
        <div className="relative flex-1 w-full overflow-hidden">
          {/* -------------------------------------------------------
              COVER SCREEN: VALENTINA Y LA MUÑECA INICIAL
              ------------------------------------------------------- */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-between p-5 pt-18 pb-8 text-center transition-all duration-700 ease-in-out ${
              !hasStarted
                ? 'opacity-100 scale-100 pointer-events-auto z-30 translate-y-0'
                : 'opacity-0 scale-95 pointer-events-none z-0 -translate-y-2'
            }`}
          >
            {/* Top Title Banner */}
            <div>
              <div className="text-[10px] tracking-[4px] text-pink-400 font-extrabold uppercase mb-1 drop-shadow-md">
                ✨ ¡ESTÁS INVITADO/A! ✨
              </div>
              <h1 className="font-editorial text-4xl font-extrabold tracking-[5px] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-200 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                {party.nombre}
              </h1>
              <div className="text-xs tracking-[4px] text-slate-300 font-bold uppercase mt-0.5">
                CUMPLE {party.edad} AÑOS
              </div>
            </div>

            {/* Main Stage: Valentina and her favorite doll YoYa: Sparkle right side-by-side */}
            <div className="relative w-full max-w-[320px] h-[360px] flex items-center justify-center my-auto">
              {/* YoYa: Sparkle Doll */}
              <div className="absolute left-2 w-42 h-[320px] rounded-[26px] overflow-hidden border-2 border-white/40 shadow-[0_20px_45px_rgba(0,0,0,0.9)] -rotate-4 z-10 bg-black">
                <img
                  src={yoyaFrontImg}
                  alt="Muñeca Favorita YoYa Sparkle"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[9px] font-bold text-pink-300">
                  💖 YoYa: Sparkle
                </div>
              </div>

              {/* Valentina Real VIP Portrait */}
              <div className="absolute right-2 bottom-2 w-42 h-[310px] rounded-[26px] overflow-hidden border-3 border-pink-400 shadow-[0_20px_50px_rgba(244,114,182,0.5)] rotate-4 z-20 bg-black">
                <img
                  src={activePortrait}
                  alt="Valentina"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/30 text-[10px] font-black text-white whitespace-nowrap shadow-lg">
                  👑 VALENTINA
                </div>
              </div>
            </div>

            {/* Date and Place Preview */}
            <div className="text-[11px] text-slate-300 font-semibold tracking-wide mb-2">
              📅 {party.fecha} · ⏰ {party.hora}
            </div>

            {/* THE BIG START BUTTON */}
            <button
              onClick={handleStartInvitation}
              className="relative w-full max-w-[310px] py-4 px-6 rounded-full font-black text-sm tracking-[2.5px] uppercase bg-gradient-to-r from-white via-slate-100 to-pink-100 text-slate-900 shadow-[0_10px_35px_rgba(255,255,255,0.4),0_0_25px_rgba(244,114,182,0.4)] gleam-effect active:scale-95 transition-transform flex items-center justify-center gap-2.5 cursor-pointer overflow-hidden"
            >
              <Sparkles className="w-5 h-5 text-pink-500 animate-spin" />
              <span>✨ ABRIR INVITACIÓN ✨</span>
            </button>
          </div>

          {/* -------------------------------------------------------
              SLIDESHOW CONTAINER (ACTIVE WHEN hasStarted = true)
              ------------------------------------------------------- */}
          <div
            className={`absolute inset-0 flex flex-col justify-between p-4 pt-16 pb-6 text-center select-none overflow-hidden transition-all duration-700 ease-in-out ${
              hasStarted
                ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                : 'opacity-0 scale-105 pointer-events-none z-0 translate-y-2'
            }`}
          >
            {/* Left / Right Tap Zones for Navigation */}
            <div
              onClick={() => {
                if (currentSlide > 0) goToSlide(currentSlide - 1);
              }}
              className="absolute left-0 top-14 bottom-14 w-1/4 z-30 cursor-pointer"
              title="Tocar para anterior"
            />
            <div
              onClick={() => {
                if (currentSlide < SLIDE_DURATIONS.length - 1) goToSlide(currentSlide + 1);
              }}
              className="absolute right-0 top-14 bottom-14 w-1/4 z-30 cursor-pointer"
              title="Tocar para siguiente"
            />

            {/* SLIDES WITH CINEMATIC CROSSFADE (FUNDIDO CRUZADO) */}
            <div className="relative flex-1 w-full flex items-center justify-center">
              {/* SLIDE 1: BIENVENIDA & VALENTINA 9 AÑOS */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                  currentSlide === 0
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-36 h-52 rounded-2xl overflow-hidden border-2 border-pink-400 shadow-[0_15px_40px_rgba(244,114,182,0.4)] relative bg-black">
                    <img src={activePortrait} alt="Valentina" className="w-full h-full object-cover object-top" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-bold text-pink-300">
                      👑 Valentina
                    </div>
                  </div>
                  <div className="w-36 h-52 rounded-2xl overflow-hidden border-2 border-white/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative bg-black">
                    <img src={yoyaFrontImg} alt="YoYa Sparkle" className="w-full h-full object-cover object-top" />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-bold text-white">
                      💖 YoYa Sparkle
                    </div>
                  </div>
                </div>

                <div className="text-[11px] tracking-[4px] text-pink-400 font-bold uppercase mb-1">
                  🎉 ¡ESTÁS INVITADO/A! 🎉
                </div>
                <h2 className="font-editorial text-4xl font-extrabold tracking-[5px] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-200">
                  {party.nombre}
                </h2>
                <div className="text-xs tracking-[5px] text-slate-300 uppercase font-semibold mt-1">
                  CUMPLE
                </div>
                <div className="font-editorial text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.7)] leading-none mt-1">
                  {party.edad}
                </div>
                <p className="text-xs text-pink-200/90 font-medium italic mt-3 max-w-[280px]">
                  ¡Y quiere compartir este día tan especial contigo!
                </p>
              </div>

              {/* SLIDE 2: DIVERSIÓN & SU MUÑECA FAVORITA YOYA */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                  currentSlide === 1
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div className="text-[10px] tracking-[3px] text-pink-400 font-bold uppercase mb-2">
                  ✨ SU MUÑECA FAVORITA ✨
                </div>

                <div className="w-56 h-[340px] rounded-[28px] overflow-hidden border-2 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(244,114,182,0.3)] relative bg-black mb-3">
                  <img src={yoyaFrontImg} alt="YoYa Sparkle Coat" className="w-full h-full object-cover object-top" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-3 right-3 text-left">
                    <span className="px-2.5 py-0.5 rounded-full bg-pink-500/80 text-[9px] font-extrabold text-white">
                      YoYa: Sparkle
                    </span>
                    <div className="text-sm font-extrabold text-white mt-1">Look de Pasarela Glam</div>
                    <div className="text-[10px] text-slate-300">Abrigo de piel blanca, falda denim y lentes chic</div>
                  </div>
                </div>

                <div className="font-editorial text-lg font-bold text-white tracking-wide">
                  🎂 DIVERSIÓN, JUEGOS Y RISAS
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-[290px]">
                  {party.detalles}
                </p>
              </div>

              {/* SLIDE 3: ESTILO & FOTOS DE ESTUDIO */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                  currentSlide === 2
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div className="text-[10px] tracking-[3px] text-pink-400 font-bold uppercase mb-2">
                  📸 SESIÓN DE MODA & GLAMOUR
                </div>

                <div className="grid grid-cols-2 gap-2.5 w-full max-w-[300px] mb-3">
                  <div className="h-44 rounded-2xl overflow-hidden border border-white/30 shadow-lg relative bg-black">
                    <img src={yoyaPortraitImg} alt="YoYa Portrait" className="w-full h-full object-cover object-top" />
                    <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[8px] font-bold text-white">
                      Close-up Glam
                    </div>
                  </div>
                  <div className="h-44 rounded-2xl overflow-hidden border border-pink-400/50 shadow-lg relative bg-black">
                    <img src={yoyaEarmuffsImg} alt="YoYa Earmuffs" className="w-full h-full object-cover object-top" />
                    <div className="absolute bottom-1.5 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[8px] font-bold text-pink-300">
                      Cozy Hi Look
                    </div>
                  </div>
                </div>

                <div className="font-editorial text-base font-bold text-white tracking-wider">
                  🌸 FASHION BIRTHDAY 🌸
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/15 text-xs text-slate-200 mt-2 max-w-[300px]">
                  <span className="text-pink-400 font-bold">Dress Code:</span> {party.dressCode}
                </div>
              </div>

              {/* SLIDE 4: COORDENADAS DE LA FIESTA */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                  currentSlide === 3
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div className="w-full max-w-[340px] glass-vip-card rounded-[26px] p-5 text-left border border-white/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-white to-blue-400" />

                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <div>
                      <div className="font-editorial text-base font-bold text-white">
                        🌸 TE ESPERAMOS 🌸
                      </div>
                      <div className="text-[10px] text-pink-400 font-bold tracking-wider uppercase">
                        PARA CELEBRAR JUNTOS
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-pink-400 shadow-md">
                      <img src={activePortrait} alt="Valentina" className="w-full h-full object-cover object-top" />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 flex-shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">FECHA</div>
                      <div className="text-sm font-extrabold text-white">{party.fecha}</div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 flex-shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">HORARIO</div>
                      <div className="text-sm font-extrabold text-white">{party.hora}</div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 flex-shrink-0">
                      <Home className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[9px] uppercase font-bold text-slate-400">LUGAR</div>
                      <div className="text-sm font-extrabold text-white">{party.lugar}</div>
                      <div className="text-xs text-pink-300 font-semibold flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{party.direccion}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SLIDE 5: CUENTA REGRESIVA EN VIVO */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                  currentSlide === 4
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-purple-500 shadow-[0_0_30px_rgba(244,114,182,0.6)] mb-4">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                    <img src={activePortrait} alt="Valentina" className="w-full h-full object-cover object-top" />
                  </div>
                </div>

                <div className="text-[11px] tracking-[3px] text-pink-400 font-bold uppercase mb-1">
                  ⏳ CUENTA REGRESIVA
                </div>
                <h3 className="font-editorial text-2xl font-black text-white tracking-wider mb-4">
                  ¡CADA VEZ FALTA MENOS!
                </h3>

                <div className="grid grid-cols-4 gap-2.5 w-full max-w-[320px] mb-4">
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-2 text-center backdrop-blur-md">
                    <div className="font-editorial text-2xl font-black text-white leading-none">
                      {String(timeLeft.days).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-bold">Días</div>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-2 text-center backdrop-blur-md">
                    <div className="font-editorial text-2xl font-black text-white leading-none">
                      {String(timeLeft.hours).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-bold">Horas</div>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-2 text-center backdrop-blur-md">
                    <div className="font-editorial text-2xl font-black text-white leading-none">
                      {String(timeLeft.minutes).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-bold">Mins</div>
                  </div>
                  <div className="bg-white/10 border border-white/20 rounded-2xl p-2 text-center backdrop-blur-md">
                    <div className="font-editorial text-2xl font-black text-white leading-none">
                      {String(timeLeft.seconds).padStart(2, '0')}
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-bold">Segs</div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 font-medium max-w-[280px]">
                  Contando los segundos para vernos y festejar juntos 🎉🎈
                </p>
              </div>

              {/* SLIDE 6: GRAN FINAL & CONFIRMACIÓN POR WHATSAPP (1164270908) */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-between py-2 transition-all duration-700 ease-in-out ${
                  currentSlide === 5
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div>
                  <div className="font-script text-5xl text-pink-400 drop-shadow-[0_0_20px_rgba(244,114,182,0.7)]">
                    🎈 ¡No faltes! 🎈
                  </div>
                  <h3 className="font-editorial text-xl font-black tracking-widest text-white mt-1">
                    {party.nombre} CUMPLE {party.edad} AÑOS
                  </h3>
                  <p className="text-xs text-pink-200/90 italic mt-1 px-4 leading-relaxed font-medium">
                    "{party.mensajeEspecial}"
                  </p>
                </div>

                {/* Trio Display: YoYa Sparkle + Valentina + YoYa Earmuffs */}
                <div className="relative w-72 h-52 flex items-center justify-center my-auto">
                  <div className="absolute left-2 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl -rotate-6 z-10 bg-black">
                    <img src={yoyaFrontImg} alt="YoYa Coat" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute right-2 w-32 h-44 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl rotate-6 z-20 bg-black">
                    <img src={yoyaEarmuffsImg} alt="YoYa Earmuffs" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute bottom-0 w-36 h-42 rounded-2xl overflow-hidden border-3 border-pink-400 shadow-[0_10px_35px_rgba(244,114,182,0.8)] z-30 bg-black">
                    <img src={activePortrait} alt="Valentina" className="w-full h-full object-cover object-top" />
                  </div>
                </div>

                {/* Final WhatsApp Action Button (11 6427-0908) */}
                <div className="w-full max-w-[330px] flex flex-col gap-2">
                  <button
                    onClick={handleWhatsApp}
                    className="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(16,185,129,0.55)] active:scale-95 transition-all cursor-pointer border border-emerald-400/40 animate-pulse"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>CONFIRMAR ASISTENCIA AL WHATSAPP</span>
                  </button>
                  <div className="text-[10px] text-emerald-300 font-semibold tracking-wide">
                    WhatsApp: 11 6427-0908
                  </div>

                  <div className="flex gap-2 mt-0.5">
                    <button
                      onClick={handleMaps}
                      className="flex-1 py-2.5 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>MAPS</span>
                    </button>
                    <button
                      onClick={handleCalendar}
                      className="flex-1 py-2.5 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-pink-400" />
                      <span>AGENDAR</span>
                    </button>
                    <button
                      onClick={handleReplay}
                      title="Repetir presentación"
                      className="py-2.5 px-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[11px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-slate-200" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Slide Navigation Bar */}
            <div className="w-full flex items-center justify-between pt-2 px-2 text-xs text-slate-400 z-30">
              <button
                onClick={() => {
                  if (currentSlide > 0) goToSlide(currentSlide - 1);
                }}
                disabled={currentSlide === 0}
                className={`flex items-center gap-1 py-1 px-3 rounded-full bg-black/40 border border-white/15 text-white active:scale-95 transition-all ${
                  currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>

              <span className="text-[11px] font-bold text-slate-300">
                {currentSlide + 1} / {SLIDE_DURATIONS.length}
              </span>

              <button
                onClick={() => {
                  if (currentSlide < SLIDE_DURATIONS.length - 1) goToSlide(currentSlide + 1);
                }}
                disabled={currentSlide === SLIDE_DURATIONS.length - 1}
                className={`flex items-center gap-1 py-1 px-3 rounded-full bg-black/40 border border-white/15 text-white active:scale-95 transition-all ${
                  currentSlide === SLIDE_DURATIONS.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Link Copied Notification */}
        {copiedLink && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 py-2 px-4 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Enlace copiado para enviar por WhatsApp!</span>
          </div>
        )}

        {/* Audio Saved Notification */}
        {uploadSuccess && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 py-2.5 px-4 rounded-full bg-pink-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>¡Canción de Valentina guardada con éxito!</span>
          </div>
        )}

        {/* Settings Drawer (Cleaned: Organizer can set the song permanently) */}
        {showSettings && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end">
            <div className="bg-[#121520] border-t border-white/20 rounded-t-[32px] p-6 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="text-sm font-bold tracking-wider text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Configuración de la Invitación</span>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* One-click Audio Saver for Valentina's song */}
              <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-400/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/30 border border-pink-400/50 flex items-center justify-center text-pink-300">
                    <Music className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Canción de Valentina</div>
                    <div className="text-[10px] text-pink-200">
                      Guardar el archivo de música que tienes
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => audioInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 hover:opacity-90 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-lg active:scale-95 transition-transform"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Guardar</span>
                </button>
              </div>

              <div className="space-y-3 text-left">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    WhatsApp para Confirmaciones
                  </label>
                  <input
                    type="text"
                    value={party.whatsappDisplay}
                    onChange={(e) =>
                      setParty({
                        ...party,
                        whatsappDisplay: e.target.value,
                        whatsapp: '549' + e.target.value.replace(/[^0-9]/g, ''),
                      })
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Enlace de Audio Directo (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://.../cancion.mp3"
                    value={party.audioUrl}
                    onChange={(e) => setParty({ ...party, audioUrl: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-pink-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={party.nombre}
                    onChange={(e) => setParty({ ...party, nombre: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Fecha
                  </label>
                  <input
                    type="text"
                    value={party.fecha}
                    onChange={(e) => setParty({ ...party, fecha: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Horario
                  </label>
                  <input
                    type="text"
                    value={party.hora}
                    onChange={(e) => setParty({ ...party, hora: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Lugar
                  </label>
                  <input
                    type="text"
                    value={party.lugar}
                    onChange={(e) => setParty({ ...party, lugar: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={party.direccion}
                    onChange={(e) => setParty({ ...party, direccion: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-pink-400"
                  />
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-3 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider mt-4 cursor-pointer"
                >
                  Guardar y Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
