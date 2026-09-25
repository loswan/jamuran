import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, CharacterType, NpcMember, PancerState, PlayerCircleState, GameScore } from '../types/game';
import { audioManager, JAMURAN_SONG_DURATION } from '../audio/gamelanAudio';
import { drawVectorCharacter, CHARACTER_RENDER_WIDTH, CHARACTER_RENDER_HEIGHT } from '../renderer/characterRenderer';
import { MATH_QUESTIONS, JAMUR_COMMANDS } from '../data/mathQuestions';
import { Volume2, VolumeX, HelpCircle, RotateCcw, ArrowLeft, ArrowRight, Play, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { HowToPlayModal } from './HowToPlayModal';

const CIRCLE_PLAYER_COUNT = 7;
const NPC_COUNT = CIRCLE_PLAYER_COUNT - 1;
const CIRCLE_ANGLE_STEP = (Math.PI * 2) / CIRCLE_PLAYER_COUNT;

export const JamathGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // React State for HUD & UI modals
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType>('boy');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [currentLyric, setCurrentLyric] = useState<string>('Mari bermain Jamuran!');
  const [score, setScore] = useState<GameScore>({
    current: 0,
    highScore: 0,
    streak: 0,
    round: 1,
    totalAnswered: 0,
    correctCount: 0
  });

  // Game internal mutable state referenced in requestAnimationFrame
  const stateRef = useRef({
    gameState: 'MENU' as GameState,
    selectedCharacter: 'boy' as CharacterType,
    score: {
      current: 0,
      highScore: 0,
      streak: 0,
      round: 1,
      totalAnswered: 0,
      correctCount: 0
    },
    questionIndex: 0,
    currentQuestion: MATH_QUESTIONS[0],
    numberLineMin: -5,
    numberLineMax: 5,
    numberLineCurrent: MATH_QUESTIONS[0].start,
    numberLineStart: MATH_QUESTIONS[0].start,
    activeCommand: JAMUR_COMMANDS[0],
    commandDialogElapsed: 0,
    actionElapsed: 0,
    feedbackElapsed: 0,
    feedbackResult: null as 'correct' | 'wrong' | null,
    autoRotateCircle: false,
    pressedKeys: {
      ArrowLeft: false,
      ArrowRight: false,
      KeyA: false,
      KeyD: false
    },
    player: {
      angle: -Math.PI / 2,
      direction: 1,
      angularSpeed: 2.2,
      radius: 0,
      isMoving: false,
      walkTimer: 0,
      walkFrame: 0,
      directionRow: 0,
      flipHorizontal: false,
      x: 0,
      y: 0,
      previousX: null,
      previousY: null
    } as PlayerCircleState,
    npcs: [] as NpcMember[],
    pancer: {
      character: 'boy',
      name: 'Pancer',
      x: 0,
      y: 0,
      directionRow: 0,
      frame: 0,
      commandNumber: 1
    } as PancerState,
    lastFrameTime: performance.now(),
    confetti: [] as { x: number; y: number; vx: number; vy: number; color: string; size: number }[]
  });

  // Initialize NPCs once
  useEffect(() => {
    const npcNames = ['Budi', 'Ayu', 'Doni', 'Ratih', 'Joko', 'Dewi'];
    stateRef.current.npcs = Array.from({ length: NPC_COUNT }, (_, index) => ({
      id: `npc-${index}`,
      name: npcNames[index % npcNames.length],
      angleOffset: CIRCLE_ANGLE_STEP * (index + 1),
      character: index % 2 === 0 ? 'girl' : 'boy',
      directionRow: 0,
      flipHorizontal: false,
      x: 0,
      y: 0,
      colorVariant: index + 1
    }));
  }, []);

  // Sync React state to ref
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.selectedCharacter = selectedCharacter;
  }, [selectedCharacter]);

  // Audio mute toggle
  const toggleMute = useCallback(() => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  }, []);

  // Start game from Character Select
  const handleStartGame = useCallback(() => {
    audioManager.playClick();
    const st = stateRef.current;
    st.gameState = 'MUSIC_PLAYING';
    setGameState('MUSIC_PLAYING');

    st.player.angle = -Math.PI / 2;
    st.player.isMoving = false;
    st.questionIndex = 0;
    st.currentQuestion = MATH_QUESTIONS[0];
    st.numberLineStart = st.currentQuestion.start;
    st.numberLineCurrent = st.currentQuestion.start;

    // Start traditional Javanese Jamuran song!
    audioManager.setCallbacks(
      (lyric) => {
        setCurrentLyric(lyric);
      },
      () => {
        // Song finished! Transition to Pancer command
        handleSongFinished();
      }
    );
    audioManager.playJamuranSong();
  }, []);

  // When song reaches end phrase ("Semprat-semprit jamur apa?!")
  const handleSongFinished = useCallback(() => {
    audioManager.playWhistle();
    const st = stateRef.current;
    st.gameState = 'JAMUR_COMMAND';
    setGameState('JAMUR_COMMAND');

    // Pick a random Jamur command (Kethek, Gagang, Payung, Meja Kursi)
    const randomCmd = JAMUR_COMMANDS[Math.floor(Math.random() * JAMUR_COMMANDS.length)];
    st.activeCommand = randomCmd;
    st.commandDialogElapsed = 0;
    st.actionElapsed = 0;
    st.player.isMoving = false;
  }, []);

  // Move player on Number Line
  const moveMathPlayer = useCallback((direction: number) => {
    const st = stateRef.current;
    if (st.gameState !== 'MATH_CHALLENGE') return;

    const next = Math.max(st.numberLineMin, Math.min(st.numberLineMax, st.numberLineCurrent + direction));
    if (next !== st.numberLineCurrent) {
      st.numberLineCurrent = next;
      st.player.directionRow = direction > 0 ? 2 : 1; // right or left profile
      st.player.flipHorizontal = direction > 0;
      audioManager.playStep(direction > 0);
    }
  }, []);

  // Set direct number line position
  const setDirectMathPosition = useCallback((num: number) => {
    const st = stateRef.current;
    if (st.gameState !== 'MATH_CHALLENGE') return;
    const clamped = Math.max(st.numberLineMin, Math.min(st.numberLineMax, num));
    if (clamped !== st.numberLineCurrent) {
      const dir = clamped > st.numberLineCurrent ? 1 : -1;
      st.numberLineCurrent = clamped;
      st.player.directionRow = dir > 0 ? 2 : 1;
      st.player.flipHorizontal = dir > 0;
      audioManager.playStep(dir > 0);
    }
  }, []);

  // Spawn confetti particles for victory celebration
  const spawnConfetti = (centerX: number, centerY: number) => {
    const colors = ['#ffd166', '#84e1bc', '#f4d7a1', '#e53e3e', '#63b3ed', '#f687b3'];
    const particles = [];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6
      });
    }
    stateRef.current.confetti = particles;
  };

  // Submit Answer
  const submitAnswer = useCallback(() => {
    const st = stateRef.current;
    if (st.gameState !== 'MATH_CHALLENGE') return;

    const isCorrect = st.numberLineCurrent === st.currentQuestion.answer;
    st.feedbackResult = isCorrect ? 'correct' : 'wrong';
    st.feedbackElapsed = 0;
    st.gameState = isCorrect ? 'FEEDBACK_CORRECT' : 'FEEDBACK_WRONG';
    setGameState(st.gameState);

    if (isCorrect) {
      audioManager.playCorrect();
      const newScore = {
        ...st.score,
        current: st.score.current + 100 + st.score.streak * 20,
        highScore: Math.max(st.score.highScore, st.score.current + 100 + st.score.streak * 20),
        streak: st.score.streak + 1,
        round: st.score.round + 1,
        totalAnswered: st.score.totalAnswered + 1,
        correctCount: st.score.correctCount + 1
      };
      st.score = newScore;
      setScore(newScore);
      spawnConfetti(window.innerWidth / 2, window.innerHeight / 2);
    } else {
      audioManager.playWrong();
      const newScore = {
        ...st.score,
        streak: 0,
        totalAnswered: st.score.totalAnswered + 1
      };
      st.score = newScore;
      setScore(newScore);
    }
  }, []);

  // Continue after feedback
  const continueToNextRound = useCallback(() => {
    const st = stateRef.current;
    st.questionIndex = (st.questionIndex + 1) % MATH_QUESTIONS.length;
    st.currentQuestion = MATH_QUESTIONS[st.questionIndex];
    st.numberLineStart = st.currentQuestion.start;
    st.numberLineCurrent = st.currentQuestion.start;
    st.feedbackResult = null;
    st.gameState = 'MUSIC_PLAYING';
    setGameState('MUSIC_PLAYING');

    audioManager.playJamuranSong();
  }, []);

  // Retry same question
  const retryQuestion = useCallback(() => {
    const st = stateRef.current;
    st.numberLineCurrent = st.numberLineStart;
    st.feedbackResult = null;
    st.gameState = 'MATH_CHALLENGE';
    setGameState('MATH_CHALLENGE');
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        st.pressedKeys.ArrowLeft = true;
        if (st.gameState === 'MATH_CHALLENGE') {
          moveMathPlayer(-1);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        st.pressedKeys.ArrowRight = true;
        if (st.gameState === 'MATH_CHALLENGE') {
          moveMathPlayer(1);
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        if (st.gameState === 'MATH_CHALLENGE') {
          submitAnswer();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const st = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        st.pressedKeys.ArrowLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        st.pressedKeys.ArrowRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [moveMathPlayer, submitAnswer]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Loop
    const loop = (timestamp: number) => {
      const st = stateRef.current;
      const deltaTime = Math.min((timestamp - st.lastFrameTime) / 1000, 0.05);
      st.lastFrameTime = timestamp;

      const w = window.innerWidth;
      const h = window.innerHeight;

      ctx.clearRect(0, 0, w, h);

      // ARENA DIMENSIONS
      const centerX = w / 2;
      const centerY = h / 2;
      const arenaWidth = Math.min(w * 0.9, 1140);
      const arenaHeight = Math.min(h * 0.8, 720);
      const arenaX = centerX - arenaWidth / 2;
      const arenaY = centerY - arenaHeight / 2;
      const mushroomSize = Math.min(arenaWidth, arenaHeight) * 0.22;
      const circleRadius = mushroomSize * 1.58;

      // Draw Alun-Alun / Courtyard Arena
      drawCourtyard(ctx, arenaX, arenaY, arenaWidth, arenaHeight);

      // Draw Centerpiece Mushroom ("Jamur Pancer")
      drawCenterMushroom(ctx, centerX, centerY, mushroomSize);

      // State Machine Logic
      if (st.gameState === 'MENU') {
        drawMenuScreen(ctx, w, h);
      } else if (st.gameState === 'CHARACTER_SELECT') {
        drawCharacterSelectScreen(ctx, w, h, st.selectedCharacter);
      } else if (st.gameState === 'MUSIC_PLAYING') {
        // Circle walking rotation
        updateCirclePhysics(st, deltaTime, circleRadius, centerX, centerY);
        drawCircleParticipants(ctx, st, centerX, centerY);
      } else if (st.gameState === 'JAMUR_COMMAND') {
        // Halt circle & show Pancer dialog
        updateCirclePositionsStatic(st, circleRadius, centerX, centerY);
        drawCircleParticipants(ctx, st, centerX, centerY);

        st.commandDialogElapsed += deltaTime;
        drawPancerCommandDialog(ctx, w, h, st.activeCommand, st.commandDialogElapsed);

        // Transition to action phase after 2.0s
        if (st.commandDialogElapsed >= 2.0) {
          st.gameState = 'JAMUR_ACTION';
          st.actionElapsed = 0;
          setGameState('JAMUR_ACTION');
        }
      } else if (st.gameState === 'JAMUR_ACTION') {
        // Everyone does the Jamur Action!
        updateCirclePositionsStatic(st, circleRadius, centerX, centerY);
        st.actionElapsed += deltaTime;
        drawCircleParticipants(ctx, st, centerX, centerY, st.activeCommand.id, st.actionElapsed);
        drawActionBanner(ctx, w, h, st.activeCommand, st.actionElapsed);

        // Transition to math challenge after command duration
        if (st.actionElapsed >= st.activeCommand.duration) {
          st.gameState = 'MATH_CHALLENGE';
          st.feedbackResult = null;
          setGameState('MATH_CHALLENGE');
        }
      } else if (st.gameState === 'MATH_CHALLENGE' || st.gameState === 'FEEDBACK_CORRECT' || st.gameState === 'FEEDBACK_WRONG') {
        // Blur background arena slightly
        drawBlurredBackgroundOverlay(ctx, w, h);

        // Math Challenge Stage with Number Line
        drawMathChallengeStage(ctx, w, h, st, deltaTime);

        // Feedback timer
        if (st.gameState === 'FEEDBACK_CORRECT') {
          st.feedbackElapsed += deltaTime;
          updateAndDrawConfetti(ctx, st);
          if (st.feedbackElapsed >= 2.8) {
            continueToNextRound();
          }
        } else if (st.gameState === 'FEEDBACK_WRONG') {
          st.feedbackElapsed += deltaTime;
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      audioManager.stopJamuranSong();
    };
  }, [continueToNextRound]);

  // Handle Canvas Click / Touch for UI Buttons
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const w = window.innerWidth;
    const h = window.innerHeight;
    const st = stateRef.current;

    if (st.gameState === 'MENU') {
      const btn = getMenuStartButton(w, h);
      if (isInside(x, y, btn)) {
        audioManager.playClick();
        st.gameState = 'CHARACTER_SELECT';
        setGameState('CHARACTER_SELECT');
      }
    } else if (st.gameState === 'CHARACTER_SELECT') {
      const cards = getCharacterSelectCards(w, h);
      if (isInside(x, y, cards.boy)) {
        audioManager.playClick();
        st.selectedCharacter = 'boy';
        setSelectedCharacter('boy');
      } else if (isInside(x, y, cards.girl)) {
        audioManager.playClick();
        st.selectedCharacter = 'girl';
        setSelectedCharacter('girl');
      } else {
        const btn = getSelectPlayButton(w, h);
        if (isInside(x, y, btn)) {
          handleStartGame();
        }
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#132c28]">
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="absolute inset-0 block w-full h-full cursor-pointer"
      />

      {/* TOP HEADER HUD */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-8 py-3 bg-[#183d38]/85 backdrop-blur-md border-b border-[#f4d7a1]/25 text-slate-100">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              audioManager.playClick();
              audioManager.stopJamuranSong();
              stateRef.current.gameState = 'MENU';
              setGameState('MENU');
            }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#d95d39] border border-[#f4d7a1] flex items-center justify-center font-black text-[#fff1c7] text-lg shadow-sm group-hover:scale-105 transition-transform">
              J
            </div>
            <span className="font-extrabold text-lg sm:text-xl text-[#fff1c7] tracking-wider font-serif">
              JAMATH
            </span>
          </button>
          <span className="hidden md:inline-block text-xs font-medium text-[#b5d48c] border-l border-[#f4d7a1]/30 pl-3">
            Dolanan Tradisional Jamuran & Garis Bilangan
          </span>
        </div>

        {/* Center: Realtime Karaoke Lyric or Status */}
        {gameState === 'MUSIC_PLAYING' && (
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-[#0f2824]/90 rounded-full border border-[#79b85b]/40 text-[#ffd166] text-xs sm:text-sm font-semibold animate-pulse">
            <span>♫</span>
            <span>{currentLyric}</span>
          </div>
        )}

        {/* Right Controls & Score */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Round & Score */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <div className="px-2.5 py-1 bg-[#0f2824] rounded-lg border border-[#f4d7a1]/30">
              <span className="text-slate-400 mr-1">Babak:</span>
              <span className="font-bold text-[#ffd166]">{score.round}</span>
            </div>
            <div className="px-2.5 py-1 bg-[#0f2824] rounded-lg border border-[#f4d7a1]/30">
              <span className="text-slate-400 mr-1">Skor:</span>
              <span className="font-bold text-[#b5d48c]">{score.current}</span>
            </div>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="p-2 bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/30 rounded-lg text-[#fff1c7] transition-all"
            title={isMuted ? 'Nyalakan Suara Gamelan' : 'Bisukan Suara'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#ffd166]" />}
          </button>

          {/* Help Modal Button */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2 bg-[#0f2824] hover:bg-[#24564b] border border-[#f4d7a1]/30 rounded-lg text-[#fff1c7] transition-all"
            title="Cara Bermain"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* BOTTOM CONTROLS FOR TOUCH / MOBILE ACCESSIBILITY */}
      {gameState === 'MUSIC_PLAYING' && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-4 px-4 pointer-events-none">
          <div className="flex items-center gap-3 p-2 bg-[#183d38]/90 backdrop-blur-md rounded-2xl border border-[#f4d7a1]/30 shadow-xl pointer-events-auto">
            <button
              onPointerDown={() => {
                stateRef.current.pressedKeys.ArrowLeft = true;
              }}
              onPointerUp={() => {
                stateRef.current.pressedKeys.ArrowLeft = false;
              }}
              onPointerLeave={() => {
                stateRef.current.pressedKeys.ArrowLeft = false;
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#24564b] active:bg-[#79b85b] rounded-xl text-xs sm:text-sm font-bold text-[#fff1c7] border border-[#b5d48c]/40 transition-transform active:scale-95 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> Putar Kiri
            </button>

            <span className="text-[11px] text-slate-300 font-medium px-1 hidden sm:inline">
              Gunakan panah atau tombol layar
            </span>

            <button
              onPointerDown={() => {
                stateRef.current.pressedKeys.ArrowRight = true;
              }}
              onPointerUp={() => {
                stateRef.current.pressedKeys.ArrowRight = false;
              }}
              onPointerLeave={() => {
                stateRef.current.pressedKeys.ArrowRight = false;
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#24564b] active:bg-[#79b85b] rounded-xl text-xs sm:text-sm font-bold text-[#fff1c7] border border-[#b5d48c]/40 transition-transform active:scale-95 shadow-md"
            >
              Putar Kanan <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MATH CHALLENGE ON-SCREEN TOUCH BAR */}
      {gameState === 'MATH_CHALLENGE' && (
        <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center items-center gap-3 px-4 pointer-events-none">
          <div className="flex flex-wrap justify-center items-center gap-2 p-2.5 bg-[#183d38]/95 backdrop-blur-md rounded-2xl border-2 border-[#f4d7a1] shadow-2xl pointer-events-auto">
            <button
              onClick={() => moveMathPlayer(-1)}
              className="flex items-center gap-1 px-3.5 py-2.5 bg-[#24564b] hover:bg-[#1b433b] active:scale-95 rounded-xl font-bold text-xs sm:text-sm text-[#fff1c7] border border-[#b5d48c]/40 shadow-md"
            >
              <ArrowLeft className="w-4 h-4" /> Kiri (-1)
            </button>

            {/* Quick Number Selector Chips */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {[-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => setDirectMathPosition(val)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all ${
                    stateRef.current.numberLineCurrent === val
                      ? 'bg-[#ffd166] text-[#2b1506] ring-2 ring-white scale-110 shadow'
                      : 'bg-[#0f2824] text-slate-200 hover:bg-[#24564b]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>

            <button
              onClick={() => moveMathPlayer(1)}
              className="flex items-center gap-1 px-3.5 py-2.5 bg-[#24564b] hover:bg-[#1b433b] active:scale-95 rounded-xl font-bold text-xs sm:text-sm text-[#fff1c7] border border-[#b5d48c]/40 shadow-md"
            >
              Kanan (+1) <ArrowRight className="w-4 h-4" />
            </button>

            {/* SUBMIT BUTTON */}
            <button
              onClick={submitAnswer}
              className="px-6 py-2.5 bg-[#d95d39] hover:bg-[#c04a28] active:scale-95 text-[#fff1c7] font-black rounded-xl border border-[#f4d7a1] shadow-lg text-sm sm:text-base transition-transform"
            >
              JAWAB SEKARANG
            </button>
          </div>
        </div>
      )}

      {/* FEEDBACK WRONG RETRY BUTTON */}
      {gameState === 'FEEDBACK_WRONG' && (
        <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center items-center pointer-events-none">
          <div className="flex items-center gap-4 p-3 bg-[#183d38]/95 backdrop-blur-md rounded-2xl border-2 border-amber-400 shadow-2xl pointer-events-auto">
            <span className="text-xs sm:text-sm text-[#ffd166] font-semibold">
              Belum tepat! Coba ingat langkah pergeseran di garis bilangan.
            </span>
            <button
              onClick={retryQuestion}
              className="px-5 py-2 bg-[#d95d39] hover:bg-[#c04a28] active:scale-95 text-[#fff1c7] font-bold rounded-xl border border-[#f4d7a1] shadow text-xs sm:text-sm flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* How to Play Modal */}
      <HowToPlayModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
};

/* ========================================================================= */
/* RENDERING & MATH HELPER FUNCTIONS                                         */
/* ========================================================================= */

function isInside(x: number, y: number, box: { x: number; y: number; width: number; height: number }) {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

function getMenuStartButton(w: number, h: number) {
  const width = Math.min(w * 0.38, 280);
  const height = Math.max(54, h * 0.08);
  return {
    x: (w - width) / 2,
    y: h * 0.72,
    width,
    height
  };
}

function getCharacterSelectCards(w: number, h: number) {
  const cardW = Math.min(w * 0.32, 230);
  const cardH = Math.min(h * 0.42, 310);
  const gap = Math.min(w * 0.05, 48);
  const totalW = cardW * 2 + gap;
  const startX = (w - totalW) / 2;
  const y = h * 0.26;

  return {
    boy: { x: startX, y, width: cardW, height: cardH },
    girl: { x: startX + cardW + gap, y, width: cardW, height: cardH }
  };
}

function getSelectPlayButton(w: number, h: number) {
  const width = Math.min(w * 0.36, 260);
  const height = Math.max(52, h * 0.076);
  return {
    x: (w - width) / 2,
    y: h * 0.76,
    width,
    height
  };
}

function drawCourtyard(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  // Outer deep forest background
  ctx.fillStyle = '#112925';
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Courtyard boundary
  const radius = Math.min(w, h) * 0.06;
  ctx.fillStyle = '#79b85b'; // Lush grassy lawn
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.stroke();

  // Subtle inner decorative border
  ctx.strokeStyle = 'rgba(255, 241, 199, 0.25)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x + 16, y + 16, w - 32, h - 32, radius * 0.8);
  ctx.stroke();

  // Batik Kawung flower motifs in four corners
  const cornerOffset = 42;
  drawKawungMotif(ctx, x + cornerOffset, y + cornerOffset);
  drawKawungMotif(ctx, x + w - cornerOffset, y + cornerOffset);
  drawKawungMotif(ctx, x + cornerOffset, y + h - cornerOffset);
  drawKawungMotif(ctx, x + w - cornerOffset, y + h - cornerOffset);
}

function drawKawungMotif(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 241, 199, 0.28)';
  ctx.strokeStyle = 'rgba(255, 241, 199, 0.4)';
  ctx.lineWidth = 1.5;
  const r = 16;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, r * 0.9, r * 0.45, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCenterMushroom(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const capW = size * 1.6;
  const capH = size * 0.85;
  const stemW = size * 0.55;
  const stemH = size * 0.82;

  // Stem
  ctx.save();
  ctx.fillStyle = '#f4d7a1';
  ctx.strokeStyle = '#5a321f';
  ctx.lineWidth = Math.max(3, size * 0.04);
  ctx.beginPath();
  ctx.roundRect(cx - stemW / 2, cy - stemH * 0.15, stemW, stemH, size * 0.12);
  ctx.fill();
  ctx.stroke();

  // Cap
  ctx.fillStyle = '#d95d39';
  ctx.beginPath();
  ctx.ellipse(cx, cy - stemH * 0.15, capW / 2, capH / 2, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  // White polka dots
  ctx.fillStyle = '#fff1c7';
  [
    { x: -0.38, y: -0.16, r: 0.09 },
    { x: 0, y: -0.32, r: 0.11 },
    { x: 0.38, y: -0.16, r: 0.09 },
    { x: -0.18, y: -0.1, r: 0.06 },
    { x: 0.18, y: -0.1, r: 0.06 }
  ].forEach((spot) => {
    ctx.beginPath();
    ctx.arc(cx + size * spot.x, cy - stemH * 0.15 - size * spot.y, size * spot.r, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function updateCirclePhysics(st: any, dt: number, radius: number, cx: number, cy: number) {
  const movingRight = st.pressedKeys.ArrowRight && !st.pressedKeys.ArrowLeft;
  const movingLeft = st.pressedKeys.ArrowLeft && !st.pressedKeys.ArrowRight;
  st.player.isMoving = movingRight || movingLeft || st.autoRotateCircle;

  if (st.player.isMoving) {
    const dir = movingLeft ? -1 : 1;
    st.player.direction = dir;
    st.player.angle += dir * st.player.angularSpeed * dt;
    st.player.walkTimer += Math.abs(st.player.angularSpeed) * dt * 4;
    st.player.walkFrame = Math.floor(st.player.walkTimer) % 6;
  } else {
    st.player.walkTimer = 0;
    st.player.walkFrame = 0;
  }

  // Update Player position
  st.player.radius = radius;
  const currentX = cx + Math.cos(st.player.angle) * radius;
  const currentY = cy + Math.sin(st.player.angle) * radius;

  if (st.player.previousX === null) {
    st.player.previousX = currentX;
    st.player.previousY = currentY;
  }

  const vx = currentX - st.player.previousX;
  const vy = currentY - st.player.previousY;

  if (st.player.isMoving && (vx !== 0 || vy !== 0)) {
    if (Math.abs(vx) > Math.abs(vy)) {
      st.player.directionRow = 1; // profile
      st.player.flipHorizontal = vx > 0;
    } else {
      st.player.directionRow = vy > 0 ? 0 : 3;
      st.player.flipHorizontal = false;
    }
  }

  st.player.x = currentX;
  st.player.y = currentY;
  st.player.previousX = currentX;
  st.player.previousY = currentY;

  // Update NPCs
  st.npcs.forEach((npc: NpcMember) => {
    const angle = st.player.angle + npc.angleOffset;
    npc.x = cx + Math.cos(angle) * radius;
    npc.y = cy + Math.sin(angle) * radius;
    npc.directionRow = st.player.directionRow;
    npc.flipHorizontal = st.player.flipHorizontal;
  });

  // Pancer in center
  st.pancer.x = cx;
  st.pancer.y = cy - 10;
}

function updateCirclePositionsStatic(st: any, radius: number, cx: number, cy: number) {
  st.player.radius = radius;
  st.player.x = cx + Math.cos(st.player.angle) * radius;
  st.player.y = cy + Math.sin(st.player.angle) * radius;

  st.npcs.forEach((npc: NpcMember) => {
    const angle = st.player.angle + npc.angleOffset;
    npc.x = cx + Math.cos(angle) * radius;
    npc.y = cy + Math.sin(angle) * radius;
  });

  st.pancer.x = cx;
  st.pancer.y = cy - 10;
}

function drawCircleParticipants(
  ctx: CanvasRenderingContext2D,
  st: any,
  cx: number,
  cy: number,
  actionState: any = 'normal',
  actionElapsed: number = 0
) {
  // Draw connecting hand-holding string/ring between children
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 241, 199, 0.45)';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, st.player.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Draw NPCs
  st.npcs.forEach((npc: NpcMember) => {
    drawVectorCharacter(ctx, npc.character, {
      x: npc.x,
      y: npc.y,
      directionRow: npc.directionRow,
      walkFrame: st.player.walkFrame,
      flipHorizontal: npc.flipHorizontal,
      actionState: actionState,
      actionElapsed: actionElapsed,
      colorVariant: npc.colorVariant
    });
  });

  // Draw Central Pancer
  drawVectorCharacter(ctx, st.pancer.character, {
    x: st.pancer.x,
    y: st.pancer.y,
    directionRow: 0,
    walkFrame: 0,
    isPancer: true
  });

  // Draw Player
  drawVectorCharacter(ctx, st.selectedCharacter, {
    x: st.player.x,
    y: st.player.y,
    directionRow: st.player.directionRow,
    walkFrame: st.player.walkFrame,
    flipHorizontal: st.player.flipHorizontal,
    actionState: actionState,
    actionElapsed: actionElapsed,
    highlightRing: true
  });
}

function drawPancerCommandDialog(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  command: any,
  elapsed: number
) {
  const dialogW = Math.min(w * 0.72, 580);
  const dialogH = 96;
  const dialogX = (w - dialogW) / 2;
  const dialogY = Math.max(64, h * 0.1);

  ctx.save();
  ctx.fillStyle = 'rgba(24, 61, 56, 0.95)';
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(dialogX, dialogY, dialogW, dialogH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff1c7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px Arial';
  ctx.fillText("PANCER  •  SEMANGAT JAMURAN!", w / 2, dialogY + 28);

  const commandVisible = elapsed >= 0.8;
  ctx.fillStyle = commandVisible ? '#ffd166' : '#b5d48c';
  ctx.font = `bold ${Math.max(20, Math.min(w, h) * 0.038)}px Arial`;
  ctx.fillText(commandVisible ? `${command.name}!` : "Semprat-semprit jamur apa...?", w / 2, dialogY + 65);
  ctx.restore();
}

function drawActionBanner(ctx: CanvasRenderingContext2D, w: number, h: number, command: any, elapsed: number) {
  const bannerW = Math.min(w * 0.65, 520);
  const bannerH = 68;
  const bannerX = (w - bannerW) / 2;
  const bannerY = Math.max(64, h * 0.09);
  const remaining = Math.max(0, Math.ceil(command.duration - elapsed));

  ctx.save();
  ctx.fillStyle = 'rgba(24, 61, 56, 0.92)';
  ctx.strokeStyle = '#ffd166';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffd166';
  ctx.font = `bold ${Math.max(17, Math.min(w, h) * 0.03)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`AKSI ${command.name}  •  ${remaining}s`, w / 2, bannerY + 26);

  ctx.fillStyle = '#fff1c7';
  ctx.font = '13px Arial';
  ctx.fillText(command.actionInstruction, w / 2, bannerY + 48);
  ctx.restore();
}

function drawBlurredBackgroundOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 40, 36, 0.82)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawMathChallengeStage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  st: any,
  dt: number
) {
  const panelW = Math.min(w * 0.82, 640);
  const panelH = 175;
  const panelX = (w - panelW) / 2;
  const panelY = Math.max(68, h * 0.1);

  // Top Challenge Card
  ctx.save();
  ctx.fillStyle = 'rgba(24, 61, 56, 0.96)';
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelW, panelH, 20);
  ctx.fill();
  ctx.stroke();

  // Title
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold ${Math.max(16, Math.min(w, h) * 0.028)}px Arial`;
  ctx.fillText("TANTANGAN JAMUR MATEMATIKA", w / 2, panelY + 28);

  // Prompt Question
  ctx.fillStyle = '#fff1c7';
  ctx.font = `bold ${Math.max(15, Math.min(w, h) * 0.024)}px Arial`;
  ctx.fillText(st.currentQuestion.prompt, w / 2, panelY + 62);

  // Giant Operation Formula
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(34, Math.min(w, h) * 0.065)}px Arial`;
  ctx.fillText(st.currentQuestion.operation + " = ?", w / 2, panelY + 112);

  // Educational note
  ctx.fillStyle = '#b5d48c';
  ctx.font = '12px Arial';
  ctx.fillText(st.currentQuestion.conceptNote, w / 2, panelY + 152);
  ctx.restore();

  // Number Line Layout
  const lineWidth = Math.min(w * 0.78, 620);
  const lineX = (w - lineWidth) / 2;
  const lineY = Math.min(h * 0.72, panelY + panelH + 150);
  const step = lineWidth / (st.numberLineMax - st.numberLineMin);

  // DRAW NUMBER LINE
  drawInteractiveNumberLine(ctx, lineX, lineY, lineWidth, step, st);

  // Character sitting on Number line
  const playerX = lineX + (st.numberLineCurrent - st.numberLineMin) * step;
  const playerY = lineY - CHARACTER_RENDER_HEIGHT * 0.52;

  const actionPose =
    st.gameState === 'FEEDBACK_CORRECT'
      ? 'correct'
      : st.gameState === 'FEEDBACK_WRONG'
      ? 'wrong'
      : 'normal';

  drawVectorCharacter(ctx, st.selectedCharacter, {
    x: playerX,
    y: playerY,
    directionRow: st.player.directionRow,
    walkFrame: 0,
    flipHorizontal: st.player.flipHorizontal,
    actionState: actionPose,
    actionElapsed: st.feedbackElapsed,
    highlightRing: true
  });
}

function drawInteractiveNumberLine(
  ctx: CanvasRenderingContext2D,
  lineX: number,
  lineY: number,
  lineWidth: number,
  step: number,
  st: any
) {
  const tickH = 14;

  ctx.save();
  // Baseline Bar
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lineX, lineY);
  ctx.lineTo(lineX + lineWidth, lineY);
  ctx.stroke();

  // Arrow heads at ends
  ctx.fillStyle = '#f4d7a1';
  // Left arrow
  ctx.beginPath();
  ctx.moveTo(lineX - 10, lineY);
  ctx.lineTo(lineX, lineY - 8);
  ctx.lineTo(lineX, lineY + 8);
  ctx.closePath();
  ctx.fill();
  // Right arrow
  ctx.beginPath();
  ctx.moveTo(lineX + lineWidth + 10, lineY);
  ctx.lineTo(lineX + lineWidth, lineY - 8);
  ctx.lineTo(lineX + lineWidth, lineY + 8);
  ctx.closePath();
  ctx.fill();

  // Draw Arc from Start to Current Position
  const startX = lineX + (st.numberLineStart - st.numberLineMin) * step;
  const currX = lineX + (st.numberLineCurrent - st.numberLineMin) * step;

  if (st.numberLineStart !== st.numberLineCurrent) {
    const isForward = st.numberLineCurrent > st.numberLineStart;
    const arcHeight = Math.min(50, Math.abs(currX - startX) * 0.35);

    ctx.strokeStyle = isForward ? '#79b85b' : '#e53e3e';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(startX, lineY - 10);
    ctx.quadraticCurveTo((startX + currX) / 2, lineY - 10 - arcHeight, currX, lineY - 10);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Ticks and Labels
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let val = st.numberLineMin; val <= st.numberLineMax; val++) {
    const x = lineX + (val - st.numberLineMin) * step;

    // Tick line
    ctx.strokeStyle = val === 0 ? '#ffd166' : '#f4d7a1';
    ctx.lineWidth = val === 0 ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(x, lineY - tickH / 2);
    ctx.lineTo(x, lineY + tickH / 2);
    ctx.stroke();

    // Value text
    ctx.fillStyle =
      val === st.numberLineCurrent
        ? '#ffd166'
        : val === 0
        ? '#fff1c7'
        : val < 0
        ? '#f6ad55'
        : '#9ae6b4';
    ctx.fillText(String(val), x, lineY + tickH / 2 + 8);
  }

  // START indicator marker
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(startX, lineY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 11px Arial';
  ctx.fillText("MULAI", startX, lineY + tickH / 2 + 28);

  // Position indicator at top right
  ctx.fillStyle = '#fff1c7';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`POSISI SEKARANG: ${st.numberLineCurrent}`, lineX + lineWidth, lineY - 35);

  ctx.restore();
}

function updateAndDrawConfetti(ctx: CanvasRenderingContext2D, st: any) {
  ctx.save();
  st.confetti.forEach((p: any) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15; // gravity

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawMenuScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 40, 36, 0.88)';
  ctx.fillRect(0, 0, w, h);

  // Center Decorative Box
  const cardW = Math.min(w * 0.75, 540);
  const cardH = Math.min(h * 0.65, 420);
  const cardX = (w - cardW) / 2;
  const cardY = (h - cardH) / 2;

  ctx.fillStyle = '#183d38';
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  // Game Logo & Title
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.max(42, Math.min(w, h) * 0.08)}px serif`;
  ctx.fillText("JAMATH", w / 2, cardY + cardH * 0.28);

  ctx.fillStyle = '#fff1c7';
  ctx.font = `bold ${Math.max(16, Math.min(w, h) * 0.03)}px Arial`;
  ctx.fillText("DOLANAN JAMURAN & MATEMATIKA", w / 2, cardY + cardH * 0.44);

  ctx.fillStyle = '#b5d48c';
  ctx.font = '14px Arial';
  ctx.fillText("Belajar garis bilangan dengan riang gembira!", w / 2, cardY + cardH * 0.54);

  // Start Button
  const btn = getMenuStartButton(w, h);
  ctx.fillStyle = '#d95d39';
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff1c7';
  ctx.font = `bold ${Math.max(17, btn.height * 0.35)}px Arial`;
  ctx.fillText("MULAI BERMAIN", btn.x + btn.width / 2, btn.y + btn.height / 2);

  ctx.restore();
}

function drawCharacterSelectScreen(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  selected: CharacterType
) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 40, 36, 0.9)';
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(26, Math.min(w, h) * 0.048)}px Arial`;
  ctx.fillText("PILIH TOKOH DOLANAN", w / 2, h * 0.15);

  ctx.fillStyle = '#fff1c7';
  ctx.font = '14px Arial';
  ctx.fillText("Pilih karakter yang akan memimpin lingkaran Jamuran", w / 2, h * 0.2);

  const cards = getCharacterSelectCards(w, h);

  // BOY CARD (Bagio)
  const isBoy = selected === 'boy';
  ctx.fillStyle = isBoy ? '#24564b' : '#14312c';
  ctx.strokeStyle = isBoy ? '#ffd166' : '#79b85b';
  ctx.lineWidth = isBoy ? 5 : 2;
  ctx.beginPath();
  ctx.roundRect(cards.boy.x, cards.boy.y, cards.boy.width, cards.boy.height, 18);
  ctx.fill();
  ctx.stroke();

  drawVectorCharacter(ctx, 'boy', {
    x: cards.boy.x + cards.boy.width / 2,
    y: cards.boy.y + cards.boy.height * 0.44,
    directionRow: 0,
    walkFrame: 0
  });

  ctx.fillStyle = '#fff1c7';
  ctx.font = 'bold 18px Arial';
  ctx.fillText("BAGIO", cards.boy.x + cards.boy.width / 2, cards.boy.y + cards.boy.height * 0.8);
  ctx.fillStyle = '#b5d48c';
  ctx.font = '12px Arial';
  ctx.fillText("Laki-laki (Blangkon & Batik)", cards.boy.x + cards.boy.width / 2, cards.boy.y + cards.boy.height * 0.89);

  // GIRL CARD (Siti)
  const isGirl = selected === 'girl';
  ctx.fillStyle = isGirl ? '#24564b' : '#14312c';
  ctx.strokeStyle = isGirl ? '#ffd166' : '#79b85b';
  ctx.lineWidth = isGirl ? 5 : 2;
  ctx.beginPath();
  ctx.roundRect(cards.girl.x, cards.girl.y, cards.girl.width, cards.girl.height, 18);
  ctx.fill();
  ctx.stroke();

  drawVectorCharacter(ctx, 'girl', {
    x: cards.girl.x + cards.girl.width / 2,
    y: cards.girl.y + cards.girl.height * 0.44,
    directionRow: 0,
    walkFrame: 0
  });

  ctx.fillStyle = '#fff1c7';
  ctx.font = 'bold 18px Arial';
  ctx.fillText("SITI", cards.girl.x + cards.girl.width / 2, cards.girl.y + cards.girl.height * 0.8);
  ctx.fillStyle = '#b5d48c';
  ctx.font = '12px Arial';
  ctx.fillText("Perempuan (Kebaya & Pita)", cards.girl.x + cards.girl.width / 2, cards.girl.y + cards.girl.height * 0.89);

  // PLAY BUTTON
  const btn = getSelectPlayButton(w, h);
  ctx.fillStyle = '#d95d39';
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff1c7';
  ctx.font = `bold ${Math.max(17, btn.height * 0.35)}px Arial`;
  ctx.fillText("MASUK KE LINGKARAN", btn.x + btn.width / 2, btn.y + btn.height / 2);

  ctx.restore();
}
