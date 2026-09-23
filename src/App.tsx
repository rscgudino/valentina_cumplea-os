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
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Copy,
  ExternalLink,
  Navigation,
  Heart
} from 'lucide-react';

// Party Configuration
import { PARTY_CONFIG } from './config/partyConfig';

// Visual assets: Valentina and her favorite doll YoYa: Sparkle
import yoyaFrontImg from './assets/images/yoya_sparkle_front_1790183065047.jpg';
import yoyaPortraitImg from './assets/images/yoya_sparkle_portrait_1790183121361.jpg';
import yoyaEarmuffsImg from './assets/images/yoya_sparkle_earmuffs_1790183089432.jpg';
import vipPortraitFallback from './assets/images/valentina_portrait_vip_1790182204136.jpg';

// Reading durations for each slide in milliseconds
const SLIDE_DURATIONS = [
  7500,  // Slide 1: Bienvenida & Valentina 9 Años (7.5s)
  8000,  // Slide 2: Diversión & Muñeca Favorita YoYa: Sparkle (8s)
  8000,  // Slide 3: Estilo & Fotos de estudio (8s)
  9000,  // Slide 4: Coordenadas de la fiesta & Navegación Waze/Maps (9s)
  8000,  // Slide 5: Cuenta regresiva en vivo (8s)
  14000, // Slide 6: Gran final, WhatsApp & Firma Ondigu (14s)
];

// Quick interactive reactions
const REACTIONS = [
  { emoji: '🎂', label: '¡Feliz Cumple!', color: '#f472b6' },
  { emoji: '💖', label: '¡Te quiero!', color: '#ec4899' },
  { emoji: '👗', label: '¡Look Glam!', color: '#c084fc' },
  { emoji: '✨', label: '¡Allí estaré!', color: '#fbbf24' },
  { emoji: '🎉', label: '¡A festejar!', color: '#60a5fa' },
];

