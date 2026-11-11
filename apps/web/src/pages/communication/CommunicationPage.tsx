import React, { useState } from 'react';
import type {
  ComplaintPriority,
  ComplaintStatus,
  CounselingCategory,
  AchievementLevel,
} from '@edusaas/shared-types';
import type {
  ViolationResponseData,
  AchievementResponseData,
  CounselingResponseData,
  ComplaintResponseData,
} from '@edusaas/api-contracts';

const ComplaintPriorityEnum = {
  LOW: 'LOW' as ComplaintPriority,
  MEDIUM: 'MEDIUM' as ComplaintPriority,
  HIGH: 'HIGH' as ComplaintPriority,
  URGENT: 'URGENT' as ComplaintPriority,
};

const ComplaintStatusEnum = {
  OPEN: 'OPEN' as ComplaintStatus,
  IN_PROGRESS: 'IN_PROGRESS' as ComplaintStatus,
  RESOLVED: 'RESOLVED' as ComplaintStatus,
  CLOSED: 'CLOSED' as ComplaintStatus,
};

const CounselingCategoryEnum = {
  ACADEMIC: 'ACADEMIC' as CounselingCategory,
  BEHAVIORAL: 'BEHAVIORAL' as CounselingCategory,
  FAMILY: 'FAMILY' as CounselingCategory,
  PERSONAL: 'PERSONAL' as CounselingCategory,
  CAREER: 'CAREER' as CounselingCategory,
};

const AchievementLevelEnum = {
  INTERNAL: 'INTERNAL' as AchievementLevel,
  KECAMATAN: 'KECAMATAN' as AchievementLevel,
  KABUPATEN: 'KABUPATEN' as AchievementLevel,
  PROVINSI: 'PROVINSI' as AchievementLevel,
  NASIONAL: 'NASIONAL' as AchievementLevel,
  INTERNASIONAL: 'INTERNASIONAL' as AchievementLevel,
};

