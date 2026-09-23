import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Download, RefreshCw, Upload, Image as ImageIcon, Sparkles, MessageCircle } from 'lucide-react';
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
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Stop live camera stream cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Attempt live webcam stream (desktop or supported mobile browsers)
  const startLiveCamera = async () => {
    try {
      setCameraError(null);
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Navegador no soporta cámara en vivo');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
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
      setCameraError('Cámara en vivo no disponible. Usa el botón "Abrir Cámara del Celular" para tomarte tu selfie.');
      setCameraActive(false);
    }
  };

  // Close cleanup
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Draw framed photo with high fidelity and proper aspect ratio cover
  const drawFrameOnCanvas = (sourceImage: HTMLVideoElement | HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution canvas for sharp mobile download (750x1000)
    const width = 750;
    const height = 1000;
    canvas.width = width;
    canvas.height = height;

    // Calculate source dimensions safely
    let srcW = width;
    let srcH = height;
    if (sourceImage instanceof HTMLVideoElement) {
      srcW = sourceImage.videoWidth || width;
      srcH = sourceImage.videoHeight || height;
    } else if (sourceImage instanceof HTMLImageElement) {
      srcW = sourceImage.naturalWidth || sourceImage.width || width;
      srcH = sourceImage.naturalHeight || sourceImage.height || height;
    }

    // Object-fit: cover calculation (centers face/photo without distortion)
    const scale = Math.max(width / srcW, height / srcH);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (srcW - sw) / 2;
    const sy = (srcH - sh) / 2;

    ctx.save();
    // If live video front camera, mirror horizontally
    if (sourceImage instanceof HTMLVideoElement) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(sourceImage, sx, sy, sw, sh, 0, 0, width, height);
    ctx.restore();

    // Studio vignette gradient overlay for high contrast and elegance
    const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
    topGrad.addColorStop(0, 'rgba(10, 10, 18, 0.85)');
    topGrad.addColorStop(0.6, 'rgba(10, 10, 18, 0.45)');
    topGrad.addColorStop(1, 'rgba(10, 10, 18, 0.0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, 180);

    const bottomGrad = ctx.createLinearGradient(0, height - 220, 0, height);
    bottomGrad.addColorStop(0, 'rgba(10, 10, 18, 0.0)');
    bottomGrad.addColorStop(0.4, 'rgba(10, 10, 18, 0.65)');
    bottomGrad.addColorStop(1, 'rgba(10, 10, 18, 0.92)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, height - 220, width, 220);

    // Outer Decorative Studio Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.strokeRect(18, 18, width - 36, height - 36);

    ctx.strokeStyle = '#f472b6'; // Rose pink
    ctx.lineWidth = 4;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // Corner Sparkle Accents
    ctx.fillStyle = '#fcd34d'; // Amber gold
    ctx.font = '24px sans-serif';
    ctx.fillText('✨', 38, 55);
    ctx.fillText('✨', width - 65, 55);

    // Magazine Header Texts
    ctx.textAlign = 'center';
    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('★ FASHION BIRTHDAY · VIP EDITION ★', width / 2, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px "Playfair Display", Georgia, serif';
    ctx.fillText(party.nombre.toUpperCase(), width / 2, 126);

    ctx.fillStyle = '#fcd34d';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`CUMPLE ${party.edad} AÑOS`, width / 2, 158);

    // Bottom Celebration Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Playfair Display", Georgia, serif';
    ctx.fillText('YoYa: Sparkle Celebration', width / 2, height - 105);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`📅 ${party.fecha} · ${party.lugar}`, width / 2, height - 70);

    ctx.fillStyle = '#f472b6';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('¡Recuerdo inolvidable con Valentina! 💕', width / 2, height - 42);

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    setCapturedImage(dataUrl);
    setIsProcessing(false);
    stopCamera();
  };

  // Live video capture
  const handleCaptureLive = () => {
    triggerHaptic([40, 50, 60]);
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      setIsProcessing(true);
      drawFrameOnCanvas(videoRef.current);
    } else {
      // Fallback to native camera input
      cameraInputRef.current?.click();
    }
  };

  // Handle image selected from Native Camera or Gallery
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic(30);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        drawFrameOnCanvas(img);
      };
      img.onerror = () => {
        setIsProcessing(false);
        setCameraError('No se pudo procesar la imagen seleccionada.');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);

    // Reset input value so same photo can be picked again if desired
    e.target.value = '';
  };

  // Open native camera (Selfie mode)
  const handleOpenNativeCamera = () => {
    triggerHaptic(30);
    cameraInputRef.current?.click();
  };

  // Open native gallery
  const handleOpenGallery = () => {
    triggerHaptic(25);
    galleryInputRef.current?.click();
  };

  // Download photo
  const handleDownload = () => {
    triggerHaptic([30, 40, 30]);
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.download = `recuerdo-valentina-9-anos-${Date.now()}.png`;
    link.href = capturedImage;
    link.click();
  };

  // Retake
  const handleRetake = () => {
    triggerHaptic(20);
    setCapturedImage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#0f121d] border border-white/20 p-4 sm:p-5 text-white shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
        {/* Ambient Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic(20);
            stopCamera();
            onClose();
          }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer z-30"
          aria-label="Cerrar Photobooth"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-2.5 flex-shrink-0">
          <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            Selfie Photobooth VIP
          </span>
          <h3 className="font-editorial text-xl font-bold text-white mt-1">
            Marco de Recuerdo
          </h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            Sácate una foto con el marco oficial de Valentina 🌸
          </p>
        </div>

        {/* Hidden File Inputs for Native Camera & Gallery */}
        {/* capture="user" opens the phone's front camera immediately on iOS & Android */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handleFileSelected}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />

        {/* Hidden Canvas for High-Resolution Composition */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Stage Container */}
        <div className="relative w-full flex-1 min-h-[300px] max-h-[420px] rounded-2xl overflow-hidden bg-zinc-950 border border-white/20 shadow-inner flex items-center justify-center mb-3">
          {capturedImage ? (
            /* Result Photo Framed */
            <div className="relative w-full h-full flex items-center justify-center bg-black p-1">
              <img
                src={capturedImage}
                alt="Tu recuerdo con marco"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
          ) : isProcessing ? (
            /* Processing Loader */
            <div className="text-center p-4">
              <Sparkles className="w-10 h-10 text-pink-400 animate-spin mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Preparando tu marco VIP...</p>
            </div>
          ) : cameraActive ? (
            /* Live Web Stream */
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between border-4 border-white/60">
                <div className="text-center pt-2">
                  <div className="text-[9px] font-bold text-pink-400">✨ FASHION BIRTHDAY ✨</div>
                  <div className="font-editorial text-2xl font-black text-white">{party.nombre}</div>
                  <div className="text-[10px] font-bold text-amber-300">CUMPLE {party.edad} AÑOS</div>
                </div>
                <div className="text-center pb-2">
                  <div className="text-[11px] font-bold text-white">YoYa: Sparkle Celebration</div>
                </div>
              </div>
            </div>
          ) : (
            /* Interactive Welcome Camera Launcher (Guaranteed Native Support) */
            <div className="p-4 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-600 p-0.5 shadow-[0_0_25px_rgba(244,114,182,0.6)] mb-3 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#121624] flex items-center justify-center">
                  <Camera className="w-8 h-8 text-pink-400 animate-pulse" />
                </div>
              </div>

              <h4 className="font-editorial text-base font-bold text-white mb-1">
                ¡Sonríe para la cámara!
              </h4>
              <p className="text-xs text-slate-300 max-w-[240px] mb-4">
                Toma una selfie con tu celular o elige una foto de tu galería para agregarle el marco de la fiesta.
              </p>

              <div className="w-full space-y-2">
                <button
                  onClick={handleOpenNativeCamera}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(244,114,182,0.5)] active:scale-95 transition-all cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Abrir Cámara del Celular</span>
                </button>

                <button
                  onClick={handleOpenGallery}
                  className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-amber-300" />
                  <span>Elegir Foto de la Galería</span>
                </button>
              </div>

              {cameraError && (
                <p className="text-[10px] text-amber-300 mt-2 px-2">{cameraError}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex-shrink-0">
          {capturedImage ? (
            <div className="space-y-2">
              <button
                onClick={handleDownload}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.5)] active:scale-95 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Foto de Recuerdo</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleOpenNativeCamera}
                  className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Tomar Otra</span>
                </button>
                <button
                  onClick={handleOpenGallery}
                  className="py-2.5 px-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Otra</span>
                </button>
              </div>
            </div>
          ) : cameraActive ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCaptureLive}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(244,114,182,0.5)] active:scale-95 transition-all cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Capturar Foto</span>
              </button>
              <button
                onClick={handleOpenNativeCamera}
                title="Usar cámara nativa del celular"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
