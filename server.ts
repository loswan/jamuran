import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  ClientMessage,
  ServerMessage,
  RoomState,
  PlayerProfile,
  GroupProfile,
  GameMode,
  JamurCommand,
  MathQuestion
} from './src/types/game.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-defined math questions on server (authoritative source of truth)
const SERVER_MATH_QUESTIONS: MathQuestion[] = [
  {
    id: 1,
    prompt: "Berapa hasil dari penjumlahan ini?",
    operation: "-3 + 5",
    start: -3,
    step: 5,
    answer: 2,
    explanation: "Mulai dari titik -3, melangkah ke kanan (+) sebanyak 5 satuan. Berhenti di angka 2.",
    conceptNote: "Penjumlahan (+) artinya bergerak ke arah KANAN pada garis bilangan."
  },
  {
    id: 2,
    prompt: "Berapa hasil dari pengurangan ini?",
    operation: "2 - 4",
    start: 2,
    step: -4,
    answer: -2,
    explanation: "Mulai dari titik 2, melangkah ke kiri (-) sebanyak 4 satuan. Berhenti di angka -2.",
    conceptNote: "Pengurangan (-) artinya bergerak ke arah KIRI pada garis bilangan."
  },
  {
    id: 3,
    prompt: "Berapa hasil dari penjumlahan ini?",
    operation: "-4 + 7",
    start: -4,
    step: 7,
    answer: 3,
    explanation: "Mulai dari titik -4, bergerak ke kanan (+) sebanyak 7 satuan. Berhenti di angka 3.",
    conceptNote: "Mulai di daerah negatif, bergerak ke kanan melewati angka 0 menuju positif."
  },
  {
    id: 4,
    prompt: "Berapa hasil dari pengurangan ini?",
    operation: "-1 - 3",
    start: -1,
    step: -3,
    answer: -4,
    explanation: "Mulai dari titik -1, lalu bergerak makin ke kiri (-) sebanyak 3 satuan. Berhenti di angka -4.",
    conceptNote: "Negatif dikurangi bilangan positif membuat nilainya semakin ke kiri (semakin negatif)."
  },
  {
    id: 5,
    prompt: "Berapa hasil dari penjumlahan ini?",
    operation: "-2 + 2",
    start: -2,
    step: 2,
    answer: 0,
    explanation: "Mulai dari titik -2, melangkah ke kanan (+) sebanyak 2 satuan. Berhenti tepat di angka netral 0!",
    conceptNote: "Dua bilangan berlawanan tanda jika dijumlahkan menghasilkan 0."
  },
  {
    id: 6,
    prompt: "Berapa hasil dari pengurangan ini?",
    operation: "1 - 5",
    start: 1,
    step: -5,
    answer: -4,
    explanation: "Mulai dari titik 1, melangkah ke kiri (-) sebanyak 5 satuan. Berhenti di angka -4.",
    conceptNote: "Pengurangan lebih besar dari titik awal, hasilnya jatuh ke wilayah negatif."
  },
  {
    id: 7,
    prompt: "Berapa hasil dari penjumlahan ini?",
    operation: "-5 + 4",
    start: -5,
    step: 4,
    answer: -1,
    explanation: "Mulai dari titik -5, melangkah ke kanan (+) sebanyak 4 satuan. Berhenti di angka -1.",
    conceptNote: "Maju ke kanan mendekati angka nol."
  },
  {
    id: 8,
    prompt: "Berapa hasil dari pengurangan ini?",
    operation: "3 - 5",
    start: 3,
    step: -5,
    answer: -2,
    explanation: "Mulai dari titik 3, melangkah ke kiri (-) sebanyak 5 satuan. Berhenti di angka -2.",
    conceptNote: "Melangkah 3 satuan sampai nol, lalu lanjut 2 satuan lagi ke kiri sehingga berada di -2."
  }
];