export const CommunicationPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'discipline' | 'achievements' | 'counseling' | 'complaints'>('discipline');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [showCounselingModal, setShowCounselingModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintResponseData | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // MOCK DATA: VIOLATIONS & DISCIPLINE
  // ---------------------------------------------------------------------------
  const [violations, setViolations] = useState<ViolationResponseData[]>([
    {
      id: 'v-1',
      tenantId: 'tenant-1',
      studentId: 'st-1',
      studentName: 'Muhammad Zaid Al-Faqih',
      studentNis: '2026001',
      recordedByEmployeeId: 'emp-1',
      recordedByName: 'Ustaz Ridwan S.Pd.I',
      violationDate: '2026-08-11T00:00:00Z',
      title: 'Terlambat mengikuti salat tahajud & subuh berjamaah',
      points: 5,
      sanction: 'Teguran lisan & piket kebersihan masjid',
      status: 'RECORDED',
      createdAt: '2026-08-11T06:00:00Z',
    },
    {
      id: 'v-2',
      tenantId: 'tenant-1',
      studentId: 'st-2',
      studentName: 'Ahmad Dahlan Syahputra',
      studentNis: '2026002',
      recordedByEmployeeId: 'emp-2',
      recordedByName: 'Ustaz Zarkasyi',
      violationDate: '2026-08-10T00:00:00Z',
      title: 'Membawa gawai (smartphone) di luar jadwal izin',
      points: 25,
      sanction: 'Penyitaan smartphone 1 bulan & pemanggilan orang tua',
      status: 'RECORDED',
      createdAt: '2026-08-10T14:30:00Z',
    },
  ]);

  // Form State: Violation
  const [newViolation, setNewViolation] = useState({
    studentName: 'Ahmad Dahlan Syahputra',
    studentNis: '2026002',
    title: '',
    points: 10,
    sanction: '',
  });

  // ---------------------------------------------------------------------------
  // MOCK DATA: ACHIEVEMENTS
  // ---------------------------------------------------------------------------
  const [achievements, setAchievements] = useState<AchievementResponseData[]>([
    {
      id: 'ach-1',
      tenantId: 'tenant-1',
      studentId: 'st-1',
      studentName: 'Muhammad Zaid Al-Faqih',
      studentNis: '2026001',
      title: 'Juara 1 Musabaqah Hifzil Qur\'an (MHQ) 10 Juz',
      level: AchievementLevelEnum.PROVINSI,
      achievementDate: '2026-08-05T00:00:00Z',
      points: 50,
      certificateUrl: 'https://cdn.edusaas.id/certs/mhq-provinsi.pdf',
      createdAt: '2026-08-06T10:00:00Z',
    },
    {
      id: 'ach-2',
      tenantId: 'tenant-1',
      studentId: 'st-3',
      studentName: 'Fatimah Az-Zahra',
      studentNis: '2026003',
      title: 'Juara 2 Olimpiade Bahasa Arab (OBA) Tingkat Jawa Barat',
      level: AchievementLevelEnum.PROVINSI,
      achievementDate: '2026-07-28T00:00:00Z',
      points: 40,
      certificateUrl: 'https://cdn.edusaas.id/certs/oba-jabar.pdf',
      createdAt: '2026-07-29T09:00:00Z',
    },
  ]);

  // Form State: Achievement
  const [newAchievement, setNewAchievement] = useState({
    studentName: 'Muhammad Zaid Al-Faqih',
    studentNis: '2026001',
    title: '',
    level: AchievementLevelEnum.KABUPATEN,
    points: 20,
    certificateUrl: '',
  });

  // ---------------------------------------------------------------------------
  // MOCK DATA: COUNSELING (BK)
  // ---------------------------------------------------------------------------
  const [counselingSessions, setCounselingSessions] = useState<CounselingResponseData[]>([
    {
      id: 'cs-1',
      tenantId: 'tenant-1',
      studentId: 'st-2',
      studentName: 'Ahmad Dahlan Syahputra',
      studentNis: '2026002',
      counselorEmployeeId: 'emp-bk',
      counselorName: 'Dra. Hj. Nurul Hidayah, M.Pd. (Konselor)',
      sessionDate: '2026-08-11T00:00:00Z',
      category: CounselingCategoryEnum.BEHAVIORAL,
      notes: 'Santri merasa rindu rumah pada bulan ke-2 dan mengalami penurunan motivasi belajar nahwu.',
      actionPlan: 'Musyrif kamar dan wali kelas memberikan pendampingan personal & mentoring tilawah.',
      followUpRequired: true,
      createdAt: '2026-08-11T11:00:00Z',
    },
  ]);

  // Form State: Counseling
  const [newCounseling, setNewCounseling] = useState({
    studentName: 'Ahmad Dahlan Syahputra',
    studentNis: '2026002',
    category: CounselingCategoryEnum.ACADEMIC,
    notes: '',
    actionPlan: '',
    followUpRequired: false,
  });

  // ---------------------------------------------------------------------------
  // MOCK DATA: COMPLAINTS (PENGADUAN WALI MURID)
  // ---------------------------------------------------------------------------
  const [complaints, setComplaints] = useState<ComplaintResponseData[]>([
    {
      id: 'comp-1',
      tenantId: 'tenant-1',
      userId: 'u-parent-1',
      userName: 'H. Sulaiman Al-Faqih (Wali Santri Zaid)',
      userEmail: 'sulaiman.faqih@gmail.com',
      title: 'Kran air wudhu lantai 2 gedung putra sering mati saat subuh',
      description: 'Mohon dicek pompa air asrama putra karena saat jam 04.00 air sering mengecil ketika santri wudhu bersama.',
      category: 'Fasilitas & Sarpras',
      priority: ComplaintPriorityEnum.HIGH,
      status: ComplaintStatusEnum.IN_PROGRESS,
      resolutionNotes: 'Teknisi sarpras sedang mengganti otomatis pompa air asrama.',
      createdAt: '2026-08-10T08:15:00Z',
      updatedAt: '2026-08-10T09:30:00Z',
      resolvedAt: null,
    },
    {
      id: 'comp-2',
      tenantId: 'tenant-1',
      userId: 'u-parent-2',
      userName: 'Hj. Aminah (Wali Santriwati Fatimah)',
      userEmail: 'aminah.syarif@yahoo.com',
      title: 'Permohonan menu diet khusus maag santriwati',
      description: 'Ananda Fatimah memiliki riwayat maag kronis, mohon koordinasi bagian dapur pondok.',
      category: 'Kesehatan & Gizi Asrama',
      priority: ComplaintPriorityEnum.MEDIUM,
      status: ComplaintStatusEnum.RESOLVED,
      resolutionNotes: 'Sudah dikoordinasikan dengan petugas gizi & klinik pesantren untuk menu diet bubur gandum.',
      createdAt: '2026-08-08T13:20:00Z',
      updatedAt: '2026-08-09T10:00:00Z',
      resolvedAt: '2026-08-09T10:00:00Z',
    },
  ]);

  // Handle Resolve Complaint
  const handleResolveSubmit = () => {
    if (!selectedComplaint) return;
    if (!resolutionText.trim()) {
      showToast('Catatan penanganan wajib diisi!');
      return;
    }

    setComplaints((prev) =>
      prev.map((c) =>
        c.id === selectedComplaint.id
          ? {
              ...c,
              status: ComplaintStatusEnum.RESOLVED,
              resolutionNotes: resolutionText,
              resolvedAt: new Date().toISOString(),
            }
          : c
      )
    );

    showToast(`Tiket pengaduan "${selectedComplaint.title}" berhasil diselesaikan.`);
    setShowResolveModal(false);
    setSelectedComplaint(null);
    setResolutionText('');
  };

  // Metrics calculation
  const totalViolations = violations.length;
  const totalAchievements = achievements.length;
  const totalCounseling = counselingSessions.length;
  const openComplaints = complaints.filter((c) => c.status === ComplaintStatusEnum.OPEN || c.status === ComplaintStatusEnum.IN_PROGRESS).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-indigo-700 text-white px-5 py-3 rounded-lg shadow-xl flex items-center space-x-3 border border-indigo-500 animate-bounce">
          <span className="text-xl">📢</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 p-6 rounded-2xl border border-indigo-800/40 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>🛡️ EduSaaS Communication & BK Hub</span>
              <span>•</span>
              <span className="bg-indigo-900/80 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                Phase 8 Verified
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Pusat Komunikasi, Tata Tertib & Bimbingan Konseling (BK)
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Perekaman poin pelanggaran & tata tertib, rekam jejak prestasi santri, catatan BK berprivasi tinggi, dan tiket keluhan rahasia orang tua.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowViolationModal(true)}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-2 transition"
            >
              <span>⚖️</span>
              <span>Catat Pelanggaran</span>
            </button>
            <button
              onClick={() => setShowAchievementModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-2 transition"
            >
              <span>🏆</span>
              <span>Catat Prestasi</span>
            </button>
            <button
              onClick={() => setShowCounselingModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-2 transition"
            >
              <span>🧠</span>
              <span>Sesi Konseling (BK)</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-900/50">
          <div className="bg-slate-900/70 p-3 rounded-xl border border-indigo-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Pelanggaran</p>
            <p className="text-xl font-bold text-rose-400 mt-1">{totalViolations} Catatan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Penegakan tata tertib</p>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-indigo-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Prestasi Santri</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">{totalAchievements} Penghargaan</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Akademik & non-akademik</p>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-indigo-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Sesi Konseling (BK)</p>
            <p className="text-xl font-bold text-indigo-400 mt-1">{totalCounseling} Sesi</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Privasi terisolasi ketat</p>
          </div>
          <div className="bg-slate-900/70 p-3 rounded-xl border border-indigo-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Pengaduan Aktif</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{openComplaints} Tiket</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Dalam proses respon</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-700 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('discipline')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeSubTab === 'discipline'
              ? 'border-b-2 border-indigo-500 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⚖️</span>
          <span>Tata Tertib & Poin Pelanggaran</span>
        </button>
        <button
          onClick={() => setActiveSubTab('achievements')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeSubTab === 'achievements'
              ? 'border-b-2 border-indigo-500 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🏆</span>
          <span>Rekam Prestasi Santri</span>
        </button>
        <button
          onClick={() => setActiveSubTab('counseling')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeSubTab === 'counseling'
              ? 'border-b-2 border-indigo-500 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🧠</span>
          <span>Bimbingan Konseling (BK)</span>
          <span className="bg-indigo-900/60 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-700/50">
            Confidential
          </span>
        </button>
        <button
          onClick={() => setActiveSubTab('complaints')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeSubTab === 'complaints'
              ? 'border-b-2 border-indigo-500 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📩</span>
          <span>Pusat Pengaduan Orang Tua</span>
          {openComplaints > 0 && (
            <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">
              {openComplaints}
            </span>
          )}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: TATA TERTIB & POIN PELANGGARAN                                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'discipline' && (
        <div className="space-y-6">
          {/* Warning Letter Threshold Info */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-white">Ambang Batas Surat Peringatan (SP):</p>
                <p className="text-slate-400">
                  Akumulasi poin memicu surat peringatan dan notifikasi otomatis ke wali murid:
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 font-mono">
              <span className="bg-amber-900/40 text-amber-300 px-2.5 py-1 rounded border border-amber-700/40">
                SP 1: ≥ 25 Poin
              </span>
              <span className="bg-orange-900/40 text-orange-300 px-2.5 py-1 rounded border border-orange-700/40">
                SP 2: ≥ 50 Poin
              </span>
              <span className="bg-rose-900/40 text-rose-300 px-2.5 py-1 rounded border border-rose-700/40">
                SP 3 (Panggilan): ≥ 75 Poin
              </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">Buku Catatan Pelanggaran Santri</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Catatan pelanggaran kedisiplinan santri tercatat terpusat dan terkirim otomatis ke aplikasi wali.
                </p>
              </div>
              <input
                type="text"
                placeholder="Cari santri / jenis pelanggaran..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-indigo-500 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Pelanggaran</th>
                    <th className="py-3 px-4">Bobot Poin</th>
                    <th className="py-3 px-4">Sanksi / Tindakan</th>
                    <th className="py-3 px-4">Dicatat Oleh</th>
                    <th className="py-3 px-4">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {violations
                    .filter(
                      (v) =>
                        v.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        v.title.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{v.studentName}</p>
                          <p className="text-[10px] text-slate-400">NIS: {v.studentNis}</p>
                        </td>
                        <td className="py-3 px-4 font-medium text-white">{v.title}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              v.points >= 25
                                ? 'bg-rose-900/50 text-rose-300 border border-rose-700/50'
                                : 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                            }`}
                          >
                            +{v.points} Poin
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{v.sanction || '-'}</td>
                        <td className="py-3 px-4 text-slate-300">{v.recordedByName}</td>
                        <td className="py-3 px-4 text-slate-400 text-[10px]">
                          {new Date(v.violationDate).toLocaleDateString('id-ID', {
                            dateStyle: 'medium',
                          })}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: REKAM PRESTASI SANTRI                                          */}
      {/* ===================================================================== */}
      {activeSubTab === 'achievements' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">Papan Rekam Jejak Prestasi Santri</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Apresiasi capaian santri di bidang akademik, tahfiz, sains, seni, dan olahraga.
                </p>
              </div>
              <button
                onClick={() => setShowAchievementModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition self-start"
              >
                + Catat Prestasi Baru
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Nama Kejuaraan / Prestasi</th>
                    <th className="py-3 px-4">Tingkat</th>
                    <th className="py-3 px-4">Poin Apresiasi</th>
                    <th className="py-3 px-4">Sertifikat</th>
                    <th className="py-3 px-4">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {achievements.map((ach) => (
                    <tr key={ach.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{ach.studentName}</p>
                        <p className="text-[10px] text-slate-400">NIS: {ach.studentNis}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">{ach.title}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                          {ach.level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-400">+{ach.points} Poin</td>
                      <td className="py-3 px-4">
                        {ach.certificateUrl ? (
                          <a
                            href={ach.certificateUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline flex items-center space-x-1"
                          >
                            <span>📄</span>
                            <span>Lihat Sertifikat</span>
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[10px]">
                        {new Date(ach.achievementDate).toLocaleDateString('id-ID', {
                          dateStyle: 'medium',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: BIMBINGAN KONSELING (BK)                                       */}
      {/* ===================================================================== */}
      {activeSubTab === 'counseling' && (
        <div className="space-y-6">
          {/* Privacy Alert */}
          <div className="bg-indigo-950/70 border border-indigo-700/50 p-4 rounded-xl flex items-start space-x-3 text-xs text-indigo-200">
            <span className="text-xl">🔒</span>
            <div>
              <p className="font-bold text-white text-sm">Proteksi Kerahasiaan Data Bimbingan Konseling (BK)</p>
              <p className="mt-0.5 leading-relaxed">
                Catatan sesi konseling hanya dapat diakses oleh Guru BK/Konselor berlisensi dan Kepala Sekolah sesuai prinsip perlindungan data pribadi siswa.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">Buku Sesi Bimbingan Konseling (BK)</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daftar sesi pendampingan psikologis, akademik, sosial, dan kepribadian santri.
                </p>
              </div>
              <button
                onClick={() => setShowCounselingModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition self-start"
              >
                + Buka Sesi Konseling Baru
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {counselingSessions.map((cs) => (
                <div key={cs.id} className="p-4 space-y-3 hover:bg-slate-800/30 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white text-sm">{cs.studentName}</span>
                        <span className="text-xs text-slate-400 font-mono">(NIS: {cs.studentNis})</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                          {cs.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Konselor: {cs.counselorName} • Tanggal: {new Date(cs.sessionDate).toLocaleDateString('id-ID')}
                      </p>
                    </div>

                    {cs.followUpRequired && (
                      <span className="bg-amber-900/40 text-amber-300 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-amber-700/40 self-start">
                        Perlu Tindak Lanjut (Follow-Up)
                      </span>
                    )}
                  </div>

                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Catatan Masalah / Konseling:</span>
                      <p className="text-slate-200 mt-0.5 leading-relaxed">{cs.notes}</p>
                    </div>
                    {cs.actionPlan && (
                      <div>
                        <span className="text-emerald-400 font-semibold">Rencana Aksi (Action Plan):</span>
                        <p className="text-emerald-200 mt-0.5">{cs.actionPlan}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: PUSAT PENGADUAN WALI MURID (COMPLAINTS)                        */}
      {/* ===================================================================== */}
      {activeSubTab === 'complaints' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">Meja Pengaduan & Keluhan Rahasia Orang Tua</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tiket keluhan dan aspirasi dari wali murid mengenai fasilitas, akademik, asrama, dan pelayanan.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Pengadu / Wali</th>
                    <th className="py-3 px-4">Judul Keluhan</th>
                    <th className="py-3 px-4">Kategori</th>
                    <th className="py-3 px-4">Prioritas</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Aksi / Penanganan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {complaints.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{c.userName}</p>
                        <p className="text-[10px] text-slate-400">{c.userEmail || '-'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{c.title}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{c.description}</p>
                        {c.resolutionNotes && (
                          <p className="text-[10px] text-emerald-400 mt-0.5">
                            Solusi: {c.resolutionNotes}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{c.category}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.priority === ComplaintPriorityEnum.URGENT || c.priority === ComplaintPriorityEnum.HIGH
                              ? 'bg-rose-900/50 text-rose-300 border border-rose-700/50'
                              : 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                          }`}
                        >
                          {c.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === ComplaintStatusEnum.RESOLVED
                              ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                              : c.status === ComplaintStatusEnum.IN_PROGRESS
                              ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                              : 'bg-amber-900/50 text-amber-300 border border-amber-700/50'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.status !== ComplaintStatusEnum.RESOLVED && (
                          <button
                            onClick={() => {
                              setSelectedComplaint(c);
                              setResolutionText(c.resolutionNotes || '');
                              setShowResolveModal(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold shadow"
                          >
                            Tanggapi / Selesaikan
                          </button>
                        )}
                        {c.status === ComplaintStatusEnum.RESOLVED && (
                          <span className="text-[11px] text-emerald-400 font-semibold">
                            ✓ Telah Selesai
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: CATAT PELANGGARAN                                            */}
      {/* ===================================================================== */}
      {showViolationModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Catat Pelanggaran Tata Tertib</h3>
              <button
                onClick={() => setShowViolationModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nama Santri:</label>
                <input
                  type="text"
                  value={newViolation.studentName}
                  onChange={(e) => setNewViolation({ ...newViolation, studentName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Jenis Pelanggaran:</label>
                <input
                  type="text"
                  placeholder="Contoh: Merusak fasilitas asrama / Tidak ikut salat"
                  value={newViolation.title}
                  onChange={(e) => setNewViolation({ ...newViolation, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Bobot Poin Pelanggaran:</label>
                <input
                  type="number"
                  min="1"
                  value={newViolation.points}
                  onChange={(e) => setNewViolation({ ...newViolation, points: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Sanksi / Tindakan Edukatif:</label>
                <input
                  type="text"
                  placeholder="Contoh: Kerja bakti / Menghafal 1 juz"
                  value={newViolation.sanction}
                  onChange={(e) => setNewViolation({ ...newViolation, sanction: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowViolationModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newViolation.title) {
                    showToast('Jenis pelanggaran wajib diisi!');
                    return;
                  }
                  const newEntry: ViolationResponseData = {
                    id: 'v-' + Date.now(),
                    tenantId: 'tenant-1',
                    studentId: 'st-2',
                    studentName: newViolation.studentName,
                    studentNis: newViolation.studentNis,
                    recordedByEmployeeId: 'emp-1',
                    recordedByName: 'Ustaz Ridwan S.Pd.I',
                    violationDate: new Date().toISOString(),
                    title: newViolation.title,
                    points: newViolation.points,
                    sanction: newViolation.sanction,
                    status: 'RECORDED',
                    createdAt: new Date().toISOString(),
                  };
                  setViolations([newEntry, ...violations]);
                  showToast(`Pelanggaran santri (+${newViolation.points} poin) berhasil dicatat.`);
                  setShowViolationModal(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
              >
                Simpan Pelanggaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: CATAT PRESTASI                                               */}
      {/* ===================================================================== */}
      {showAchievementModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Catat Prestasi Santri</h3>
              <button
                onClick={() => setShowAchievementModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nama Santri:</label>
                <input
                  type="text"
                  value={newAchievement.studentName}
                  onChange={(e) => setNewAchievement({ ...newAchievement, studentName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Judul Kejuaraan / Prestasi:</label>
                <input
                  type="text"
                  placeholder="Contoh: Juara 1 Pidato Bahasa Inggris (Storytelling)"
                  value={newAchievement.title}
                  onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Tingkat Prestasi:</label>
                <select
                  value={newAchievement.level}
                  onChange={(e) => setNewAchievement({ ...newAchievement, level: e.target.value as AchievementLevel })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value={AchievementLevelEnum.INTERNAL}>Internal Sekolah / Pesantren</option>
                  <option value={AchievementLevelEnum.KECAMATAN}>Kecamatan</option>
                  <option value={AchievementLevelEnum.KABUPATEN}>Kabupaten / Kota</option>
                  <option value={AchievementLevelEnum.PROVINSI}>Provinsi</option>
                  <option value={AchievementLevelEnum.NASIONAL}>Nasional</option>
                  <option value={AchievementLevelEnum.INTERNASIONAL}>Internasional</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Poin Apresiasi:</label>
                <input
                  type="number"
                  min="5"
                  value={newAchievement.points}
                  onChange={(e) => setNewAchievement({ ...newAchievement, points: parseInt(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAchievementModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newAchievement.title) {
                    showToast('Judul prestasi wajib diisi!');
                    return;
                  }
                  const newEntry: AchievementResponseData = {
                    id: 'ach-' + Date.now(),
                    tenantId: 'tenant-1',
                    studentId: 'st-1',
                    studentName: newAchievement.studentName,
                    studentNis: newAchievement.studentNis,
                    title: newAchievement.title,
                    level: newAchievement.level,
                    achievementDate: new Date().toISOString(),
                    points: newAchievement.points,
                    certificateUrl: newAchievement.certificateUrl || null,
                    createdAt: new Date().toISOString(),
                  };
                  setAchievements([newEntry, ...achievements]);
                  showToast(`Prestasi "${newAchievement.title}" berhasil dicatat.`);
                  setShowAchievementModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Simpan Prestasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: CATAT SESI KONSELING (BK)                                    */}
      {/* ===================================================================== */}
      {showCounselingModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-lg">🧠</span>
                <h3 className="font-bold text-base text-white">Catat Sesi Bimbingan Konseling</h3>
              </div>
              <button
                onClick={() => setShowCounselingModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Nama Santri:</label>
                <input
                  type="text"
                  value={newCounseling.studentName}
                  onChange={(e) => setNewCounseling({ ...newCounseling, studentName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Kategori Masalah:</label>
                <select
                  value={newCounseling.category}
                  onChange={(e) => setNewCounseling({ ...newCounseling, category: e.target.value as CounselingCategory })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value={CounselingCategoryEnum.ACADEMIC}>Akademik & Belajar</option>
                  <option value={CounselingCategoryEnum.BEHAVIORAL}>Perilaku & Tata Tertib</option>
                  <option value={CounselingCategoryEnum.FAMILY}>Keluarga & Hubungan Orang Tua</option>
                  <option value={CounselingCategoryEnum.PERSONAL}>Pribadi & Emosional</option>
                  <option value={CounselingCategoryEnum.CAREER}>Karir & Minat Studi Lanjut</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Catatan Konseling (Rahasia):</label>
                <textarea
                  rows={3}
                  value={newCounseling.notes}
                  onChange={(e) => setNewCounseling({ ...newCounseling, notes: e.target.value })}
                  placeholder="Catatan hasil dialog dan observasi konselor..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Rencana Aksi / Solusi:</label>
                <textarea
                  rows={2}
                  value={newCounseling.actionPlan}
                  onChange={(e) => setNewCounseling({ ...newCounseling, actionPlan: e.target.value })}
                  placeholder="Langkah pendampingan tindak lanjut..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="followUpCheck"
                  checked={newCounseling.followUpRequired}
                  onChange={(e) => setNewCounseling({ ...newCounseling, followUpRequired: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="followUpCheck" className="text-slate-300 cursor-pointer">
                  Perlu Sesi Lanjutan / Tindak Lanjut (Follow-Up)
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowCounselingModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newCounseling.notes) {
                    showToast('Catatan konseling wajib diisi!');
                    return;
                  }
                  const newEntry: CounselingResponseData = {
                    id: 'cs-' + Date.now(),
                    tenantId: 'tenant-1',
                    studentId: 'st-2',
                    studentName: newCounseling.studentName,
                    studentNis: newCounseling.studentNis,
                    counselorEmployeeId: 'emp-bk',
                    counselorName: 'Dra. Hj. Nurul Hidayah, M.Pd.',
                    sessionDate: new Date().toISOString(),
                    category: newCounseling.category,
                    notes: newCounseling.notes,
                    actionPlan: newCounseling.actionPlan || null,
                    followUpRequired: newCounseling.followUpRequired,
                    createdAt: new Date().toISOString(),
                  };
                  setCounselingSessions([newEntry, ...counselingSessions]);
                  showToast('Sesi konseling berhasil disimpan secara rahasia.');
                  setShowCounselingModal(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
              >
                Simpan Sesi BK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: RESOLUSI PENGADUAN                                           */}
      {/* ===================================================================== */}
      {showResolveModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Tanggapi Tiket Pengaduan</h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <p className="font-bold text-white">{selectedComplaint.title}</p>
                <p className="text-[11px] text-slate-400 mt-1">{selectedComplaint.description}</p>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  Dari: {selectedComplaint.userName}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">
                  Catatan Tindak Lanjut / Solusi Resmi:
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Tuliskan tindakan yang telah dilakukan oleh pihak sekolah/pesantren..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleResolveSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Tandai Selesai (Resolved)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
