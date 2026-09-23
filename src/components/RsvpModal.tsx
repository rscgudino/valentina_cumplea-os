import React, { useState } from 'react';
import { X, MessageCircle, Heart, Users, Utensils, Check } from 'lucide-react';
import { PARTY_CONFIG } from '../config/partyConfig';

interface RsvpModalProps {
  isOpen: boolean;
  onClose: () => void;
  party: typeof PARTY_CONFIG;
  triggerHaptic: (pattern: number | number[]) => void;
}

export const RsvpModal: React.FC<RsvpModalProps> = ({ isOpen, onClose, party, triggerHaptic }) => {
  const [nombre, setNombre] = useState('');
  const [asistencia, setAsistencia] = useState<'si' | 'no'>('si');
  const [adultos, setAdultos] = useState(1);
  const [ninos, setNinos] = useState(1);
  const [menu, setMenu] = useState('Tradicional');
  const [mensaje, setMensaje] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    triggerHaptic([60, 50, 70]);

    const nombreTexto = nombre.trim() ? nombre.trim() : 'Un amigo/a de Valentina';
    const totalAsistentes = asistencia === 'si' ? `${adultos} adulto(s) y ${ninos} niño(s)` : 'No podré asistir';
    
    let text = `🌸 *CONFIRMACIÓN DE ASISTENCIA* 🌸\n`;
    text += `💖 *Cumpleaños de ${party.nombre} (9 Años)*\n`;
    text += `📅 ${party.fecha} · 🏠 ${party.direccion}\n\n`;
    text += `👤 *Invitado/Familia:* ${nombreTexto}\n`;
    text += `✨ *Estado:* ${asistencia === 'si' ? '¡Sí, confirmo con alegría! 🎉' : 'Lamentablemente no podré ir 😢'}\n`;

    if (asistencia === 'si') {
      text += `👨‍👩‍👧‍👦 *Asistentes:* ${totalAsistentes}\n`;
      text += `🍽️ *Preferencia de Menú:* ${menu}\n`;
    }

    if (mensaje.trim()) {
      text += `💌 *Mensaje para Valentina:* "${mensaje.trim()}"\n`;
    }

    const phone = party.whatsapp;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-sm rounded-3xl bg-[#10131d] border border-white/20 p-5 text-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow Header */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

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

        {/* Header Title */}
        <div className="text-center mb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            RSVP Inteligente
          </span>
          <h3 className="font-editorial text-xl font-bold text-white mt-1.5">
            Confirmar Asistencia
          </h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Ayuda a los papás de {party.nombre} a organizar la fiesta
          </p>
        </div>

        {/* Form Body */}
        <div className="space-y-3.5 text-left text-xs">
          {/* Guest Name */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Nombre de la Familia o Invitado(s) *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Familia Gómez / Sofía y mamá"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 text-xs"
            />
          </div>

          {/* Attendance Toggle */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              ¿Podrás asistir?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setAsistencia('si');
                }}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  asistencia === 'si'
                    ? 'bg-pink-600 border-pink-400 text-white shadow-[0_0_15px_rgba(244,114,182,0.4)]'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>¡Sí, asistiré! 🎉</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(20);
                  setAsistencia('no');
                }}
                className={`py-2 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  asistencia === 'no'
                    ? 'bg-zinc-700 border-zinc-500 text-white shadow-md'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>No podré ir 😢</span>
              </button>
            </div>
          </div>

          {/* If YES: Number of Guests */}
          {asistencia === 'si' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <Users className="w-3 h-3 text-pink-400" /> Adultos:
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={() => setAdultos(Math.max(0, adultos - 1))}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm text-white">{adultos}</span>
                    <button
                      type="button"
                      onClick={() => setAdultos(adultos + 1)}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="bg-white/5 p-2.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block flex items-center gap-1">
                    <Heart className="w-3 h-3 text-pink-400" /> Niños:
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <button
                      type="button"
                      onClick={() => setNinos(Math.max(0, ninos - 1))}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm text-white">{ninos}</span>
                    <button
                      type="button"
                      onClick={() => setNinos(ninos + 1)}
                      className="w-6 h-6 rounded-lg bg-white/10 text-white font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Dietary Preferences */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-pink-400" /> Preferencia / Menú Especial:
                </label>
                <select
                  value={menu}
                  onChange={(e) => setMenu(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181c28] border border-white/15 text-white focus:outline-none focus:border-pink-400 text-xs cursor-pointer"
                >
                  <option value="Tradicional">Menú Tradicional (Todo permitido)</option>
                  <option value="Sin TACC / Celíaco">Sin TACC / Celíaco</option>
                  <option value="Vegetariano">Vegetariano</option>
                  <option value="Vegano">Vegano</option>
                  <option value="Alergia a Frutos Secos / Lácteos">Alergia específica</option>
                </select>
              </div>
            </>
          )}

          {/* Optional Message */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Mensaje o Saludo para {party.nombre} (Opcional):
            </label>
            <input
              type="text"
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="¡Feliz cumple Valen, nos vemos pronto!"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white placeholder-slate-500 focus:outline-none focus:border-pink-400 text-xs"
            />
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full mt-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-xs tracking-wider uppercase shadow-[0_10px_25px_rgba(16,185,129,0.4)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Enviar por WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};
