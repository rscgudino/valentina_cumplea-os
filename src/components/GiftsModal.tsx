import React, { useState } from 'react';
import { X, Gift, Copy, Check, Sparkles, Heart } from 'lucide-react';
import { PARTY_CONFIG } from '../config/partyConfig';

interface GiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: typeof PARTY_CONFIG;
  triggerHaptic: (pattern: number | number[]) => void;
}

export const GiftsModal: React.FC<GiftsModalProps> = ({ isOpen, onClose, party, triggerHaptic }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyAlias = () => {
    triggerHaptic([30, 40, 30]);
    navigator.clipboard?.writeText(party.aliasCBU);
    setCopied(true);
    setTimeout(() => setCopied(false), 2800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#10131d] border border-white/20 p-5 text-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close button */}
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 p-0.5 shadow-[0_0_20px_rgba(244,114,182,0.4)] mx-auto flex items-center justify-center mb-2">
            <div className="w-full h-full rounded-2xl bg-[#121624] flex items-center justify-center">
              <Gift className="w-6 h-6 text-pink-400" />
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            Detalles & Cariño
          </span>
          <h3 className="font-editorial text-xl font-bold text-white mt-1">
            Buzón de Regalos
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-[260px] mx-auto">
            {party.regalosSubtitulo}
          </p>
        </div>

        {/* Wishlist / Preferences */}
        <div className="space-y-3 mb-4 text-xs">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[11px] font-bold text-pink-300 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              <span>Gustos & Preferencias de Valentina:</span>
            </div>
            <ul className="space-y-1.5 text-slate-200">
              {party.gustosFavoritos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2 text-[11px]">
                  <span className="text-pink-400">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Virtual Piggy Bank / Transfer Box */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-black/60 border border-pink-500/30 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold uppercase text-amber-300 tracking-wider mb-1">
              <Heart className="w-3 h-3 text-pink-400 fill-pink-400" />
              <span>Lluvia de Sobres / Alcancía Virtual</span>
            </div>
            <p className="text-[10px] text-slate-300 mb-2.5">
              Si prefieres colaborar con su alcancía para sus proyectos y paseos:
            </p>

            <div className="p-2.5 rounded-xl bg-black/60 border border-white/20 mb-2 text-left flex items-center justify-between">
              <div>
                <div className="text-[9px] uppercase font-bold text-slate-400">ALIAS CBU / MP:</div>
                <div className="text-xs font-black text-amber-300 tracking-wider">{party.aliasCBU}</div>
                <div className="text-[9px] text-slate-400">{party.bancoNombre} · {party.titularCuenta}</div>
              </div>
              <button
                onClick={handleCopyAlias}
                className="py-1.5 px-2.5 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footnote */}
        <div className="text-center">
          <p className="text-[11px] text-slate-400 italic">
            ¡Tu presencia y tu abrazo son el mejor obsequio! 💖
          </p>
        </div>
      </div>
    </div>
  );
};
