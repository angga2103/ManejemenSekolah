import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Users,
  Search,
  Plus,
  Download,
  Filter,
  UserCheck,
  Phone,
  ShieldCheck,
  X,
  CreditCard,
  BellRing,
} from 'lucide-react';
import type { Gender, StudentStatus, GuardianRelationshipType } from '@edusaas/shared-types';

interface StudentItem {
  id: string;
  nis: string;
  nisn?: string;
  fullName: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string;
  status: StudentStatus;
  currentClass?: {
    id: string;
    name: string;
  } | null;
  guardians: Array<{
    id: string;
    fullName: string;
    phone: string;
    relationshipType: GuardianRelationshipType;
    isPrimary: boolean;
    hasFinancialAccess: boolean;
    receiveWhatsapp: boolean;
  }>;
}

const mockStudents: StudentItem[] = [
  {
    id: 's-1',
    nis: '20261001',
    nisn: '0081234567',
    fullName: 'Ahmad Bilal Al-Ghifari',
    gender: 'MALE' as Gender,
    birthPlace: 'Jakarta',
    birthDate: '2010-04-12',
    status: 'ACTIVE' as StudentStatus,
    currentClass: { id: 'c-1', name: '10 MIPA 1' },
    guardians: [
      {
        id: 'g-1',
        fullName: 'H. Suryadi Rahman',
        phone: '081234567897',
        relationshipType: 'FATHER' as GuardianRelationshipType,
        isPrimary: true,
        hasFinancialAccess: true,
        receiveWhatsapp: true,
      },
      {
        id: 'g-2',
        fullName: 'Hj. Halimah',
        phone: '081234567898',
        relationshipType: 'MOTHER' as GuardianRelationshipType,
        isPrimary: false,
        hasFinancialAccess: false,
        receiveWhatsapp: true,
      },
    ],
  },
  {
    id: 's-2',
    nis: '20261002',
    nisn: '0081234568',
    fullName: 'Muhammad Yusuf Mansur',
    gender: 'MALE' as Gender,
    birthPlace: 'Bandung',
    birthDate: '2010-06-20',
    status: 'ACTIVE' as StudentStatus,
    currentClass: { id: 'c-1', name: '10 MIPA 1' },
    guardians: [
      {
        id: 'g-3',
        fullName: 'Drs. H. Mansur Hidayat',
        phone: '081399887766',
        relationshipType: 'FATHER' as GuardianRelationshipType,
        isPrimary: true,
        hasFinancialAccess: true,
        receiveWhatsapp: true,
      },
    ],
  },
  {
    id: 's-3',
    nis: '20261003',
    nisn: '0081234569',
    fullName: 'Siti Fatimah Azzahra',
    gender: 'FEMALE' as Gender,
    birthPlace: 'Surabaya',
    birthDate: '2010-08-15',
    status: 'ACTIVE' as StudentStatus,
    currentClass: { id: 'c-2', name: 'Ula A - Kitab Kuning' },
    guardians: [
      {
        id: 'g-1',
        fullName: 'H. Suryadi Rahman',
        phone: '081234567897',
        relationshipType: 'FATHER' as GuardianRelationshipType,
        isPrimary: true,
        hasFinancialAccess: true,
        receiveWhatsapp: true,
      },
    ],
  },
  {
    id: 's-4',
    nis: '20261004',
    nisn: '0081234570',
    fullName: 'Ali Zainal Abidin',
    gender: 'MALE' as Gender,
    birthPlace: 'Semarang',
    birthDate: '2010-09-10',
    status: 'ACTIVE' as StudentStatus,
    currentClass: { id: 'c-1', name: '10 MIPA 1' },
    guardians: [],
  },
  {
    id: 's-5',
    nis: '20251009',
    nisn: '0071234599',
    fullName: 'Maryam Nurul Jannah',
    gender: 'FEMALE' as Gender,
    birthPlace: 'Yogyakarta',
    birthDate: '2009-11-05',
    status: 'GRADUATED' as StudentStatus,
    currentClass: null,
    guardians: [],
  },
];

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>(mockStudents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkGuardianModalOpen, setIsLinkGuardianModalOpen] = useState(false);

  // New Student Form State
  const [newNis, setNewNis] = useState('');
  const [newNisn, setNewNisn] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newGender, setNewGender] = useState<Gender>('MALE' as Gender);
  const [newBirthPlace, setNewBirthPlace] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('2010-01-01');
  const [newClass, setNewClass] = useState('10 MIPA 1');

  // New Guardian Link State
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRel, setGuardianRel] = useState<GuardianRelationshipType>('FATHER' as GuardianRelationshipType);
  const [hasFinance, setHasFinance] = useState(true);

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.nis.includes(search) ||
      (s.nisn && s.nisn.includes(search));
    const matchStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNis || !newFullName) return;

    const newStudent: StudentItem = {
      id: `s-${Date.now()}`,
      nis: newNis,
      nisn: newNisn || undefined,
      fullName: newFullName,
      gender: newGender,
      birthPlace: newBirthPlace || 'Jakarta',
      birthDate: newBirthDate,
      status: 'ACTIVE' as StudentStatus,
      currentClass: { id: 'c-1', name: newClass },
      guardians: [],
    };

    setStudents([newStudent, ...students]);
    setIsAddModalOpen(false);
    setNewNis('');
    setNewNisn('');
    setNewFullName('');
  };

  const handleLinkGuardian = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !guardianName || !guardianPhone) return;

    const newGuardian = {
      id: `g-${Date.now()}`,
      fullName: guardianName,
      phone: guardianPhone,
      relationshipType: guardianRel,
      isPrimary: selectedStudent.guardians.length === 0,
      hasFinancialAccess: hasFinance,
      receiveWhatsapp: true,
    };

    const updated = {
      ...selectedStudent,
      guardians: [...selectedStudent.guardians, newGuardian],
    };

    setSelectedStudent(updated);
    setStudents(students.map((s) => (s.id === updated.id ? updated : s)));
    setIsLinkGuardianModalOpen(false);
    setGuardianName('');
    setGuardianPhone('');
  };

  const handleExportCsv = () => {
    const headers = ['NIS', 'NISN', 'Nama Lengkap', 'Gender', 'Tempat Lahir', 'Tgl Lahir', 'Kelas', 'Status'];
    const rows = filteredStudents.map((s) => [
      s.nis,
      s.nisn || '',
      `"${s.fullName}"`,
      s.gender,
      `"${s.birthPlace}"`,
      s.birthDate,
      `"${s.currentClass?.name || '-'}"`,
      s.status,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `data-santri-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-600" /> Data Induk Santri & Siswa
          </h1>
          <p className="text-sm text-slate-500">
            Pusat manajemen master data santri, pemetaan wali murid, status mutasi, dan rombel kelas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportCsv}
            className="text-xs border-slate-300 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" /> Unduh CSV / Excel
          </Button>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
          >
            <Plus className="w-4 h-4" /> Tambah Santri Baru
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 bg-white border border-slate-200">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari berdasarkan NIS, NISN, atau Nama Santri..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-medium px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
            >
              <option value="ALL">Semua Status (Aktif & Alumni)</option>
              <option value="ACTIVE">Aktif Belajar</option>
              <option value="GRADUATED">Alumni / Lulus</option>
              <option value="TRANSFERRED_OUT">Mutasi Keluar</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Students Data Table */}
      <Card className="overflow-hidden border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px] tracking-wider">
                <th className="py-3 px-4">NIS / NISN</th>
                <th className="py-3 px-4">Nama Lengkap Santri</th>
                <th className="py-3 px-4">JK</th>
                <th className="py-3 px-4">Kelahiran</th>
                <th className="py-3 px-4">Rombel Kelas</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Wali Terdaftar</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    Tidak ada santri yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition cursor-pointer" onClick={() => setSelectedStudent(s)}>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      <div>{s.nis}</div>
                      <div className="text-[10px] text-slate-400">{s.nisn || '-'}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                        {s.fullName.substring(0, 2).toUpperCase()}
                      </div>
                      {s.fullName}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${s.gender === 'MALE' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                        {s.gender === 'MALE' ? 'L' : 'P'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      <div>{s.birthPlace}</div>
                      <div className="text-[10px]">{s.birthDate}</div>
                    </td>
                    <td className="py-3 px-4">
                      {s.currentClass ? (
                        <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {s.currentClass.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Belum Diplot</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={s.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {s.status === 'ACTIVE' ? 'Aktif' : 'Lulus'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      {s.guardians.length > 0 ? (
                        <div className="flex items-center gap-1 text-[11px] font-medium text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{s.guardians[0].fullName}</span>
                          {s.guardians.length > 1 && (
                            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-bold">
                              +{s.guardians.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-rose-500 text-[10px] italic">Belum Ditautkan</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStudent(s);
                        }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                      >
                        Detail & Wali
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Student Details & Guardian Link Drawer/Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                  {selectedStudent.fullName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedStudent.fullName}</h3>
                  <div className="text-xs text-slate-500">
                    NIS: {selectedStudent.nis} | NISN: {selectedStudent.nisn || '-'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block">Jenis Kelamin:</span>
                <span className="font-semibold text-slate-800">
                  {selectedStudent.gender === 'MALE' ? 'Laki-Laki (Santri Putra)' : 'Perempuan (Santri Putri)'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Tempat / Tgl Lahir:</span>
                <span className="font-semibold text-slate-800">{selectedStudent.birthPlace}, {selectedStudent.birthDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Rombel Kelas:</span>
                <span className="font-semibold text-emerald-700">{selectedStudent.currentClass?.name || 'Belum Diplot'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Status Akademik:</span>
                <Badge variant={selectedStudent.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {selectedStudent.status}
                </Badge>
              </div>
            </div>

            {/* Guardians Section (1:N and N:M Relationship Showcase) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Relasi Wali Murid Terdaftar
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Sistem mendukung relasi ganda (Ayah, Ibu, Wali Asuh) dengan hak akses finansial & notifikasi terpisah.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsLinkGuardianModalOpen(true)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Tautkan Wali Baru
                </Button>
              </div>

              {selectedStudent.guardians.length === 0 ? (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  Belum ada data orang tua atau wali murid yang tertaut dengan santri ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedStudent.guardians.map((g) => (
                    <div
                      key={g.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between shadow-sm"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{g.fullName}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                            {g.relationshipType === 'FATHER' ? 'Ayah Kandung' : g.relationshipType === 'MOTHER' ? 'Ibu Kandung' : 'Wali Resmi'}
                          </span>
                          {g.isPrimary && (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                              Wali Utama
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" /> {g.phone}
                          </span>
                          {g.hasFinancialAccess && (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <CreditCard className="w-3 h-3" /> Akses Tagihan & SPP
                            </span>
                          )}
                          {g.receiveWhatsapp && (
                            <span className="flex items-center gap-1 text-emerald-700 font-medium">
                              <BellRing className="w-3 h-3" /> Notifikasi WA Aktif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-600" /> Pendaftaran Santri Baru
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Nomor Induk Santri (NIS) *</label>
                  <Input value={newNis} onChange={(e) => setNewNis(e.target.value)} placeholder="cth: 20261009" required />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">NISN Nasional</label>
                  <Input value={newNisn} onChange={(e) => setNewNisn(e.target.value)} placeholder="0081239999" />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Nama Lengkap Santri *</label>
                <Input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Nama lengkap sesuai akta lahir" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Jenis Kelamin *</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as Gender)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="MALE">Laki-Laki (Santri Putra)</option>
                    <option value="FEMALE">Perempuan (Santri Putri)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Plotting Kelas Awal</label>
                  <select
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
                  >
                    <option value="10 MIPA 1">10 MIPA 1 (Formal)</option>
                    <option value="10 MIPA 2">10 MIPA 2 (Formal)</option>
                    <option value="Ula A - Kitab Kuning">Ula A - Kitab Kuning (Pesantren)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Tempat Lahir</label>
                  <Input value={newBirthPlace} onChange={(e) => setNewBirthPlace(e.target.value)} placeholder="Jakarta" />
                </div>
                <div>
                  <label className="block text-slate-600 mb-1 font-semibold">Tanggal Lahir</label>
                  <Input type="date" value={newBirthDate} onChange={(e) => setNewBirthDate(e.target.value)} />
                </div>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Simpan Data Santri
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link Guardian Modal */}
      {isLinkGuardianModalOpen && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Tautkan Orang Tua / Wali</h3>
              <button onClick={() => setIsLinkGuardianModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLinkGuardian} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Nama Lengkap Wali *</label>
                <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="Nama lengkap orang tua" required />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Nomor WhatsApp / HP *</label>
                <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="081234567890" required />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Hubungan Keluarga</label>
                <select
                  value={guardianRel}
                  onChange={(e) => setGuardianRel(e.target.value as GuardianRelationshipType)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-slate-50"
                >
                  <option value="FATHER">Ayah Kandung</option>
                  <option value="MOTHER">Ibu Kandung</option>
                  <option value="LEGAL_GUARDIAN">Wali Resmi / Paman</option>
                  <option value="FOUNDATION_SPONSOR">Donatur / Sponsor Yayasan</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasFinance}
                    onChange={(e) => setHasFinance(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Izinkan akses tagihan pembayaran SPP & Keuangan</span>
                </label>
              </div>

              <div className="pt-3 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsLinkGuardianModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  Tautkan Wali
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
