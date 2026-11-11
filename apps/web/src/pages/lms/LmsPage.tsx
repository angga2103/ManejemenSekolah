import React, { useState } from 'react';

interface MockCourseMaterial {
  id: string;
  title: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  authorName: string;
  materialType: 'DOCUMENT' | 'VIDEO' | 'ARTICLE' | 'LINK';
  fileUrl?: string;
  createdAt: string;
}

interface MockAssignment {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  dueDate: string;
  maxScore: number;
  totalSubmissions: number;
  gradedSubmissions: number;
}

interface MockExam {
  id: string;
  title: string;
  subjectName: string;
  className: string;
  token: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  passingScore: number;
  totalQuestions: number;
  totalParticipants: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'FINISHED';
}

export const LmsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'materials' | 'assignments' | 'cbt'>('materials');

  // Materials State
  const [materials] = useState<MockCourseMaterial[]>([
    {
      id: 'mat-1',
      title: 'Matan Al-Jurumiyyah: Bab Kalam & Tanda-Tanda Isim',
      subjectName: 'Nahwu Al-Jurumiyyah',
      subjectCode: 'NHW-01',
      className: '10 Diniyah Ula',
      authorName: 'Ustaz Ahmad Ridwan',
      materialType: 'DOCUMENT',
      fileUrl: 'https://s3.edusaas.test/nahwu-bab-kalam.pdf',
      createdAt: '10 Nov 2026',
    },
    {
      id: 'mat-2',
      title: 'Video Praktik Sorogan Fiqih Fathul Qorib: Bab Thaharah',
      subjectName: 'Fiqih Fathul Qorib',
      subjectCode: 'FQH-01',
      className: '10 Diniyah Ula',
      authorName: 'K.H. Zainal Abidin',
      materialType: 'VIDEO',
      fileUrl: 'https://youtube.com/watch?v=sample-sorogan',
      createdAt: '08 Nov 2026',
    },
    {
      id: 'mat-3',
      title: 'Modul Persamaan Kuadrat & Fungsi Kuadrat',
      subjectName: 'Matematika Wajib',
      subjectCode: 'MTK-10',
      className: '10 MIPA 1',
      authorName: 'Dra. Siti Rahmah',
      materialType: 'DOCUMENT',
      fileUrl: 'https://s3.edusaas.test/matematika-persamaan-kuadrat.pdf',
      createdAt: '05 Nov 2026',
    },
    {
      id: 'mat-4',
      title: 'Kajian Amtsilah At-Tashrifiyyah: Tsulatsi Mujarrad',
      subjectName: 'Shorof',
      subjectCode: 'SHR-01',
      className: '10 Diniyah Ula',
      authorName: 'Ustaz Zaid bin Tsabit',
      materialType: 'ARTICLE',
      createdAt: '01 Nov 2026',
    },
  ]);

  // Assignments State
  const [assignments] = useState<MockAssignment[]>([
    {
      id: 'asg-1',
      title: 'Tugas Menulis I\'rab 10 Kalimat Pilihan Matan Jurumiyyah',
      subjectName: 'Nahwu Al-Jurumiyyah',
      className: '10 Diniyah Ula',
      dueDate: '15 Nov 2026, 23:59',
      maxScore: 100,
      totalSubmissions: 28,
      gradedSubmissions: 25,
    },
    {
      id: 'asg-2',
      title: 'Latihan Soal Ujian Tengah Semester: Trigonometri Dasar',
      subjectName: 'Matematika Wajib',
      className: '10 MIPA 1',
      dueDate: '18 Nov 2026, 17:00',
      maxScore: 100,
      totalSubmissions: 30,
      gradedSubmissions: 30,
    },
    {
      id: 'asg-3',
      title: 'Ringkasan Syarat Sah Shalat Berjamaah & Masbuq',
      subjectName: 'Fiqih Fathul Qorib',
      className: '10 Diniyah Ula',
      dueDate: '20 Nov 2026, 21:00',
      maxScore: 100,
      totalSubmissions: 19,
      gradedSubmissions: 12,
    },
  ]);

  // Exams State
  const [exams] = useState<MockExam[]>([
    {
      id: 'ex-1',
      title: 'Ujian Akhir Semester CBT: Fiqih Fathul Qorib',
      subjectName: 'Fiqih Fathul Qorib',
      className: '10 Diniyah Ula',
      token: 'QORIB6',
      durationMinutes: 90,
      startTime: '20 Nov 2026, 08:00',
      endTime: '20 Nov 2026, 11:30',
      passingScore: 75,
      totalQuestions: 40,
      totalParticipants: 30,
      status: 'ACTIVE',
    },
    {
      id: 'ex-2',
      title: 'Penilaian Tengah Semester CBT: Matematika Wajib',
      subjectName: 'Matematika Wajib',
      className: '10 MIPA 1',
      token: 'MTK10A',
      durationMinutes: 60,
      startTime: '22 Nov 2026, 09:00',
      endTime: '22 Nov 2026, 11:00',
      passingScore: 75,
      totalQuestions: 30,
      totalParticipants: 30,
      status: 'SCHEDULED',
    },
    {
      id: 'ex-3',
      title: 'Imtihan Syafahi & Tahriri CBT: Nahwu & Shorof',
      subjectName: 'Nahwu Al-Jurumiyyah',
      className: '10 Diniyah Ula',
      token: 'NAHWU7',
      durationMinutes: 60,
      startTime: '10 Nov 2026, 08:00',
      endTime: '10 Nov 2026, 10:00',
      passingScore: 75,
      totalQuestions: 35,
      totalParticipants: 30,
      status: 'FINISHED',
    },
  ]);

  const [selectedExamModal, setSelectedExamModal] = useState<MockExam | null>(null);

  const getMaterialTypeBadge = (type: string) => {
    switch (type) {
      case 'DOCUMENT':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-700 rounded">📄 PDF / Dokumen</span>;
      case 'VIDEO':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-700 rounded">🎥 Video Pembelajaran</span>;
      case 'ARTICLE':
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-700 rounded">📝 Artikel / Teks</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-700 rounded">🔗 Tautan</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-700">
                Phase 6 • LMS & Online Examinations (CBT)
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                Auto-Grading & Grade Engine Sync
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-2">
              LMS & Ujian Daring (CBT) Terintegrasi
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pusat materi ajar digital, pengumpulan tugas santri, bank soal multikurikulum, dan pelaksanaan ujian CBT daring.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                activeTab === 'materials'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              📁 Bahan Ajar Digital
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                activeTab === 'assignments'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              📝 Tugas & Pengumpulan
            </button>
            <button
              onClick={() => setActiveTab('cbt')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                activeTab === 'cbt'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ⚡ Ujian CBT Daring
            </button>
          </div>
        </div>

        {/* Quick KPI Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Materi Aktif</span>
            <div className="text-xl font-bold text-slate-800 mt-0.5">48 Modul</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Tugas Terkumpul</span>
            <div className="text-xl font-bold text-blue-600 mt-0.5">386 Berkas</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Bank Butir Soal</span>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">1,250 Soal</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Tingkat Kelulusan CBT</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">94.2% Lulus</div>
          </div>
        </div>
      </div>

      {/* TAB 1: BAHAN AJAR DIGITAL */}
      {activeTab === 'materials' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Repositori Bahan Ajar & Modul Santri</h2>
              <p className="text-xs text-slate-500">
                Koleksi e-kitab kuning, modul kurikulum nasional, video kajian sorogan, dan ringkasan materi santri.
              </p>
            </div>
            <button
              onClick={() => alert('Fitur unggah materi: Guru/Ustaz dapat mengunggah PDF atau menyematkan video pembelajaran.')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-2"
            >
              📤 Bagikan Materi Baru
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-blue-600">{m.subjectName} ({m.subjectCode})</span>
                    <h3 className="font-bold text-slate-800 text-sm">{m.title}</h3>
                  </div>
                  {getMaterialTypeBadge(m.materialType)}
                </div>

                <div className="text-xs text-slate-500 flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <span>Rombel: <strong>{m.className}</strong></span>
                  <span>Oleh: {m.authorName}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-[11px] text-slate-400">Diunggah: {m.createdAt}</span>
                  <button
                    onClick={() => alert(`Membuka materi: ${m.title}`)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    📖 Buka Materi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: TUGAS & PENGUMPULAN */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Daftar Tugas & Penugasan Santri</h2>
              <p className="text-xs text-slate-500">
                Monitoring batas waktu pengumpulan tugas harian, setoran hafalan, dan penilaian terpadu.
              </p>
            </div>
            <button
              onClick={() => alert('Formulir buat tugas baru: Isi judul, petunjuk, tenggat waktu, dan rombel.')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-2"
            >
              ➕ Buat Penugasan Baru
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Judul Tugas</th>
                  <th className="p-3">Mata Pelajaran</th>
                  <th className="p-3">Rombel</th>
                  <th className="p-3">Tenggat Waktu</th>
                  <th className="p-3 text-center">Pengumpulan</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/70">
                    <td className="p-3 font-semibold text-slate-800">{asg.title}</td>
                    <td className="p-3 text-slate-600">{asg.subjectName}</td>
                    <td className="p-3 text-slate-600">{asg.className}</td>
                    <td className="p-3 font-mono text-slate-700">{asg.dueDate}</td>
                    <td className="p-3 text-center font-semibold">
                      <span className="text-emerald-600">{asg.totalSubmissions}</span> / 30 Santri
                      <span className="text-[10px] block text-slate-400 font-normal">({asg.gradedSubmissions} dinilai)</span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => alert(`Memeriksa pengumpulan tugas: ${asg.title}`)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold text-xs"
                      >
                        Periksa & Nilai
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CBT & UJIAN DARING */}
      {activeTab === 'cbt' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Paket & Sesi Ujian Daring (CBT)</h2>
              <p className="text-xs text-slate-500">
                Ujian berbasis komputer dengan keamanan token acak, pengacakan soal, auto-grading, dan sinkronisasi otomatis ke buku rapor.
              </p>
            </div>
            <button
              onClick={() => alert('Buat Paket Ujian: Tentukan durasi, token, rombel, dan pilih soal dari bank soal.')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-2"
            >
              ⚡ Buat Paket Ujian CBT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((ex) => (
              <div key={ex.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-slate-500">{ex.subjectName}</span>
                  {ex.status === 'ACTIVE' ? (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-100 text-emerald-800 rounded animate-pulse">● SEDANG AKTIF</span>
                  ) : ex.status === 'SCHEDULED' ? (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 rounded">📅 TERJADWAL</span>
                  ) : (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded">SELESAI</span>
                  )}
                </div>

                <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{ex.title}</h3>

                <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Token Masuk:</span>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">{ex.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Durasi Pengerjaan:</span>
                    <span className="font-semibold text-slate-800">{ex.durationMinutes} Menit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Soal:</span>
                    <span className="font-semibold text-slate-800">{ex.totalQuestions} Butir</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">KKM Kelulusan:</span>
                    <span className="font-semibold text-emerald-700">{ex.passingScore}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-500">{ex.totalParticipants} Peserta</span>
                  <button
                    onClick={() => setSelectedExamModal(ex)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Pantau Sesi CBT
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CBT MONITOR MODAL */}
      {selectedExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                Monitoring Proktor CBT: {selectedExamModal.title}
              </h3>
              <button
                onClick={() => setSelectedExamModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500">Token Keamanan:</span>
                <p className="font-mono font-bold text-base text-indigo-700">{selectedExamModal.token}</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500">Durasi:</span>
                <p className="font-bold text-base text-slate-800">{selectedExamModal.durationMinutes} Menit</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500">Total Butir Soal:</span>
                <p className="font-bold text-base text-slate-800">{selectedExamModal.totalQuestions} Soal</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <span className="text-slate-500">Auto-Sync Rapor:</span>
                <p className="font-bold text-base text-emerald-600">AKTIF (Grade Engine)</p>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
              ℹ️ <strong>Auto-Grading Aktif</strong>: Seluruh jawaban objektif (Pilihan Ganda & Benar/Salah) dinilai secara instan setelah santri menekan tombol "Selesai", dan nilai langsung tersinkronisasi ke transkrip nilai akademik.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedExamModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  alert('Token baru berhasil diperbarui!');
                  setSelectedExamModal(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
              >
                🔄 Reset Token Ujian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
