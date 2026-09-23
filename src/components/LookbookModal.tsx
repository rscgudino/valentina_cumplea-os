import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Heart, Sparkles } from 'lucide-react';
import { PARTY_CONFIG } from '../config/partyConfig';

import yoyaFrontImg from '../assets/images/yoya_sparkle_front_1790183065047.jpg';
import yoyaPortraitImg from '../assets/images/yoya_sparkle_portrait_1790183121361.jpg';
import yoyaEarmuffsImg from '../assets/images/yoya_sparkle_earmuffs_1790183089432.jpg';
import vipPortraitFallback from '../assets/images/valentina_portrait_vip_1790182204136.jpg';

interface LookbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: typeof PARTY_CONFIG;
  triggerHaptic: (pattern: number | number[]) => void;
}

export const LookbookModal: React.FC<LookbookModalProps> = ({
  isOpen,
  onClose,
  party,
  triggerHaptic,
}) => {
  const [activePhoto, setActivePhoto] = useState(0);

  const photos = [
    {
      src: party.valentinaPhotoUrl || vipPortraitFallback,
      fallback: vipPortraitFallback,
      title: 'Valentina · 9 Años',
      subtitle: 'La estrella del cumpleaños 👑',
      tag: 'Birthday Girl',
    },
    {
      src: yoyaFrontImg,
      fallback: yoyaFrontImg,
      title: 'YoYa: Sparkle',
      subtitle: 'Su muñeca favorita en pasarela ✨',
      tag: 'Fashion Doll',
    },
    {
      src: yoyaPortraitImg,
      fallback: yoyaPortraitImg,
      title: 'Portrait Glam',
      subtitle: 'Look de estudio fotográfico 📸',
      tag: 'Studio Edition',
    },
    {
      src: yoyaEarmuffsImg,
      fallback: yoyaEarmuffsImg,
      title: 'Cozy Chic',
      subtitle: 'Estilo de invierno glamuroso ❄️',
      tag: 'Winter Glow',
    },
  ];

  if (!isOpen) return null;

  const current = photos[activePhoto];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#10131d] border border-white/20 p-5 text-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            triggerHaptic(20);
            onClose();
          }}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-3">
          <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            Lookbook Exclusivo
          </span>
          <h3 className="font-editorial text-xl font-bold text-white mt-1">
            Galería de Pasarela
          </h3>
        </div>

        {/* Polaroid Card */}
        <div className="bg-white p-3 pb-4 rounded-2xl shadow-2xl text-slate-900 text-center relative mb-3">
          <div className="relative w-full h-64 rounded-xl overflow-hidden bg-zinc-900 border border-slate-200">
            <img
              src={current.src}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = current.fallback;
              }}
              alt={current.title}
              className="w-full h-full object-cover object-top"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[9px] font-extrabold text-pink-300">
              {current.tag}
            </div>
          </div>

          <div className="pt-2.5">
            <div className="font-editorial text-base font-black tracking-wide text-slate-900">
              {current.title}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
              {current.subtitle}
            </div>
          </div>
        </div>

        {/* Photo Selector Thumbnails & Navigation */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => {
              triggerHaptic(20);
              setActivePhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex gap-1.5 overflow-x-auto py-1">
            {photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => {
                  triggerHaptic(20);
                  setActivePhoto(idx);
                }}
                className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 cursor-pointer ${
                  activePhoto === idx
                    ? 'border-pink-400 scale-105 shadow-[0_0_10px_rgba(244,114,182,0.5)]'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={p.src}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = p.fallback;
                  }}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              triggerHaptic(20);
              setActivePhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
            }}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
