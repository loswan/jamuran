import { MathQuestion } from '../types/game';

export const MATH_QUESTIONS: MathQuestion[] = [
  {
    id: 1,
    prompt: "Berapa hasil dari penjumlahan ini?",
    operation: "-3 + 5",
    start: -3,
    step: 5,
    answer: 2,
    explanation: "Mulai dari titik -3, lalu melangkah ke kanan (+) sebanyak 5 satuan. Berhenti di angka 2.",
    conceptNote: "Penjumlahan (+) artinya bergerak ke arah KANAN pada garis bilangan."
  },
  {
    id: 2,
    prompt: "Berapa hasil dari pengurangan ini?",
    operation: "2 - 4",
    start: 2,
    step: -4,
    answer: -2,
    explanation: "Mulai dari titik 2, lalu melangkah ke kiri (-) sebanyak 4 satuan. Berhenti di angka -2.",
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
    conceptNote: "Karena pengurangan lebih besar dari titik awal, hasilnya jatuh ke wilayah negatif."
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

export const JAMUR_COMMANDS = [
  {
    id: 'gagak' as const,
    name: 'JAMUR GAGAK',
    javaneseName: 'Jamur Gagak (Gaok-gaok)',
    description: 'Mengepakkan kedua tangan seperti sayap burung gagak sambil bersuara gaok-gaok!',
    actionInstruction: 'Kepakkan sayapmu seperti burung gagak gaok-gaok!',
    duration: 11.6
  },
  {
    id: 'kethek' as const,
    name: 'JAMUR KETHEK',
    javaneseName: 'Jamur Kethek (Kethek Menek)',
    description: 'Menirukan monyet lincah memanjat dahan pohon dan bergaya ceria!',
    actionInstruction: 'Tirukan monyet memanjat pohon dan bergaya lucu!',
    duration: 30.8
  },
  {
    id: 'gagang' as const,
    name: 'JAMUR GAGANG',
    javaneseName: 'Jamur Gagang (Tangkai Pohon)',
    description: 'Berdiri tegak dengan satu kaki seperti tangkai jamur atau dahan pohon tanpa goyah!',
    actionInstruction: 'Angkat satu kakimu dan pertahankan keseimbangan!',
    duration: 3.5
  },
  {
    id: 'payung' as const,
    name: 'JAMUR PAYUNG',
    javaneseName: 'Jamur Payung (Payungan)',
    description: 'Merentangkan kedua tangan ke atas membentuk lengkungan payung yang megah!',
    actionInstruction: 'Rentangkan tangan ke atas seperti payung pelindung hujan!',
    duration: 3.5
  },
  {
    id: 'meja_kursi' as const,
    name: 'JAMUR MEJA KURSI',
    javaneseName: 'Jamur Meja Kursi',
    description: 'Jongkok mantap dengan tangan di lutut menjadi kursi atau meja yang kokoh!',
    actionInstruction: 'Jongkok dengan kokoh membentuk meja dan kursi!',
    duration: 3.5
  }
];
