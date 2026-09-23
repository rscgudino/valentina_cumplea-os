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
  Heart,
  Gift,
  Camera,
  Shirt,
  Disc,
  BookOpen
} from 'lucide-react';

// Party Configuration
import { PARTY_CONFIG } from './config/partyConfig';

// Feature Modals
import { RsvpModal } from './components/RsvpModal';
import { GiftsModal } from './components/GiftsModal';
import { DressCodeModal } from './components/DressCodeModal';
import { LookbookModal } from './components/LookbookModal';
import { PhotoboothModal } from './components/PhotoboothModal';

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
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [flashKey, setFlashKey] = useState<number>(0);
  const flashTimeoutRef = useRef<number | null>(null);

  // Party Disco Mode & Feature Modals States
  const [isPartyMode, setIsPartyMode] = useState<boolean>(false);
  const isPartyModeRef = useRef<boolean>(false);
  const partyBeamAngleRef = useRef<number>(0);

  const [showRsvpModal, setShowRsvpModal] = useState<boolean>(false);
  const [showGiftsModal, setShowGiftsModal] = useState<boolean>(false);
  const [showDressCodeModal, setShowDressCodeModal] = useState<boolean>(false);
  const [showLookbookModal, setShowLookbookModal] = useState<boolean>(false);
  const [showPhotoboothModal, setShowPhotoboothModal] = useState<boolean>(false);

  // Sync ref for animation loop
  useEffect(() => {
    isPartyModeRef.current = isPartyMode;
  }, [isPartyMode]);

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
  const bokehListRef = useRef<any[]>([]);
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

  // Subtle runway camera shutter click (Web Audio API)
  const playShutterClick = useCallback(() => {
    if (isMuted || !audioCtxRef.current || !synthGainRef.current) return;
    try {
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') return;
      const t = ctx.currentTime;

      // Quick dual camera shutter impulse
      const osc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.035);

      clickGain.gain.setValueAtTime(0.09, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.045);

      osc.connect(clickGain);
      clickGain.connect(synthGainRef.current);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }, [isMuted]);

  // Photographic Studio Strobe Flash (Estilo Flash de Cámara / Pasarela)
  const triggerPhotoFlash = useCallback(() => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    setIsFlashing(true);
    setFlashKey((k) => k + 1);
    playShutterClick();
    flashTimeoutRef.current = window.setTimeout(() => {
      setIsFlashing(false);
    }, 440);
  }, [playShutterClick]);

  // Soft cinematic ambient flare & photographic strobe flash on slide transition
  const triggerSoftTransition = useCallback(() => {
    setAmbientGlow(true);
    triggerPhotoFlash();
    setTimeout(() => setAmbientGlow(false), 350);
  }, [triggerPhotoFlash]);

  // Helper to detect low-end or budget mobile hardware to optimize performance
  const isLowEndDevice = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    // 1. Hardware Concurrency: 4 or fewer CPU cores is common on entry-level smartphones
    const cores = typeof navigator !== 'undefined' ? (navigator.hardwareConcurrency || 4) : 4;
    // 2. Device RAM Memory (GB) available in modern mobile Chromium/Android
    const memory = typeof navigator !== 'undefined' ? ((navigator as any).deviceMemory || 4) : 4;
    // 3. Mobile screen footprint check
    const isMobile =
      window.innerWidth <= 768 ||
      (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));

    return cores <= 4 || memory < 4 || (isMobile && window.devicePixelRatio < 2.5);
  }, []);

  // Confetti Particle Burst with Adaptive Mobile Performance Limiter
  const triggerConfetti = useCallback(
    (amount = 45, customX?: number, customY?: number, isGranFinal = false) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const lowEnd = isLowEndDevice();
      // Dynamic particle ceilings:
      // On low-end mobile devices, reduce particle count and enforce strict active pool capacity
      const maxGlobalCapacity = lowEnd ? 26 : 70;
      const burstLimit = isGranFinal
        ? (lowEnd ? 20 : 48) // Gran Final: optimized for budget devices
        : (lowEnd ? 12 : Math.min(amount, 36));

      const finalAmount = Math.min(amount, burstLimit);

      // Prune oldest particles if the active pool exceeds device capacity to prevent mobile lag
      if (confettiListRef.current.length + finalAmount > maxGlobalCapacity) {
        const overflow = confettiListRef.current.length + finalAmount - maxGlobalCapacity;
        confettiListRef.current.splice(0, overflow);
      }

      const colors = ['#ffffff', '#f472b6', '#c084fc', '#fcd34d', '#93c5fd', '#fbcfe8', '#ffd700'];
      const centerX = customX !== undefined ? customX : canvas.width / 2;
      const centerY = customY !== undefined ? customY : canvas.height * 0.35;

      const pieces = Array.from({ length: finalAmount }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 2.8 + 1.2;
        return {
          x: centerX + (Math.random() - 0.5) * 80,
          y: centerY + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * speed * 0.9,
          vy: Math.sin(angle) * speed * 0.7 - 1.8,
          gravity: 0.042,
          size: Math.random() * 6 + 3.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * Math.PI,
          rotSpeed: (Math.random() - 0.5) * 0.08,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: Math.random() * 0.05 + 0.02,
          life: 1.5,
        };
      });
      confettiListRef.current.push(...pieces);
    },
    [isLowEndDevice]
  );

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

    // 1. Initialize Luxury Photographic Studio Bokeh Lights (Lentes de estudio f/1.4)
    const bokehPalette = [
      { r: 255, g: 220, b: 175 }, // Champagne Warm Gold
      { r: 244, g: 114, b: 182 }, // Studio Rose Pink
      { r: 192, g: 132, b: 252 }, // Iris Lavender
      { r: 147, g: 197, b: 253 }, // Soft Celestial Blue
      { r: 255, g: 242, b: 225 }, // Soft Warm Ivory
      { r: 251, g: 207, b: 232 }, // Pearl Blush
    ];

    bokehListRef.current = Array.from({ length: 24 }, () => {
      const color = bokehPalette[Math.floor(Math.random() * bokehPalette.length)];
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        baseRadius: Math.random() * 36 + 22, // 22px to 58px radius
        radiusVariation: Math.random() * 12 + 6,
        speedX: (Math.random() - 0.5) * 0.16,
        speedY: (Math.random() - 0.5) * 0.14 - 0.12, // Gentle upward drifting motion
        baseAlpha: Math.random() * 0.11 + 0.05, // Translucent soft glow
        alphaVariation: Math.random() * 0.05 + 0.02,
        phase: Math.random() * Math.PI * 2,
        phaseSpeed: Math.random() * 0.016 + 0.008,
        color,
        hasLensRing: Math.random() > 0.4, // Subtle optical lens aberration ring
      };
    });

    // 2. Initialize Crisp Ambient Star Sparkles
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

      // 0. Dynamic Photographic Studio Bokeh Effect (Círculos desenfocados de luz óptica)
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      bokehListRef.current.forEach((b) => {
        b.x += b.speedX;
        b.y += b.speedY;
        b.phase += b.phaseSpeed;

        const maxR = b.baseRadius + b.radiusVariation;
        if (b.x < -maxR) b.x = canvas.width + maxR;
        if (b.x > canvas.width + maxR) b.x = -maxR;
        if (b.y < -maxR) b.y = canvas.height + maxR;
        if (b.y > canvas.height + maxR) b.y = -maxR;

        // Gentle breathing pulsation in radius and opacity
        const currentR = Math.max(14, b.baseRadius + Math.sin(b.phase) * b.radiusVariation);
        const currentAlpha = Math.max(
          0.025,
          Math.min(0.24, b.baseAlpha + Math.sin(b.phase * 0.85) * b.alphaVariation)
        );

        const grad = ctx.createRadialGradient(b.x, b.y, currentR * 0.15, b.x, b.y, currentR);
        const { r, g, b: blue } = b.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${blue}, ${currentAlpha * 1.3})`);
        grad.addColorStop(0.65, `rgba(${r}, ${g}, ${blue}, ${currentAlpha * 0.7})`);
        if (b.hasLensRing) {
          // Subtle lens iris rim characteristic of 85mm portrait lenses
          grad.addColorStop(0.86, `rgba(${r}, ${g}, ${blue}, ${currentAlpha * 0.95})`);
        }
        grad.addColorStop(1, `rgba(${r}, ${g}, ${blue}, 0)`);

        ctx.beginPath();
        ctx.arc(b.x, b.y, currentR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });
      ctx.restore();

      // 0.5. Dynamic Party Disco Beams (Modo Fiesta 🪩)
      if (isPartyModeRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        partyBeamAngleRef.current += 0.02;
        const t = partyBeamAngleRef.current;
        const discoColors = [
          { r: 244, g: 114, b: 182 }, // Neon Pink
          { r: 56, g: 189, b: 248 },  // Neon Cyan
          { r: 250, g: 204, b: 21 },  // Neon Gold
          { r: 192, g: 132, b: 252 }, // Neon Violet
        ];

        for (let i = 0; i < 4; i++) {
          const angle = t + (i * Math.PI) / 2;
          const originX = canvas.width / 2 + Math.cos(angle) * (canvas.width * 0.35);
          const originY = -30;
          const targetX = canvas.width / 2 + Math.sin(angle * 1.3) * (canvas.width * 0.6);
          const targetY = canvas.height + 30;

          const col = discoColors[i % discoColors.length];
          const grad = ctx.createLinearGradient(originX, originY, targetX, targetY);
          grad.addColorStop(0, `rgba(${col.r}, ${col.g}, ${col.b}, 0.25)`);
          grad.addColorStop(0.5, `rgba(${col.r}, ${col.g}, ${col.b}, 0.12)`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.beginPath();
          ctx.moveTo(originX - 15, originY);
          ctx.lineTo(originX + 15, originY);
          ctx.lineTo(targetX + 60, targetY);
          ctx.lineTo(targetX - 60, targetY);
          ctx.closePath();
          ctx.fillStyle = grad;
          ctx.fill();
        }
        ctx.restore();
      }

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

      // 3. Confetti physics (Papelillos suaves con resistencia al aire y oscilación elegante)
      const conf = confettiListRef.current;
      for (let i = conf.length - 1; i >= 0; i--) {
        const c = conf[i];
        c.vx *= 0.96; // Suave fricción del aire
        c.vy = Math.min(c.vy + c.gravity, 1.35); // Velocidad terminal suave (cae pausadamente)
        c.wobble = (c.wobble || 0) + (c.wobbleSpeed || 0.03);
        c.x += c.vx + Math.sin(c.wobble) * 0.55; // Ondulación suave lateral
        c.y += c.vy;
        c.rotation += c.rotSpeed;
        c.life -= 0.0065; // Desvanecimiento gradual

        if (c.life <= 0 || c.y > canvas.height + 25) {
          conf.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = Math.max(0, Math.min(1, c.life));
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
            triggerConfetti(25, undefined, undefined, false);
            setCurrentSlide((s) => s + 1);
            return 0;
          } else {
            // Gran Final confetti burst with mobile low-end limiter
            triggerConfetti(45, undefined, undefined, true);
            return 100;
          }
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [hasStarted, isPaused, currentSlide, triggerSoftTransition, triggerConfetti]);

  // Safe Navigator Vibration API Haptic Feedback Helper
  const triggerHaptic = useCallback((pattern: number | number[]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  }, []);

  // Jump to specific slide with crossfade
  const goToSlide = (index: number) => {
    triggerHaptic(20);
    triggerSoftTransition();
    triggerConfetti(25, undefined, undefined, index === SLIDE_DURATIONS.length - 1);
    setCurrentSlide(index);
    setSlideProgress(0);
  };

  // Start presentation with Luxury Envelope Opening Animation (Tactile Haptic Feedback)
  const handleOpenEnvelope = () => {
    if (isOpeningEnvelope) return;
    // Haptic feedback pattern: initial wax snap (45ms), pause (60ms), celebration burst (80ms)
    triggerHaptic([45, 60, 80]);
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
    triggerHaptic([30, 40, 30]);
    goToSlide(0);
    playPartyMusic();
  };

  // Send an interactive wish / reaction to Valentina
  const handleSendReaction = (r: typeof REACTIONS[0], e: React.MouseEvent) => {
    triggerHaptic(35);
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

  // WhatsApp confirmation: Direct link to WhatsApp (Tactile Haptic Confirmation)
  const handleWhatsApp = () => {
    // Distinct double pulse confirmation: [60ms, 50ms pause, 70ms]
    triggerHaptic([60, 50, 70]);
    const phone = party.whatsapp;
    const msg = encodeURIComponent(party.whatsappMessage);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  // Google Maps
  const handleMaps = () => {
    triggerHaptic(25);
    window.open(party.mapsUrl, '_blank');
  };

  // Waze Navigation
  const handleWaze = () => {
    triggerHaptic(25);
    window.open(party.wazeUrl, '_blank');
  };

  // Copy Address
  const handleCopyAddress = () => {
    triggerHaptic([30, 40, 30]);
    navigator.clipboard?.writeText(party.direccion);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2500);
  };

  // Google Calendar
  const handleCalendar = () => {
    triggerHaptic(25);
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
    triggerHaptic([30, 40, 30]);
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
    triggerHaptic(25);
    window.open(party.designerUrl, '_blank');
  };

  // Contact Ondigu for Custom Invitation
  const handleContactOndigu = () => {
    triggerHaptic([40, 50, 60]);
    const msg = encodeURIComponent(
      '¡Hola Ondigu! Vi la invitación digital de Valentina y me encantó. Quisiera consultar para hacer una invitación personalizada para mi evento.'
    );
    window.open(`https://wa.me/5491164270908?text=${msg}`, '_blank');
  };

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      className="relative w-full h-[100dvh] min-h-[100dvh] bg-[#040508] flex items-center justify-center overflow-hidden select-none touch-none"
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

        {/* Photographic Strobe Flash Layer (Efecto Flash Fotográfico / Estrobo de Pasarela) */}
        {isFlashing && (
          <div
            key={`strobe-flash-${flashKey}`}
            className="absolute inset-0 pointer-events-none z-50 animate-photo-flash bg-white"
            style={{ willChange: 'opacity' }}
          >
            {/* Center High-Intensity Xenon Lens Bloom */}
            <div className="absolute inset-0 bg-radial from-white via-white/85 to-transparent" />
          </div>
        )}

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

          {/* Right Action: Party Disco Mode & Share Link */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                triggerHaptic(30);
                setIsPartyMode(!isPartyMode);
                triggerConfetti(30);
              }}
              title="Activar / Desactivar Modo Fiesta con Luces"
              className={`px-2.5 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 text-xs shadow-lg active:scale-95 transition-all cursor-pointer ${
                isPartyMode
                  ? 'bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 border-pink-300 text-white shadow-[0_0_15px_rgba(244,114,182,0.6)] animate-pulse'
                  : 'bg-black/60 border-white/20 text-slate-300 hover:text-white'
              }`}
            >
              <span className="text-xs">🪩</span>
              <span className="text-[9px] font-black uppercase tracking-wider">{isPartyMode ? 'Disco ON' : 'Fiesta'}</span>
            </button>

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
            <div className="relative w-full max-w-[320px] h-[305px] flex items-center justify-center my-auto">
              {/* YoYa: Sparkle Doll */}
              <div className="absolute left-2 w-40 h-[285px] rounded-[26px] overflow-hidden border-2 border-white/40 shadow-[0_20px_45px_rgba(0,0,0,0.9)] -rotate-4 z-10 bg-black">
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
              <div className="absolute right-2 bottom-0 w-42 h-[290px] rounded-[26px] overflow-hidden border-3 border-pink-400 shadow-[0_20px_50px_rgba(244,114,182,0.5)] rotate-4 z-20 bg-black">
                <img
                  src={photoSrc}
                  onError={() => setPhotoSrc(vipPortraitFallback)}
                  alt="Valentina"
                  className="w-full h-full object-cover object-top"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/30 text-[10px] font-black text-white whitespace-nowrap shadow-lg">
                  👑 VALENTINA
                </div>
              </div>
            </div>

            {/* Luxury Wax Stamp "V" Button - BAJADO para que no toque las fotos */}
            <div
              onClick={handleOpenEnvelope}
              className={`cursor-pointer flex flex-col items-center mt-3 mb-2 transition-all duration-700 active:scale-95 z-30 ${
                isOpeningEnvelope ? 'scale-125 rotate-12 opacity-0' : 'scale-100 hover:scale-105'
              }`}
            >
              <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-0.5 shadow-[0_0_25px_rgba(251,191,36,0.85)] flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-red-800 to-red-950 border border-yellow-300/60 flex items-center justify-center shadow-inner">
                  <span className="font-editorial text-2xl font-black text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    V
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-yellow-300 bg-black/80 px-2.5 py-0.5 rounded-full mt-1 border border-yellow-400/40 shadow-sm">
                Toca el sello para abrir
              </span>
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
            className={`absolute inset-0 flex flex-col justify-between p-3 pt-14 pb-8 sm:pb-6 text-center select-none overflow-hidden transition-all duration-700 ease-in-out ${
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

                {/* Interactive Modals: Dress Code Guide & Lookbook */}
                <div className="flex items-center gap-2 mt-2.5 w-full max-w-[300px]">
                  <button
                    onClick={() => {
                      triggerHaptic(25);
                      setShowDressCodeModal(true);
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 border border-pink-400/40 text-pink-300 text-[10px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <Shirt className="w-3.5 h-3.5" />
                    <span>Guía Dress Code</span>
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(25);
                      setShowLookbookModal(true);
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[10px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-300" />
                    <span>Ver Lookbook</span>
                  </button>
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

                    {/* Gifts Mailbox Direct Access */}
                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        setShowGiftsModal(true);
                      }}
                      className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 hover:from-amber-400 hover:to-purple-500 border-2 border-amber-300 text-white text-[11px] font-black tracking-wider uppercase flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.65)]"
                    >
                      <Gift className="w-4 h-4 text-white fill-white" />
                      <span>Buzón de Regalos & Cariño 🎁</span>
                    </button>
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
                <div className="relative w-56 h-32 sm:h-38 flex items-center justify-center my-0.5">
                  <div className="absolute left-2 w-24 sm:w-28 h-28 sm:h-34 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl -rotate-6 z-10 bg-black">
                    <img src={yoyaFrontImg} alt="YoYa Coat" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute right-2 w-24 sm:w-28 h-28 sm:h-34 rounded-2xl overflow-hidden border-2 border-white/30 shadow-xl rotate-6 z-20 bg-black">
                    <img src={yoyaEarmuffsImg} alt="YoYa Earmuffs" className="w-full h-full object-cover object-top" />
                  </div>
                  <div className="absolute bottom-0 w-28 sm:w-32 h-32 sm:h-38 rounded-2xl overflow-hidden border-3 border-pink-400 shadow-[0_10px_35px_rgba(244,114,182,0.8)] z-30 bg-black">
                    <img
                      src={photoSrc}
                      onError={() => setPhotoSrc(vipPortraitFallback)}
                      alt="Valentina"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>

                {/* Final WhatsApp Action Button & Interactive Features */}
                <div className="w-full max-w-[320px] flex flex-col gap-1.5">
                  <button
                    onClick={() => {
                      triggerHaptic([60, 50, 70]);
                      setShowRsvpModal(true);
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.7),0_6px_20px_rgba(0,0,0,0.6)] active:scale-95 transition-all cursor-pointer border-2 border-emerald-300 animate-pulse"
                  >
                    <MessageCircle className="w-5 h-5 fill-white" />
                    <span>CONFIRMAR ASISTENCIA (RSVP)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 my-0.5">
                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        setShowPhotoboothModal(true);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-fuchsia-600 to-purple-600 hover:from-pink-400 hover:to-purple-500 border-2 border-pink-300 text-white font-black text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(236,72,153,0.65)]"
                    >
                      <Camera className="w-4 h-4 text-white" />
                      <span>📸 PHOTOBOOTH</span>
                    </button>
                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        setShowGiftsModal(true);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 border-2 border-amber-300 text-white font-black text-[11px] tracking-wider uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.65)]"
                    >
                      <Gift className="w-4 h-4 text-white" />
                      <span>🎁 REGALOS</span>
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={handleMaps}
                      className="flex-1 py-1.5 px-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-blue-400" />
                      <span>MAPS</span>
                    </button>
                    <button
                      onClick={handleCalendar}
                      className="flex-1 py-1.5 px-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[10px] tracking-wider uppercase flex items-center justify-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <Calendar className="w-3 h-3 text-pink-400" />
                      <span>AGENDAR</span>
                    </button>
                    <button
                      onClick={handleReplay}
                      title="Repetir presentación"
                      className="py-1.5 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-[10px] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
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
                BOTTOM INTERACTIVE WISHES / REACTIONS BAR (ELEVATED DOCK)
                ========================================================= */}
            <div className="w-full flex items-center justify-between px-2.5 py-1.5 mb-2 sm:mb-1 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_10px_30px_rgba(0,0,0,0.85)] z-30">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-[10px] font-extrabold text-pink-300 hidden xs:inline pr-1">Deseos:</span>
                {REACTIONS.map((r, i) => (
                  <button
                    key={i}
                    onClick={(e) => handleSendReaction(r, e)}
                    title={r.label}
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 active:scale-125 transition-transform flex items-center justify-center text-sm cursor-pointer shadow-sm"
                  >
                    {r.emoji}
                  </button>
                ))}
              </div>

              {/* Navigation controls & Page counter */}
              <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-xl border border-white/15">
                <button
                  onClick={() => {
                    if (currentSlide > 0) goToSlide(currentSlide - 1);
                  }}
                  disabled={currentSlide === 0}
                  className={`p-1 rounded-lg bg-black/40 border border-white/20 text-white active:scale-90 transition-all ${
                    currentSlide === 0 ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:bg-pink-600/40'
                  }`}
                  aria-label="Diapositiva anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <span className="text-xs font-black text-white px-1 tracking-wider whitespace-nowrap">
                  {currentSlide + 1} <span className="text-slate-400 font-normal">/</span> {SLIDE_DURATIONS.length}
                </span>

                <button
                  onClick={() => {
                    if (currentSlide < SLIDE_DURATIONS.length - 1) goToSlide(currentSlide + 1);
                  }}
                  disabled={currentSlide === SLIDE_DURATIONS.length - 1}
                  className={`p-1 rounded-lg bg-black/40 border border-white/20 text-white active:scale-90 transition-all ${
                    currentSlide === SLIDE_DURATIONS.length - 1 ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer hover:bg-pink-600/40'
                  }`}
                  aria-label="Diapositiva siguiente"
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

        {/* =========================================================
            FEATURE MODALS (RSVP, GIFTS, DRESS CODE, LOOKBOOK, PHOTOBOOTH)
            ========================================================= */}
        <RsvpModal
          isOpen={showRsvpModal}
          onClose={() => setShowRsvpModal(false)}
          party={party}
          triggerHaptic={triggerHaptic}
        />

        <GiftsModal
          isOpen={showGiftsModal}
          onClose={() => setShowGiftsModal(false)}
          party={party}
          triggerHaptic={triggerHaptic}
        />

        <DressCodeModal
          isOpen={showDressCodeModal}
          onClose={() => setShowDressCodeModal(false)}
          party={party}
          triggerHaptic={triggerHaptic}
        />

        <LookbookModal
          isOpen={showLookbookModal}
          onClose={() => setShowLookbookModal(false)}
          party={party}
          triggerHaptic={triggerHaptic}
        />

        <PhotoboothModal
          isOpen={showPhotoboothModal}
          onClose={() => setShowPhotoboothModal(false)}
          party={party}
          triggerHaptic={triggerHaptic}
        />
      </div>
    </div>
  );
}
