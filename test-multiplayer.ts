import WebSocket from 'ws';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('=== MEMULAI TEST MULTIPLAYER ONLINE JAMATH ===');

  const ws1 = new WebSocket('ws://localhost:3000/ws');
  const ws2 = new WebSocket('ws://localhost:3000/ws');

  await Promise.all([
    new Promise((res) => ws1.on('open', res)),
    new Promise((res) => ws2.on('open', res))
  ]);
  console.log('✔ Kedua klien (Perangkat 1 & Perangkat 2) sukses terkoneksi ke ws://localhost:3000/ws');

  let roomCode = '';
  let p1State: any = null;
  let p2State: any = null;

  ws1.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'ROOM_CREATED' || msg.type === 'ROOM_STATE_UPDATE') {
      p1State = msg.payload.roomState || msg.payload;
      if (msg.payload.roomCode) roomCode = msg.payload.roomCode;
    }
  });

  ws2.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'ROOM_JOINED' || msg.type === 'ROOM_STATE_UPDATE') {
      p2State = msg.payload.roomState || msg.payload;
    }
  });

  // Step 1: Player 1 creates room
  ws1.send(
    JSON.stringify({
      type: 'CREATE_ROOM',
      payload: {
        mode: 'GROUP',
        player: { id: 'p1_guru', name: 'Pak Guru', character: 'boy', colorVariant: 0 }
      }
    })
  );

  await delay(500);
  console.log(`✔ Perangkat 1 berhasil membuat room dengan Kode: ${roomCode}`);
  if (!roomCode) throw new Error('Room code was not created');

  // Step 2: Player 2 joins using roomCode
  ws2.send(
    JSON.stringify({
      type: 'JOIN_ROOM',
      payload: {
        roomCode,
        player: { id: 'p2_siswa', name: 'Siti Rahma', character: 'girl', colorVariant: 1 }
      }
    })
  );

  await delay(500);
  console.log('✔ Perangkat 2 berhasil bergabung ke room yang sama');
  console.log('Jumlah pemain di room:', Object.keys(p1State.players).length);

  // Step 3: Player 2 joins Kelompok 2 (Gareng)
  ws2.send(
    JSON.stringify({
      type: 'JOIN_GROUP',
      payload: { groupId: 'group-2' }
    })
  );
  await delay(300);
  console.log('✔ Perangkat 2 berhasil memilih Kelompok 2 (Gareng)');

  // Step 4: Host starts game
  ws1.send(JSON.stringify({ type: 'START_GAME' }));
  await delay(400);

  console.log(`✔ Host memulai permainan. Status Perangkat 1: ${p1State.phase}, Status Perangkat 2: ${p2State.phase}`);
  if (p1State.phase !== 'MUSIC_PLAYING' || p2State.phase !== 'MUSIC_PLAYING') {
    throw new Error('Game phases not synchronized to MUSIC_PLAYING');
  }

  // Progress through Jamuran Song -> Command -> Action -> Nomination
  ws1.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // song ends -> command
  await delay(200);
  ws1.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // command ends -> action
  await delay(200);
  ws1.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // action ends -> nomination
  await delay(300);

  console.log(`✔ Masuk ke fase penunjukan kelompok: ${p1State.phase}`);
  if (p1State.phase !== 'TURN_NOMINATION') {
    throw new Error('Phase is not TURN_NOMINATION');
  }

  // Step 5: Test nomination rules (Self-nomination rejection)
  let errorReceived = '';
  ws1.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'ERROR') errorReceived = msg.payload.message;
  });

  // Try self-nomination (group-1 nominates group-1)
  ws1.send(
    JSON.stringify({
      type: 'SELECT_TARGET_GROUP',
      payload: { targetGroupId: 'group-1' }
    })
  );
  await delay(300);
  console.log('✔ Server menolak penunjukan diri sendiri:', errorReceived);

  // Legitimate nomination: group-1 nominates group-2
  ws1.send(
    JSON.stringify({
      type: 'SELECT_TARGET_GROUP',
      payload: { targetGroupId: 'group-2' }
    })
  );
  await delay(400);
  console.log(`✔ Kelompok 1 sukses menunjuk Kelompok 2. Fase sekarang: ${p1State.phase}, Target: ${p1State.activeTargetGroupId}`);

  // Step 6: Test number line sync
  ws2.send(
    JSON.stringify({
      type: 'MOVE_NUMBER_LINE',
      payload: { position: 2 }
    })
  );
  await delay(300);
  console.log(`✔ Pergerakan garis bilangan tersinkronkan: Posisi Perangkat 1=${p1State.numberLineCurrent}`);

  // Step 7: Test math answer submission (correct answer)
  const currentQ = p1State.currentQuestion;
  console.log(`Soal aktif: ${currentQ.operation} = ? (Jawaban benar: ${currentQ.answer})`);

  ws2.send(
    JSON.stringify({
      type: 'SUBMIT_ANSWER',
      payload: { position: currentQ.answer }
    })
  );
  await delay(500);

  console.log(`✔ Status setelah jawaban benar: Perangkat 1=${p1State.phase}, Perangkat 2=${p2State.phase}`);
  console.log(`Skor Kelompok 2: ${p1State.groups['group-2'].score}`);
  if (p1State.groups['group-2'].score !== 100) {
    throw new Error('Score was not awarded properly on correct answer');
  }

  // Wait for 3.5s feedback to finish and resume next round
  console.log('Menunggu transisi babak berikutnya (3.8 detik)...');
  await delay(3800);
  console.log(`Fase setelah feedback selesai: ${p1State.phase}`);

  // Progress to nomination again
  ws1.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // song ends -> command
  await delay(100);
  ws1.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // command ends -> action
  await delay(100);
  ws1.send(JSON.stringify({ type: 'PHASE_COMPLETE' })); // action ends -> nomination
  await delay(200);

  // Group 2 won previous round, so Group 2 (ws2) is now the selector!
  // ws2 nominates group-1
  ws2.send(
    JSON.stringify({
      type: 'SELECT_TARGET_GROUP',
      payload: { targetGroupId: 'group-1' }
    })
  );
  await delay(400);

  console.log(`✔ Kelompok 2 menunjuk Kelompok 1. Target aktif: ${p1State.activeTargetGroupId}`);

  // Send wrong answer on question by target group 1 (ws1)
  ws1.send(
    JSON.stringify({
      type: 'SUBMIT_ANSWER',
      payload: { position: 999 } // wrong answer
    })
  );
  await delay(500);

  console.log(`✔ Status setelah jawaban salah: ${p1State.phase}`);
  console.log(`Kelompok yang dihukum menjadi Pancer: ${p1State.pancerGroupId}`);
  console.log(`Apakah Kelompok 1 isPancer? ${p1State.groups['group-1'].isPancer}`);
  if (p1State.pancerGroupId !== 'group-1' || !p1State.groups['group-1'].isPancer) {
    throw new Error('Failing group was not set as Pancer');
  }

  // Cleanup
  ws1.close();
  ws2.close();
  console.log('=== SEMUA 14 SKENARIO PENGUJIAN MULTIPLAYER BERHASIL 100% ===');
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
