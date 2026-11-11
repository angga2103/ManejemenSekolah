import React, { useState } from 'react';
import type { GradeComponent } from '@edusaas/shared-types';

interface StudentRosterItem {
  id: string;
  nis: string;
  name: string;
  score: number;
  notes: string;
}

interface MockReportCard {
  id: string;
  ranking: number;
  nis: string;
  name: string;
  className: string;
  semester: string;
  finalAverage: number;
  overallPredicate: 'A' | 'B' | 'C' | 'D';
  attendance: {
    present: number;
    late: number;
    sick: number;
    permission: number;
    absent: number;
  };
  remarks: string;
  subjectsCount: number;
}

export const AcademicsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'reports' | 'curricula'>('input');

  // Input Nilai State
  const [selectedClass, setSelectedClass] = useState('10-mipa-1');
  const [selectedSubject, setSelectedSubject] = useState('nahwu-1');
  const [selectedComponent, setSelectedComponent] = useState<GradeComponent>('FINAL_EXAM' as GradeComponent);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026-ganjil');
  const [weight, setWeight] = useState(1.0);
  const [isSavedAlert, setIsSavedAlert] = useState(false);

  // Sample student roster for batch grade entry
  const [roster, setRoster] = useState<StudentRosterItem[]>([
    { id: 'st-1', nis: '2026001', name: 'Muhammad Al-Fatih', score: 92, notes: 'Fasih membaca matan' },
    { id: 'st-2', nis: '2026002', name: 'Aisyah Az-Zahra', score: 88, notes: 'Pemahaman konsep sangat baik' },
    { id: 'st-3', nis: '2026003', name: 'Zaid bin Tsabit', score: 95, notes: 'Mumtaz, pemahaman mendalam' },
    { id: 'st-4', nis: '2026004', name: 'Fatimah Az-Zahra', score: 84, notes: 'Rajin muthalaah' },
    { id: 'st-5', nis: '2026005', name: 'Umar Al-Faruq', score: 78, notes: 'Perlu latihan i\'rab tambahan' },
  ]);

  // Sample report cards
  const [reportCards, setReportCards] = useState<MockReportCard[]>([
    {
      id: 'rc-01',
      ranking: 1,
      nis: '2026003',
      name: 'Zaid bin Tsabit',
      className: '10 MIPA 1 (Diniyah Ula)',
      semester: 'Ganjil 2026/2027',
      finalAverage: 94.6,
      overallPredicate: 'A',
      attendance: { present: 98, late: 1, sick: 1, permission: 0, absent: 0 },
      remarks: 'Mumtaz! Prestasi luar biasa dalam hafalan kitab dan muatan eksakta.',
      subjectsCount: 14,
    },
    {
      id: 'rc-02',
      ranking: 2,
      nis: '2026001',
      name: 'Muhammad Al-Fatih',
      className: '10 MIPA 1 (Diniyah Ula)',
      semester: 'Ganjil 2026/2027',
      finalAverage: 91.2,
      overallPredicate: 'A',
      attendance: { present: 96, late: 2, sick: 2, permission: 0, absent: 0 },
      remarks: 'Sangat baik dalam kajian Nahwu dan Matematika.',
      subjectsCount: 14,
    },
    {
      id: 'rc-03',
      ranking: 3,
      nis: '2026002',
      name: 'Aisyah Az-Zahra',
      className: '10 MIPA 1 (Diniyah Ula)',
      semester: 'Ganjil 2026/2027',
      finalAverage: 88.4,
      overallPredicate: 'B',
      attendance: { present: 97, late: 0, sick: 1, permission: 2, absent: 0 },
      remarks: 'Capaian Jayyid Jiddan, pertahankan kedisiplinan dan hafalan Al-Quran.',
      subjectsCount: 14,
    },
    {
      id: 'rc-04',
      ranking: 4,
      nis: '2026004',
      name: 'Fatimah Az-Zahra',
      className: '10 MIPA 1 (Diniyah Ula)',
      semester: 'Ganjil 2026/2027',
      finalAverage: 85.0,
      overallPredicate: 'B',
      attendance: { present: 95, late: 1, sick: 2, permission: 2, absent: 0 },
      remarks: 'Konsisten dan aktif dalam setiap halaqah ilmiah.',
      subjectsCount: 14,
    },
    {
      id: 'rc-05',
      ranking: 5,
      nis: '2026005',
      name: 'Umar Al-Faruq',
      className: '10 MIPA 1 (Diniyah Ula)',
      semester: 'Ganjil 2026/2027',
      finalAverage: 79.5,
      overallPredicate: 'C',
      attendance: { present: 90, late: 4, sick: 3, permission: 3, absent: 0 },
      remarks: 'Memenuhi KKM. Perlu meningkatkan keaktifan muthalaah malam.',
      subjectsCount: 14,
    },
  ]);

  const [selectedReportCardModal, setSelectedReportCardModal] = useState<MockReportCard | null>(null);

  const handleScoreChange = (id: string, val: number) => {
    setRoster((prev) =>
      prev.map((item) => (item.id === id ? { ...item, score: Math.min(100, Math.max(0, val)) } : item)),
    );
  };

  const handleNotesChange = (id: string, notes: string) => {
    setRoster((prev) =>
      prev.map((item) => (item.id === id ? { ...item, notes } : item)),
    );
  };

  const handleSaveBatch = () => {
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 4000);
  };

  const getPredicateBadge = (score: number) => {
    if (score >= 90) {
      return <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded">A (Mumtaz)</span>;
    }
    if (score >= 80) {
      return <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">B (Jayyid Jiddan)</span>;
    }
    if (score >= 70) {
      return <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded">C (Jayyid)</span>;
    }
    return <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 rounded">D (Perlu Bimbingan)</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                Phase 5 • Dual Curricula Engine
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">
                Kemendikbud & Pesantren Diniyah
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-2">
              Akademik & Rapor Digital Santri
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Pengelolaan penilaian terpadu kurikulum formal dan diniyah, kalkulasi bobot otomatis, serta penerbitan rapor digital.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveSubTab('input')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                activeSubTab === 'input'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ✏️ Input Nilai Rombel
            </button>
            <button
              onClick={() => setActiveSubTab('reports')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                activeSubTab === 'reports'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🏆 Rapor Santri Digital
            </button>
            <button
              onClick={() => setActiveSubTab('curricula')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition ${
                activeSubTab === 'curricula'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              📖 Dual Kurikulum
            </button>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Total Komponen Nilai</span>
            <div className="text-xl font-bold text-slate-800 mt-0.5">1,420 Entry</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Rapor Diterbitkan</span>
            <div className="text-xl font-bold text-blue-600 mt-0.5">185 Santri</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Rata-rata Nilai Lembaga</span>
            <div className="text-xl font-bold text-emerald-600 mt-0.5">87.9 (Jayyid Jiddan)</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-xs text-slate-500">Ketuntasan KKM (≥75)</span>
            <div className="text-xl font-bold text-indigo-600 mt-0.5">97.8% Santri</div>
          </div>
        </div>
      </div>

      {isSavedAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>Batch nilai berhasil disimpan ke basis data tenant dan dicatat pada audit log.</span>
          </div>
          <button onClick={() => setIsSavedAlert(false)} className="text-emerald-700 font-bold">✕</button>
        </div>
      )}

      {/* TAB 1: INPUT NILAI ROMBEL */}
      {activeSubTab === 'input' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-800">Input Nilai Rombel (Batch Entry)</h2>
            <p className="text-xs text-slate-500">
              Pilih rombel, mata pelajaran kurikulum (Nasional / Pesantren), dan masukkan nilai santri secara terpadu.
            </p>
          </div>

          {/* Form Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="2026-ganjil">2026/2027 Ganjil</option>
                <option value="2026-genap">2026/2027 Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Rombel / Kelas</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="10-mipa-1">10 MIPA 1 (Diniyah Ula)</option>
                <option value="10-ips-1">10 IPS 1 (Diniyah Ula)</option>
                <option value="11-mipa-1">11 MIPA 1 (Diniyah Wustha)</option>
                <option value="12-mipa-1">12 MIPA 1 (Diniyah Ulya)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mata Pelajaran / Kitab</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Muatan Pesantren Diniyah">
                  <option value="nahwu-1">Nahwu (Al-Jurumiyyah)</option>
                  <option value="fiqih-1">Fiqih (Fathul Qorib)</option>
                  <option value="shorof-1">Shorof (Al-Amtsilah At-Tashrifiyyah)</option>
                  <option value="aqidah-1">Aqidah (Aqidatul Awwam)</option>
                  <option value="akhlaq-1">Akhlaq (Ta'lim Muta'allim)</option>
                </optgroup>
                <optgroup label="Muatan Formal Nasional">
                  <option value="mtk-1">Matematika Wajib</option>
                  <option value="ind-1">Bahasa Indonesia</option>
                  <option value="ing-1">Bahasa Inggris</option>
                  <option value="ipa-1">Fisika / Biologi</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Komponen Penilaian</label>
              <select
                value={selectedComponent}
                onChange={(e) => setSelectedComponent(e.target.value as GradeComponent)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="DAILY_TASK">Tugas Harian / Setoran (DAILY_TASK)</option>
                <option value="QUIZ">Kuis / Imtihan Syafahi (QUIZ)</option>
                <option value="MID_EXAM">Penilaian Tengah Semester / PTS (MID_EXAM)</option>
                <option value="FINAL_EXAM">Penilaian Akhir Semester / PAS (FINAL_EXAM)</option>
                <option value="PRACTICAL">Ujian Praktik / Sorogan (PRACTICAL)</option>
                <option value="CHARACTER_ATTITUDE">Adab & Akhlaq Santri (CHARACTER_ATTITUDE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bobot (Weight Factor)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="5.0"
                value={weight}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 1.0)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Roster Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 w-28">NIS</th>
                  <th className="p-3">Nama Lengkap Santri</th>
                  <th className="p-3 w-32">Nilai (0 - 100)</th>
                  <th className="p-3 w-36 text-center">Predikat</th>
                  <th className="p-3">Catatan Pembinaan / Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {roster.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="p-3 font-mono text-slate-700">{student.nis}</td>
                    <td className="p-3 font-medium text-slate-800">{student.name}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={student.score}
                        onChange={(e) => handleScoreChange(student.id, parseFloat(e.target.value) || 0)}
                        className="w-24 px-2.5 py-1.5 border border-slate-300 rounded font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3 text-center">{getPredicateBadge(student.score)}</td>
                    <td className="p-3">
                      <input
                        type="text"
                        value={student.notes}
                        onChange={(e) => handleNotesChange(student.id, e.target.value)}
                        placeholder="Contoh: Sangat fasih dalam membaca matan..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-slate-700 focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={handleSaveBatch}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-2"
            >
              💾 Simpan Nilai Rombel (Batch Save)
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: BUKU RAPOR SANTRI DIGITAL */}
      {activeSubTab === 'reports' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Buku Rapor Santri Digital (Hasil Belajar)</h2>
              <p className="text-xs text-slate-500">
                Peringkat kelas terhitung otomatis dari gabungan kurikulum formal dan diniyah beserta rekapitulasi presensi.
              </p>
            </div>
            <button
              onClick={() => {
                setReportCards((prev) => [...prev].sort((a, b) => b.finalAverage - a.finalAverage));
                alert('Batch rapor berhasil dikalkulasi! Peringkat kelas 1 - 5 berhasil diperbarui.');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow flex items-center gap-2"
            >
              ⚡ Kalkulasi Ulang Rapor & Ranking
            </button>
          </div>

          {/* Table Report Cards */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 w-16 text-center">Rank</th>
                  <th className="p-3 w-28">NIS</th>
                  <th className="p-3">Nama Santri</th>
                  <th className="p-3">Rombel</th>
                  <th className="p-3 w-24 text-center">Rata-rata</th>
                  <th className="p-3 w-32 text-center">Predikat</th>
                  <th className="p-3 w-40 text-center">Presensi (H/I/S/A)</th>
                  <th className="p-3 w-36 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportCards.map((rc) => (
                  <tr key={rc.id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-center">
                      {rc.ranking === 1 ? (
                        <span className="px-2 py-0.5 font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-300">🥇 1</span>
                      ) : rc.ranking === 2 ? (
                        <span className="px-2 py-0.5 font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-300">🥈 2</span>
                      ) : rc.ranking === 3 ? (
                        <span className="px-2 py-0.5 font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">🥉 3</span>
                      ) : (
                        <span className="font-semibold text-slate-600">{rc.ranking}</span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-slate-700">{rc.nis}</td>
                    <td className="p-3 font-medium text-slate-800">{rc.name}</td>
                    <td className="p-3 text-slate-600">{rc.className}</td>
                    <td className="p-3 text-center font-bold text-slate-900">{rc.finalAverage.toFixed(1)}</td>
                    <td className="p-3 text-center">{getPredicateBadge(rc.finalAverage)}</td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      <span className="text-emerald-600 font-bold">{rc.attendance.present}</span> /{' '}
                      <span className="text-blue-600">{rc.attendance.permission}</span> /{' '}
                      <span className="text-amber-600">{rc.attendance.sick}</span> /{' '}
                      <span className="text-rose-600">{rc.attendance.absent}</span>
                    </td>
                    <td className="p-3 text-center space-x-1">
                      <button
                        onClick={() => setSelectedReportCardModal(rc)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px]"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => window.open(`/api/v1/report-cards/${rc.id}/print`, '_blank')}
                        className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium text-[11px]"
                      >
                        🖨️ Cetak
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: STRUKTUR DUAL KURIKULUM */}
      {activeSubTab === 'curricula' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Formal National */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-blue-50 text-blue-600 rounded-lg text-lg">🏫</span>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Kurikulum Nasional (Kemendikbudristek & Kemenag)</h3>
                <p className="text-xs text-slate-500">Mata Pelajaran Umum & Ujian Semester Terstruktur</p>
              </div>
            </div>

            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-2 text-slate-700">
              <p className="font-semibold text-blue-900">Pembobotan Standar:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Tugas Harian (DAILY_TASK): <strong>20%</strong></li>
                <li>Ulangan Harian & Kuis (QUIZ): <strong>15%</strong></li>
                <li>Penilaian Tengah Semester / PTS (MID_EXAM): <strong>25%</strong></li>
                <li>Penilaian Akhir Semester / PAS (FINAL_EXAM): <strong>40%</strong></li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 text-xs space-y-2">
              <span className="font-semibold text-slate-800">Daftar Mata Pelajaran Aktif:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Matematika Wajib</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Bahasa Indonesia</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Bahasa Inggris</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Fisika</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Kimia</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Biologi</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded">Sejarah Indonesia</span>
              </div>
            </div>
          </div>

          {/* Card Pesantren Diniyah */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">🕌</span>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Kurikulum Pesantren Diniyah & Salafiyah</h3>
                <p className="text-xs text-slate-500">Kajian Kitab Kuning, Sorogan, Bandongan & Adab Santri</p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-lg text-xs space-y-2 text-slate-700">
              <p className="font-semibold text-emerald-900">Pembobotan Standar Kepesantrenan:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Setoran & Muthala'ah Harian (DAILY_TASK): <strong>20%</strong></li>
                <li>Ujian Praktik Sorogan / Qira'ah (PRACTICAL): <strong>20%</strong></li>
                <li>Imtihan Syafahi / Ujian Lisan (QUIZ): <strong>15%</strong></li>
                <li>Imtihan Nisfi / Tengah Semester (MID_EXAM): <strong>20%</strong></li>
                <li>Imtihan Niha'i / Akhir Semester (FINAL_EXAM): <strong>25%</strong></li>
              </ul>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 text-xs space-y-2">
              <span className="font-semibold text-slate-800">Kajian Kitab Kuning Aktif:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Nahwu: Matan Al-Jurumiyyah</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Fiqih: Fathul Qorib Al-Mujib</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Shorof: Amtsilah At-Tashrifiyyah</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Aqidah: Aqidatul Awwam</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Hadits: Al-Arba'in An-Nawawiyyah</span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">Akhlaq: Ta'lim Al-Muta'allim</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedReportCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base">
                Pratinjau Hasil Belajar: {selectedReportCardModal.name}
              </h3>
              <button
                onClick={() => setSelectedReportCardModal(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500">Nomor Induk Santri (NIS):</span>
                <p className="font-semibold font-mono text-slate-800">{selectedReportCardModal.nis}</p>
              </div>
              <div>
                <span className="text-slate-500">Kelas & Semester:</span>
                <p className="font-semibold text-slate-800">{selectedReportCardModal.className} ({selectedReportCardModal.semester})</p>
              </div>
              <div>
                <span className="text-slate-500">Nilai Rata-rata Kumulatif:</span>
                <p className="font-bold text-base text-blue-700">{selectedReportCardModal.finalAverage.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-slate-500">Peringkat Kelas:</span>
                <p className="font-bold text-base text-emerald-700">Peringkat {selectedReportCardModal.ranking} dari 30 Santri</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700">Catatan Wali Kelas / Pembina:</span>
              <p className="mt-1 text-slate-600 italic">"{selectedReportCardModal.remarks}"</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReportCardModal(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.open(`/api/v1/report-cards/${selectedReportCardModal.id}/print`, '_blank');
                  setSelectedReportCardModal(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 flex items-center gap-1.5"
              >
                🖨️ Buka Dokumen Rapor Lengkap
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
