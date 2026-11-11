import React, { useState } from 'react';
import type {
  Gender,
  TahfizRecordType,
  TahfizFluencyRating,
  PesantrenPermitType,
  PesantrenPermitStatus,
} from '@edusaas/shared-types';
import type {
  DormitoryResponseData,
  TahfizRecordResponseData,
  HalaqahGroupResponseData,
  PesantrenPermitResponseData,
} from '@edusaas/api-contracts';

const GenderEnum = {
  MALE: 'MALE' as Gender,
  FEMALE: 'FEMALE' as Gender,
};

const TahfizRecordTypeEnum = {
  ZIYADAH: 'ZIYADAH' as TahfizRecordType,
  MUROJA_AH: 'MUROJA_AH' as TahfizRecordType,
};

const TahfizFluencyRatingEnum = {
  MUMTAZ: 'MUMTAZ' as TahfizFluencyRating,
  JAYYID_JIDDAN: 'JAYYID_JIDDAN' as TahfizFluencyRating,
  JAYYID: 'JAYYID' as TahfizFluencyRating,
  MAQBUL: 'MAQBUL' as TahfizFluencyRating,
};

const PesantrenPermitTypeEnum = {
  PULANG_KE_RUMAH: 'PULANG_KE_RUMAH' as PesantrenPermitType,
  KELUAR_KOMPLEKS: 'KELUAR_KOMPLEKS' as PesantrenPermitType,
  RUMAH_SAKIT: 'RUMAH_SAKIT' as PesantrenPermitType,
  LAINNYA: 'LAINNYA' as PesantrenPermitType,
};

const PesantrenPermitStatusEnum = {
  PENDING_APPROVAL: 'PENDING_APPROVAL' as PesantrenPermitStatus,
  APPROVED_BY_MUSYRIF: 'APPROVED_BY_MUSYRIF' as PesantrenPermitStatus,
  APPROVED_BY_KEASRAMAAN: 'APPROVED_BY_KEASRAMAAN' as PesantrenPermitStatus,
  REJECTED: 'REJECTED' as PesantrenPermitStatus,
  ACTIVE_OUTSIDE: 'ACTIVE_OUTSIDE' as PesantrenPermitStatus,
  RETURNED: 'RETURNED' as PesantrenPermitStatus,
  OVERDUE: 'OVERDUE' as PesantrenPermitStatus,
};