export default function App() {
  const party = PARTY_CONFIG;

  // Active portrait photo with automatic fallback
  const [photoSrc, setPhotoSrc] = useState<string>(party.valentinaPhotoUrl || vipPortraitFallback);

  // Presentation State
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isOpeningEnvelope, setIsOpeningEnvelope] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [slideProgress, setSlideProgress] = useState<number>(0); // 0 to 100%
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [ambientGlow, setAmbientGlow] = useState<boolean>(false);

  // Interactive Feedback States
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);
  const [reactionToast, setReactionToast] = useState<string | null>(null);

  // Floating Reaction Emojis
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string; x: number; y: number }[]>([]);

  // References
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiListRef = useRef<any[]>([]);
  const particlesListRef = useRef<any[]>([]);
  const touchSparklesRef = useRef<any[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Web Audio Synthesizer (Fallback in case user audio is muted/pending)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthIntervalRef = useRef<number | null>(null);
  const synthGainRef = useRef<GainNode | null>(null);

  // Real-time Countdown state
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

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
    setTimeout(() => setAmbientGlow(false), 350);
  }, []);

  // Confetti Particle Burst
  const triggerConfetti = useCallback((amount = 60, customX?: number, customY?: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const colors = ['#ffffff', '#f472b6', '#c084fc', '#fcd34d', '#93c5fd', '#fbcfe8', '#ffd700'];
    const centerX = customX !== undefined ? customX : canvas.width / 2;
    const centerY = customY !== undefined ? customY : canvas.height * 0.42;

    const pieces = Array.from({ length: amount }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2.5;
      return {
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3.5,
        gravity: 0.14,
        size: Math.random() * 6.5 + 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.22,
        life: 1.3,
      };
    });
    confettiListRef.current.push(...pieces);
  }, []);

  // Interactive Touch / Pointer Sparkles (Efecto Mágico al tocar la pantalla)
  const spawnTouchSparkle = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const colors = ['#ffffff', '#f472b6', '#c084fc', '#ffd700', '#fbcfe8'];
    const sparkles = Array.from({ length: 6 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      return {
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
      };
    });
    touchSparklesRef.current.push(...sparkles);
  }, []);

  // Pointer event handlers for touching magic
  const handlePointerDown = (e: React.PointerEvent) => {
    spawnTouchSparkle(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (Math.random() < 0.35) {
      spawnTouchSparkle(e.clientX, e.clientY);
    }
  };

  // Canvas floating sparkles, confetti & touch animation loop
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

      // 1. Ambient Sparkle Dust
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

      // 2. Interactive Touch Sparkles
      const touchSp = touchSparklesRef.current;
      for (let i = touchSp.length - 1; i >= 0; i--) {
        const s = touchSp[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.035;

        if (s.life <= 0) {
          touchSp.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.life;
        ctx.shadowBlur = 8;
        ctx.shadowColor = s.color;
        ctx.fill();
        ctx.restore();
      }

      // 3. Confetti physics
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

  // Web Audio Synthesizer (Upbeat Pop Melody - Fallback)
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

  // Play party music (Directly plays user's uploaded musica.mp3)
  const playPartyMusic = () => {
    if (audioElementRef.current) {
      audioElementRef.current.play()
        .then(() => {
          stopSynthCelebration();
        })
        .catch(() => {
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
      playPartyMusic();
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

  // Start presentation with Luxury Envelope Opening Animation
  const handleOpenEnvelope = () => {
    if (isOpeningEnvelope) return;
    setIsOpeningEnvelope(true);
    triggerConfetti(85);

    // Play music immediately on user touch
    playPartyMusic();

    setTimeout(() => {
      triggerSoftTransition();
      setHasStarted(true);
      setCurrentSlide(0);
      setSlideProgress(0);
      setIsOpeningEnvelope(false);
    }, 900);
  };

  // Replay presentation from slide 0
  const handleReplay = () => {
    goToSlide(0);
    playPartyMusic();
  };

  // Send an interactive wish / reaction to Valentina
  const handleSendReaction = (r: typeof REACTIONS[0], e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;

    triggerConfetti(25, x, y);

    const newId = Date.now() + Math.random();
    setFloatingEmojis((prev) => [...prev, { id: newId, emoji: r.emoji, x: Math.random() * 260 + 40, y: 550 }]);

    setTimeout(() => {
      setFloatingEmojis((prev) => prev.filter((item) => item.id !== newId));
    }, 2200);

    setReactionToast(`¡Enviaste ${r.emoji} "${r.label}" a Valentina!`);
    setTimeout(() => setReactionToast(null), 2500);
  };

  // WhatsApp confirmation: Direct link to WhatsApp
  const handleWhatsApp = () => {
    const phone = party.whatsapp;
    const msg = encodeURIComponent(party.whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  // Google Maps
  const handleMaps = () => {
    window.open(party.mapsUrl, '_blank');
  };

  // Waze Navigation
  const handleWaze = () => {
    window.open(party.wazeUrl, '_blank');
  };

  // Copy Address
  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(party.direccion);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
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

  // Open Ondigu Designer Website
  const handleOpenOndigu = () => {
    window.open(party.designerUrl, '_blank');
  };

  // Contact Ondigu for Custom Invitation
  const handleContactOndigu = () => {
    const msg = encodeURIComponent(
      '¡Hola Ondigu! Vi la invitación digital de Valentina y me encantó. Quisiera consultar para hacer una invitación personalizada para mi evento.'
    );
    window.open(`https://wa.me/5491164270908?text=${msg}`, '_blank');
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative w-full h-screen bg-[#040508] flex items-center justify-center overflow-hidden select-none touch-none"
    >
      {/* Background Birthday Song (musica.mp3) */}
      <audio
        ref={audioElementRef}
        src={party.audioUrl}
        loop
        preload="auto"
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

        {/* 2D Canvas for Sparkling Floating Particles, Confetti & Touch Sparks */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />

        {/* Floating Animated Emojis Burst */}
        <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
          {floatingEmojis.map((item) => (
            <div
              key={item.id}
              className="absolute text-3xl animate-bounce drop-shadow-[0_0_15px_rgba(244,114,182,0.8)] transition-all duration-1000"
              style={{
                left: `${item.x}px`,
                bottom: '120px',
                animation: 'floatUp 2.2s ease-out forwards',
              }}
            >
              {item.emoji}
            </div>
          ))}
        </div>

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
            HEADER TOOLBAR (100% CLEAN: SOUND, AUTO-PLAY, SHARE)
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

          {/* Right Action: Share Link */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              title="Compartir por WhatsApp"
              className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform cursor-pointer hover:bg-white/10"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-200" />
            </button>
          </div>
        </div>

        {/* =========================================================
            MAIN STAGE WITH CINEMATIC CROSSFADE (FUNDIDO CRUZADO)
            ========================================================= */}
        <div className="relative flex-1 w-full overflow-hidden">
          {/* -------------------------------------------------------
              COVER SCREEN: LUXURY ENVELOPE & OPENING EXPERIENCE
              ------------------------------------------------------- */}
          <div
            className={`absolute inset-0 flex flex-col items-center justify-between p-5 pt-16 pb-8 text-center transition-all duration-700 ease-in-out ${
              !hasStarted
                ? 'opacity-100 scale-100 pointer-events-auto z-30 translate-y-0'
                : 'opacity-0 scale-95 pointer-events-none z-0 -translate-y-2'
            }`}
          >
            {/* Top Title Banner */}
            <div>
              <div className="text-[10px] tracking-[4px] text-pink-400 font-extrabold uppercase mb-1 drop-shadow-md flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
                <span>INVITACIÓN VIP EXCLUSIVA</span>
                <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" />
              </div>
              <h1 className="font-editorial text-4xl font-extrabold tracking-[5px] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-pink-200 drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                {party.nombre}
              </h1>
              <div className="text-xs tracking-[4px] text-slate-300 font-bold uppercase mt-0.5">
                CUMPLE {party.edad} AÑOS
              </div>
            </div>

            {/* Main Stage: Side-by-side Real Valentina & YoYa: Sparkle */}
            <div className="relative w-full max-w-[320px] h-[340px] flex items-center justify-center my-auto">
              {/* YoYa: Sparkle Doll */}
              <div className="absolute left-2 w-40 h-[300px] rounded-[26px] overflow-hidden border-2 border-white/40 shadow-[0_20px_45px_rgba(0,0,0,0.9)] -rotate-4 z-10 bg-black">
                <img
                  src={yoyaFrontImg}
                  alt="Muñeca Favorita YoYa Sparkle"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[9px] font-bold text-pink-300">
                  💖 YoYa: Sparkle
                </div>
              </div>

              {/* Real Valentina Portrait */}
              <div className="absolute right-2 bottom-2 w-42 h-[310px] rounded-[26px] overflow-hidden border-3 border-pink-400 shadow-[0_20px_50px_rgba(244,114,182,0.5)] rotate-4 z-20 bg-black">
                <img
                  src={photoSrc}
                  onError={() => setPhotoSrc(vipPortraitFallback)}
                  alt="Valentina"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/30 text-[10px] font-black text-white whitespace-nowrap shadow-lg">
                  👑 VALENTINA
                </div>
              </div>

              {/* Luxury Envelope Stamp "V" Overlay */}
              <div
                onClick={handleOpenEnvelope}
                className={`absolute -bottom-4 z-30 cursor-pointer flex flex-col items-center transition-all duration-700 ${
                  isOpeningEnvelope ? 'scale-125 rotate-12 opacity-0' : 'scale-100 hover:scale-105'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-[0_0_25px_rgba(251,191,36,0.8)] flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-red-800 to-red-950 border border-yellow-300/60 flex items-center justify-center shadow-inner">
                    <span className="font-editorial text-2xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                      V
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-300 bg-black/80 px-2 py-0.5 rounded-full mt-1 border border-yellow-400/40">
                  Toca el sello
                </span>
              </div>
            </div>

            {/* Date and Place Preview */}
            <div className="text-[11px] text-slate-300 font-semibold tracking-wide mb-2">
              📅 {party.fecha} · ⏰ {party.hora}
            </div>

            {/* THE BIG START BUTTON */}
            <button
              onClick={handleOpenEnvelope}
              className="relative w-full max-w-[310px] py-4 px-6 rounded-full font-black text-sm tracking-[2.5px] uppercase bg-gradient-to-r from-white via-slate-100 to-pink-100 text-slate-900 shadow-[0_10px_35px_rgba(255,255,255,0.4),0_0_25px_rgba(244,114,182,0.4)] gleam-effect active:scale-95 transition-transform flex items-center justify-center gap-2.5 cursor-pointer overflow-hidden"
            >
              <Sparkles className="w-5 h-5 text-pink-500 animate-spin" />
              <span>{isOpeningEnvelope ? '¡ABRIENDO...' : '✨ ABRIR INVITACIÓN ✨'}</span>
            </button>
          </div>

          {/* -------------------------------------------------------
              SLIDESHOW CONTAINER (ACTIVE WHEN hasStarted = true)
              ------------------------------------------------------- */}
          <div
            className={`absolute inset-0 flex flex-col justify-between p-4 pt-16 pb-4 text-center select-none overflow-hidden transition-all duration-700 ease-in-out ${
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
              className="absolute left-0 top-14 bottom-24 w-1/4 z-30 cursor-pointer"
              title="Tocar para anterior"
            />
            <div
              onClick={() => {
                if (currentSlide < SLIDE_DURATIONS.length - 1) goToSlide(currentSlide + 1);
              }}
              className="absolute right-0 top-14 bottom-24 w-1/4 z-30 cursor-pointer"
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
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-36 h-50 rounded-2xl overflow-hidden border-2 border-pink-400 shadow-[0_15px_40px_rgba(244,114,182,0.4)] relative bg-black">
                    <img
                      src={photoSrc}
                      onError={() => setPhotoSrc(vipPortraitFallback)}
                      alt="Valentina"
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-bold text-pink-300">
                      👑 Valentina
                    </div>
                  </div>
                  <div className="w-36 h-50 rounded-2xl overflow-hidden border-2 border-white/40 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative bg-black">
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
                <div className="text-xs tracking-[5px] text-slate-300 uppercase font-semibold mt-0.5">
                  CUMPLE
                </div>
                <div className="font-editorial text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_0_30px_rgba(255,255,255,0.7)] leading-none mt-1">
                  {party.edad}
                </div>
                <p className="text-xs text-pink-200/90 font-medium italic mt-2.5 max-w-[280px]">
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

                <div className="w-56 h-[330px] rounded-[28px] overflow-hidden border-2 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_25px_rgba(244,114,182,0.3)] relative bg-black mb-3">
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

              {/* SLIDE 4: COORDENADAS DE LA FIESTA & NAVEGACIÓN */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 ease-in-out ${
                  currentSlide === 3
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div className="w-full max-w-[340px] glass-vip-card rounded-[26px] p-4 text-left border border-white/20 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 via-white to-blue-400" />

                  <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                    <div>
                      <div className="font-editorial text-base font-bold text-white">
                        🌸 TE ESPERAMOS 🌸
                      </div>
                      <div className="text-[10px] text-pink-400 font-bold tracking-wider uppercase">
                        COORDENADAS DE LA FIESTA
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-pink-400 shadow-md">
                      <img
                        src={photoSrc}
                        onError={() => setPhotoSrc(vipPortraitFallback)}
                        alt="Valentina"
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 flex-shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase font-bold text-slate-400">FECHA</div>
                      <div className="text-xs font-extrabold text-white">{party.fecha}</div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white/5 border border-white/10 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[8px] uppercase font-bold text-slate-400">HORARIO</div>
                      <div className="text-xs font-extrabold text-white">{party.hora}</div>
                    </div>
                  </div>

                  {/* Location & Direct Navigation Buttons */}
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-start gap-2.5 mb-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 flex-shrink-0">
                        <Home className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-[8px] uppercase font-bold text-slate-400">LUGAR</div>
                        <div className="text-xs font-extrabold text-white">{party.lugar}</div>
                        <div className="text-[11px] text-pink-300 font-semibold flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{party.direccion}</span>
                        </div>
                      </div>
                    </div>

                    {/* Waze / Google Maps / Copy Address */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10">
                      <button
                        onClick={handleMaps}
                        className="py-1.5 px-2 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/30 text-blue-200 text-[9px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>Maps</span>
                      </button>
                      <button
                        onClick={handleWaze}
                        className="py-1.5 px-2 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/30 text-cyan-200 text-[9px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Waze</span>
                      </button>
                      <button
                        onClick={handleCopyAddress}
                        className="py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[9px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedAddress ? '¡Copiado!' : 'Copiar'}</span>
                      </button>
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
                <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-pink-500 to-purple-500 shadow-[0_0_30px_rgba(244,114,182,0.6)] mb-3">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-white">
                    <img
                      src={photoSrc}
                      onError={() => setPhotoSrc(vipPortraitFallback)}
                      alt="Valentina"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>

                <div className="text-[11px] tracking-[3px] text-pink-400 font-bold uppercase mb-1">
                  ⏳ CUENTA REGRESIVA
                </div>
                <h3 className="font-editorial text-2xl font-black text-white tracking-wider mb-3">
                  ¡CADA VEZ FALTA MENOS!
                </h3>

                <div className="grid grid-cols-4 gap-2 w-full max-w-[310px] mb-3">
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

                <button
                  onClick={handleCalendar}
                  className="py-2 px-4 rounded-full bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-200 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer mb-2"
                >
                  <Calendar className="w-3.5 h-3.5 text-pink-400" />
                  <span>Guardar en mi Calendario</span>
                </button>

                <p className="text-xs text-slate-300 font-medium max-w-[280px]">
                  Contando los segundos para vernos y festejar juntos 🎉🎈
                </p>
              </div>

              {/* SLIDE 6: GRAN FINAL, WHATSAPP & FIRMA DE AUTOR ONDIGU */}
              <div
                className={`absolute inset-0 flex flex-col items-center justify-between py-1 transition-all duration-700 ease-in-out ${
                  currentSlide === 5
                    ? 'opacity-100 scale-100 pointer-events-auto z-20 translate-y-0'
                    : 'opacity-0 scale-95 pointer-events-none z-10 translate-y-1'
                }`}
              >
                <div>
                  <div className="font-script text-4xl text-pink-400 drop-shadow-[0_0_20px_rgba(244,114,182,0.7)]">
                    🎈 ¡No faltes! 🎈
                  </div>
                  <h3 className="font-editorial text-lg font-black tracking-widest text-white mt-0.5">
                    {party.nombre} CUMPLE {party.edad} AÑOS
                  </h3>
                  <p className="text-[11px] text-pink-200/90 italic px-4 font-medium">
                    "{party.mensajeEspecial}"
                  </p>
                </div>

                {/* Trio Display: YoYa Sparkle + Real Valentina */}
                <div className="relative w-64 h-40 flex items-center justify-center my-1">
                  <div className="absolute left-2 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl -rotate-6 z-10 bg-black">
                    <img src={yoyaFrontImg} alt="YoYa Coat" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute right-2 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl rotate-6 z-20 bg-black">
                    <img src={yoyaEarmuffsImg} alt="YoYa Earmuffs" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute bottom-0 w-32 h-38 rounded-2xl overflow-hidden border-3 border-pink-400 shadow-[0_10px_35px_rgba(244,114,182,0.8)] z-30 bg-black">
                    <img
                      src={photoSrc}
                      onError={() => setPhotoSrc(vipPortraitFallback)}
                      alt="Valentina"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>

                {/* Final WhatsApp Action Button */}
                <div className="w-full max-w-[320px] flex flex-col gap-1.5">
                  <button
                    onClick={handleWhatsApp}
                    className="w-full py-3 px-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(16,185,129,0.55)] active:scale-95 transition-all cursor-pointer border border-emerald-400/40 animate-pulse"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>CONFIRMAR ASISTENCIA AL WHATSAPP</span>
                  </button>

                  <div className="flex gap-1.5">
                    <button
                      onClick={handleMaps}
                      className="flex-1 py-2 px-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>MAPS</span>
                    </button>
                    <button
                      onClick={handleCalendar}
                      className="flex-1 py-2 px-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-pink-400" />
                      <span>AGENDAR</span>
                    </button>
                    <button
                      onClick={handleReplay}
                      title="Repetir presentación"
                      className="py-2 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[10px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-200" />
                    </button>
                  </div>

                  {/* =========================================================
                      ONDIGU DESIGNER VIP BRANDING & CLIENT CONVERSION ENGINE
                      ========================================================= */}
                  <div className="mt-1 pt-2 border-t border-white/15 flex flex-col items-center">
                    <div
                      onClick={handleOpenOndigu}
                      className="group cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-pink-400/30 hover:border-pink-300 transition-all shadow-md active:scale-95"
                    >
                      <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
                      <span className="text-[10px] text-slate-300">
                        Diseñado por{' '}
                        <strong className="text-white font-extrabold group-hover:text-pink-300 underline underline-offset-2">
                          {party.designerName}
                        </strong>
                      </span>
                      <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-white" />
                    </div>

                    <button
                      onClick={handleContactOndigu}
                      className="mt-1 text-[9px] font-bold text-pink-300/90 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>✨ ¿Quieres una invitación como esta para tu evento? Toca aquí</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================
                BOTTOM INTERACTIVE WISHES / REACTIONS BAR
                ========================================================= */}
            <div className="w-full flex items-center justify-between pt-1 px-1 z-30">
              <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/15">
                <span className="text-[9px] font-bold text-slate-400 hidden sm:inline">Deseos:</span>
                {REACTIONS.map((r, i) => (
                  <button
                    key={i}
                    onClick={(e) => handleSendReaction(r, e)}
                    title={r.label}
                    className="w-6 h-6 rounded-full hover:scale-125 active:scale-95 transition-transform flex items-center justify-center text-sm cursor-pointer"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>

              {/* Navigation controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (currentSlide > 0) goToSlide(currentSlide - 1);
                  }}
                  disabled={currentSlide === 0}
                  className={`p-1.5 rounded-full bg-black/40 border border-white/15 text-white active:scale-95 transition-all ${
                    currentSlide === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="text-[10px] font-bold text-slate-300 px-1">
                  {currentSlide + 1}/{SLIDE_DURATIONS.length}
                </span>

                <button
                  onClick={() => {
                    if (currentSlide < SLIDE_DURATIONS.length - 1) goToSlide(currentSlide + 1);
                  }}
                  disabled={currentSlide === SLIDE_DURATIONS.length - 1}
                  className={`p-1.5 rounded-full bg-black/40 border border-white/15 text-white active:scale-95 transition-all ${
                    currentSlide === SLIDE_DURATIONS.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Toast Notification */}
        {reactionToast && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 py-2 px-4 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce border border-pink-300/40">
            <Heart className="w-4 h-4 fill-white" />
            <span>{reactionToast}</span>
          </div>
        )}

        {/* Link Copied Notification */}
        {copiedLink && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 py-2 px-4 rounded-full bg-emerald-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>¡Enlace copiado para enviar por WhatsApp!</span>
          </div>
        )}

        {/* Address Copied Notification */}
        {copiedAddress && (
          <div className="absolute top-18 left-1/2 -translate-x-1/2 z-50 py-2 px-4 rounded-full bg-blue-600 text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
            <Copy className="w-4 h-4" />
            <span>¡Dirección copiada al portapapeles!</span>
          </div>
        )}
      </div>
    </div>
  );
}
