import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GameState,
  GameMode,
  CharacterType,
  PlayerProfile,
  NpcMember,
  PancerState,
  PlayerCircleState,
  GameScore,
  RoomState
} from '../types/game';
import { audioManager } from '../audio/gamelanAudio';
import { drawVectorCharacter, drawHandHoldingRing } from '../renderer/characterRenderer';
import { MATH_QUESTIONS, JAMUR_COMMANDS } from '../data/mathQuestions';

import { HowToPlayModal } from './HowToPlayModal';
import { IdentitySetupModal } from './IdentitySetupModal';
import { ModeSelectModal } from './ModeSelectModal';
import { RoomJoinCreateModal } from './RoomJoinCreateModal';
import { LobbyView } from './LobbyView';
import { OrientationPrompt } from './OrientationPrompt';
import { MathSuccessTransition } from './MathSuccessTransition';
import { ScoreboardBadge } from './ScoreboardBadge';
import { MainMenuOverlay } from './MainMenuOverlay';
import {
  GameContainer,
  GameHeader,
  RotationPaddles,
  MathQuestionPanel,
  MathControlDock,
  RetryBanner,
  TurnNominationModal
} from './GameComponents';
import { multiplayerService } from '../services/multiplayerService';
import { jamuranAudioController } from '../services/jamuranAudioController';
import { MathQuestion } from '../types/game';

const CIRCLE_PLAYER_COUNT = 7;
const NPC_COUNT = CIRCLE_PLAYER_COUNT - 1;
const CIRCLE_ANGLE_STEP = (Math.PI * 2) / CIRCLE_PLAYER_COUNT;

