import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Download, RefreshCw, Sparkles, Upload } from 'lucide-react';
import { PARTY_CONFIG } from '../config/partyConfig';

interface PhotoboothModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: typeof PARTY_CONFIG;
  triggerHaptic: (pattern: number | number[]) => void;
}

export const PhotoboothModal: React.FC<PhotoboothModalProps> = ({
  isOpen,
  onClose,
  party,
  triggerHaptic,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Start webcam
  const startCamera = async () => {
    try {
      setErrorMsg(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setErrorMsg('No se pudo acceder a la cámara. Puedes subir una foto desde tu galería.');
      setCameraActive(false);
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, capturedImage]);

  if (!isOpen) return null;

  // Composite Photo with Magazine / Party Frame on Canvas
  const drawFrameOnCanvas = (sourceImage: HTMLVideoElement | HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;

    // Draw background/photo
    ctx.drawImage(sourceImage, 0, 0, width, height);

    // Vignette / Studio darkening for high legibility
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0,0,0,0.5)');
    grad.addColorStop(0.2, 'rgba(0,0,0,0.0)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0.2)');
    grad.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative Studio Outer Frame
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 10;
    ctx.strokeRect(15, 15, width - 30, height - 30);

    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, 22, width - 44, height - 44);

    // Magazine Header
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✨ FASHION BIRTHDAY · VIP EDITION ✨', width / 2, 55);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 42px "Playfair Display", Georgia, serif';
    ctx.fillText(party.nombre, width / 2, 98);

    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(`CUMPLE ${party.edad} AÑOS`, width / 2, 125);

    // Bottom Celebration Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Playfair Display", Georgia, serif';
    ctx.fillText('YoYa: Sparkle Celebration', width / 2, height - 80);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px sans-serif';
    ctx.fillText(`📅 ${party.fecha} · ${party.lugar}`, width / 2, height - 52);

    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Recuerdo exclusivo del cumpleaños', width / 2, height - 30);

    const dataUrl = canvas.toDataURL('image/png');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  // Capture from live camera
  const handleCapture = () => {
    triggerHaptic([40, 50, 60]);
    if (videoRef.current) {
      drawFrameOnCanvas(videoRef.current);
    }
  };

  // Handle upload file fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    triggerHaptic(25);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        drawFrameOnCanvas(img);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Download resulting photo
  const handleDownload = () => {
    triggerHaptic([30, 40, 30]);
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `recuerdo-${party.nombre.toLowerCase()}-9-anos.png`;
    link.href = capturedImage;
    link.click();
  };

  const handleRetake = () => {
    triggerHaptic(20);
    setCapturedImage(null);
    startCamera();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#10131d] border border-white/20 p-5 text-white shadow-2xl overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic(20);
            stopCamera();
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            Selfie Photobooth
          </span>
          <h3 className="font-editorial text-xl font-bold text-white mt-1">
            Marco de Recuerdo VIP
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            ¡Sácate una foto con el marco oficial de la fiesta!
          </p>
        </div>

        {/* Hidden Canvas for Composition */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Stage Container */}
        <div className="relative w-full h-[360px] rounded-2xl overflow-hidden bg-zinc-950 border border-white/20 shadow-inner flex items-center justify-center mb-3">
          {capturedImage ? (
            /* Result Image */
            <img
              src={capturedImage}
              alt="Recuerdo capturado"
              className="w-full h-full object-contain bg-black"
            />
          ) : cameraActive ? (
            /* Live Camera Stream with Magazine Preview Overlay */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              {/* Live Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between border-8 border-white/60">
                <div className="text-center pt-2">
                  <div className="text-[10px] font-bold text-pink-400">✨ FASHION BIRTHDAY ✨</div>
                  <div className="font-editorial text-2xl font-black text-white">{party.nombre}</div>
                  <div className="text-[11px] font-bold text-amber-300">CUMPLE {party.edad} AÑOS</div>
                </div>
                <div className="text-center pb-2">
                  <div className="text-xs font-bold text-white">YoYa: Sparkle Celebration</div>
                  <div className="text-[10px] text-pink-300 font-semibold">{party.fecha}</div>
                </div>
              </div>
            </div>
          ) : (
            /* Fallback or Permission denied */
            <div className="p-4 text-center">
              <Camera className="w-12 h-12 text-slate-500 mx-auto mb-2" />
              <p className="text-xs text-slate-400 mb-3">{errorMsg || 'Iniciando cámara...'}</p>
              <label className="py-2 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Subir foto desde la galería</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="space-y-2">
          {capturedImage ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="py-2.5 px-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Foto</span>
              </button>
              <button
                onClick={handleRetake}
                className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 active:scale-95 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Tomar Otra</span>
              </button>
            </div>
          ) : cameraActive ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCapture}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,114,182,0.5)] active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Tomar Foto</span>
              </button>
              <label className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white border border-white/20 flex items-center justify-center cursor-pointer">
                <Upload className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
