import React, { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { PARTY_CONFIG } from '../config/partyConfig';

interface DressCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: typeof PARTY_CONFIG;
  triggerHaptic: (pattern: number | number[]) => void;
}

const DRESS_OPTIONS = [
  {
    id: 'denim',
    title: 'Toque Denim Glam 👖',
    tag: 'Casual Chic',
    color: 'from-blue-600/30 to-indigo-900/40',
    borderColor: 'border-blue-400/40',
    desc: 'Jeans con detalles, camperas de denim con parches o strass, faldas vaqueras combinadas con remeras o tops divertidos.',
    tip: '¡Súper cómodo y canchero para bailar!',
  },
  {
    id: 'white',
    title: 'Toque Blanco Puro 🤍',
    tag: 'Fresco & Elegante',
    color: 'from-slate-200/20 to-zinc-800/40',
    borderColor: 'border-white/40',
    desc: 'Remeras, camisas o vestidos blancos con textura limpia. Aporta mucha luz para las fotos del evento.',
    tip: '¡Ideal para combinar con zapatillas o sandalias!',
  },
  {
    id: 'sparkle',
    title: 'Toque Plateado & Sparkle 💎',
    tag: 'Brillo Pasarela',
    color: 'from-pink-500/20 to-purple-900/40',
    borderColor: 'border-pink-400/40',
    desc: 'Lentejuelas, glitter, accesorios plateados, bijou de moda o calzado brillante.',
    tip: '¡El toque de estrella de la pasarela YoYa!',
  },
];

export const DressCodeModal: React.FC<DressCodeModalProps> = ({
  isOpen,
  onClose,
  party,
  triggerHaptic,
}) => {
  const [selectedId, setSelectedId] = useState<string>('denim');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#10131d] border border-white/20 p-5 text-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-blue-500/15 rounded-full blur-2xl pointer-events-none" />

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
        <div className="text-center mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            ¿Qué me pongo?
          </span>
          <h3 className="font-editorial text-xl font-bold text-white mt-1">
            Guía de Dress Code
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {party.dressCode}
          </p>
        </div>

        {/* Interactive Options Cards */}
        <div className="space-y-2.5 mb-4 text-xs">
          {DRESS_OPTIONS.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  triggerHaptic(25);
                  setSelectedId(opt.id);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer bg-gradient-to-r ${opt.color} ${
                  isSelected
                    ? `${opt.borderColor} shadow-[0_0_15px_rgba(244,114,182,0.3)] scale-[1.01]`
                    : 'border-white/10 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    {opt.title}
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-pink-300">
                    {opt.tag}
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">
                  {opt.desc}
                </p>
                <div className="text-[10px] text-pink-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span>{opt.tip}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
          <p className="text-[11px] text-slate-300">
            🌟 Puedes elegir una opción o combinarlas como más te guste. ¡Lo principal es venir con ganas de festejar!
          </p>
        </div>
      </div>
    </div>
  );
};
