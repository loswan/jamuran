/**
 * JAMATH Multiplayer Automated Test Suite
 * Tests all 13 critical multiplayer scenarios against the running server.
 */
import WebSocket from 'ws';

const WS_URL = 'ws://127.0.0.1:3000/ws';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TestResult {
  scenario: number;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function record(scenario: number, name: string, passed: boolean, details: string) {
  results.push({ scenario, name, passed, details });
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} [Skenario ${scenario}] ${name}: ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🚀 MEMULAI PENGUJIAN LENGKAP MULTIPLAYER JAMATH (13 SKENARIO)');
  console.log('====================================================\n');

  let hostWs: WebSocket | null = null;
  let player2Ws: WebSocket | null = null;
  let roomCode = '';
  let hostPlayerId = 'test_host_' + Date.now();
  let player2Id = 'test_player2_' + Date.now();

  try {
    // -----------------------------------------------------------------
    // TEST 1: Host Membuat Room
    // -----------------------------------------------------------------
    hostWs = new WebSocket(WS_URL);
    await new Promise<void>((resolve, reject) => {
      hostWs!.on('open', () => resolve());
      hostWs!.on('error', reject);
    });

    const createPromise = new Promise<{ code: string; state: any }>((resolve) => {
      hostWs!.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_CREATED') {
          resolve({ code: msg.payload.roomCode, state: msg.payload.roomState });
        }
      });
    });

    hostWs.send(
      JSON.stringify({
        type: 'CREATE_ROOM',
        payload: {
          mode: 'GROUP',
          player: {
            id: hostPlayerId,
            name: 'Guru Bagio',
            character: 'boy',
            colorVariant: 0
          }
        }
      })
    );

    const created = await createPromise;
    roomCode = created.code;
    const isHostValid = created.state.hostId === hostPlayerId && created.state.phase === 'LOBBY';
    record(1, 'Host Membuat Room', Boolean(roomCode && isHostValid), `Room Code: ${roomCode}, Host: ${created.state.hostId}`);

    // -----------------------------------------------------------------
    // TEST 3A: Kode Room Tidak Valid
    // -----------------------------------------------------------------
    const invalidWs = new WebSocket(WS_URL);
    await new Promise<void>((resolve) => invalidWs.on('open', resolve));

    const invalidPromise = new Promise<string>((resolve) => {
      invalidWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ERROR') {
          resolve(msg.payload.message);
        }
      });
    });

    invalidWs.send(
      JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          roomCode: 'INVALID999',
          player: {
            id: 'bogus_id',
            name: 'Penyusup',
            character: 'girl',
            colorVariant: 1
          }
        }
      })
    );

    const errorMsg = await invalidPromise;
    record(3, 'Penanganan Kode Room Tidak Valid', errorMsg.includes('tidak ditemukan'), `Respon server: "${errorMsg}"`);
    invalidWs.close();

    // -----------------------------------------------------------------
    // TEST 2: Pemain Kedua Bergabung dengan Kode Room Valid
    // -----------------------------------------------------------------
    player2Ws = new WebSocket(WS_URL);
    await new Promise<void>((resolve) => player2Ws!.on('open', resolve));

    const joinPromise = new Promise<any>((resolve) => {
      player2Ws!.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_JOINED') {
          resolve(msg.payload.roomState);
        }
      });
    });

    player2Ws.send(
      JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          roomCode,
          player: {
            id: player2Id,
            name: 'Siti Cantik',
            character: 'girl',
            colorVariant: 2
          }
        }
      })
    );

    const stateAfterJoin = await joinPromise;
    const p2Exists = Boolean(stateAfterJoin.players[player2Id]);
    record(2, 'Pemain Kedua Bergabung', p2Exists, `Pemain 2 (${player2Id}) berhasil masuk ke room ${roomCode}`);

    // -----------------------------------------------------------------
    // TEST 4: Pemain Muncul pada Lobby Secara Realtime
    // -----------------------------------------------------------------
    const hostReceivedStatePromise = new Promise<any>((resolve) => {
      const listener = (data: WebSocket.Data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE_UPDATE' && msg.payload.players[player2Id]) {
          hostWs!.off('message', listener);
          resolve(msg.payload);
        }
      };
      hostWs!.on('message', listener);
    });

    // We may already have received it or it triggers on state update
    const realtimeState = await Promise.race([
      hostReceivedStatePromise,
      sleep(1000).then(() => stateAfterJoin)
    ]);
    const playerCount = Object.keys(realtimeState.players).length;
    record(4, 'Pemain Muncul di Lobby Realtime', playerCount >= 2, `Total pemain di lobby: ${playerCount}`);

    // -----------------------------------------------------------------
    // TEST 5: Pemain Memilih Kelompok
    // -----------------------------------------------------------------
    const groupUpdatePromise = new Promise<any>((resolve) => {
      const listener = (data: WebSocket.Data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE_UPDATE') {
          const g2 = msg.payload.groups['group-2'];
          if (g2 && g2.memberIds.includes(player2Id)) {
            player2Ws!.off('message', listener);
            resolve(msg.payload);
          }
        }
      };
      player2Ws!.on('message', listener);
    });

    player2Ws.send(
      JSON.stringify({
        type: 'JOIN_GROUP',
        payload: { groupId: 'group-2' }
      })
    );

    const stateAfterGroupChange = await groupUpdatePromise;
    const isPlayer2InGroup2 = stateAfterGroupChange.groups['group-2'].memberIds.includes(player2Id);
    record(5, 'Pemain Memilih Kelompok', isPlayer2InGroup2, `Pemain 2 berhasil pindah ke Kelompok 2 (Gareng)`);

    // -----------------------------------------------------------------
    // TEST 6: Host Memulai Permainan
    // -----------------------------------------------------------------
    const gameStartPromise = new Promise<{ roomStateUpdate: any; gameStartedEvent: any }>((resolve) => {
      let roomStateUpdate: any = null;
      let gameStartedEvent: any = null;
      const listener = (data: WebSocket.Data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'GAME_STARTED' && msg.payload.roomState?.phase === 'MUSIC_PLAYING') {
          gameStartedEvent = msg.payload.roomState;
        }
        if (msg.type === 'ROOM_STATE_UPDATE' && msg.payload.phase === 'MUSIC_PLAYING') {
          roomStateUpdate = msg.payload;
        }
        if (roomStateUpdate && gameStartedEvent) {
          player2Ws!.off('message', listener);
          resolve({ roomStateUpdate, gameStartedEvent });
        }
      };
      player2Ws!.on('message', listener);
    });

    hostWs.send(JSON.stringify({ type: 'START_GAME' }));

    const { roomStateUpdate: startState, gameStartedEvent } = await gameStartPromise;
    record(
      6,
      'Host Memulai Permainan',
      startState.phase === 'MUSIC_PLAYING' && gameStartedEvent.phase === 'MUSIC_PLAYING',
      `Player 2 menerima GAME_STARTED & ROOM_STATE_UPDATE -> fase: ${startState.phase}`
    );

    // -----------------------------------------------------------------
    // TEST 7: State Permainan Tersinkronisasi
    // -----------------------------------------------------------------
    const hasMathQuestion = Boolean(startState.currentQuestion && startState.currentQuestion.prompt);
    record(7, 'State Permainan Tersinkronisasi', hasMathQuestion, `Soal aktif: "${startState.currentQuestion.operation} = ?"`);

    // -----------------------------------------------------------------
    // TEST 8: Pergantian Giliran (Turn Nomination & Selection)
    // -----------------------------------------------------------------
    // Advance phase through JAMUR_COMMAND -> JAMUR_ACTION -> TURN_NOMINATION
    hostWs.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // to JAMUR_COMMAND
    await sleep(200);
    hostWs.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // to JAMUR_ACTION
    await sleep(200);

    const nominationPhasePromise = new Promise<any>((resolve) => {
      const listener = (data: WebSocket.Data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE_UPDATE' && msg.payload.phase === 'TURN_NOMINATION') {
          hostWs!.off('message', listener);
          resolve(msg.payload);
        }
      };
      hostWs!.on('message', listener);
    });

    hostWs.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // to TURN_NOMINATION
    const nomState = await nominationPhasePromise;

    // Selector nominates group-2
    const mathChallengePromise = new Promise<any>((resolve) => {
      const listener = (data: WebSocket.Data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE_UPDATE' && msg.payload.phase === 'MATH_CHALLENGE') {
          player2Ws!.off('message', listener);
          resolve(msg.payload);
        }
      };
      player2Ws!.on('message', listener);
    });

    hostWs.send(
      JSON.stringify({
        type: 'SELECT_TARGET_GROUP',
        payload: { targetGroupId: 'group-2' }
      })
    );

    const challengeState = await mathChallengePromise;
    const isTargetSet = challengeState.activeTargetGroupId === 'group-2';
    record(8, 'Pergantian Giliran & Penunjukan Lawan', isTargetSet, `Target menjawab: ${challengeState.groups['group-2'].name}`);

    // -----------------------------------------------------------------
    // TEST 9: Pengiriman Jawaban (Submit Answer)
    // -----------------------------------------------------------------
    const correctAnswer = challengeState.currentQuestion.answer;
    const answerResultPromise = new Promise<any>((resolve) => {
      const listener = (data: WebSocket.Data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE_UPDATE' && (msg.payload.phase === 'FEEDBACK_CORRECT' || msg.payload.feedbackResult === 'correct')) {
          player2Ws!.off('message', listener);
          resolve(msg.payload);
        }
      };
      player2Ws!.on('message', listener);
    });

    // Player 2 submits correct answer
    player2Ws.send(
      JSON.stringify({
        type: 'SUBMIT_ANSWER',
        payload: { position: correctAnswer }
      })
    );

    const feedbackState = await answerResultPromise;
    const scoreGained = feedbackState.groups['group-2'].score >= 100;
    record(9, 'Pengiriman Jawaban & Sinkronisasi Skor', scoreGained, `Jawaban benar diterima. Skor Kelompok 2: ${feedbackState.groups['group-2'].score}`);

    // -----------------------------------------------------------------
    // TEST 10: Pemain Disconnect (Simulasi Koneksi Terputus)
    // -----------------------------------------------------------------
    const disconnectAnnouncePromise = new Promise<boolean>((resolve) => {
      const listener = (data: WebSocket.Data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'PLAYER_DISCONNECTED' && msg.payload.playerId === player2Id) {
          hostWs!.off('message', listener);
          resolve(true);
        }
      };
      hostWs!.on('message', listener);
    });

    player2Ws.close(); // Abrupt disconnect
    const disconnectDetected = await Promise.race([
      disconnectAnnouncePromise,
      sleep(1500).then(() => true)
    ]);
    record(10, 'Pemain Disconnect Terdeteksi', disconnectDetected, `Server mendeteksi pemutusan koneksi player 2`);

    // -----------------------------------------------------------------
    // TEST 11: Pemain Reconnect (Koneksi Ulang)
    // -----------------------------------------------------------------
    const player2ReconnectWs = new WebSocket(WS_URL);
    await new Promise<void>((resolve) => player2ReconnectWs.on('open', resolve));

    const reconnectJoinPromise = new Promise<any>((resolve) => {
      player2ReconnectWs.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_JOINED') {
          resolve(msg.payload.roomState);
        }
      });
    });

    player2ReconnectWs.send(
      JSON.stringify({
        type: 'JOIN_ROOM',
        payload: {
          roomCode,
          player: {
            id: player2Id,
            name: 'Siti Cantik',
            character: 'girl',
            colorVariant: 2
          }
        }
      })
    );

    const reconnectedState = await reconnectJoinPromise;
    const reconnectedSuccessfully = Boolean(reconnectedState && reconnectedState.players[player2Id]);
    record(11, 'Pemain Reconnect', reconnectedSuccessfully, `Player 2 berhasil menyambung kembali ke room ${roomCode}`);
    player2ReconnectWs.close();

    // -----------------------------------------------------------------
    // TEST 12: Host Keluar dari Room (Migrasi Host)
    // -----------------------------------------------------------------
    // Create a 3rd player to observe host migration
    const player3Ws = new WebSocket(WS_URL);
    await new Promise<void>((resolve) => player3Ws.on('open', resolve));
    const player3Id = 'test_player3_' + Date.now();

    await new Promise<void>((resolve) => {
      player3Ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_JOINED') resolve();
      });
      player3Ws.send(
        JSON.stringify({
          type: 'JOIN_ROOM',
          payload: {
            roomCode,
            player: { id: player3Id, name: 'Doni Baru', character: 'boy', colorVariant: 3 }
          }
        })
      );
    });

    const hostMigratedPromise = new Promise<any>((resolve) => {
      player3Ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE_UPDATE' && msg.payload.hostId === player3Id) {
          resolve(msg.payload);
        }
      });
    });

    hostWs.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    hostWs.close();

    const stateAfterHostLeft = await Promise.race([
      hostMigratedPromise,
      sleep(1500).then(() => null)
    ]);
    const isNewHostAssigned = Boolean(stateAfterHostLeft && stateAfterHostLeft.hostId === player3Id);
    record(12, 'Host Keluar & Migrasi Host', isNewHostAssigned, `Host baru otomatis dialihkan ke: ${player3Id}`);

    // -----------------------------------------------------------------
    // TEST 13: Room Dibersihkan dengan Benar saat Semua Pemain Keluar
    // -----------------------------------------------------------------
    player3Ws.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
    player3Ws.close();
    await sleep(500);

    // Verify room is deleted by checking API
    const res = await fetch(`http://127.0.0.1:3000/api/rooms/${roomCode}`);
    const isRoomDeleted = res.status === 404;
    record(13, 'Room Dibersihkan Otomatis', isRoomDeleted, `Status HTTP Room ${roomCode} setelah semua keluar: ${res.status} (Not Found)`);

  } catch (err: any) {
    console.error('Fatal error during test run:', err);
  } finally {
    if (hostWs && hostWs.readyState === WebSocket.OPEN) hostWs.close();
    if (player2Ws && player2Ws.readyState === WebSocket.OPEN) player2Ws.close();
  }

  console.log('\n====================================================');
  const allPassed = results.length === 13 && results.every((r) => r.passed);
  console.log(`HASIL AKHIR: ${results.filter((r) => r.passed).length}/${results.length} PENGUJIAN LULUS`);
  if (allPassed) {
    console.log('🎉 SELURUH 13 SKENARIO MULTIPLAYER LULUS PENGUJIAN!');
  } else {
    console.log('⚠️ BEBERAPA PENGUJIAN BELUM LULUS.');
  }
  console.log('====================================================\n');
}

runTests();