export const JamathGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const viewportSizeRef = useRef<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 800,
    height: typeof window !== 'undefined' ? window.innerHeight : 450
  });

  // App Navigation States
  const [appScreen, setAppScreen] = useState<'GAME' | 'LOBBY'>('GAME');
  const [showIdentityModal, setShowIdentityModal] = useState<boolean>(false);
  const [showModeModal, setShowModeModal] = useState<boolean>(false);
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [showManualScoreboard, setShowManualScoreboard] = useState<boolean>(false);

  // Player & Game Configuration
  const [gameMode, setGameMode] = useState<GameMode>('INDIVIDUAL');
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile>({
    id: multiplayerService.getPlayerId(),
    name: 'Siswa Jamath',
    character: 'boy',
    colorVariant: 0,
    joinedAt: Date.now()
  });

  // Game internal state for Singleplayer & Multiplayer
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [currentLyric, setCurrentLyric] = useState<string>('Mari bermain Jamuran!');
  const [serverRoomState, setServerRoomState] = useState<RoomState | null>(null);

  // Transition and question celebration state
  const [solvedQuestion, setSolvedQuestion] = useState<MathQuestion | null>(null);
  const currentChallengeQuestionRef = useRef<MathQuestion | null>(null);

  // Singleplayer Score
  const [singleScore, setSingleScore] = useState<GameScore>({
    current: 0,
    highScore: 0,
    streak: 0,
    round: 1,
    totalAnswered: 0,
    correctCount: 0
  });

  // Mutable Game Loop State
  const stateRef = useRef({
    gameMode: 'INDIVIDUAL' as GameMode,
    gameState: 'MENU' as GameState,
    playerProfile: {
      id: multiplayerService.getPlayerId(),
      name: 'Siswa Jamath',
      character: 'boy' as CharacterType,
      colorVariant: 0,
      joinedAt: Date.now()
    } as PlayerProfile,
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
    pressedKeys: {
      ArrowLeft: false,
      ArrowRight: false
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
    confetti: [] as { x: number; y: number; vx: number; vy: number; color: string; size: number }[],
    victorySparkles: [] as { x: number; y: number; vx: number; vy: number; rot: number; size: number; alpha: number }[]
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

  // Sync React states to ref
  useEffect(() => {
    stateRef.current.gameState = gameState;
  }, [gameState]);

  useEffect(() => {
    stateRef.current.gameMode = gameMode;
  }, [gameMode]);

  useEffect(() => {
    stateRef.current.playerProfile = playerProfile;
  }, [playerProfile]);

  // Subscribe to Multiplayer Service Events
  useEffect(() => {
    let prevPhase: string | null = null;
    let prevPancerGroup: string | null = null;

    const unsubscribeState = multiplayerService.onStateUpdate((roomState) => {
      setServerRoomState(roomState);

      if (stateRef.current.gameMode === 'GROUP') {
        const isPhaseChange = prevPhase !== roomState.phase;

        // Obstacle success sound when completing JAMUR_ACTION
        if (isPhaseChange && prevPhase === 'JAMUR_ACTION') {
          audioManager.playObstacleSuccess();
        }

        // Pancer transition sound when entering TURN_NOMINATION or when Pancer changes
        if (
          (isPhaseChange && roomState.phase === 'TURN_NOMINATION') ||
          (prevPancerGroup && roomState.pancerGroupId && prevPancerGroup !== roomState.pancerGroupId)
        ) {
          audioManager.playPancerTransition();
        }

        prevPhase = roomState.phase;
        prevPancerGroup = roomState.pancerGroupId;

        setGameState(roomState.phase);
        stateRef.current.gameState = roomState.phase;
        stateRef.current.currentQuestion = roomState.currentQuestion;
        stateRef.current.questionIndex = roomState.questionIndex;
        stateRef.current.numberLineCurrent = roomState.numberLineCurrent;
        stateRef.current.numberLineStart = roomState.numberLineStart;
        stateRef.current.activeCommand = roomState.activeCommand;
        stateRef.current.feedbackResult = roomState.feedbackResult;

        // Sync Jamuran audio phase
        if (roomState.phase === 'MUSIC_PLAYING') {
          jamuranAudioController.playCirclingForRound(roomState.roundNumber || 1);
        } else if (roomState.phase === 'JAMUR_COMMAND' || roomState.phase === 'JAMUR_ACTION') {
          const round = roomState.roundNumber || 1;
          const circlingTrackIndex = round % 2 !== 0 ? 0 : 2;
          jamuranAudioController.playCommandForCirclingTrack(circlingTrackIndex);
        } else {
          jamuranAudioController.pause();
        }

        // Keep track of current challenge question so victory transition screen displays the exact solved formula
        if (roomState.currentQuestion) {
          currentChallengeQuestionRef.current = roomState.currentQuestion;
        }

        // Celebrate on correct with screen transition
        if (roomState.phase === 'FEEDBACK_CORRECT') {
          setSolvedQuestion(currentChallengeQuestionRef.current || roomState.currentQuestion);
          audioManager.playCorrect();
          spawnConfetti();
          spawnVictorySparkles();
        } else if (roomState.phase === 'FEEDBACK_WRONG') {
          audioManager.playWrong();
        } else if (roomState.phase === 'MUSIC_PLAYING') {
          setSolvedQuestion(null);
        }
      }
    });

    return () => {
      unsubscribeState();
    };
  }, []);

  // Audio mute toggle
  const toggleMute = useCallback(() => {
    const muted = audioManager.toggleMute();
    jamuranAudioController.setMuted(muted);
    setIsMuted(muted);
  }, []);

  // Confetti particles spawner using dynamic viewport center
  const spawnConfetti = (centerX?: number, centerY?: number) => {
    const cx = centerX ?? (viewportSizeRef.current.width / 2);
    const cy = centerY ?? (viewportSizeRef.current.height / 2);
    const colors = ['#ffd166', '#84e1bc', '#f4d7a1', '#e53e3e', '#63b3ed', '#f687b3'];
    const particles = [];
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 7;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6
      });
    }
    stateRef.current.confetti = particles;
  };

  // Golden victory sparkles spawner for correct answer screen transition
  const spawnVictorySparkles = (centerX?: number, centerY?: number) => {
    const cx = centerX ?? (viewportSizeRef.current.width * 0.5);
    const cy = centerY ?? (viewportSizeRef.current.height * 0.5);
    const sparkles = [];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 4.0;
      sparkles.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        rot: Math.random() * Math.PI * 2,
        size: 5 + Math.random() * 7,
        alpha: 1.0
      });
    }
    stateRef.current.victorySparkles = sparkles;
  };

  // Track ended callback for Singleplayer sequence: 1.mp3 -> 2.mp3 -> 3.mp3 -> 4.mp3 -> 1.mp3
  const handleTrackEnded = useCallback((completedTrackIndex: number, nextTrackIndex: number) => {
    const st = stateRef.current;
    if (st.gameMode !== 'INDIVIDUAL') return;

    if (completedTrackIndex === 0 || completedTrackIndex === 2) {
      // Circling track ended (1.mp3 or 3.mp3)! Play whistle, transition to command, and start command audio
      audioManager.playWhistle();
      st.gameState = 'JAMUR_COMMAND';
      setGameState('JAMUR_COMMAND');

      const targetCommandId = completedTrackIndex === 0 ? 'gagak' : 'kethek';
      const cmd = JAMUR_COMMANDS.find((c) => c.id === targetCommandId) || JAMUR_COMMANDS[0];
      st.activeCommand = cmd;
      st.commandDialogElapsed = 0;
      st.actionElapsed = 0;
      st.player.isMoving = false;

      // Play corresponding command track (2.mp3: Jamur Gagak, or 4.mp3: Kethek Menek)
      jamuranAudioController.playTrack(nextTrackIndex);
    } else if (completedTrackIndex === 1 || completedTrackIndex === 3) {
      // Command track ended (2.mp3 or 4.mp3)! Player successfully held pose
      audioManager.playObstacleSuccess();
      st.gameState = 'MATH_CHALLENGE';
      st.feedbackResult = null;
      setGameState('MATH_CHALLENGE');
      jamuranAudioController.pause();
    }
  }, []);

  // Set up audio controller callbacks on mount
  useEffect(() => {
    jamuranAudioController.preloadAll();
    jamuranAudioController.setCallbacks(
      (lyric) => {
        setCurrentLyric(lyric);
      },
      (completedTrackIndex, nextTrackIndex) => {
        handleTrackEnded(completedTrackIndex, nextTrackIndex);
      }
    );
  }, [handleTrackEnded]);

  // Start Single Player Game
  const startSingleplayerGame = useCallback(() => {
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
    st.score.round = 1;
    setSingleScore((prev) => ({ ...prev, round: 1 }));

    jamuranAudioController.resetToBeginning();
    jamuranAudioController.playCirclingForRound(1);
  }, []);

  // Move player on Number Line
  const moveMathPlayer = useCallback(
    (direction: number) => {
      const st = stateRef.current;
      if (st.gameState !== 'MATH_CHALLENGE') return;

      if (st.gameMode === 'GROUP' && serverRoomState) {
        const myGroupId = serverRoomState.players[playerProfile.id]?.groupId;
        const isTargetGroup = myGroupId === serverRoomState.activeTargetGroupId;
        if (!isTargetGroup && !serverRoomState.players[playerProfile.id]?.isHost) {
          return;
        }

        const next = Math.max(
          serverRoomState.numberLineMin,
          Math.min(serverRoomState.numberLineMax, serverRoomState.numberLineCurrent + direction)
        );
        multiplayerService.moveNumberLine(next);
        audioManager.playStep(direction > 0);
      } else {
        const next = Math.max(
          st.numberLineMin,
          Math.min(st.numberLineMax, st.numberLineCurrent + direction)
        );
        if (next !== st.numberLineCurrent) {
          st.numberLineCurrent = next;
          st.player.directionRow = direction > 0 ? 2 : 1;
          st.player.flipHorizontal = direction > 0;
          audioManager.playStep(direction > 0);
        }
      }
    },
    [serverRoomState, playerProfile.id]
  );

  const setDirectMathPosition = useCallback(
    (num: number) => {
      const st = stateRef.current;
      if (st.gameState !== 'MATH_CHALLENGE') return;

      if (st.gameMode === 'GROUP' && serverRoomState) {
        const myGroupId = serverRoomState.players[playerProfile.id]?.groupId;
        const isTargetGroup = myGroupId === serverRoomState.activeTargetGroupId;
        if (!isTargetGroup && !serverRoomState.players[playerProfile.id]?.isHost) {
          return;
        }

        const clamped = Math.max(serverRoomState.numberLineMin, Math.min(serverRoomState.numberLineMax, num));
        multiplayerService.moveNumberLine(clamped);
        audioManager.playStep(clamped > serverRoomState.numberLineCurrent);
      } else {
        const clamped = Math.max(st.numberLineMin, Math.min(st.numberLineMax, num));
        if (clamped !== st.numberLineCurrent) {
          const dir = clamped > st.numberLineCurrent ? 1 : -1;
          st.numberLineCurrent = clamped;
          st.player.directionRow = dir > 0 ? 2 : 1;
          st.player.flipHorizontal = dir > 0;
          audioManager.playStep(dir > 0);
        }
      }
    },
    [serverRoomState, playerProfile.id]
  );

  // Submit Answer
  const submitAnswer = useCallback(() => {
    const st = stateRef.current;
    if (st.gameState !== 'MATH_CHALLENGE') return;

    if (st.gameMode === 'GROUP' && serverRoomState) {
      multiplayerService.submitAnswer(serverRoomState.numberLineCurrent);
    } else {
      const isCorrect = st.numberLineCurrent === st.currentQuestion.answer;
      st.feedbackResult = isCorrect ? 'correct' : 'wrong';
      st.feedbackElapsed = 0;
      st.gameState = isCorrect ? 'FEEDBACK_CORRECT' : 'FEEDBACK_WRONG';
      setGameState(st.gameState);

      if (isCorrect) {
        setSolvedQuestion(st.currentQuestion);
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
        setSingleScore(newScore);
        spawnConfetti();
        spawnVictorySparkles();
      } else {
        audioManager.playWrong();
        const newScore = {
          ...st.score,
          streak: 0,
          totalAnswered: st.score.totalAnswered + 1
        };
        st.score = newScore;
        setSingleScore(newScore);
      }
    }
  }, [serverRoomState]);

  // Singleplayer continue after feedback
  const continueSingleplayerToNextRound = useCallback(() => {
    const st = stateRef.current;
    const nextQIndex = st.questionIndex + 1;

    // If all questions are completed, transition to victory!
    if (nextQIndex >= MATH_QUESTIONS.length) {
      jamuranAudioController.stop();
      st.gameState = 'ROUND_VICTORY';
      setGameState('ROUND_VICTORY');
      return;
    }

    st.questionIndex = nextQIndex;
    st.currentQuestion = MATH_QUESTIONS[st.questionIndex];
    st.numberLineStart = st.currentQuestion.start;
    st.numberLineCurrent = st.currentQuestion.start;
    st.feedbackResult = null;

    // Rotate center Pancer identity for variety & play traditional kendang transition
    const pancerChar: CharacterType = st.questionIndex % 2 === 0 ? 'boy' : 'girl';
    st.pancer.character = pancerChar;
    st.pancer.name = pancerChar === 'boy' ? 'Pancer Bagio' : 'Pancer Siti';
    audioManager.playPancerTransition();

    const roundNum = st.questionIndex + 1;
    st.score.round = roundNum;
    setSingleScore((prev) => ({ ...prev, round: roundNum }));

    st.gameState = 'MUSIC_PLAYING';
    setGameState('MUSIC_PLAYING');
    setSolvedQuestion(null);

    // Play next circling track (1.mp3 on odd rounds, 3.mp3 on even rounds)
    jamuranAudioController.playCirclingForRound(roundNum);
  }, []);

  // Singleplayer retry
  const retrySingleplayerQuestion = useCallback(() => {
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
      } else if (e.key === 'Enter') {
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

  // Main Canvas Render Loop with ResizeObserver System
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvasContainerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const handleResize = (targetWidth: number, targetHeight: number) => {
      if (targetWidth <= 0 || targetHeight <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      // Store logical dimensions for all game loop & coordinate calculations
      viewportSizeRef.current = {
        width: targetWidth,
        height: targetHeight
      };

      // Set internal canvas bitmap buffer dimensions scaled by DPR
      canvas.width = Math.round(targetWidth * dpr);
      canvas.height = Math.round(targetHeight * dpr);

      // Set explicit display style to perfectly match container
      canvas.style.width = `${targetWidth}px`;
      canvas.style.height = `${targetHeight}px`;

      // Reset transformations and scale context for crisp retina rendering
      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    // Initial measurement
    const initialRect = container.getBoundingClientRect();
    const initW = initialRect.width || window.innerWidth;
    const initH = initialRect.height || window.innerHeight;
    handleResize(initW, initH);

    // Responsive ResizeObserver dynamically adapting to mobile landscape viewport changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        let width = 0;
        let height = 0;

        if (entry.contentBoxSize) {
          const boxSize = Array.isArray(entry.contentBoxSize)
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize;
          width = boxSize.inlineSize;
          height = boxSize.blockSize;
        }

        if (!width || !height) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
        }

        if (width > 0 && height > 0) {
          handleResize(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    // Fallback listener for window resize & orientation rotation
    const onWindowResize = () => {
      if (container) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          handleResize(rect.width, rect.height);
        }
      }
    };

    window.addEventListener('resize', onWindowResize);
    window.addEventListener('orientationchange', onWindowResize);

    const loop = (timestamp: number) => {
      const st = stateRef.current;
      const deltaTime = Math.min((timestamp - st.lastFrameTime) / 1000, 0.05);
      st.lastFrameTime = timestamp;

      const { width: w, height: h } = viewportSizeRef.current;
      const isLandscape = w > h;

      ctx.clearRect(0, 0, w, h);

      // Compact header offset in landscape
      const topOffset = isLandscape ? Math.max(38, Math.min(48, h * 0.12)) : 52;
      const availH = h - topOffset;
      const centerX = w / 2;
      const centerY = topOffset + availH * 0.5;

      // Sizing adapted to landscape screen height while preserving element proportions
      const arenaH = Math.min(availH * 0.94, 680);
      const arenaW = Math.min(w * 0.95, isLandscape ? Math.min(arenaH * 2.0, w - 32) : 720);
      const arenaX = centerX - arenaW / 2;
      const arenaY = centerY - arenaH / 2;

      const mushroomSize = Math.min(arenaW * 0.18, arenaH * 0.22);
      const circleRadius = Math.min(arenaW * 0.34, arenaH * 0.36);

      // Draw Alun-Alun Courtyard Lawn
      drawCourtyard(ctx, arenaX, arenaY, arenaW, arenaH, w, h);

      // Draw Centerpiece Mushroom
      drawCenterMushroom(ctx, centerX, centerY, mushroomSize);

      // State Rendering Logic
      if (st.gameState === 'MENU') {
        drawMenuScreen(ctx, w, h);
      } else if (st.gameState === 'MUSIC_PLAYING') {
        updateCirclePhysics(st, deltaTime, circleRadius, centerX, centerY);
        const audioTime = jamuranAudioController.getCurrentTime();
        drawCircleParticipants(ctx, st, centerX, centerY, serverRoomState, arenaH, 'holding_hands', audioTime > 0 ? audioTime : (performance.now() / 1000));
      } else if (st.gameState === 'JAMUR_COMMAND') {
        updateCirclePositionsStatic(st, circleRadius, centerX, centerY);
        st.commandDialogElapsed += deltaTime;
        drawCircleParticipants(ctx, st, centerX, centerY, serverRoomState, arenaH, 'normal', st.commandDialogElapsed);

        drawPancerCommandDialog(ctx, w, h, st.activeCommand, st.commandDialogElapsed, isLandscape);

        if (st.gameMode === 'INDIVIDUAL' && st.commandDialogElapsed >= 2.0) {
          st.gameState = 'JAMUR_ACTION';
          st.actionElapsed = 0;
          setGameState('JAMUR_ACTION');
        }
      } else if (st.gameState === 'JAMUR_ACTION') {
        updateCirclePositionsStatic(st, circleRadius, centerX, centerY);
        const prevActionElapsed = st.actionElapsed;
        st.actionElapsed += deltaTime;
        drawCircleParticipants(ctx, st, centerX, centerY, serverRoomState, arenaH, st.activeCommand.id, st.actionElapsed);
        drawActionBanner(
          ctx,
          w,
          h,
          st.activeCommand,
          st.actionElapsed,
          isLandscape,
          arenaX,
          arenaY,
          arenaW,
          arenaH,
          circleRadius
        );

        // Play countdown tick during the final 3, 2, 1 seconds of holding pose
        const prevSec = Math.ceil(Math.max(0, st.activeCommand.duration - prevActionElapsed));
        const curSec = Math.ceil(Math.max(0, st.activeCommand.duration - st.actionElapsed));
        if (curSec <= 3 && curSec >= 1 && curSec < prevSec) {
          audioManager.playPoseCountdownTick(curSec);
        }

        if (st.gameMode === 'INDIVIDUAL' && st.actionElapsed >= st.activeCommand.duration) {
          audioManager.playObstacleSuccess();
          st.gameState = 'MATH_CHALLENGE';
          st.feedbackResult = null;
          setGameState('MATH_CHALLENGE');
          jamuranAudioController.pause();
        }
      } else if (
        st.gameState === 'TURN_NOMINATION' ||
        st.gameState === 'MATH_CHALLENGE' ||
        st.gameState === 'FEEDBACK_CORRECT' ||
        st.gameState === 'FEEDBACK_WRONG'
      ) {
        updateCirclePositionsStatic(st, circleRadius, centerX, centerY);
        drawCircleParticipants(
          ctx,
          st,
          centerX,
          centerY,
          serverRoomState,
          arenaH,
          st.gameState === 'FEEDBACK_CORRECT' ? 'correct' : 'normal',
          st.feedbackElapsed
        );
        drawBlurredBackgroundOverlay(ctx, w, h);

        if (st.gameState === 'MATH_CHALLENGE' || st.gameState === 'FEEDBACK_CORRECT' || st.gameState === 'FEEDBACK_WRONG') {
          drawLandscapeMathStage(ctx, w, h, st, deltaTime, serverRoomState, isLandscape);
        }

        if (st.gameState === 'FEEDBACK_CORRECT') {
          st.feedbackElapsed += deltaTime;
          updateAndDrawConfetti(ctx, st);
          updateAndDrawVictoryEffects(ctx, st, w, h, isLandscape);
          if (st.gameMode === 'INDIVIDUAL' && st.feedbackElapsed >= 3.0) {
            continueSingleplayerToNextRound();
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
      resizeObserver.disconnect();
      window.removeEventListener('resize', onWindowResize);
      window.removeEventListener('orientationchange', onWindowResize);
      jamuranAudioController.stop();
    };
  }, [continueSingleplayerToNextRound, serverRoomState]);

  // Click on Canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const x = (e.clientX - rect.left) * (canvas.width / (rect.width * dpr));
    const y = (e.clientY - rect.top) * (canvas.height / (rect.height * dpr));

    const { width: w, height: h } = viewportSizeRef.current;
    const st = stateRef.current;

    if (st.gameState === 'MENU') {
      const btn = getMenuStartButton(w, h);
      if (isInside(x, y, btn)) {
        audioManager.playClick();
        setShowModeModal(true);
      }
    }
  };

  // Turn Nomination logic for Group mode
  const myPlayerInRoom = serverRoomState?.players[playerProfile.id];
  const isMyGroupTurnToSelect = Boolean(
    gameMode === 'GROUP' &&
    serverRoomState &&
    serverRoomState.phase === 'TURN_NOMINATION' &&
    myPlayerInRoom?.groupId === serverRoomState.activeSelectorGroupId
  );

  const handleNominateGroup = (targetGroupId: string) => {
    audioManager.playClick();
    multiplayerService.selectTargetGroup(targetGroupId);
  };

  // Math Challenge status for current player
  const isMyGroupTurnToAnswer = Boolean(
    gameMode === 'INDIVIDUAL' ||
    (gameMode === 'GROUP' &&
      serverRoomState &&
      (myPlayerInRoom?.groupId === serverRoomState.activeTargetGroupId || myPlayerInRoom?.isHost))
  );

  const targetGroupName =
    gameMode === 'GROUP' && serverRoomState?.activeTargetGroupId
      ? serverRoomState.groups[serverRoomState.activeTargetGroupId]?.name
      : playerProfile.name;

  return (
    <GameContainer>
      {/* Mobile Portrait helper prompt (Only active during actual gameplay on mobile) */}
      <OrientationPrompt appScreen={appScreen} gameState={gameState} />

      {/* If currently in Lobby screen */}
      {appScreen === 'LOBBY' && serverRoomState ? (
        <div className="flex-1 w-full h-full min-h-0 min-w-0 flex flex-col overflow-hidden box-border">
          <LobbyView
            roomState={serverRoomState}
            myPlayerId={playerProfile.id}
            onStartGame={() => {
              multiplayerService.startGame();
              setAppScreen('GAME');
            }}
            onLeaveRoom={() => {
              multiplayerService.leaveRoom();
              jamuranAudioController.stop();
              jamuranAudioController.resetToBeginning();
              setAppScreen('GAME');
              setGameState('MENU');
            }}
          />
        </div>
      ) : (
        <div className="flex-1 w-full h-full min-h-0 min-w-0 flex flex-col relative overflow-hidden bg-[#112925] box-border">
          {/* ROW 1: ULTRA-COMPACT HEADER HUD (Only during active gameplay) */}
          {gameState !== 'MENU' && (
            <GameHeader
              roomCode={serverRoomState?.roomCode}
              isGroupMode={gameMode === 'GROUP'}
              roundNumber={gameMode === 'GROUP' ? serverRoomState?.roundNumber || 1 : singleScore.round}
              score={
                gameMode === 'GROUP' && myPlayerInRoom?.groupId && serverRoomState?.groups[myPlayerInRoom.groupId]
                  ? serverRoomState.groups[myPlayerInRoom.groupId].score
                  : singleScore.current
              }
              isMuted={isMuted}
              currentLyric={currentLyric}
              isSingingPhase={gameState === 'MUSIC_PLAYING'}
              onHomeClick={() => {
                audioManager.playClick();
                jamuranAudioController.stop();
                jamuranAudioController.resetToBeginning();
                if (gameMode === 'GROUP') {
                  multiplayerService.leaveRoom();
                }
                stateRef.current.gameState = 'MENU';
                setGameState('MENU');
              }}
              onScoreboardToggle={() => {
                audioManager.playClick();
                setShowManualScoreboard((prev) => !prev);
              }}
              onToggleMute={toggleMute}
              onOpenHelp={() => setIsHelpOpen(true)}
            />
          )}

          {/* ROW 2: MAIN GAME AREA (Column 1: MathQuestionPanel, Column 2: Jamuran Canvas Arena) */}
          <div className="flex-1 w-full min-h-0 min-w-0 flex flex-row items-stretch p-1 sm:p-2 px-safe gap-3 sm:gap-4 overflow-hidden relative box-border">
            {/* Column 1: Math Question Panel (Only rendered during Math Challenge & Feedback) */}
            {(gameState === 'MATH_CHALLENGE' || gameState === 'FEEDBACK_CORRECT' || gameState === 'FEEDBACK_WRONG') && (
              <div className="w-[230px] xs:w-[260px] sm:w-[290px] md:w-[330px] max-w-[36%] h-full shrink-0 flex flex-col justify-center box-border z-10">
                <MathQuestionPanel
                  question={stateRef.current.currentQuestion}
                  isGroupMode={gameMode === 'GROUP'}
                  targetGroupName={
                    gameMode === 'GROUP' && serverRoomState?.activeTargetGroupId
                      ? serverRoomState.groups[serverRoomState.activeTargetGroupId]?.name
                      : undefined
                  }
                />
              </div>
            )}

            {/* Column 2: Jamuran Arena Canvas Container (Expands to 100% on MENU and Circle phases) */}
            <div
              ref={canvasContainerRef}
              className={`flex-1 h-full min-h-0 min-w-0 relative flex items-center justify-center overflow-hidden box-border ${
                gameState !== 'MENU'
                  ? 'rounded-[14px] sm:rounded-[16px] border border-[#f4d7a1]/25 bg-[#0d221e]/50'
                  : ''
              }`}
            >
              <canvas
                ref={canvasRef}
                onClick={handleCanvasClick}
                className="block w-full h-full cursor-pointer touch-none"
              />

              {/* MAIN MENU OVERLAY - Mounted inside canvas container on MENU */}
              {gameState === 'MENU' && (
                <MainMenuOverlay
                  playerProfile={playerProfile}
                  gameMode={gameMode}
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  onStartPlay={() => {
                    audioManager.playClick();
                    setShowModeModal(true);
                  }}
                  onOpenModeSelect={() => {
                    audioManager.playClick();
                    setShowModeModal(true);
                  }}
                  onOpenIdentityModal={() => {
                    audioManager.playClick();
                    setShowIdentityModal(true);
                  }}
                  onOpenHelp={() => {
                    audioManager.playClick();
                    setIsHelpOpen(true);
                  }}
                />
              )}

              {/* DEDICATED THUMB-ZONE ROTATION CONTROLS (Fase Melingkar Jamuran di HP) */}
              {gameState === 'MUSIC_PLAYING' && (
                <RotationPaddles
                  onRotateLeftStart={() => {
                    stateRef.current.pressedKeys.ArrowLeft = true;
                  }}
                  onRotateLeftEnd={() => {
                    stateRef.current.pressedKeys.ArrowLeft = false;
                  }}
                  onRotateRightStart={() => {
                    stateRef.current.pressedKeys.ArrowRight = true;
                  }}
                  onRotateRightEnd={() => {
                    stateRef.current.pressedKeys.ArrowRight = false;
                  }}
                />
              )}

              {/* TURN NOMINATION MODAL (Revisi Dosen: 6 Groups Landscape Grid) */}
              {gameState === 'TURN_NOMINATION' && serverRoomState && (
                <TurnNominationModal
                  serverRoomState={serverRoomState}
                  isMyGroupTurn={isMyGroupTurnToSelect}
                  onNominateGroup={handleNominateGroup}
                />
              )}
            </div>
          </div>

          {/* ROW 3: ANSWER CONTROL PANEL (In normal layout flow, strictly non-overlapping) */}
          {gameState === 'MATH_CHALLENGE' && (
            <MathControlDock
              currentValue={
                gameMode === 'GROUP' && serverRoomState
                  ? serverRoomState.numberLineCurrent
                  : stateRef.current.numberLineCurrent
              }
              isMyTurn={isMyGroupTurnToAnswer}
              minVal={-5}
              maxVal={5}
              onStepLeft={() => moveMathPlayer(-1)}
              onStepRight={() => moveMathPlayer(1)}
              onDirectSelect={(val) => setDirectMathPosition(val)}
              onSubmit={submitAnswer}
            />
          )}

          {/* SINGLEPLAYER RETRY BUTTON (Normal flow in Row 3) */}
          {gameState === 'FEEDBACK_WRONG' && gameMode === 'INDIVIDUAL' && (
            <RetryBanner
              message="Belum tepat! Perhatikan pergeseran di garis bilangan."
              onRetry={retrySingleplayerQuestion}
            />
          )}

          {/* SCREEN TRANSITION EFFECT (FADE & SLIDE) UPON COMPLETING MATH CHALLENGE */}
          {gameState === 'FEEDBACK_CORRECT' && (solvedQuestion || stateRef.current.currentQuestion) && (
            <MathSuccessTransition
              question={solvedQuestion || stateRef.current.currentQuestion}
              isGroupMode={gameMode === 'GROUP'}
              scoreEarned={
                gameMode === 'GROUP'
                  ? 100
                  : 100 + Math.max(0, stateRef.current.score.streak - 1) * 20
              }
              streak={stateRef.current.score.streak}
              groupName={
                gameMode === 'GROUP' && serverRoomState?.activeTargetGroupId
                  ? serverRoomState.groups[serverRoomState.activeTargetGroupId]?.name
                  : undefined
              }
              durationSeconds={gameMode === 'GROUP' ? 3.5 : 3.0}
            />
          )}

          {/* CORNER SCOREBOARD BADGE WITH BOUNCE ANIMATION (FEEDBACK PROGRES) */}
          <ScoreboardBadge
            visible={gameState === 'FEEDBACK_CORRECT' || showManualScoreboard}
            isGroupMode={gameMode === 'GROUP'}
            pointsGained={
              gameMode === 'GROUP'
                ? 100
                : 100 + Math.max(0, singleScore.streak - 1) * 20
            }
            streak={gameMode === 'GROUP' ? 1 : singleScore.streak}
            totalScore={
              gameMode === 'GROUP' && myPlayerInRoom?.groupId && serverRoomState?.groups[myPlayerInRoom.groupId]
                ? serverRoomState.groups[myPlayerInRoom.groupId].score
                : singleScore.current
            }
            roundNumber={gameMode === 'GROUP' ? serverRoomState?.roundNumber || 1 : singleScore.round}
            totalAnswered={singleScore.totalAnswered}
            highScore={singleScore.highScore}
            isNewHighScore={singleScore.current > 0 && singleScore.current >= singleScore.highScore}
            groupName={
              gameMode === 'GROUP' && serverRoomState?.activeTargetGroupId
                ? serverRoomState.groups[serverRoomState.activeTargetGroupId]?.name
                : undefined
            }
            allGroups={serverRoomState?.groups}
            activeGroupId={serverRoomState?.activeTargetGroupId}
            onClose={() => setShowManualScoreboard(false)}
          />
        </div>
      )}

      {/* MODAL 1: IDENTITY SETUP */}
      {showIdentityModal && (
        <IdentitySetupModal
          initialPlayer={playerProfile}
          onConfirm={(profile) => {
            const updated: PlayerProfile = {
              ...playerProfile,
              name: profile.name,
              character: profile.character,
              colorVariant: profile.colorVariant
            };
            setPlayerProfile(updated);
            setShowIdentityModal(false);

            if (gameMode === 'GROUP') {
              setShowRoomModal(true);
            } else {
              startSingleplayerGame();
            }
          }}
          onCancel={() => setShowIdentityModal(false)}
        />
      )}

      {/* MODAL 2: MODE SELECT */}
      {showModeModal && (
        <ModeSelectModal
          onSelectMode={(mode) => {
            setGameMode(mode);
            setShowModeModal(false);
            setShowIdentityModal(true);
          }}
          onClose={() => setShowModeModal(false)}
        />
      )}

      {/* MODAL 3: ROOM JOIN / CREATE */}
      {showRoomModal && (
        <RoomJoinCreateModal
          player={playerProfile}
          mode={gameMode}
          onSuccess={() => {
            setShowRoomModal(false);
            setAppScreen('LOBBY');
          }}
          onClose={() => setShowRoomModal(false)}
          onChangeIdentity={() => {
            setShowRoomModal(false);
            setShowIdentityModal(true);
          }}
        />
      )}

      {/* MODAL 4: HOW TO PLAY */}
      <HowToPlayModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </GameContainer>
  );
};

/* ========================================================================= */
/* RENDERING HELPER FUNCTIONS (LANDSCAPE OPTIMIZED)                          */
/* ========================================================================= */

function isInside(x: number, y: number, box: { x: number; y: number; width: number; height: number }) {
  return x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height;
}

function getMenuStartButton(w: number, h: number) {
  const isLandscape = w > h;
  const width = Math.min(w * 0.36, isLandscape ? 240 : 280);
  const height = Math.max(46, isLandscape ? h * 0.12 : h * 0.08);
  return {
    x: (w - width) / 2,
    y: isLandscape ? h * 0.68 : h * 0.72,
    width,
    height
  };
}

function drawCourtyard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  viewportW: number,
  viewportH: number
) {
  ctx.fillStyle = '#112925';
  ctx.fillRect(0, 0, viewportW, viewportH);

  const radius = Math.min(w, h) * 0.06;
  ctx.fillStyle = '#79b85b';
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 241, 199, 0.22)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x + 12, y + 12, w - 24, h - 24, radius * 0.8);
  ctx.stroke();

  const cornerOffset = 36;
  drawKawungMotif(ctx, x + cornerOffset, y + cornerOffset);
  drawKawungMotif(ctx, x + w - cornerOffset, y + cornerOffset);
  drawKawungMotif(ctx, x + cornerOffset, y + h - cornerOffset);
  drawKawungMotif(ctx, x + w - cornerOffset, y + h - cornerOffset);
}