export const PesantrenPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'dormitory' | 'tahfiz' | 'permits'>('dormitory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showTahfizModal, setShowTahfizModal] = useState(false);
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ---------------------------------------------------------------------------
  // MOCK DATA: DORMITORIES & ROOMS
  // ---------------------------------------------------------------------------
  const [dormitories] = useState<DormitoryResponseData[]>([
    {
      id: 'dorm-1',
      tenantId: 'tenant-1',
      name: 'Gedung Al-Fatih (Asrama Putra)',
      buildingCode: 'BL-A',
      gender: GenderEnum.MALE,
      description: 'Kompleks asrama santri putra tingkat wustha & ulya',
      totalRooms: 4,
      totalCapacity: 40,
      totalOccupancy: 32,
      rooms: [
        {
          id: 'room-101',
          dormitoryId: 'dorm-1',
          roomNumber: 'Kamar 101 (Abu Bakar)',
          floor: 1,
          capacity: 10,
          currentOccupancy: 8,
          availableSlots: 2,
          allocations: [
            {
              id: 'al-1',
              tenantId: 'tenant-1',
              roomId: 'room-101',
              roomNumber: '101',
              dormitoryId: 'dorm-1',
              dormitoryName: 'Gedung Al-Fatih',
              studentId: 'st-1',
              studentName: 'Muhammad Zaid Al-Faqih',
              studentNis: '2026001',
              bedNumber: 'A1-Atas',
              startDate: '2026-07-15T00:00:00Z',
              isActive: true,
            },
            {
              id: 'al-2',
              tenantId: 'tenant-1',
              roomId: 'room-101',
              roomNumber: '101',
              dormitoryId: 'dorm-1',
              dormitoryName: 'Gedung Al-Fatih',
              studentId: 'st-2',
              studentName: 'Ahmad Dahlan Syahputra',
              studentNis: '2026002',
              bedNumber: 'A1-Bawah',
              startDate: '2026-07-15T00:00:00Z',
              isActive: true,
            },
          ],
        },
        {
          id: 'room-102',
          dormitoryId: 'dorm-1',
          roomNumber: 'Kamar 102 (Umar bin Khattab)',
          floor: 1,
          capacity: 10,
          currentOccupancy: 10,
          availableSlots: 0,
          allocations: [],
        },
      ],
    },
    {
      id: 'dorm-2',
      tenantId: 'tenant-1',
      name: "Gedung Khadijah (Asrama Putri)",
      buildingCode: 'BL-B',
      gender: GenderEnum.FEMALE,
      description: 'Kompleks asrama santriwati berdaya tampung 50 santri',
      totalRooms: 3,
      totalCapacity: 30,
      totalOccupancy: 24,
      rooms: [
        {
          id: 'room-201',
          dormitoryId: 'dorm-2',
          roomNumber: 'Kamar 201 (Aisyah r.a.)',
          floor: 1,
          capacity: 10,
          currentOccupancy: 8,
          availableSlots: 2,
          allocations: [],
        },
      ],
    },
  ]);

  // ---------------------------------------------------------------------------
  // MOCK DATA: HALAQAH & TAHFIZ
  // ---------------------------------------------------------------------------
  const [halaqahGroups] = useState<HalaqahGroupResponseData[]>([
    {
      id: 'hq-1',
      tenantId: 'tenant-1',
      name: 'Halaqah Imam Ashim (Ulya)',
      ustazEmployeeId: 'emp-1',
      ustazName: 'Ustaz Abdullah, Lc. Al-Hafiz',
      targetJuz: 30,
      schedule: "Ba'da Subuh & Ba'da Ashar",
      memberCount: 12,
      createdAt: '2026-07-01T00:00:00Z',
    },
    {
      id: 'hq-2',
      tenantId: 'tenant-1',
      name: "Halaqah Nafi' Al-Madani (Wustha)",
      ustazEmployeeId: 'emp-2',
      ustazName: 'Ustaz Ridwan S.Pd.I',
      targetJuz: 10,
      schedule: "Ba'da Maghrib & Isya",
      memberCount: 15,
      createdAt: '2026-07-01T00:00:00Z',
    },
  ]);

  const [tahfizRecords, setTahfizRecords] = useState<TahfizRecordResponseData[]>([
    {
      id: 'tr-1',
      tenantId: 'tenant-1',
      studentId: 'st-1',
      studentName: 'Muhammad Zaid Al-Faqih',
      studentNis: '2026001',
      musyrifId: 'emp-1',
      musyrifName: 'Ustaz Abdullah, Lc.',
      halaqahGroupId: 'hq-1',
      halaqahGroupName: 'Halaqah Imam Ashim (Ulya)',
      recordType: TahfizRecordTypeEnum.ZIYADAH,
      surahNumber: 78,
      surahName: 'An-Naba',
      ayatStart: 1,
      ayatEnd: 40,
      juz: 30,
      fluencyRating: TahfizFluencyRatingEnum.MUMTAZ,
      tajwidRating: 'MUMTAZ',
      notes: 'Makharijul huruf sangat fasih, ghunnah tepat',
      recordedAt: '2026-08-11T05:45:00Z',
    },
    {
      id: 'tr-2',
      tenantId: 'tenant-1',
      studentId: 'st-2',
      studentName: 'Ahmad Dahlan Syahputra',
      studentNis: '2026002',
      musyrifId: 'emp-1',
      musyrifName: 'Ustaz Abdullah, Lc.',
      halaqahGroupId: 'hq-1',
      halaqahGroupName: 'Halaqah Imam Ashim (Ulya)',
      recordType: TahfizRecordTypeEnum.MUROJA_AH,
      surahNumber: 67,
      surahName: 'Al-Mulk',
      ayatStart: 1,
      ayatEnd: 30,
      juz: 29,
      fluencyRating: TahfizFluencyRatingEnum.JAYYID_JIDDAN,
      tajwidRating: 'JAYYID',
      notes: 'Kelancaran stabil, perhatikan mad wajib muttashil',
      recordedAt: '2026-08-11T05:50:00Z',
    },
    {
      id: 'tr-3',
      tenantId: 'tenant-1',
      studentId: 'st-3',
      studentName: 'Fatimah Az-Zahra',
      studentNis: '2026003',
      musyrifId: 'emp-3',
      musyrifName: 'Ustadzah Maryam S.Ag',
      recordType: TahfizRecordTypeEnum.ZIYADAH,
      surahNumber: 2,
      surahName: 'Al-Baqarah',
      ayatStart: 1,
      ayatEnd: 25,
      juz: 1,
      fluencyRating: TahfizFluencyRatingEnum.JAYYID,
      tajwidRating: 'JAYYID',
      notes: 'Hafalan baru juz 1 awal, terus tingkatkan ketelitian',
      recordedAt: '2026-08-10T16:30:00Z',
    },
  ]);

  // ---------------------------------------------------------------------------
  // MOCK DATA: PERIZINAN SANTRI (PESANTREN PERMITS)
  // ---------------------------------------------------------------------------
  const [permits, setPermits] = useState<PesantrenPermitResponseData[]>([
    {
      id: 'prm-1',
      tenantId: 'tenant-1',
      studentId: 'st-1',
      studentName: 'Muhammad Zaid Al-Faqih',
      studentNis: '2026001',
      permitType: PesantrenPermitTypeEnum.PULANG_KE_RUMAH,
      reason: 'Menghadiri pernikahan saudara kandung di Solo',
      pickupPersonName: 'H. Sulaiman Al-Faqih',
      pickupPersonRelation: 'Ayah Kandung',
      pickupPersonPhone: '081234567890',
      expectedDeparture: '2026-08-15T08:00:00Z',
      expectedReturn: '2026-08-17T17:00:00Z',
      actualDeparture: null,
      actualReturn: null,
      securityGateToken: 'GATE-20260815-F41A8C',
      status: PesantrenPermitStatusEnum.APPROVED_BY_KEASRAMAAN,
      approvedByMusyrifName: 'Ustaz Abdullah, Lc.',
      approvedByKeasramaanName: 'K.H. Mansyur (Mudir Asrama)',
      notes: 'Izin resmi pulang 3 hari telah divalidasi wali santri via WhatsApp',
      createdAt: '2026-08-11T09:00:00Z',
      updatedAt: '2026-08-11T10:15:00Z',
    },
    {
      id: 'prm-2',
      tenantId: 'tenant-1',
      studentId: 'st-2',
      studentName: 'Ahmad Dahlan Syahputra',
      studentNis: '2026002',
      permitType: PesantrenPermitTypeEnum.RUMAH_SAKIT,
      reason: 'Pemeriksaan dokter spesialis THT RSUD',
      pickupPersonName: 'M. Syahputra',
      pickupPersonRelation: 'Paman',
      pickupPersonPhone: '081398765432',
      expectedDeparture: '2026-08-11T13:00:00Z',
      expectedReturn: '2026-08-11T18:00:00Z',
      actualDeparture: '2026-08-11T13:10:00Z',
      actualReturn: null,
      securityGateToken: 'GATE-20260811-9B3E12',
      status: PesantrenPermitStatusEnum.ACTIVE_OUTSIDE,
      approvedByMusyrifName: 'Ustaz Abdullah, Lc.',
      approvedByKeasramaanName: 'K.H. Mansyur (Mudir Asrama)',
      notes: 'Rujukan klinik pesantren terlampir',
      createdAt: '2026-08-11T08:30:00Z',
      updatedAt: '2026-08-11T13:10:00Z',
    },
    {
      id: 'prm-3',
      tenantId: 'tenant-1',
      studentId: 'st-3',
      studentName: 'Fatimah Az-Zahra',
      studentNis: '2026003',
      permitType: PesantrenPermitTypeEnum.KELUAR_KOMPLEKS,
      reason: 'Beli buku rujukan nahwu shorof di toko kitab kota',
      pickupPersonName: 'Hj. Aminah',
      pickupPersonRelation: 'Ibu Kandung',
      pickupPersonPhone: '081567891234',
      expectedDeparture: '2026-08-12T14:00:00Z',
      expectedReturn: '2026-08-12T17:30:00Z',
      actualDeparture: null,
      actualReturn: null,
      securityGateToken: 'GATE-20260812-7A2D44',
      status: PesantrenPermitStatusEnum.PENDING_APPROVAL,
      notes: 'Menunggu rekomendasi ustadzah kamar',
      createdAt: '2026-08-11T11:00:00Z',
      updatedAt: '2026-08-11T11:00:00Z',
    },
  ]);

  // Form State: Allocate Bed
  const [newAlloc, setNewAlloc] = useState({
    roomId: 'room-101',
    studentName: '',
    studentNis: '',
    bedNumber: 'A2-Atas',
  });

  // Form State: Tahfiz Log
  const [newTahfiz, setNewTahfiz] = useState({
    studentName: 'Muhammad Zaid Al-Faqih',
    studentNis: '2026001',
    recordType: TahfizRecordTypeEnum.ZIYADAH,
    surahNumber: 79,
    surahName: "An-Nazi'at",
    ayatStart: 1,
    ayatEnd: 46,
    juz: 30,
    fluencyRating: TahfizFluencyRatingEnum.MUMTAZ,
    tajwidRating: 'MUMTAZ',
    notes: 'Hafalan sangat mutqin dan lancar',
  });

  // Gate Pass Security Scanner State
  const [gateTokenInput, setGateTokenInput] = useState('');
  const [scannedPermit, setScannedPermit] = useState<PesantrenPermitResponseData | null>(null);

  // Quick Action: Approve Permit
  const handleApprovePermit = (id: string, stage: 'MUSYRIF' | 'KEASRAMAAN') => {
    setPermits((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (stage === 'MUSYRIF') {
          return {
            ...p,
            status: PesantrenPermitStatusEnum.APPROVED_BY_MUSYRIF,
            approvedByMusyrifName: 'Ustadz Pembina (Disetujui)',
          };
        } else {
          return {
            ...p,
            status: PesantrenPermitStatusEnum.APPROVED_BY_KEASRAMAAN,
            approvedByKeasramaanName: 'Kepala Keasramaan (Disetujui)',
          };
        }
      })
    );
    showToast(`Izin berhasil disetujui pada tahap ${stage}!`);
  };

  // Quick Action: Reject Permit
  const handleRejectPermit = (id: string) => {
    setPermits((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: PesantrenPermitStatusEnum.REJECTED } : p))
    );
    showToast('Izin santri telah ditolak!');
  };

  // Quick Action: Scan Token
  const handleScanToken = () => {
    const found = permits.find(
      (p) => p.securityGateToken.toUpperCase() === gateTokenInput.trim().toUpperCase()
    );
    if (!found) {
      showToast('Token gerbang tidak ditemukan atau tidak valid!');
      setScannedPermit(null);
    } else {
      setScannedPermit(found);
    }
  };

  // Gate Check Out / Check In
  const handleGateAction = (action: 'CHECK_OUT' | 'CHECK_IN') => {
    if (!scannedPermit) return;

    if (action === 'CHECK_OUT') {
      if (scannedPermit.status !== PesantrenPermitStatusEnum.APPROVED_BY_KEASRAMAAN) {
        showToast('Santri belum diizinkan keluar (Harus disetujui Keasramaan)!');
        return;
      }
      setPermits((prev) =>
        prev.map((p) =>
          p.id === scannedPermit.id
            ? {
                ...p,
                status: PesantrenPermitStatusEnum.ACTIVE_OUTSIDE,
                actualDeparture: new Date().toISOString(),
              }
            : p
        )
      );
      showToast(`Santri ${scannedPermit.studentName} berhasil CHECK-OUT dari gerbang pesantren.`);
    } else {
      setPermits((prev) =>
        prev.map((p) =>
          p.id === scannedPermit.id
            ? {
                ...p,
                status: PesantrenPermitStatusEnum.RETURNED,
                actualReturn: new Date().toISOString(),
              }
            : p
        )
      );
      showToast(`Santri ${scannedPermit.studentName} telah kembali (CHECK-IN) ke pesantren.`);
    }
    setScannedPermit(null);
    setGateTokenInput('');
    setShowGatePassModal(false);
  };

  // Stats calculation
  const totalDorms = dormitories.length;
  const totalCapacity = dormitories.reduce((acc, d) => acc + d.totalCapacity, 0);
  const totalOccupied = dormitories.reduce((acc, d) => acc + d.totalOccupancy, 0);
  const occupancyRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
  const activeOutsideCount = permits.filter((p) => p.status === PesantrenPermitStatusEnum.ACTIVE_OUTSIDE).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-lg shadow-xl flex items-center space-x-3 border border-emerald-500 animate-bounce">
          <span className="text-xl">🕌</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 rounded-2xl border border-emerald-700/40 shadow-xl text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <span>🕌 EduSaaS Pesantren Engine</span>
              <span>•</span>
              <span className="bg-emerald-800/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Phase 7 Verified
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Kepesantrenan, Asrama (Kobong) & Tahfiz Qur'an
            </h1>
            <p className="text-sm text-slate-300 mt-1">
              Sentralisasi manajemen hunian asrama, log setoran ziyadah & muroja'ah tahfiz, serta gerbang perizinan santri.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowGatePassModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-2 transition"
            >
              <span>🛡️</span>
              <span>Gerbang Keamanan (Satpam)</span>
            </button>
            <button
              onClick={() => setShowTahfizModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow flex items-center space-x-2 transition"
            >
              <span>📖</span>
              <span>Input Setoran Tahfiz</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-800/50">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Asrama</p>
            <p className="text-xl font-bold text-white mt-1">{totalDorms} Gedung</p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Putra & Putri terpisah</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Okupansi Asrama</p>
            <p className="text-xl font-bold text-emerald-400 mt-1">
              {totalOccupied} / {totalCapacity} ({occupancyRate}%)
            </p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Setoran Tahfiz Hari Ini</p>
            <p className="text-xl font-bold text-white mt-1">{tahfizRecords.length} Jurnal</p>
            <p className="text-[11px] text-teal-300 mt-0.5">Ziyadah & Muroja'ah aktif</p>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-emerald-800/30">
            <p className="text-[11px] text-slate-400 uppercase font-semibold">Santri Sedang Di Luar</p>
            <p className="text-xl font-bold text-amber-400 mt-1">{activeOutsideCount} Santri</p>
            <p className="text-[11px] text-slate-300 mt-0.5">Gate pass terverifikasi</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex border-b border-slate-700 space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('dormitory')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeSubTab === 'dormitory'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🏘️</span>
          <span>Gedung Asrama & Kamar</span>
        </button>
        <button
          onClick={() => setActiveSubTab('tahfiz')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeSubTab === 'tahfiz'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📖</span>
          <span>Halaqah & Setoran Tahfiz Qur'an</span>
        </button>
        <button
          onClick={() => setActiveSubTab('permits')}
          className={`pb-3 flex items-center space-x-2 transition ${
            activeSubTab === 'permits'
              ? 'border-b-2 border-emerald-500 text-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🚪</span>
          <span>Perizinan Santri & Gerbang (Gate Pass)</span>
          {activeOutsideCount > 0 && (
            <span className="bg-amber-600 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
              {activeOutsideCount}
            </span>
          )}
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ASRAMA & KAMAR                                                 */}
      {/* ===================================================================== */}
      {activeSubTab === 'dormitory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-400">Filter Gender:</span>
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs">
                {['ALL', 'MALE', 'FEMALE'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGender(g)}
                    className={`px-3 py-1 rounded-md transition ${
                      selectedGender === g
                        ? 'bg-emerald-600 text-white font-medium'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {g === 'ALL' ? 'Semua Gedung' : g === 'MALE' ? 'Putra (Bannin)' : 'Putri (Bannat)'}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setShowAllocateModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              + Alokasikan Kasur Santri
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dormitories
              .filter((d) => selectedGender === 'ALL' || d.gender === selectedGender)
              .map((dorm) => (
                <div
                  key={dorm.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">
                          {dorm.gender === GenderEnum.MALE ? '👦' : '🧕'}
                        </span>
                        <h3 className="text-base font-bold text-white">{dorm.name}</h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{dorm.description}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        dorm.gender === GenderEnum.MALE
                          ? 'bg-blue-900/40 text-blue-400 border-blue-700/50'
                          : 'bg-rose-900/40 text-rose-400 border-rose-700/50'
                      }`}
                    >
                      {dorm.gender === GenderEnum.MALE ? 'ASRAMA PUTRA' : 'ASRAMA PUTRI'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-lg text-center text-xs">
                    <div>
                      <p className="text-slate-400 text-[10px]">Total Kamar</p>
                      <p className="font-bold text-white mt-0.5">{dorm.totalRooms}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Kapasitas Kasur</p>
                      <p className="font-bold text-white mt-0.5">{dorm.totalCapacity}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-[10px]">Terisi / Kosong</p>
                      <p className="font-bold text-emerald-400 mt-0.5">
                        {dorm.totalOccupancy} / {dorm.totalCapacity - dorm.totalOccupancy}
                      </p>
                    </div>
                  </div>

                  {/* Room List in Dorm */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Rincian Kamar:</p>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {dorm.rooms?.map((room) => (
                        <div
                          key={room.id}
                          className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/70 flex items-center justify-between text-xs"
                        >
                          <div>
                            <p className="font-medium text-white">{room.roomNumber}</p>
                            <p className="text-[11px] text-slate-400">
                              Lantai {room.floor} • Terisi {room.currentOccupancy} dari {room.capacity} santri
                            </p>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                room.availableSlots > 0
                                  ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                                  : 'bg-rose-900/40 text-rose-400 border border-rose-700/40'
                              }`}
                            >
                              {room.availableSlots > 0
                                ? `${room.availableSlots} Slot Kosong`
                                : 'Penuh'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: TAHFIZ & HALAQAH                                               */}
      {/* ===================================================================== */}
      {activeSubTab === 'tahfiz' && (
        <div className="space-y-6">
          {/* Halaqah Groups Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {halaqahGroups.map((hq) => (
              <div
                key={hq.id}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">👳</span>
                    <h3 className="font-bold text-white text-sm">{hq.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Pembina: {hq.ustazName}</p>
                  <p className="text-[11px] text-teal-400 mt-0.5">Jadwal: {hq.schedule}</p>
                </div>
                <div className="text-right">
                  <span className="bg-emerald-900/50 text-emerald-300 text-xs px-2.5 py-1 rounded-lg border border-emerald-700/40 font-semibold">
                    {hq.memberCount} Santri
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Target: {hq.targetJuz} Juz</p>
                </div>
              </div>
            ))}
          </div>

          {/* Tahfiz Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">Buku Jurnal Setoran Tahfiz Santri</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Rekam setoran Ziyadah (Hafalan Baru) & Muroja'ah (Pengulangan).
                </p>
              </div>
              <input
                type="text"
                placeholder="Cari santri / surah..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 w-full sm:w-64"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Tipe Setoran</th>
                    <th className="py-3 px-4">Surah & Ayat</th>
                    <th className="py-3 px-4">Juz</th>
                    <th className="py-3 px-4">Kelancaran</th>
                    <th className="py-3 px-4">Tajwid</th>
                    <th className="py-3 px-4">Musyrif</th>
                    <th className="py-3 px-4">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tahfizRecords
                    .filter(
                      (r) =>
                        r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.surahName.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{rec.studentName}</p>
                          <p className="text-[10px] text-slate-400">NIS: {rec.studentNis}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.recordType === TahfizRecordTypeEnum.ZIYADAH
                                ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40'
                                : 'bg-blue-900/40 text-blue-400 border border-blue-700/40'
                            }`}
                          >
                            {rec.recordType}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-white">{rec.surahName}</p>
                          <p className="text-[10px] text-slate-400">
                            Ayat {rec.ayatStart} - {rec.ayatEnd}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-bold text-white">Juz {rec.juz}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              rec.fluencyRating === TahfizFluencyRatingEnum.MUMTAZ
                                ? 'bg-emerald-800/40 text-emerald-300'
                                : rec.fluencyRating === TahfizFluencyRatingEnum.JAYYID_JIDDAN
                                ? 'bg-teal-800/40 text-teal-300'
                                : 'bg-amber-800/40 text-amber-300'
                            }`}
                          >
                            {rec.fluencyRating}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{rec.tajwidRating || 'JAYYID'}</td>
                        <td className="py-3 px-4 text-slate-300">{rec.musyrifName}</td>
                        <td className="py-3 px-4 text-slate-400 text-[10px]">
                          {new Date(rec.recordedAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
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
      {/* TAB 3: PERIZINAN SANTRI & GERBANG (PERMITS)                           */}
      {/* ===================================================================== */}
      {activeSubTab === 'permits' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-sm">Daftar Pengajuan Izin Keluar & Pulang</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alur persetujuan berjenjang: Musyrif Kamar → Keasramaan → Gerbang Satpam.
                </p>
              </div>
              <button
                onClick={() => setShowGatePassModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow transition flex items-center space-x-2 self-start"
              >
                <span>🔍</span>
                <span>Validasi Token Gerbang (Satpam)</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Tipe Izin</th>
                    <th className="py-3 px-4">Alasan & Penjemput</th>
                    <th className="py-3 px-4">Jadwal Keluar - Pulang</th>
                    <th className="py-3 px-4">Token Gerbang</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Persetujuan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {permits.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{p.studentName}</p>
                        <p className="text-[10px] text-slate-400">NIS: {p.studentNis}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {p.permitType}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-white">{p.reason}</p>
                        <p className="text-[10px] text-slate-400">
                          Penjemput: {p.pickupPersonName} ({p.pickupPersonRelation}) • {p.pickupPersonPhone}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <p className="text-slate-300">
                          Brgkt: {new Date(p.expectedDeparture).toLocaleDateString('id-ID')}
                        </p>
                        <p className="text-slate-400">
                          Plg: {new Date(p.expectedReturn).toLocaleDateString('id-ID')}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-[11px] bg-slate-950 px-2 py-1 rounded text-amber-400 font-mono border border-slate-800">
                          {p.securityGateToken}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === PesantrenPermitStatusEnum.PENDING_APPROVAL
                              ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50'
                              : p.status === PesantrenPermitStatusEnum.APPROVED_BY_MUSYRIF
                              ? 'bg-blue-900/40 text-blue-300 border border-blue-700/50'
                              : p.status === PesantrenPermitStatusEnum.APPROVED_BY_KEASRAMAAN
                              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50'
                              : p.status === PesantrenPermitStatusEnum.ACTIVE_OUTSIDE
                              ? 'bg-purple-900/40 text-purple-300 border border-purple-700/50'
                              : p.status === PesantrenPermitStatusEnum.RETURNED
                              ? 'bg-teal-900/40 text-teal-300 border border-teal-700/50'
                              : 'bg-rose-900/40 text-rose-300 border border-rose-700/50'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          {p.status === PesantrenPermitStatusEnum.PENDING_APPROVAL && (
                            <>
                              <button
                                onClick={() => handleApprovePermit(p.id, 'MUSYRIF')}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-semibold"
                                title="Setujui sebagai Musyrif"
                              >
                                Setujui Musyrif
                              </button>
                              <button
                                onClick={() => handleRejectPermit(p.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {p.status === PesantrenPermitStatusEnum.APPROVED_BY_MUSYRIF && (
                            <>
                              <button
                                onClick={() => handleApprovePermit(p.id, 'KEASRAMAAN')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-semibold"
                                title="Setujui sebagai Keasramaan"
                              >
                                Setujui Keasramaan
                              </button>
                              <button
                                onClick={() => handleRejectPermit(p.id)}
                                className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-semibold"
                              >
                                Tolak
                              </button>
                            </>
                          )}
                          {(p.status === PesantrenPermitStatusEnum.APPROVED_BY_KEASRAMAAN ||
                            p.status === PesantrenPermitStatusEnum.ACTIVE_OUTSIDE ||
                            p.status === PesantrenPermitStatusEnum.RETURNED) && (
                            <span className="text-[10px] text-slate-400">Siap di Gerbang</span>
                          )}
                        </div>
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
      {/* MODAL 1: ALOKASI KASUR SANTRI                                         */}
      {/* ===================================================================== */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Alokasikan Kasur Asrama</h3>
              <button
                onClick={() => setShowAllocateModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Pilih Kamar:</label>
                <select
                  value={newAlloc.roomId}
                  onChange={(e) => setNewAlloc({ ...newAlloc, roomId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="room-101">Kamar 101 - Gedung Al-Fatih (Putra)</option>
                  <option value="room-201">Kamar 201 - Gedung Khadijah (Putri)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nama Santri:</label>
                <input
                  type="text"
                  placeholder="Contoh: Bilal bin Rabah"
                  value={newAlloc.studentName}
                  onChange={(e) => setNewAlloc({ ...newAlloc, studentName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nomor Induk Santri (NIS):</label>
                <input
                  type="text"
                  placeholder="Contoh: 2026005"
                  value={newAlloc.studentNis}
                  onChange={(e) => setNewAlloc({ ...newAlloc, studentNis: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Nomor Ranjang / Kasur:</label>
                <input
                  type="text"
                  value={newAlloc.bedNumber}
                  onChange={(e) => setNewAlloc({ ...newAlloc, bedNumber: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAllocateModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!newAlloc.studentName) {
                    showToast('Nama santri wajib diisi!');
                    return;
                  }
                  showToast(`Santri ${newAlloc.studentName} berhasil dialokasikan ke kamar.`);
                  setShowAllocateModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Simpan Penempatan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: INPUT SETORAN TAHFIZ                                         */}
      {/* ===================================================================== */}
      {showTahfizModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Input Setoran Tahfiz Qur'an</h3>
              <button
                onClick={() => setShowTahfizModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Tipe Setoran:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setNewTahfiz({ ...newTahfiz, recordType: TahfizRecordTypeEnum.ZIYADAH })
                    }
                    className={`py-2 rounded-lg font-medium border text-center transition ${
                      newTahfiz.recordType === TahfizRecordTypeEnum.ZIYADAH
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Ziyadah (Hafalan Baru)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewTahfiz({ ...newTahfiz, recordType: TahfizRecordTypeEnum.MUROJA_AH })
                    }
                    className={`py-2 rounded-lg font-medium border text-center transition ${
                      newTahfiz.recordType === TahfizRecordTypeEnum.MUROJA_AH
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    Muroja'ah (Pengulangan)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Nama Surah:</label>
                  <input
                    type="text"
                    value={newTahfiz.surahName}
                    onChange={(e) => setNewTahfiz({ ...newTahfiz, surahName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Juz Ke:</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newTahfiz.juz}
                    onChange={(e) =>
                      setNewTahfiz({ ...newTahfiz, juz: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Ayat Awal:</label>
                  <input
                    type="number"
                    min="1"
                    value={newTahfiz.ayatStart}
                    onChange={(e) =>
                      setNewTahfiz({ ...newTahfiz, ayatStart: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Ayat Akhir:</label>
                  <input
                    type="number"
                    min="1"
                    value={newTahfiz.ayatEnd}
                    onChange={(e) =>
                      setNewTahfiz({ ...newTahfiz, ayatEnd: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Predikat Kelancaran:</label>
                <select
                  value={newTahfiz.fluencyRating}
                  onChange={(e) =>
                    setNewTahfiz({
                      ...newTahfiz,
                      fluencyRating: e.target.value as TahfizFluencyRating,
                    })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                >
                  <option value={TahfizFluencyRatingEnum.MUMTAZ}>MUMTAZ (Sangat Fasih & Mutqin)</option>
                  <option value={TahfizFluencyRatingEnum.JAYYID_JIDDAN}>JAYYID JIDDAN (Lancar)</option>
                  <option value={TahfizFluencyRatingEnum.JAYYID}>JAYYID (Cukup Lancar)</option>
                  <option value={TahfizFluencyRatingEnum.MAQBUL}>MAQBUL (Masih Perlu Pengulangan)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Catatan Ustadz:</label>
                <textarea
                  rows={2}
                  value={newTahfiz.notes}
                  onChange={(e) => setNewTahfiz({ ...newTahfiz, notes: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowTahfizModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const newEntry: TahfizRecordResponseData = {
                    id: 'tr-' + Date.now(),
                    tenantId: 'tenant-1',
                    studentId: 'st-1',
                    studentName: newTahfiz.studentName,
                    studentNis: newTahfiz.studentNis,
                    musyrifId: 'emp-1',
                    musyrifName: 'Ustaz Abdullah, Lc.',
                    recordType: newTahfiz.recordType,
                    surahNumber: newTahfiz.surahNumber,
                    surahName: newTahfiz.surahName,
                    ayatStart: newTahfiz.ayatStart,
                    ayatEnd: newTahfiz.ayatEnd,
                    juz: newTahfiz.juz,
                    fluencyRating: newTahfiz.fluencyRating,
                    tajwidRating: newTahfiz.tajwidRating,
                    notes: newTahfiz.notes,
                    recordedAt: new Date().toISOString(),
                  };
                  setTahfizRecords([newEntry, ...tahfizRecords]);
                  showToast(`Setoran ${newTahfiz.surahName} berhasil dicatat.`);
                  setShowTahfizModal(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
              >
                Simpan Setoran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: GATE PASS SCANNER (SATPAM / KEAMANAN)                        */}
      {/* ===================================================================== */}
      {showGatePassModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🛡️</span>
                <h3 className="font-bold text-base text-white">Pos Gerbang Keamanan Pesantren</h3>
              </div>
              <button
                onClick={() => setShowGatePassModal(false)}
                className="text-slate-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">
                  Masukkan / Scan Kode Token Gerbang (Gate Pass):
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Contoh: GATE-20260815-F41A8C"
                    value={gateTokenInput}
                    onChange={(e) => setGateTokenInput(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-mono uppercase"
                  />
                  <button
                    onClick={handleScanToken}
                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                  >
                    Verifikasi
                  </button>
                </div>
              </div>

              {scannedPermit && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-white text-sm">{scannedPermit.studentName}</p>
                      <p className="text-[11px] text-slate-400">NIS: {scannedPermit.studentNis}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-900/40 text-emerald-300 border border-emerald-700/50">
                      {scannedPermit.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 bg-slate-900 p-2.5 rounded-lg">
                    <div>
                      <span className="text-slate-400">Tipe Izin:</span> {scannedPermit.permitType}
                    </div>
                    <div>
                      <span className="text-slate-400">Penjemput:</span> {scannedPermit.pickupPersonName}
                    </div>
                    <div>
                      <span className="text-slate-400">Hubungan:</span>{' '}
                      {scannedPermit.pickupPersonRelation}
                    </div>
                    <div>
                      <span className="text-slate-400">No. Telp:</span> {scannedPermit.pickupPersonPhone}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    {scannedPermit.status === PesantrenPermitStatusEnum.APPROVED_BY_KEASRAMAAN && (
                      <button
                        onClick={() => handleGateAction('CHECK_OUT')}
                        className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-semibold text-xs"
                      >
                        ✓ Konfirmasi KELUAR GERBANG (Check-Out)
                      </button>
                    )}
                    {scannedPermit.status === PesantrenPermitStatusEnum.ACTIVE_OUTSIDE && (
                      <button
                        onClick={() => handleGateAction('CHECK_IN')}
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold text-xs"
                      >
                        ✓ Konfirmasi KEMBALI (Check-In)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowGatePassModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
