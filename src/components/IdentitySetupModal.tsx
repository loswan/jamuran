import React, { useState, useEffect, useRef } from 'react';
import { CharacterType, PlayerProfile } from '../types/game';
import { drawVectorCharacter } from '../renderer/characterRenderer';
import { Modal, Button, Badge, Input } from './ui';
import { User, Palette, Check } from 'lucide-react';

interface IdentitySetupModalProps {
  initialPlayer?: Partial<PlayerProfile>;
  onConfirm: (profile: { name: string; character: CharacterType; colorVariant: number }) => void;
  onCancel?: () => void;
  title?: string;
  submitLabel?: string;
}

export const IdentitySetupModal: React.FC<IdentitySetupModalProps> = ({
  initialPlayer,
  onConfirm,
  onCancel,
  title = 'Identitas Pemain',
  submitLabel = 'Simpan & Lanjutkan'
}) => {
  const [name, setName] = useState<string>(initialPlayer?.name || 'Siswa Jamath');
  const [character, setCharacter] = useState<CharacterType>(initialPlayer?.character || 'boy');
  const [colorVariant, setColorVariant] = useState<number>(initialPlayer?.colorVariant || 0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Pedestal
    ctx.save();
    ctx.fillStyle = '#24564b';
    ctx.strokeStyle = '#f4d7a1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(canvas.width / 2, canvas.height * 0.82, 48, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    drawVectorCharacter(ctx, character, {
      x: canvas.width / 2,
      y: canvas.height * 0.48,
      directionRow: 0,
      walkFrame: 0,
      colorVariant,
      width: 76,
      height: 94
    });
  }, [character, colorVariant]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setErrorMessage('Nama tidak boleh kosong!');
      return;
    }
    if (trimmed.length < 2) {
      setErrorMessage('Nama minimal 2 karakter!');
      return;
    }
    if (trimmed.length > 15) {
      setErrorMessage('Nama maksimal 15 karakter!');
      return;
    }

    setErrorMessage('');
    onConfirm({
      name: trimmed,
      character,
      colorVariant
    });
  };

  const palettes = [
    { label: 'Biru', color: '#2b6cb0' },
    { label: 'Abang', color: '#c53030' },
    { label: 'Ijo', color: '#285e61' },
    { label: 'Wungu', color: '#6b46c1' }
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={title}
      subtitle="Pilih nama & busana tradisional khas Jawa"
      icon={<User className="w-5 h-5 text-[#ffd166]" />}
      badge={<Badge variant="gold" size="sm">PROFIL</Badge>}
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Left Column: Character Preview & Selector */}
          <div className="sm:col-span-5 flex flex-col items-center bg-[#0f2824] p-3 rounded-[16px] border border-[#79b85b]/30">
            <div className="relative">
              <canvas ref={canvasRef} width={130} height={135} className="block" />
              <div className="absolute top-1 left-1">
                <Badge variant="sage" size="sm">Pratinjau</Badge>
              </div>
            </div>

            {/* Character Selector - Strictly 10px radius buttons */}
            <div className="grid grid-cols-2 gap-1.5 w-full mt-2">
              <button
                type="button"
                onClick={() => setCharacter('boy')}
                className={`py-1.5 px-2 rounded-[10px] border-2 text-center transition-all cursor-pointer ${
                  character === 'boy'
                    ? 'bg-[#24564b] border-[#ffd166] text-[#fff1c7] shadow'
                    : 'bg-[#183d38] border-[#79b85b]/30 text-slate-300 hover:bg-[#1a443e]'
                }`}
              >
                <div className="font-bold text-xs">BAGIO</div>
                <div className="text-[9px] text-[#b5d48c]">Blangkon & Surjan</div>
              </button>

              <button
                type="button"
                onClick={() => setCharacter('girl')}
                className={`py-1.5 px-2 rounded-[10px] border-2 text-center transition-all cursor-pointer ${
                  character === 'girl'
                    ? 'bg-[#24564b] border-[#ffd166] text-[#fff1c7] shadow'
                    : 'bg-[#183d38] border-[#79b85b]/30 text-slate-300 hover:bg-[#1a443e]'
                }`}
              >
                <div className="font-bold text-xs">SITI</div>
                <div className="text-[9px] text-[#b5d48c]">Kebaya & Pita</div>
              </button>
            </div>
          </div>

          {/* Right Column: Name Input & Color Swatches */}
          <div className="sm:col-span-7 flex flex-col gap-2.5">
            {/* Standardized Input */}
            <Input
              label="Nama Siswa / Pemain:"
              sublabel="Maksimal 15 karakter"
              error={errorMessage}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMessage) setErrorMessage('');
              }}
              maxLength={15}
              placeholder="Ketik namamu..."
              icon={<User className="w-3.5 h-3.5 text-[#ffd166]" />}
            />

            {/* Color Swatches */}
            <div>
              <label className="block text-xs font-bold text-[#fff1c7] mb-1 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#ffd166]" /> Corak Warna Pakaian:
              </label>
              <div className="grid grid-cols-4 gap-1 bg-[#0f2824] p-1.5 rounded-[12px] border border-[#79b85b]/30">
                {palettes.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setColorVariant(idx)}
                    className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-[10px] text-xs font-semibold transition-all cursor-pointer ${
                      colorVariant === idx
                        ? 'bg-[#24564b] text-[#ffd166] border border-[#ffd166] shadow'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full inline-block border border-white/40 shrink-0"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-[10px]">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2.5 border-t border-[#f4d7a1]/25 flex items-center justify-end gap-2 mt-1">
          {onCancel && (
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size="md"
            icon={<Check className="w-4 h-4" />}
          >
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