const SERVER_JAMUR_COMMANDS: JamurCommand[] = [
  {
    id: 'gagak',
    name: 'JAMUR GAGAK',
    javaneseName: 'Jamur Gagak (Gaok-gaok)',
    description: 'Mengepakkan kedua tangan seperti sayap burung gagak sambil bersuara gaok-gaok!',
    actionInstruction: 'Kepakkan sayapmu seperti burung gagak gaok-gaok!',
    duration: 11.6
  },
  {
    id: 'kethek',
    name: 'JAMUR KETHEK',
    javaneseName: 'Jamur Kethek (Kethekan)',
    description: 'Menirukan gerakan monyet yang lucu sedang menggaruk ketiak dan kepala!',
    actionInstruction: 'Tirukan monyet menggaruk badan dengan gembira!',
    duration: 3.5
  },
  {
    id: 'gagang',
    name: 'JAMUR GAGANG',
    javaneseName: 'Jamur Gagang (Tangkai Pohon)',
    description: 'Berdiri tegak dengan satu kaki seperti tangkai jamur tanpa goyah!',
    actionInstruction: 'Angkat satu kakimu dan pertahankan keseimbangan!',
    duration: 3.5
  },
  {
    id: 'payung',
    name: 'JAMUR PAYUNG',
    javaneseName: 'Jamur Payung (Payungan)',
    description: 'Merentangkan kedua tangan ke atas membentuk lengkungan payung yang megah!',
    actionInstruction: 'Rentangkan tangan ke atas seperti payung pelindung hujan!',
    duration: 3.5
  },
  {
    id: 'meja_kursi',
    name: 'JAMUR MEJA KURSI',
    javaneseName: 'Jamur Meja Kursi',
    description: 'Jongkok mantap dengan tangan di lutut menjadi kursi atau meja yang kokoh!',
    actionInstruction: 'Jongkok dengan kokoh membentuk meja dan kursi!',
    duration: 3.5
  }
];

interface ConnectedClient {
  ws: WebSocket;
  playerId: string;
  roomCode: string | null;
  isAlive: boolean;
}

// In-Memory Database for active rooms
const rooms = new Map<string, RoomState>();
const clients = new Map<WebSocket, ConnectedClient>();

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function sendTo(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomCode: string, message: ServerMessage) {
  const room = rooms.get(roomCode);
  if (!room) return;

  clients.forEach((client) => {
    if (client.roomCode === roomCode && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  });
}

function broadcastRoomState(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  room.updatedAt = Date.now();
  broadcastToRoom(roomCode, {
    type: 'ROOM_STATE_UPDATE',
    payload: room
  });
}

// Default 6 standard school groups for group mode
function createDefaultGroups(): Record<string, GroupProfile> {
  const defaultNames = [
    { name: 'Kelompok 1 (Semar)', character: 'boy' as const, color: 0 },
    { name: 'Kelompok 2 (Gareng)', character: 'boy' as const, color: 1 },
    { name: 'Kelompok 3 (Petruk)', character: 'boy' as const, color: 2 },
    { name: 'Kelompok 4 (Bagong)', character: 'boy' as const, color: 3 },
    { name: 'Kelompok 5 (Srikandi)', character: 'girl' as const, color: 0 },
    { name: 'Kelompok 6 (Dewi Shinta)', character: 'girl' as const, color: 1 }
  ];

  const groups: Record<string, GroupProfile> = {};
  defaultNames.forEach((item, index) => {
    const id = `group-${index + 1}`;
    groups[id] = {
      id,
      name: item.name,
      character: item.character,
      colorVariant: item.color,
      score: 0,
      isPancer: false,
      memberIds: []
    };
  });
  return groups;
}

// Main game loop ticker for active rooms (timing out turns, countdowns, phase transitions)
setInterval(() => {
  const now = Date.now();

  rooms.forEach((room, roomCode) => {
    if (room.phase === 'MATH_CHALLENGE' && room.turnTimeRemaining > 0) {
      room.turnTimeRemaining -= 1;
      if (room.turnTimeRemaining <= 0) {
        // TIME OUT! Target group failed to answer within time limit
        handleTimeoutAnswer(roomCode);
      } else if (room.turnTimeRemaining % 5 === 0) {
        broadcastRoomState(roomCode);
      }
    }
  });
}, 1000);

function handleTimeoutAnswer(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room || room.phase !== 'MATH_CHALLENGE') return;

  const targetGroup = room.activeTargetGroupId ? room.groups[room.activeTargetGroupId] : null;
  const targetName = targetGroup ? targetGroup.name : 'Kelompok yang ditunjuk';

  // Mark group as Pancer (penalty)
  room.phase = 'FEEDBACK_WRONG';
  room.feedbackResult = 'wrong';
  room.feedbackElapsed = 0;
  if (room.activeTargetGroupId) {
    room.pancerGroupId = room.activeTargetGroupId;
    // Set all groups isPancer = false except this one
    Object.values(room.groups).forEach((g) => {
      g.isPancer = g.id === room.activeTargetGroupId;
    });
  }

  room.announcement = `Waktu Habis! ${targetName} gagal menjawab tepat waktu dan dihukum menjadi PANCER di tengah!`;
  broadcastRoomState(roomCode);

  // Transition back to Jamuran after 3.5s
  setTimeout(() => {
    resumeJamuranAfterFeedback(roomCode);
  }, 3500);
}

