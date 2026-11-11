import React, { useState, useEffect } from 'react';
import type { AttendanceResponseData, AttendanceSummaryDto, LeaveRequestResponseData, NotificationItemData } from '@edusaas/api-contracts';

export const AttendancePage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'projector' | 'leaves' | 'notifications'>('overview');
  const [recordedDate, setRecordedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendanceType, setAttendanceType] = useState<string>('CLASS');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Quick scan barcode input
  const [quickBarcodeNis, setQuickBarcodeNis] = useState<string>('');
  const [scanMessage, setScanMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Correction Modal State
  const [correctingRecord, setCorrectingRecord] = useState<AttendanceResponseData | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState<string>('PRESENT');
  const [correctionReason, setCorrectionReason] = useState<string>('');

  // Projector QR State
  const [projectorQrToken, setProjectorQrToken] = useState<string>('EDUSAAS_QR_SIG_8F9A0B1C2D3E4F5A6B7C8D9E0');
  const [countdown, setCountdown] = useState<number>(30);

  // Demo Initial Data
  const [summary, setSummary] = useState<AttendanceSummaryDto>({
    recordedDate: new Date().toISOString().split('T')[0],
    type: 'CLASS' as any,
    totalStudents: 32,
    presentCount: 28,
    lateCount: 2,
    sickCount: 1,
    permissionCount: 1,
    dispensationCount: 0,
    absentCount: 0,
    attendanceRatePercentage: 93.8,
  });

  const [attendances, setAttendances] = useState<AttendanceResponseData[]>([
    {
      id: 'att-01',
      tenantId: 't-1',
      studentId: 's-1',
      studentName: 'Ahmad Faiz Al-Faruq',
      studentNis: '2026001',
      classGroupName: '10 MIPA 1',
      type: 'CLASS' as any,
      status: 'PRESENT' as any,
      method: 'QR_DYNAMIC' as any,
      recordedDate: new Date().toISOString().split('T')[0],
      checkInTime: new Date(new Date().setHours(6, 52, 0, 0)).toISOString(),
      checkOutTime: null,
      deviceId: 'Gate-Scanner-01',
      latitude: -6.2088,
      longitude: 106.8456,
      notes: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'att-02',
      tenantId: 't-1',
      studentId: 's-2',
      studentName: 'Fathimah Azzahra',
      studentNis: '2026002',
      classGroupName: '10 MIPA 1',
      type: 'CLASS' as any,
      status: 'LATE' as any,
      method: 'BARCODE' as any,
      recordedDate: new Date().toISOString().split('T')[0],
      checkInTime: new Date(new Date().setHours(7, 24, 0, 0)).toISOString(),
      checkOutTime: null,
      deviceId: 'Admin-Desk-02',
      latitude: -6.2088,
      longitude: 106.8456,
      notes: 'Terlambat 9 menit (Kondisi hujan)',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'att-03',
      tenantId: 't-1',
      studentId: 's-3',
      studentName: 'Muhammad Rizki Pratama',
      studentNis: '2026003',
      classGroupName: 'Ula A - Kitab Kuning',
      type: 'CLASS' as any,
      status: 'SICK' as any,
      method: 'MANUAL' as any,
      recordedDate: new Date().toISOString().split('T')[0],
      checkInTime: null,
      checkOutTime: null,
      deviceId: null,
      latitude: null,
      longitude: null,
      notes: 'Izin sakit: Demam (Surat Dokter No. 412)',
      createdAt: new Date().toISOString(),
    },
  ]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestResponseData[]>([
    {
      id: 'leave-01',
      tenantId: 't-1',
      studentId: 's-3',
      studentName: 'Muhammad Rizki Pratama',
      studentNis: '2026003',
      classGroupName: 'Ula A - Kitab Kuning',
      reason: 'Demam tinggi dan istirahat di UKS / Rumah',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      status: 'PENDING' as any,
      approvedByEmployeeId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'leave-02',
      tenantId: 't-1',
      studentId: 's-1',
      studentName: 'Ahmad Faiz Al-Faruq',
      studentNis: '2026001',
      classGroupName: '10 MIPA 1',
      reason: 'Mengikuti Lomba Olimpiade Sains Kabupaten (Dispensasi)',
      startDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      endDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      status: 'APPROVED' as any,
      approvedByEmployeeId: 'emp-1',
      approvedByEmployeeName: 'Ustaz Abdullah, S.Pd.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  const [notifications, setNotifications] = useState<NotificationItemData[]>([
    {
      id: 'notif-01',
      tenantId: 't-1',
      userId: 'u-parent-1',
      title: 'Laporan Presensi: Ahmad Faiz Al-Faruq (HADIR)',
      body: 'Santri Ahmad Faiz (NIS: 2026001) tercatat HADIR TEPAT WAKTU pada pukul 06:52 WIB via QR Dinamis.',
      channel: 'PUSH' as any,
      status: 'SENT' as any,
      category: 'ATTENDANCE',
      metadata: { studentId: 's-1', status: 'PRESENT' },
      readAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    },
    {
      id: 'notif-02',
      tenantId: 't-1',
      userId: 'u-parent-2',
      title: 'Peringatan Keterlambatan: Fathimah Azzahra (TERLAMBAT)',
      body: 'Santri Fathimah Azzahra (NIS: 2026002) masuk gerbang pada 07:24 WIB (batas cutoff 07:15 WIB). Notifikasi darurat dikirim ke wali murid.',
      channel: 'WHATSAPP' as any,
      status: 'SENT' as any,
      category: 'ATTENDANCE',
      metadata: { studentId: 's-2', status: 'LATE' },
      readAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'notif-03',
      tenantId: 't-1',
      userId: 'u-parent-3',
      title: 'Pengajuan Izin Sakit Santri Terverifikasi',
      body: 'Permohonan izin sakit Muhammad Rizki Pratama untuk tanggal hari ini telah diverifikasi bagian Kesantrian.',
      channel: 'IN_APP' as any,
      status: 'READ' as any,
      category: 'LEAVE_REQUEST',
      metadata: { studentId: 's-3' },
      readAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ]);

  // Projector Countdown Timer
  useEffect(() => {
    if (activeSubTab !== 'projector') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Regenerate dynamic hash token
          const newNonce = Math.random().toString(36).substring(2, 10).toUpperCase();
          setProjectorQrToken(`EDUSAAS_QR_DYNAMIC_${Date.now()}_${newNonce}`);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSubTab]);

  // Quick Barcode Scan Handler
  const handleQuickBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickBarcodeNis.trim()) return;

    const matched = attendances.find((a) => a.studentNis === quickBarcodeNis.trim());
    if (matched) {
      setScanMessage({ text: `Santri ${matched.studentName} sudah tercatat presensi sebelumnya (${matched.status})`, isError: true });
      return;
    }

    const newRecord: AttendanceResponseData = {
      id: `att-scan-${Date.now()}`,
      tenantId: 't-1',
      studentId: `s-temp-${Date.now()}`,
      studentName: `Santri NIS ${quickBarcodeNis}`,
      studentNis: quickBarcodeNis.trim(),
      classGroupName: '10 MIPA 1',
      type: attendanceType as any,
      status: 'PRESENT' as any,
      method: 'BARCODE' as any,
      recordedDate,
      checkInTime: new Date().toISOString(),
      checkOutTime: null,
      deviceId: 'Web-Barcode-Station',
      latitude: null,
      longitude: null,
      notes: 'Pencatatan langsung via barcode scanner barcode web',
      createdAt: new Date().toISOString(),
    };

    setAttendances([newRecord, ...attendances]);
    setSummary((prev) => ({
      ...prev,
      presentCount: prev.presentCount + 1,
      totalStudents: prev.totalStudents + 1,
    }));
    setScanMessage({ text: `Presensi Berhasil: NIS ${quickBarcodeNis} tercatat HADIR TEPAT WAKTU pada ${new Date().toLocaleTimeString('id-ID')}` });
    setQuickBarcodeNis('');
  };

  // Correction Submit Handler
  const handleSaveCorrection = () => {
    if (!correctingRecord) return;

    setAttendances(
      attendances.map((item) => {
        if (item.id === correctingRecord.id) {
          return {
            ...item,
            status: correctionStatus as any,
            notes: correctionReason ? `${item.notes || ''} [Koreksi: ${correctionReason}]` : item.notes,
          };
        }
        return item;
      })
    );

    setCorrectingRecord(null);
    setCorrectionReason('');
  };

  // Leave Request Approval Handler
  const handleApproveLeave = (leaveId: string, approve: boolean) => {
    setLeaveRequests(
      leaveRequests.map((lr) => {
        if (lr.id === leaveId) {
          return {
            ...lr,
            status: (approve ? 'APPROVED' : 'REJECTED') as any,
            approvedByEmployeeName: 'Admin Kesantrian',
          };
        }
        return lr;
      })
    );
  };

  // Filtered Attendances
  const filteredAttendances = attendances.filter((item) => {
    if (filterClass !== 'all' && item.classGroupName !== filterClass) return false;
    if (filterStatus !== 'all' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>📅</span> Monitoring Presensi & Kehadiran Santri
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Engine presensi multi-channel: QR Dinamis bertanda tangan kriptografis, Barcode, antrean sinkronisasi offline, dan notifikasi real-time ke wali murid.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeSubTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Ikhtisar & Roster
          </button>
          <button
            onClick={() => setActiveSubTab('projector')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'projector' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
            📺 Proyektor QR Dinamis
          </button>
          <button
            onClick={() => setActiveSubTab('leaves')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'leaves' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Pengajuan Izin
            {leaveRequests.filter((l) => l.status === 'PENDING').length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                {leaveRequests.filter((l) => l.status === 'PENDING').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeSubTab === 'notifications' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🔔 Log Notifikasi
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500 text-white">
              {notifications.filter((n) => !n.readAt).length}
            </span>
          </button>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: OVERVIEW & ROSTER */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Santri</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{summary.totalStudents}</p>
              <span className="text-[10px] text-slate-500">Santri terdaftar aktif</span>
            </div>
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Hadir Tepat Waktu</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{summary.presentCount}</p>
              <span className="text-[10px] text-emerald-600 font-medium">Sebelum 07:15 WIB</span>
            </div>
            <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Terlambat</span>
              <p className="text-2xl font-black text-amber-700 mt-1">{summary.lateCount}</p>
              <span className="text-[10px] text-amber-600 font-medium">Setelah cutoff waktu</span>
            </div>
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">Sakit</span>
              <p className="text-2xl font-black text-blue-700 mt-1">{summary.sickCount}</p>
              <span className="text-[10px] text-blue-600 font-medium">Surat dokter / izin</span>
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Izin / Dispensasi</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">{summary.permissionCount + summary.dispensationCount}</p>
              <span className="text-[10px] text-indigo-600 font-medium">Izin kegiatan resmi</span>
            </div>
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-sm">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Alpa (Tanpa Kabar)</span>
              <p className="text-2xl font-black text-rose-700 mt-1">{summary.absentCount}</p>
              <span className="text-[10px] text-rose-600 font-medium">Belum scan presensi</span>
            </div>
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm text-white">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tingkat Hadir</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{summary.attendanceRatePercentage}%</p>
              <span className="text-[10px] text-slate-400">Target minimal 90%</span>
            </div>
          </div>

          {/* Quick Scan Input & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Barcode Quick Check-in form */}
              <form onSubmit={handleQuickBarcodeScan} className="flex-1 flex gap-2 max-w-lg">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-sm">
                    📷
                  </span>
                  <input
                    type="text"
                    value={quickBarcodeNis}
                    onChange={(e) => setQuickBarcodeNis(e.target.value)}
                    placeholder="Scan Barcode Kartu / Ketik NIS Santri (Tekan Enter)..."
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Catat Hadir
                </button>
              </form>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div>
                  <input
                    type="date"
                    value={recordedDate}
                    onChange={(e) => setRecordedDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <select
                  value={attendanceType}
                  onChange={(e) => setAttendanceType(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CLASS">Kelas Formal</option>
                  <option value="DORMITORY">Absen Malam Asrama</option>
                  <option value="PRAYER">Sholat Berjamaah</option>
                  <option value="PESANTREN_ACTIVITY">Halaqah / Pengajian</option>
                </select>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Rombel</option>
                  <option value="10 MIPA 1">10 MIPA 1</option>
                  <option value="Ula A - Kitab Kuning">Ula A - Kitab Kuning</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="PRESENT">Hadir</option>
                  <option value="LATE">Terlambat</option>
                  <option value="SICK">Sakit</option>
                  <option value="PERMISSION">Izin</option>
                  <option value="ABSENT">Alpa</option>
                </select>
              </div>
            </div>

            {scanMessage && (
              <div
                className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  scanMessage.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}
              >
                <span>{scanMessage.text}</span>
                <button onClick={() => setScanMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
            )}
          </div>

          {/* Attendance Roster Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Rombel / Kelas</th>
                    <th className="py-3 px-4">Jenis Presensi</th>
                    <th className="py-3 px-4">Metode Scan</th>
                    <th className="py-3 px-4">Waktu Masuk</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Catatan & Bukti</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendances.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data presensi yang sesuai dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendances.map((item) => {
                      const checkInFormatted = item.checkInTime
                        ? new Date(item.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '-';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{item.studentName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">NIS: {item.studentNis}</div>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {item.classGroupName || '-'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-mono text-slate-500">
                              {item.method === 'QR_DYNAMIC' ? '📱 QR Dinamis' : item.method === 'BARCODE' ? '💳 Barcode Kartu' : '✍️ Manual'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-800">
                            {checkInFormatted}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.status === 'LATE'
                                    ? 'bg-amber-100 text-amber-800'
                                    : item.status === 'SICK'
                                      ? 'bg-blue-100 text-blue-800'
                                      : item.status === 'PERMISSION'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {item.notes || '-'}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setCorrectingRecord(item);
                                setCorrectionStatus(item.status);
                              }}
                              className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md font-semibold text-[11px] border border-slate-200 transition-colors"
                            >
                              Koreksi
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: DYNAMIC QR PROJECTOR */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'projector' && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 rounded-2xl text-white shadow-xl flex flex-col items-center justify-center space-y-6">
          <div className="text-center space-y-2 max-w-md">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Anti-Screenshot Cryptographic Engine
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Proyektor QR Code Dinamis
            </h2>
            <p className="text-xs text-slate-300">
              Tampilkan layar ini di proyektor kelas atau gerbang asrama. Santri memindai menggunakan kamera aplikasi mobile EduSaaS untuk presensi instan.
            </p>
          </div>

          {/* Live Dynamic QR Box */}
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center space-y-4 text-slate-900 border-4 border-emerald-500">
            {/* Visual Simulated QR Code Grid */}
            <div className="w-64 h-64 bg-slate-950 p-4 rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-75"></div>
              
              {/* Center Watermark & Logo */}
              <div className="z-10 bg-white p-3 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center">
                <span className="text-2xl">🕌</span>
                <span className="text-[10px] font-black text-slate-800 mt-1">EDUSAAS</span>
              </div>

              {/* Dynamic Scanning Line Animation */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent top-0 animate-bounce opacity-80"></div>
            </div>

            {/* Countdown Progress & Security Hash */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-500">QR Berganti Otomatis Dalam:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">{countdown}s</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(countdown / 30) * 100}%` }}
                ></div>
              </div>
              <div className="pt-2 text-[10px] text-slate-400 font-mono text-center truncate max-w-xs">
                HMAC-SHA256 Token: {projectorQrToken}
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-400 flex items-center gap-4">
            <span className="flex items-center gap-1">🔒 Enkripsi Server Authority</span>
            <span>•</span>
            <span className="flex items-center gap-1">⏱️ Kadaluwarsa 30 Detik</span>
            <span>•</span>
            <span className="flex items-center gap-1">🚫 Mencegah Titip Absen</span>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: LEAVE REQUESTS APPROVAL QUEUE */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'leaves' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Antrean Permohonan Izin & Sakit Santri</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Persetujuan dari Wali Kelas atau Musyrif Asrama akan otomatis menyinkronkan status presensi santri pada tanggal yang diajukan.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">Rombel</th>
                  <th className="py-3 px-4">Rentang Tanggal Izin</th>
                  <th className="py-3 px-4">Alasan Permohonan</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verifikator</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaveRequests.map((lr) => (
                  <tr key={lr.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{lr.studentName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">NIS: {lr.studentNis}</div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{lr.classGroupName || '-'}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      {lr.startDate} s.d {lr.endDate}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm">{lr.reason}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          lr.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lr.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {lr.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{lr.approvedByEmployeeName || '-'}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      {lr.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleApproveLeave(lr.id, true)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-[11px] shadow-sm transition-colors"
                          >
                            Setujui
                          </button>
                          <button
                            onClick={() => handleApproveLeave(lr.id, false)}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-semibold text-[11px] transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Selesai Diproses</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 4: NOTIFICATIONS LOG */}
      {/* --------------------------------------------------------------------- */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Log Pengiriman Notifikasi Kehadiran & Izin</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail pengiriman notifikasi instan ke orang tua/wali murid via In-App, Push Notification (FCM), dan WhatsApp Gateway.
              </p>
            </div>
            <button
              onClick={() => {
                setNotifications(notifications.map((n) => ({ ...n, readAt: new Date().toISOString() })));
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
            >
              Tandai Semua Dibaca
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div key={notif.id} className="py-3.5 flex items-start gap-4">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    notif.channel === 'PUSH'
                      ? 'bg-emerald-100 text-emerald-700'
                      : notif.channel === 'WHATSAPP'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {notif.channel === 'PUSH' ? '📱' : notif.channel === 'WHATSAPP' ? '💬' : '🔔'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold text-slate-900 truncate">{notif.title}</h3>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                      {new Date(notif.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{notif.body}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-600">
                      Channel: {notif.channel}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Status: {notif.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: CORRECTION OF ATTENDANCE RECORD */}
      {/* --------------------------------------------------------------------- */}
      {correctingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Koreksi Data Presensi</h3>
              <button
                onClick={() => setCorrectingRecord(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>Santri: <strong className="text-slate-900">{correctingRecord.studentName}</strong> ({correctingRecord.studentNis})</p>
              <p>Tanggal: <strong className="text-slate-900">{correctingRecord.recordedDate}</strong></p>
              <p>Status Saat Ini: <span className="font-bold text-emerald-700">{correctingRecord.status}</span></p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Koreksi Baru</label>
                <select
                  value={correctionStatus}
                  onChange={(e) => setCorrectionStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PRESENT">HADIR (PRESENT)</option>
                  <option value="LATE">TERLAMBAT (LATE)</option>
                  <option value="SICK">SAKIT (SICK)</option>
                  <option value="PERMISSION">IZIN (PERMISSION)</option>
                  <option value="DISPENSATION">DISPENSASI (DISPENSATION)</option>
                  <option value="ABSENT">ALPA (ABSENT)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Koreksi (Wajib untuk Audit Log)</label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="Misal: Bukti surat izin dokter telah diserahkan langsung oleh wali santri..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setCorrectingRecord(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveCorrection}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
              >
                Simpan & Rekam Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
