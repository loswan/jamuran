import React, { useState, useRef, useEffect } from 'react';
import { GameMode, PlayerProfile, RoomState } from '../types/game';
import { multiplayerService } from '../services/multiplayerService';
import { Modal, Button, Badge } from './ui';
import { PlusCircle, LogIn, Users, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { playUIClick } from '../audio/uiSound';

interface RoomJoinCreateModalProps {
  player: PlayerProfile;
  mode: GameMode;
  onSuccess: (roomState?: RoomState) => void;
  onClose: () => void;
  onChangeIdentity: () => void;
}

export const RoomJoinCreateModal: React.FC<RoomJoinCreateModalProps> = ({
  player,
  mode,
  onSuccess,
  onClose,
  onChangeIdentity
}) => {
  const [activeTab, setActiveTab] = useState<'JOIN' | 'CREATE'>('JOIN');
  const [roomCode, setRoomCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const cleanupRef = useRef<(() => void) | null>(null);

  const clearPendingListeners = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearPendingListeners();
    };
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = roomCode.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Masukkan kode room!');
      return;
    }
    if (cleanCode.length < 3) {
      setErrorMsg('Kode room minimal 3 karakter!');
      return;
    }

    clearPendingListeners();
    setIsLoading(true);
    setErrorMsg('');

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        setErrorMsg('Waktu tunggu koneksi habis. Periksa kode room.');
      }
    }, 8000);

    const unsubscribeError = multiplayerService.onError((err) => {
      if (!settled) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        setErrorMsg(err);
      }
    });

    const unsubscribeState = multiplayerService.onStateUpdate((state) => {
      if (!settled && state.roomCode === cleanCode) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        onSuccess(state);
      }
    });

    cleanupRef.current = () => {
      window.clearTimeout(timeoutId);
      unsubscribeError();
      unsubscribeState();
    };

    try {
      await multiplayerService.joinRoom(cleanCode, {
        id: player.id,
        name: player.name,
        character: player.character,
        colorVariant: player.colorVariant
      });
    } catch (err: any) {
      if (!settled) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        setErrorMsg(err?.message || 'Gagal terhubung ke server');
      }
    }
  };

  const handleCreate = async () => {
    clearPendingListeners();
    setIsLoading(true);
    setErrorMsg('');

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        setErrorMsg('Gagal membuat room. Periksa koneksi internet.');
      }
    }, 8000);

    const unsubscribeError = multiplayerService.onError((err) => {
      if (!settled) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        setErrorMsg(err);
      }
    });

    const unsubscribeState = multiplayerService.onStateUpdate((state) => {
      if (!settled && state.roomCode) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        onSuccess(state);
      }
    });

    cleanupRef.current = () => {
      window.clearTimeout(timeoutId);
      unsubscribeError();
      unsubscribeState();
    };

    try {
      await multiplayerService.createRoom(mode, {
        id: player.id,
        name: player.name,
        character: player.character,
        colorVariant: player.colorVariant
      });
    } catch (err: any) {
      if (!settled) {
        settled = true;
        clearPendingListeners();
        setIsLoading(false);
        setErrorMsg(err?.message || 'Gagal membuat room');
      }
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="MULTIPLAYER KELAS ONLINE"
      subtitle="Masuk atau buat room permainan untuk seluruh kelas"
      icon={<Users className="w-5 h-5 text-[#ffd166]" />}
      badge={<Badge variant="gold" size="sm">ROOM</Badge>}
      maxWidthClass="max-w-lg"
    >
      <div className="flex flex-col gap-3">
        {/* Current Player Banner */}
        <div className="p-2.5 bg-[#0f2824] rounded-[12px] border border-[#79b85b]/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <UserCheck className="w-4 h-4 text-[#ffd166] shrink-0" />
            <span className="text-slate-400">Pemain:</span>
            <span className="font-bold text-[#fff1c7] truncate">{player.name}</span>
            <span className="text-[10px] text-[#b5d48c] shrink-0">
              ({player.character === 'boy' ? 'Bagio' : 'Siti'})
            </span>
          </div>
          <button
            onClick={() => {
              playUIClick();
              onChangeIdentity();
            }}
            className="text-[11px] font-bold text-[#ffd166] hover:underline cursor-pointer shrink-0 ml-2"
          >
            Ubah
          </button>
        </div>

        {/* Tab Controls - Strictly 10px radius */}
        <div className="flex bg-[#0f2824] p-1 rounded-[12px] border border-white/10">
          <button
            type="button"
            onClick={() => {
              playUIClick();
              setActiveTab('JOIN');
              setErrorMsg('');
            }}
            className={`flex-1 min-h-[38px] py-1.5 text-xs font-bold rounded-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'JOIN'
                ? 'bg-[#24564b] text-[#ffd166] shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Gabung Room
          </button>

          <button
            type="button"
            onClick={() => {
              playUIClick();
              setActiveTab('CREATE');
              setErrorMsg('');
            }}
            className={`flex-1 min-h-[38px] py-1.5 text-xs font-bold rounded-[10px] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'CREATE'
                ? 'bg-[#24564b] text-[#ffd166] shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" /> Buat Room Baru
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-[12px] text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tab 1: JOIN */}
        {activeTab === 'JOIN' ? (
          <form onSubmit={handleJoin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#fff1c7] mb-1">
                Masukkan Kode Room (Diberikan oleh Guru / Host):
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="CONTOH: JMR74"
                maxLength={6}
                disabled={isLoading}
                className="w-full text-center tracking-widest text-lg sm:text-xl font-mono uppercase px-3 py-2 bg-[#0f2824] border-2 border-[#f4d7a1]/50 rounded-[10px] text-[#ffd166] font-bold focus:outline-none focus:border-[#ffd166] transition-colors"
              />
              <p className="text-[10px] text-slate-400 mt-1 text-center">
                Kode room terdiri dari 5-6 karakter huruf/angka
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              disabled={isLoading}
              icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            >
              {isLoading ? 'Menghubungkan...' : 'Gabung ke Room Sekarang'}
            </Button>
          </form>
        ) : (
          /* Tab 2: CREATE */
          <div className="space-y-3">
            <div className="p-3 bg-[#0f2824] rounded-[16px] border border-[#79b85b]/30 text-left">
              <h4 className="text-xs font-bold text-[#ffd166] flex items-center gap-1.5 mb-1">
                <Users className="w-4 h-4" /> Mode Kelompok Kelas
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Kamu akan menjadi <strong>Host (Guru/Pemandu)</strong>. Terdapat 6 kelompok dolanan (Kelompok 1 sampai 6). Siswa akan memilih kelompoknya di lobi sebelum permainan dimulai.
              </p>
            </div>

            <Button
              type="button"
              variant="primary"
              fullWidth
              size="md"
              onClick={handleCreate}
              disabled={isLoading}
              icon={isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            >
              {isLoading ? 'Membuat Room...' : 'Buat Room Kelas Sekarang'}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