function resumeJamuranAfterFeedback(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  // Next selector group: if previous was correct, target group becomes selector.
  // If wrong, pick next eligible group
  if (room.feedbackResult === 'wrong') {
    // Rotate selector to next group that is NOT the pancer
    const groupIds = Object.keys(room.groups).filter((gid) => room.groups[gid].memberIds.length > 0);
    if (groupIds.length > 0) {
      const nextCandidates = groupIds.filter((gid) => gid !== room.pancerGroupId);
      room.activeSelectorGroupId = nextCandidates.length > 0 ? nextCandidates[0] : groupIds[0];
    }
  }

  room.phase = 'MUSIC_PLAYING';
  room.activeTargetGroupId = null;
  room.feedbackResult = null;
  room.feedbackElapsed = 0;
  room.announcement = 'Musik Jamuran dimulai! Berputar membentuk lingkaran!';
  broadcastRoomState(roomCode);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    try {
      const hostHeader = request.headers.host || 'localhost';
      const url = new URL(request.url || '', `http://${hostHeader}`);
      const pathname = url.pathname;

      if (pathname === '/ws') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      } else {
        // Return 404 response before closing non-multiplayer upgrade sockets
        socket.write('HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n');
        socket.destroy();
      }
    } catch {
      socket.destroy();
    }
  });

  // Server-side heartbeat to sweep dead sockets and prevent reverse proxy timeout
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const client = clients.get(ws);
      if (!client) return;
      if (!client.isAlive) {
        ws.terminate();
        return;
      }
      client.isAlive = false;
      ws.ping();
    });
  }, 30000);

  server.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  app.use(express.json());

  // Support static assets under both /jamuran base path and root
  app.use('/jamuran', express.static(path.resolve(__dirname, 'public')));
  app.use(express.static(path.resolve(__dirname, 'public')));

  // Health and Room Info API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      activeRooms: rooms.size,
      connectedClients: clients.size,
      timestamp: Date.now()
    });
  });

  app.get('/api/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      return res.status(404).json({ error: 'Room tidak ditemukan' });
    }
    res.json({
      roomCode: room.roomCode,
      mode: room.mode,
      phase: room.phase,
      playerCount: Object.keys(room.players).length,
      groupCount: Object.keys(room.groups).length
    });
  });

  // WebSocket Connection Handling
  wss.on('connection', (ws: WebSocket) => {
    const clientState: ConnectedClient = {
      ws,
      playerId: `player_${Math.random().toString(36).substring(2, 9)}`,
      roomCode: null,
      isAlive: true
    };
    clients.set(ws, clientState);

    ws.on('pong', () => {
      clientState.isAlive = true;
    });

    ws.on('message', (data: string) => {
      try {
        clientState.isAlive = true;
        const message: ClientMessage = JSON.parse(data.toString());
        handleClientMessage(clientState, message);
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
        sendTo(ws, {
          type: 'ERROR',
          payload: { message: 'Format pesan tidak valid' }
        });
      }
    });

    ws.on('close', () => {
      handleClientDisconnect(clientState);
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.warn('WebSocket client error:', err);
    });
  });

  function handleClientDisconnect(client: ConnectedClient) {
    if (!client.roomCode) return;
    const room = rooms.get(client.roomCode);
    if (!room) return;

    const player = room.players[client.playerId];
    const playerName = player ? player.name : 'Pemain';

    // Remove player from their group
    if (player && player.groupId && room.groups[player.groupId]) {
      room.groups[player.groupId].memberIds = room.groups[player.groupId].memberIds.filter(
        (id) => id !== client.playerId
      );
    }

    delete room.players[client.playerId];

    // Check if room is now empty
    if (Object.keys(room.players).length === 0) {
      rooms.delete(client.roomCode);
      console.log(`Room ${client.roomCode} dihapus karena semua pemain keluar.`);
      return;
    }

    // If host left, elect new host
    if (room.hostId === client.playerId) {
      const remainingIds = Object.keys(room.players);
      room.hostId = remainingIds[0];
      room.players[room.hostId].isHost = true;
      room.announcement = `${playerName} keluar. ${room.players[room.hostId].name} menjadi Host baru.`;
    } else {
      room.announcement = `${playerName} telah meninggalkan permainan.`;
    }

    broadcastToRoom(client.roomCode, {
      type: 'PLAYER_DISCONNECTED',
      payload: { playerId: client.playerId, playerName }
    });
    broadcastRoomState(client.roomCode);
  }

  function handleClientMessage(client: ConnectedClient, msg: ClientMessage) {
    switch (msg.type) {
      case 'PING': {
        sendTo(client.ws, { type: 'PONG' });
        break;
      }

      case 'CREATE_ROOM': {
        const { mode, player } = msg.payload;
        const roomCode = generateRoomCode();
        client.roomCode = roomCode;
        client.playerId = player.id || client.playerId;

        const newPlayer: PlayerProfile = {
          id: client.playerId,
          name: (player.name || 'Pemain').trim().substring(0, 16),
          character: player.character || 'boy',
          colorVariant: player.colorVariant || 0,
          isHost: true,
          isReady: true,
          groupId: mode === 'GROUP' ? 'group-1' : undefined,
          joinedAt: Date.now()
        };

        const initialGroups = mode === 'GROUP' ? createDefaultGroups() : {};
        if (mode === 'GROUP' && initialGroups['group-1']) {
          initialGroups['group-1'].memberIds.push(client.playerId);
        }

        const roomState: RoomState = {
          roomCode,
          hostId: client.playerId,
          mode,
          phase: 'LOBBY',
          players: { [client.playerId]: newPlayer },
          groups: initialGroups,
          activeSelectorGroupId: 'group-1',
          activeTargetGroupId: null,
          pancerGroupId: null,
          currentQuestion: SERVER_MATH_QUESTIONS[0],
          questionIndex: 0,
          numberLineMin: -5,
          numberLineMax: 5,
          numberLineCurrent: SERVER_MATH_QUESTIONS[0].start,
          numberLineStart: SERVER_MATH_QUESTIONS[0].start,
          activeCommand: SERVER_JAMUR_COMMANDS[0],
          commandDialogElapsed: 0,
          actionElapsed: 0,
          feedbackElapsed: 0,
          feedbackResult: null,
          turnTimeRemaining: 45,
          maxTurnTime: 45,
          announcement: `Room ${roomCode} dibuat. Bagikan kode ini ke teman-temanmu!`,
          roundNumber: 1,
          updatedAt: Date.now()
        };

        rooms.set(roomCode, roomState);
        sendTo(client.ws, {
          type: 'ROOM_CREATED',
          payload: { roomCode, playerId: client.playerId, roomState }
        });
        break;
      }

      case 'JOIN_ROOM': {
        const roomCode = msg.payload.roomCode.toUpperCase().trim();
        const room = rooms.get(roomCode);
        if (!room) {
          return sendTo(client.ws, {
            type: 'ERROR',
            payload: { message: `Room kode "${roomCode}" tidak ditemukan!` }
          });
        }

        client.roomCode = roomCode;
        client.playerId = msg.payload.player.id || client.playerId;

        // Auto-assign to group with fewest members in group mode
        let assignedGroupId: string | undefined = undefined;
        if (room.mode === 'GROUP') {
          const groupList = Object.values(room.groups);
          groupList.sort((a, b) => a.memberIds.length - b.memberIds.length);
          if (groupList.length > 0) {
            assignedGroupId = groupList[0].id;
            groupList[0].memberIds.push(client.playerId);
          }
        }

        const newPlayer: PlayerProfile = {
          id: client.playerId,
          name: (msg.payload.player.name || 'Pemain').trim().substring(0, 16),
          character: msg.payload.player.character || 'boy',
          colorVariant: msg.payload.player.colorVariant || 0,
          isHost: false,
          isReady: true,
          groupId: assignedGroupId,
          joinedAt: Date.now()
        };

        room.players[client.playerId] = newPlayer;
        room.announcement = `${newPlayer.name} bergabung ke room!`;

        sendTo(client.ws, {
          type: 'ROOM_JOINED',
          payload: { roomCode, playerId: client.playerId, roomState: room }
        });
        broadcastRoomState(roomCode);
        break;
      }

      case 'JOIN_GROUP': {
        if (!client.roomCode) return;
        const room = rooms.get(client.roomCode);
        if (!room || room.mode !== 'GROUP') return;

        const { groupId } = msg.payload;
        const player = room.players[client.playerId];
        if (!player || !room.groups[groupId]) return;

        // Remove from old group
        if (player.groupId && room.groups[player.groupId]) {
          room.groups[player.groupId].memberIds = room.groups[player.groupId].memberIds.filter(
            (id) => id !== client.playerId
          );
        }

        // Add to new group
        player.groupId = groupId;
        room.groups[groupId].memberIds.push(client.playerId);
        room.announcement = `${player.name} berpindah ke ${room.groups[groupId].name}.`;
        broadcastRoomState(client.roomCode);
        break;
      }

      case 'START_GAME': {
        if (!client.roomCode) return;
        const room = rooms.get(client.roomCode);
        if (!room) return;

        // Only host can start
        if (room.hostId !== client.playerId) {
          return sendTo(client.ws, {
            type: 'ERROR',
            payload: { message: 'Hanya Host yang dapat memulai permainan!' }
          });
        }

        // Validate groups in group mode
        if (room.mode === 'GROUP') {
          const filledGroups = Object.values(room.groups).filter((g) => g.memberIds.length > 0);
          if (filledGroups.length < 2) {
            return sendTo(client.ws, {
              type: 'ERROR',
              payload: { message: 'Minimal butuh 2 kelompok yang memiliki anggota untuk memulai!' }
            });
          }
          room.activeSelectorGroupId = filledGroups[0].id;
        }

        room.phase = 'MUSIC_PLAYING';
        room.questionIndex = 0;
        room.currentQuestion = SERVER_MATH_QUESTIONS[0];
        room.numberLineStart = room.currentQuestion.start;
        room.numberLineCurrent = room.currentQuestion.start;
        room.announcement = 'Permainan dimulai! Bersiap untuk Jamuran!';
        broadcastRoomState(client.roomCode);
        break;
      }

      case 'SELECT_TARGET_GROUP': {
        if (!client.roomCode) return;
        const room = rooms.get(client.roomCode);
        if (!room) return;
        if (
          room.phase !== 'TURN_NOMINATION' &&
          room.phase !== 'MUSIC_PLAYING' &&
          room.phase !== 'JAMUR_ACTION' &&
          room.phase !== 'JAMUR_COMMAND'
        ) {
          return;
        }

        const player = room.players[client.playerId];
        if (!player) return;

        // Validate: only members of activeSelectorGroupId (or host) can nominate
        const isSelectorMember = player.groupId === room.activeSelectorGroupId;
        if (!isSelectorMember && !player.isHost) {
          return sendTo(client.ws, {
            type: 'ERROR',
            payload: { message: 'Bukan giliran kelompokmu untuk menunjuk!' }
          });
        }

        const { targetGroupId } = msg.payload;

        // Rule: cannot nominate own group
        if (targetGroupId === room.activeSelectorGroupId) {
          return sendTo(client.ws, {
            type: 'ERROR',
            payload: { message: 'Kelompok tidak boleh menunjuk dirinya sendiri!' }
          });
        }

        const targetGroup = room.groups[targetGroupId];
        if (!targetGroup) {
          return sendTo(client.ws, {
            type: 'ERROR',
            payload: { message: 'Kelompok target tidak valid!' }
          });
        }

        // Rule: cannot nominate group that is already Pancer if other eligible groups exist
        const eligibleGroups = Object.values(room.groups).filter(
          (g) => g.id !== room.activeSelectorGroupId && g.memberIds.length > 0
        );
        const nonPancerEligible = eligibleGroups.filter((g) => !g.isPancer);
        if (targetGroup.isPancer && nonPancerEligible.length > 0) {
          return sendTo(client.ws, {
            type: 'ERROR',
            payload: { message: 'Kelompok yang sedang menjadi Pancer tidak dapat ditunjuk kembali sekarang!' }
          });
        }

        // Transition to MATH_CHALLENGE
        room.activeTargetGroupId = targetGroupId;
        room.phase = 'MATH_CHALLENGE';
        room.numberLineStart = room.currentQuestion.start;
        room.numberLineCurrent = room.currentQuestion.start;
        room.turnTimeRemaining = room.maxTurnTime;
        room.announcement = `${targetGroup.name} ditunjuk untuk menjawab soal matematika!`;
        broadcastRoomState(client.roomCode);
        break;
      }

      case 'MOVE_NUMBER_LINE': {
        if (!client.roomCode) return;
        const room = rooms.get(client.roomCode);
        if (!room || room.phase !== 'MATH_CHALLENGE') return;

        const player = room.players[client.playerId];
        if (!player) return;

        // In group mode, only members of the active target group can move the player
        if (room.mode === 'GROUP' && player.groupId !== room.activeTargetGroupId && !player.isHost) {
          return;
        }

        const clamped = Math.max(room.numberLineMin, Math.min(room.numberLineMax, msg.payload.position));
        room.numberLineCurrent = clamped;
        broadcastRoomState(client.roomCode);
        break;
      }

      case 'SUBMIT_ANSWER': {
        if (!client.roomCode) return;
        const room = rooms.get(client.roomCode);
        if (!room || room.phase !== 'MATH_CHALLENGE') return;

        const player = room.players[client.playerId];
        if (!player) return;

        // In group mode, only members of the active target group can submit
        if (room.mode === 'GROUP' && player.groupId !== room.activeTargetGroupId && !player.isHost) {
          return sendTo(client.ws, {
            type: 'ERROR',
            payload: { message: 'Hanya kelompok yang ditunjuk yang berhak mengirimkan jawaban!' }
          });
        }

        const submittedPos = msg.payload.position;
        const isCorrect = submittedPos === room.currentQuestion.answer;

        if (isCorrect) {
          room.phase = 'FEEDBACK_CORRECT';
          room.feedbackResult = 'correct';
          room.feedbackElapsed = 0;

          // Award score to the answering group
          if (room.activeTargetGroupId && room.groups[room.activeTargetGroupId]) {
            room.groups[room.activeTargetGroupId].score += 100;
          }

          // Advance question index EXACTLY once
          room.questionIndex = (room.questionIndex + 1) % SERVER_MATH_QUESTIONS.length;
          room.currentQuestion = SERVER_MATH_QUESTIONS[room.questionIndex];
          room.numberLineStart = room.currentQuestion.start;
          room.numberLineCurrent = room.currentQuestion.start;

          // Winner becomes next selector group
          if (room.activeTargetGroupId) {
            room.activeSelectorGroupId = room.activeTargetGroupId;
          }

          const targetName = room.activeTargetGroupId ? room.groups[room.activeTargetGroupId].name : 'Pemain';
          room.announcement = `LERES! Jawaban ${targetName} BENAR! (+100 Poin)`;
          broadcastRoomState(client.roomCode);

          // Resume after 3.5s
          setTimeout(() => {
            resumeJamuranAfterFeedback(client.roomCode!);
          }, 3500);
        } else {
          // WRONG ANSWER
          room.phase = 'FEEDBACK_WRONG';
          room.feedbackResult = 'wrong';
          room.feedbackElapsed = 0;

          // Penalty: target group becomes PANCER in center!
          if (room.activeTargetGroupId) {
            room.pancerGroupId = room.activeTargetGroupId;
            Object.values(room.groups).forEach((g) => {
              g.isPancer = g.id === room.activeTargetGroupId;
            });
          }

          const targetName = room.activeTargetGroupId ? room.groups[room.activeTargetGroupId].name : 'Pemain';
          room.announcement = `SALAH! ${targetName} salah menjawab dan dihukum menjadi PANCER di tengah lingkaran!`;
          broadcastRoomState(client.roomCode);

          // Resume after 3.5s
          setTimeout(() => {
            resumeJamuranAfterFeedback(client.roomCode!);
          }, 3500);
        }
        break;
      }

      case 'PHASE_COMPLETE': {
        if (!client.roomCode) return;
        const room = rooms.get(client.roomCode);
        if (!room) return;

        // Progress phases
        if (room.phase === 'MUSIC_PLAYING') {
          room.phase = 'JAMUR_COMMAND';
          room.activeCommand = SERVER_JAMUR_COMMANDS[Math.floor(Math.random() * SERVER_JAMUR_COMMANDS.length)];
          room.commandDialogElapsed = 0;
          broadcastRoomState(client.roomCode);
        } else if (room.phase === 'JAMUR_COMMAND') {
          room.phase = 'JAMUR_ACTION';
          room.actionElapsed = 0;
          broadcastRoomState(client.roomCode);
        } else if (room.phase === 'JAMUR_ACTION') {
          if (room.mode === 'GROUP') {
            room.phase = 'TURN_NOMINATION';
            room.announcement = `Giliran ${room.groups[room.activeSelectorGroupId || '']?.name || 'Kelompok Penunjuk'} untuk memilih lawan!`;
          } else {
            room.phase = 'MATH_CHALLENGE';
          }
          broadcastRoomState(client.roomCode);
        }
        break;
      }

      case 'LEAVE_ROOM': {
        handleClientDisconnect(client);
        client.roomCode = null;
        break;
      }
    }
  }

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    // Serve production assets for both /jamuran base path and root
    app.use('/jamuran', express.static(distPath));
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Jamath running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
});