function drawKawungMotif(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 241, 199, 0.25)';
  ctx.strokeStyle = 'rgba(255, 241, 199, 0.35)';
  ctx.lineWidth = 1.2;
  const r = 14;
  for (let i = 0; i < 4; i++) {
    const angle = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r, r * 0.85, r * 0.4, angle, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawCenterMushroom(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  const capW = size * 1.5;
  const capH = size * 0.8;
  const stemW = size * 0.5;
  const stemH = size * 0.75;

  ctx.save();
  ctx.fillStyle = '#f4d7a1';
  ctx.strokeStyle = '#5a321f';
  ctx.lineWidth = Math.max(2.5, size * 0.04);
  ctx.beginPath();
  ctx.roundRect(cx - stemW / 2, cy - stemH * 0.15, stemW, stemH, size * 0.12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#d95d39';
  ctx.beginPath();
  ctx.ellipse(cx, cy - stemH * 0.15, capW / 2, capH / 2, 0, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff1c7';
  [
    { x: -0.38, y: -0.16, r: 0.09 },
    { x: 0, y: -0.32, r: 0.11 },
    { x: 0.38, y: -0.16, r: 0.09 }
  ].forEach((spot) => {
    ctx.beginPath();
    ctx.arc(cx + size * spot.x, cy - stemH * 0.15 - size * spot.y, size * spot.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function updateCirclePhysics(st: any, dt: number, radius: number, cx: number, cy: number) {
  // If audio is buffering, pause character circle animations until buffer catches up
  if (jamuranAudioController.isBuffering()) {
    st.player.walkFrame = 0;
    st.player.isMoving = false;
    updateCirclePositionsStatic(st, radius, cx, cy);
    return;
  }

  const movingRight = st.pressedKeys.ArrowRight && !st.pressedKeys.ArrowLeft;
  const movingLeft = st.pressedKeys.ArrowLeft && !st.pressedKeys.ArrowRight;
  st.player.isMoving = movingRight || movingLeft || true;

  if (st.player.isMoving) {
    const dir = movingLeft ? -1 : 1;
    st.player.direction = dir;
    st.player.angle += dir * st.player.angularSpeed * dt;

    // Walk cadence synchronized with authentic audio (~104 BPM = ~1.733 beats per second)
    const audioTime = jamuranAudioController.getCurrentTime();
    if (audioTime > 0) {
      const beat = audioTime * (104 / 60);
      st.player.walkFrame = Math.floor(beat * 4) % 6;
    } else {
      st.player.walkTimer += Math.abs(st.player.angularSpeed) * dt * 4;
      st.player.walkFrame = Math.floor(st.player.walkTimer) % 6;
    }
  } else {
    st.player.walkTimer = 0;
    st.player.walkFrame = 0;
  }

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
      st.player.directionRow = 1;
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

  st.npcs.forEach((npc: NpcMember) => {
    const angle = st.player.angle + npc.angleOffset;
    npc.x = cx + Math.cos(angle) * radius;
    npc.y = cy + Math.sin(angle) * radius;
    npc.directionRow = st.player.directionRow;
    npc.flipHorizontal = st.player.flipHorizontal;
  });

  st.pancer.x = cx;
  st.pancer.y = cy - 8;
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
  st.pancer.y = cy - 8;
}

function drawCircleParticipants(
  ctx: CanvasRenderingContext2D,
  st: any,
  cx: number,
  cy: number,
  serverRoomState: RoomState | null,
  arenaH: number,
  actionState: any = 'normal',
  actionElapsed: number = 0
) {
  // Proportional character size based on arena height
  const charH = Math.min(84, Math.max(52, arenaH * 0.24));
  const charW = Math.round(charH * (78 / 96));

  const isHoldingHands = actionState === 'holding_hands';

  // Soft arena dance path ring on grass
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 241, 199, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, st.player.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // If in Jamuran music phase, render the continuous hand-holding connections between all 7 circle participants!
  if (isHoldingHands) {
    const circleRingParticipants = [
      {
        x: st.player.x,
        y: st.player.y,
        character: st.playerProfile.character,
        colorVariant: st.playerProfile.colorVariant
      },
      ...st.npcs.map((npc: NpcMember) => ({
        x: npc.x,
        y: npc.y,
        character: npc.character,
        colorVariant: npc.colorVariant
      }))
    ];

    drawHandHoldingRing(ctx, circleRingParticipants, charW, charH, st.player.walkFrame);
  }

  const pancerGroup =
    serverRoomState && serverRoomState.pancerGroupId
      ? serverRoomState.groups[serverRoomState.pancerGroupId]
      : null;

  // Draw NPCs
  st.npcs.forEach((npc: NpcMember, index: number) => {
    drawVectorCharacter(ctx, npc.character, {
      x: npc.x,
      y: npc.y,
      width: charW,
      height: charH,
      directionRow: npc.directionRow,
      walkFrame: st.player.walkFrame,
      flipHorizontal: npc.flipHorizontal,
      actionState: isHoldingHands ? 'holding_hands' : actionState,
      actionElapsed: actionElapsed,
      colorVariant: npc.colorVariant
    });

    ctx.fillStyle = '#fff1c7';
    ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center';
    const label =
      serverRoomState && Object.values(serverRoomState.groups)[index]
        ? Object.values(serverRoomState.groups)[index].name
        : npc.name;
    ctx.fillText(label, npc.x, npc.y + charH * 0.54);
  });

  // Central Pancer (Pancer is in center and does not hold hands with the outer circle)
  const pancerChar = pancerGroup ? pancerGroup.character : st.pancer.character;
  const pancerColor = pancerGroup ? pancerGroup.colorVariant : 0;

  // Determine Pancer's dynamic action state synchronized with each game phase:
  let pancerActionState: any = 'normal';
  let pancerElapsed: number = actionElapsed;

  if (st.gameState === 'MUSIC_PLAYING') {
    // 1. Fase Pemain Mengelilingi Pancer: Tepuk tangan ritmis 104 BPM, badan bergoyang
    pancerActionState = 'pancer_clapping';
    const audioTime = jamuranAudioController.getCurrentTime();
    pancerElapsed = audioTime > 0 ? audioTime : performance.now() / 1000;
  } else if (st.gameState === 'JAMUR_COMMAND') {
    if (st.commandDialogElapsed < 0.8) {
      // 2. Fase Akhir Lagu: Berhenti tepuk tangan, angkat tangan "Mandheg! / Stop!", lihat pemain
      pancerActionState = 'pancer_stop';
      pancerElapsed = st.commandDialogElapsed;
    } else {
      // 3. Fase Memberikan Instruksi Jamuran: Menunjuk & menginstruksikan perintah jamur
      pancerActionState = 'pancer_instruct';
      pancerElapsed = st.commandDialogElapsed - 0.8;
    }
  } else if (st.gameState === 'JAMUR_ACTION') {
    // 4. Fase Aksi Pemain: Mengamati aksi pemain, tangan di pinggang (akimbo), mengangguk ramah
    pancerActionState = 'pancer_observe';
    pancerElapsed = st.actionElapsed;
  } else if (st.gameState === 'FEEDBACK_CORRECT') {
    // 5. Fase Jawaban Benar: Reaksi senang, tersenyum lebar & tepuk tangan gembira
    pancerActionState = 'pancer_celebrate';
    pancerElapsed = st.feedbackElapsed;
  } else if (st.gameState === 'FEEDBACK_WRONG') {
    pancerActionState = 'pancer_observe';
    pancerElapsed = st.feedbackElapsed;
  } else {
    pancerActionState = isHoldingHands ? 'pancer_clapping' : 'pancer_observe';
    pancerElapsed = performance.now() / 1000;
  }

  drawVectorCharacter(ctx, pancerChar, {
    x: st.pancer.x,
    y: st.pancer.y,
    width: charW,
    height: charH,
    directionRow: 0,
    walkFrame: 0,
    colorVariant: pancerColor,
    isPancer: true,
    actionState: pancerActionState,
    actionElapsed: pancerElapsed
  });

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(
    pancerGroup ? `PANCER (${pancerGroup.name})` : 'PANCER',
    st.pancer.x,
    st.pancer.y + charH * 0.54
  );

  // Player
  drawVectorCharacter(ctx, st.playerProfile.character, {
    x: st.player.x,
    y: st.player.y,
    width: charW,
    height: charH,
    directionRow: st.player.directionRow,
    walkFrame: st.player.walkFrame,
    flipHorizontal: st.player.flipHorizontal,
    actionState: isHoldingHands ? 'holding_hands' : actionState,
    actionElapsed: actionElapsed,
    colorVariant: st.playerProfile.colorVariant,
    highlightRing: true
  });

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`Kamu (${st.playerProfile.name})`, st.player.x, st.player.y + charH * 0.54);
}

function drawPancerCommandDialog(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  command: any,
  elapsed: number,
  isLandscape: boolean
) {
  const dialogW = Math.min(w * 0.65, 520);
  const dialogH = isLandscape ? 64 : 80;
  const dialogX = (w - dialogW) / 2;
  const dialogY = isLandscape ? Math.max(46, h * 0.12) : 60;

  ctx.save();
  ctx.fillStyle = 'rgba(24, 61, 56, 0.95)';
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(dialogX, dialogY, dialogW, dialogH, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff1c7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${isLandscape ? 13 : 15}px Arial`;
  ctx.fillText("PANCER  •  SEMANGAT JAMURAN!", w / 2, dialogY + (isLandscape ? 18 : 24));

  const commandVisible = elapsed >= 0.8;
  ctx.fillStyle = commandVisible ? '#ffd166' : '#b5d48c';
  ctx.font = `bold ${isLandscape ? 17 : 20}px Arial`;
  ctx.fillText(commandVisible ? `${command.name}!` : "Semprat-semprit jamur apa...?", w / 2, dialogY + (isLandscape ? 44 : 54));
  ctx.restore();
}

function drawActionBanner(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  command: any,
  elapsed: number,
  isLandscape: boolean,
  arenaX?: number,
  arenaY?: number,
  arenaW?: number,
  arenaH?: number,
  circleRadius?: number
) {
  const topOffset = isLandscape ? Math.max(38, Math.min(48, h * 0.12)) : 52;
  const remaining = Math.max(0, Math.ceil(command.duration - elapsed));

  // Compact floating card dimensions (small, minimalist, unobtrusive)
  const overlayW = isLandscape ? Math.min(230, Math.max(185, w * 0.26)) : Math.min(220, w - 24);
  const overlayH = isLandscape ? 48 : 52;

  // Safe placement on the upper-right side of the arena, strictly avoiding all character positions
  const defaultArenaRight = arenaX !== undefined && arenaW !== undefined ? arenaX + arenaW : w - 16;
  const defaultArenaTop = arenaY !== undefined ? arenaY : topOffset;

  const overlayX = Math.min(defaultArenaRight - overlayW - 12, w - overlayW - 14);
  const overlayY = Math.max(topOffset + 6, defaultArenaTop + 8);

  ctx.save();

  // 1. Dark green background with ~65% transparency (Glassmorphic HUD overlay)
  ctx.fillStyle = 'rgba(15, 45, 38, 0.65)';
  // Subtle hairline border (no thick heavy borders)
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.35)';
  ctx.lineWidth = 1;

  ctx.beginPath();
  // Soft, lightweight rounded corners (8px)
  ctx.roundRect(overlayX, overlayY, overlayW, overlayH, 8);
  ctx.fill();
  ctx.stroke();

  // Internal padding
  const padX = 10;
  const contentLeft = overlayX + padX;
  const contentRight = overlayX + overlayW - padX;
  const contentWidth = overlayW - padX * 2;

  // 2. Header Row: Action Title in Gold + Compact Timer Badge
  const headerY = overlayY + 14;

  // Action Title (Gold #ffd166, bold, concise)
  ctx.fillStyle = '#ffd166';
  ctx.font = `bold ${isLandscape ? 11 : 12}px Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const actionTitle = `AKSI ${command.name.toUpperCase()}`;
  ctx.fillText(actionTitle, contentLeft, headerY);

  // Timer pill badge on top-right of the card (clear without dominating)
  const timerText = `${remaining}s`;
  ctx.font = `bold ${isLandscape ? 10 : 11}px Arial`;
  const timerWidth = ctx.measureText(timerText).width + 10;
  const timerH = 16;
  const timerX = contentRight - timerWidth;
  const timerY = headerY - timerH / 2;

  ctx.fillStyle = remaining <= 3 ? 'rgba(229, 62, 62, 0.75)' : 'rgba(217, 93, 57, 0.55)';
  ctx.beginPath();
  ctx.roundRect(timerX, timerY, timerWidth, timerH, 4);
  ctx.fill();

  ctx.fillStyle = '#fff1c7';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(timerText, timerX + timerWidth / 2, headerY);

  // 3. Instruction Row: small, clean, easy-to-read font (#fff1c7)
  const instructionY = headerY + 12;
  ctx.fillStyle = '#fff1c7';
  ctx.font = `${isLandscape ? 9.5 : 10}px Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // Single or double line wrapped text cleanly fitting within contentWidth
  const words = command.actionInstruction.split(' ');
  let line = '';
  let curY = instructionY;
  let lineCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + (line ? ' ' : '') + words[n];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > contentWidth && n > 0) {
      ctx.fillText(line, contentLeft, curY);
      line = words[n];
      curY += 12;
      lineCount++;
      if (lineCount >= 2) break;
    } else {
      line = testLine;
    }
  }
  if (lineCount < 2 && line) {
    ctx.fillText(line, contentLeft, curY);
  }

  ctx.restore();
}

function drawBlurredBackgroundOverlay(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 40, 36, 0.85)';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

/**
 * LANDSCAPE-OPTIMIZED DUAL-ZONE MATH CHALLENGE
 * Left Zone (32-36%): Math Formula Card & Concept Note
/**
 * JAMURAN ARENA: Interactive Number Line & Character Arena
 * Question is rendered crisply in HTML (MathQuestionPanel in Column 1).
 * Canvas renders the spacious number line, player character, jumping arcs, and markers.
 */
function drawLandscapeMathStage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  st: any,
  dt: number,
  serverRoomState: RoomState | null,
  isLandscape: boolean
) {
  // Center coordinates
  const centerX = w / 2;
  const centerY = h * 0.52;

  // Decorative soft Alun-Alun lawn backdrop patch
  ctx.save();
  ctx.fillStyle = 'rgba(121, 184, 91, 0.22)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, Math.min(w * 0.44, 280), Math.min(h * 0.38, 95), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Number Line geometry
  const lineW = Math.min(w * 0.88, w - 36);
  const lineX = (w - lineW) / 2;
  const lineY = centerY;
  const step = lineW / (st.numberLineMax - st.numberLineMin);

  drawInteractiveNumberLine(ctx, lineX, lineY, lineW, step, st, serverRoomState, isLandscape);

  // Character sitting on Number line
  const currentPos =
    st.gameMode === 'GROUP' && serverRoomState
      ? serverRoomState.numberLineCurrent
      : st.numberLineCurrent;

  const charH = Math.min(84, Math.max(48, h * 0.36));
  const charW = Math.round(charH * (78 / 96));
  const playerX = lineX + (currentPos - st.numberLineMin) * step;
  const playerY = lineY - charH * 0.54;

  const actionPose =
    st.gameState === 'FEEDBACK_CORRECT'
      ? 'correct'
      : st.gameState === 'FEEDBACK_WRONG'
      ? 'wrong'
      : 'normal';

  drawVectorCharacter(ctx, st.playerProfile.character, {
    x: playerX,
    y: playerY,
    width: charW,
    height: charH,
    directionRow: st.player.directionRow,
    walkFrame: 0,
    flipHorizontal: st.player.flipHorizontal,
    actionState: actionPose,
    actionElapsed: st.feedbackElapsed,
    colorVariant: st.playerProfile.colorVariant,
    highlightRing: true
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

function drawInteractiveNumberLine(
  ctx: CanvasRenderingContext2D,
  lineX: number,
  lineY: number,
  lineWidth: number,
  step: number,
  st: any,
  serverRoomState: RoomState | null,
  isLandscape: boolean
) {
  const tickH = isLandscape ? 12 : 14;

  const currentVal =
    st.gameMode === 'GROUP' && serverRoomState
      ? serverRoomState.numberLineCurrent
      : st.numberLineCurrent;

  const startVal =
    st.gameMode === 'GROUP' && serverRoomState
      ? serverRoomState.numberLineStart
      : st.numberLineStart;

  ctx.save();
  ctx.strokeStyle = '#f4d7a1';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(lineX, lineY);
  ctx.lineTo(lineX + lineWidth, lineY);
  ctx.stroke();

  // Arrows
  ctx.fillStyle = '#f4d7a1';
  ctx.beginPath();
  ctx.moveTo(lineX - 8, lineY);
  ctx.lineTo(lineX, lineY - 6);
  ctx.lineTo(lineX, lineY + 6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(lineX + lineWidth + 8, lineY);
  ctx.lineTo(lineX + lineWidth, lineY - 6);
  ctx.lineTo(lineX + lineWidth, lineY + 6);
  ctx.closePath();
  ctx.fill();

  // Jump arc
  const startX = lineX + (startVal - st.numberLineMin) * step;
  const currX = lineX + (currentVal - st.numberLineMin) * step;

  if (startVal !== currentVal) {
    const isForward = currentVal > startVal;
    const arcHeight = Math.min(36, Math.abs(currX - startX) * 0.32);

    ctx.strokeStyle = isForward ? '#79b85b' : '#e53e3e';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(startX, lineY - 8);
    ctx.quadraticCurveTo((startX + currX) / 2, lineY - 8 - arcHeight, currX, lineY - 8);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.font = `bold ${isLandscape ? 12 : 14}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  for (let val = st.numberLineMin; val <= st.numberLineMax; val++) {
    const x = lineX + (val - st.numberLineMin) * step;

    ctx.strokeStyle = val === 0 ? '#ffd166' : '#f4d7a1';
    ctx.lineWidth = val === 0 ? 3.5 : 1.5;
    ctx.beginPath();
    ctx.moveTo(x, lineY - tickH / 2);
    ctx.lineTo(x, lineY + tickH / 2);
    ctx.stroke();

    ctx.fillStyle =
      val === currentVal
        ? '#ffd166'
        : val === 0
        ? '#fff1c7'
        : val < 0
        ? '#f6ad55'
        : '#9ae6b4';
    ctx.fillText(String(val), x, lineY + tickH / 2 + 5);
  }

  // START marker
  ctx.fillStyle = '#ffd166';
  ctx.beginPath();
  ctx.arc(startX, lineY, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 9px Arial';
  ctx.fillText("MULAI", startX, lineY + tickH / 2 + 20);

  ctx.fillStyle = '#fff1c7';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`POSISI: ${currentVal}`, lineX + lineWidth, lineY - 24);

  ctx.restore();
}

function updateAndDrawConfetti(ctx: CanvasRenderingContext2D, st: any) {
  ctx.save();
  st.confetti.forEach((p: any) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.15;

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function updateAndDrawVictoryEffects(
  ctx: CanvasRenderingContext2D,
  st: any,
  w: number,
  h: number,
  isLandscape: boolean
) {
  const t = st.feedbackElapsed;
  if (t <= 0) return;

  ctx.save();

  // 1. Fullscreen Golden Vignette & Ambient Radial Glow (Smooth Fade-In / Fade-Out)
  let ambientAlpha = 0;
  if (t < 0.4) {
    ambientAlpha = (t / 0.4) * 0.28;
  } else if (t < 2.4) {
    ambientAlpha = 0.28;
  } else {
    ambientAlpha = Math.max(0, ((3.0 - t) / 0.6) * 0.28);
  }

  if (ambientAlpha > 0) {
    const radial = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.7);
    radial.addColorStop(0, `rgba(255, 209, 102, ${ambientAlpha * 0.6})`);
    radial.addColorStop(0.5, `rgba(121, 184, 91, ${ambientAlpha * 0.25})`);
    radial.addColorStop(1, `rgba(17, 41, 37, ${ambientAlpha * 0.7})`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, w, h);

    // 2. Celebratory Golden Beam Sweep (slides from left to right in first 1.2s)
    if (t < 1.2) {
      const sweepProgress = t / 1.2;
      const sweepX = -w * 0.3 + sweepProgress * (w * 1.6);
      const sweepGrad = ctx.createLinearGradient(sweepX - 80, 0, sweepX + 80, 0);
      sweepGrad.addColorStop(0, 'rgba(255, 209, 102, 0)');
      sweepGrad.addColorStop(0.5, 'rgba(255, 241, 199, 0.22)');
      sweepGrad.addColorStop(1, 'rgba(255, 209, 102, 0)');
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, 0, w, h);
    }
  }

  // 3. Expanding Shockwave Rings around the Target Number on the Number Line
  const leftW = isLandscape ? Math.min(w * 0.35, 340) : 0;
  const leftX = isLandscape ? 16 : 0;
  const topY = isLandscape ? 46 : 54;
  const leftH = isLandscape ? h - topY - 72 : 140;
  const rightX = isLandscape ? leftX + leftW + 20 : (w - Math.min(w * 0.88, 540)) / 2;
  const rightW = isLandscape ? w - rightX - 16 : Math.min(w * 0.88, 540);
  const lineY = isLandscape ? topY + leftH * 0.58 : topY + leftH + 110;
  const step = rightW / (st.numberLineMax - st.numberLineMin);

  const targetX = rightX + (st.numberLineCurrent - st.numberLineMin) * step;
  const targetY = lineY;

  // Draw 2 periodic expanding golden rings
  for (let r = 0; r < 2; r++) {
    const phase = ((t * 2.2 + r * 0.5) % 1);
    const radius = 14 + phase * 65;
    const ringAlpha = Math.max(0, (1 - phase) * 0.75);
    ctx.strokeStyle = `rgba(255, 209, 102, ${ringAlpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(targetX, targetY, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 4. Update and render golden victory stars
  if (st.victorySparkles) {
    st.victorySparkles.forEach((s: any) => {
      s.x += s.vx;
      s.y += s.vy;
      s.rot += 0.05;
      s.alpha = Math.max(0, s.alpha - 0.007);

      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = `rgba(255, 209, 102, ${s.alpha})`;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(Math.cos((i * Math.PI) / 2) * s.size, Math.sin((i * Math.PI) / 2) * s.size);
        ctx.lineTo(
          Math.cos(((i + 0.5) * Math.PI) / 2) * (s.size * 0.38),
          Math.sin(((i + 0.5) * Math.PI) / 2) * (s.size * 0.38)
        );
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  }

  ctx.restore();
}

function drawMenuScreen(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  // Soft ambient vignette over the rotating Jamuran courtyard
  const radial = ctx.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, Math.max(w, h) * 0.75);
  radial.addColorStop(0, 'rgba(15, 40, 36, 0.65)');
  radial.addColorStop(0.7, 'rgba(17, 41, 37, 0.85)');
  radial.addColorStop(1, 'rgba(12, 30, 27, 0.95)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
