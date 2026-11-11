import React, { useState } from 'react';
import type {
  InvoiceResponseData,
  PaymentResponseData,
  FinanceSummaryDto,
  DigitalReceiptDto,
  CashAccountResponseData,
  JournalEntryResponseData,
} from '@edusaas/api-contracts';

export const FinancePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'accounting'>('invoices');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceResponseData | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<DigitalReceiptDto | null>(null);

  // Form states
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('CASH');
  const [selectedCashAccount, setSelectedCashAccount] = useState<string>('acc-1');

  // Batch Form State
  const [batchTitle, setBatchTitle] = useState('SPP Bulan November 2026');
  const [batchAmount, setBatchAmount] = useState(500000);
  const [batchClassGroup, setBatchClassGroup] = useState('10 MIPA 1');
  const [batchDueDate, setBatchDueDate] = useState('2026-11-20');

  // Financial KPI Summary
  const [summary, setSummary] = useState<FinanceSummaryDto>({
    totalInvoiced: 48500000,
    totalCollected: 36500000,
    totalOutstanding: 12000000,
    paidInvoicesCount: 73,
    unpaidInvoicesCount: 18,
    partiallyPaidCount: 6,
    overdueInvoicesCount: 2,
    collectionRatePercentage: 75.3,
    cashBalances: [
      { accountId: 'acc-1', accountName: 'Kasir Utama Bendahara', balance: 14200000 },
      { accountId: 'acc-2', accountName: 'Bank Syariah Indonesia (BSI) Operasional', balance: 18500000 },
      { accountId: 'acc-3', accountName: 'Bank BRI Rekening Pembangunan', balance: 3800000 },
    ],
    totalCashBalance: 36500000,
  });

  // Mock Invoices
  const [invoices, setInvoices] = useState<InvoiceResponseData[]>([
    {
      id: 'inv-01',
      tenantId: 't-1',
      studentId: 's-1',
      studentName: 'Ahmad Faiz Al-Faruq',
      studentNis: '2026001',
      classGroupName: '10 MIPA 1',
      billingCategoryId: 'cat-1',
      billingCategoryName: 'SPP Bulanan',
      invoiceNumber: 'INV/202611/0001',
      title: 'SPP Bulan November 2026',
      totalAmount: 500000,
      paidAmount: 500000,
      remainingAmount: 0,
      status: 'PAID' as any,
      dueDate: '2026-11-20',
      createdAt: '2026-11-01',
      updatedAt: '2026-11-05',
    },
    {
      id: 'inv-02',
      tenantId: 't-1',
      studentId: 's-2',
      studentName: 'Fathimah Azzahra',
      studentNis: '2026002',
      classGroupName: '10 MIPA 1',
      billingCategoryId: 'cat-2',
      billingCategoryName: 'Uang Pangkal & Pembangunan',
      invoiceNumber: 'INV/202610/0014',
      title: 'Uang Pangkal Gedung Baru',
      totalAmount: 3000000,
      paidAmount: 1500000,
      remainingAmount: 1500000,
      status: 'PARTIALLY_PAID' as any,
      dueDate: '2026-11-30',
      createdAt: '2026-10-10',
      updatedAt: '2026-10-25',
    },
    {
      id: 'inv-03',
      tenantId: 't-1',
      studentId: 's-3',
      studentName: 'Muhammad Rizki Pratama',
      studentNis: '2026003',
      classGroupName: 'Ula A - Kitab Kuning',
      billingCategoryId: 'cat-3',
      billingCategoryName: 'Kitab & Seragam Pesantren',
      invoiceNumber: 'INV/202611/0003',
      title: 'Paket Kitab Kuning & Seragam Diniyah',
      totalAmount: 850000,
      paidAmount: 0,
      remainingAmount: 850000,
      status: 'UNPAID' as any,
      dueDate: '2026-11-15',
      createdAt: '2026-11-02',
      updatedAt: '2026-11-02',
    },
  ]);

  // Mock Payments
  const [payments, setPayments] = useState<PaymentResponseData[]>([
    {
      id: 'pay-01',
      tenantId: 't-1',
      invoiceId: 'inv-01',
      invoiceNumber: 'INV/202611/0001',
      studentName: 'Ahmad Faiz Al-Faruq',
      transactionCode: 'TRX/20261105/9A2F41',
      amountPaid: 500000,
      paymentMethod: 'QRIS' as any,
      paymentStatus: 'SUCCESS' as any,
      receiptNumber: 'REC/202611/0001',
      paidAt: '2026-11-05T08:30:00Z',
      createdAt: '2026-11-05T08:30:00Z',
    },
    {
      id: 'pay-02',
      tenantId: 't-1',
      invoiceId: 'inv-02',
      invoiceNumber: 'INV/202610/0014',
      studentName: 'Fathimah Azzahra',
      transactionCode: 'TRX/20261025/11B7C3',
      amountPaid: 1500000,
      paymentMethod: 'VIRTUAL_ACCOUNT' as any,
      paymentStatus: 'SUCCESS' as any,
      receiptNumber: 'REC/202610/0048',
      paidAt: '2026-10-25T14:15:00Z',
      createdAt: '2026-10-25T14:15:00Z',
    },
  ]);

  // Mock Cash Accounts
  const [cashAccounts] = useState<CashAccountResponseData[]>([
    {
      id: 'acc-1',
      tenantId: 't-1',
      accountName: 'Kasir Utama Bendahara',
      accountNumber: 'CASH-01',
      bankName: 'Kas Tunai',
      currentBalance: 14200000,
      isActive: true,
    },
    {
      id: 'acc-2',
      tenantId: 't-1',
      accountName: 'Bank Syariah Indonesia (BSI) Operasional',
      accountNumber: '7144829103',
      bankName: 'BSI',
      currentBalance: 18500000,
      isActive: true,
    },
    {
      id: 'acc-3',
      tenantId: 't-1',
      accountName: 'Bank BRI Rekening Pembangunan',
      accountNumber: '034101002345509',
      bankName: 'BRI',
      currentBalance: 3800000,
      isActive: true,
    },
  ]);

  // Mock Journal Entries
  const [journals, setJournals] = useState<JournalEntryResponseData[]>([
    {
      id: 'jrn-01',
      tenantId: 't-1',
      entryDate: '2026-11-05',
      referenceNo: 'JRN/TRX/20261105/9A2F41',
      description: 'Penerimaan Pembayaran SPP via QRIS - Ahmad Faiz',
      totalDebit: 500000,
      totalCredit: 500000,
      lines: [
        { id: 'jl-1', journalEntryId: 'jrn-01', cashAccountId: 'acc-2', accountName: 'Bank BSI Operasional', lineType: 'DEBIT' as any, amount: 500000, notes: 'Kas masuk BSI QRIS' },
        { id: 'jl-2', journalEntryId: 'jrn-01', cashAccountId: 'acc-1', accountName: 'Pendapatan SPP', lineType: 'CREDIT' as any, amount: 500000, notes: 'Pengakuan pendapatan' },
      ],
      createdAt: '2026-11-05T08:30:00Z',
    },
    {
      id: 'jrn-02',
      tenantId: 't-1',
      entryDate: '2026-10-25',
      referenceNo: 'JRN/TRX/20261025/11B7C3',
      description: 'Cicilan 1 Uang Pangkal Gedung - Fathimah Azzahra',
      totalDebit: 1500000,
      totalCredit: 1500000,
      lines: [
        { id: 'jl-3', journalEntryId: 'jrn-02', cashAccountId: 'acc-2', accountName: 'Bank BSI Operasional', lineType: 'DEBIT' as any, amount: 1500000, notes: 'Transfer VA Masuk' },
        { id: 'jl-4', journalEntryId: 'jrn-02', cashAccountId: 'acc-3', accountName: 'Pendapatan Gedung', lineType: 'CREDIT' as any, amount: 1500000, notes: 'Pos pembangunan' },
      ],
      createdAt: '2026-10-25T14:15:00Z',
    },
  ]);

  // Handle Payment Submission
  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice || payAmount <= 0) return;

    const receiptNum = `REC/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${String(payments.length + 1).padStart(4, '0')}`;
    const trxCode = `TRX/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newPayment: PaymentResponseData = {
      id: `pay-${Date.now()}`,
      tenantId: 't-1',
      invoiceId: selectedInvoice.id,
      invoiceNumber: selectedInvoice.invoiceNumber,
      studentName: selectedInvoice.studentName,
      transactionCode: trxCode,
      amountPaid: payAmount,
      paymentMethod: payMethod as any,
      paymentStatus: 'SUCCESS' as any,
      receiptNumber: receiptNum,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const newPaidAmount = selectedInvoice.paidAmount + payAmount;
    const newRemaining = Math.max(0, selectedInvoice.totalAmount - newPaidAmount);
    const newStatus = newRemaining === 0 ? ('PAID' as any) : ('PARTIALLY_PAID' as any);

    // Update state
    setInvoices(
      invoices.map((inv) =>
        inv.id === selectedInvoice.id
          ? {
              ...inv,
              paidAmount: newPaidAmount,
              remainingAmount: newRemaining,
              status: newStatus,
            }
          : inv
      )
    );

    setPayments([newPayment, ...payments]);

    // Automatic journal entry
    const newJournal: JournalEntryResponseData = {
      id: `jrn-${Date.now()}`,
      tenantId: 't-1',
      entryDate: new Date().toISOString().split('T')[0],
      referenceNo: `JRN/${trxCode}`,
      description: `Penerimaan ${selectedInvoice.title} (${payMethod})`,
      totalDebit: payAmount,
      totalCredit: payAmount,
      lines: [
        {
          id: `jl-a-${Date.now()}`,
          journalEntryId: `jrn-${Date.now()}`,
          cashAccountId: selectedCashAccount,
          accountName: cashAccounts.find((a) => a.id === selectedCashAccount)?.accountName || 'Kas',
          lineType: 'DEBIT' as any,
          amount: payAmount,
          notes: 'Penerimaan masuk',
        },
        {
          id: `jl-b-${Date.now()}`,
          journalEntryId: `jrn-${Date.now()}`,
          cashAccountId: 'acc-rev',
          accountName: selectedInvoice.billingCategoryName || 'Pendapatan',
          lineType: 'CREDIT' as any,
          amount: payAmount,
          notes: 'Pendapatan pendidikan',
        },
      ],
      createdAt: new Date().toISOString(),
    };
    setJournals([newJournal, ...journals]);

    // Update Summary
    setSummary((prev) => ({
      ...prev,
      totalCollected: prev.totalCollected + payAmount,
      totalOutstanding: Math.max(0, prev.totalOutstanding - payAmount),
      totalCashBalance: prev.totalCashBalance + payAmount,
    }));

    // Generate Digital Receipt
    const receipt: DigitalReceiptDto = {
      receiptNumber: receiptNum,
      transactionCode: trxCode,
      invoiceNumber: selectedInvoice.invoiceNumber,
      invoiceTitle: selectedInvoice.title,
      studentName: selectedInvoice.studentName || 'Santri',
      studentNis: selectedInvoice.studentNis || '-',
      classGroupName: selectedInvoice.classGroupName,
      amountPaid: payAmount,
      totalInvoiceAmount: selectedInvoice.totalAmount,
      remainingBalance: newRemaining,
      paymentMethod: payMethod as any,
      paidAt: new Date().toISOString(),
      verificationHash: `HMAC_SIG_${Math.random().toString(36).substring(2, 14).toUpperCase()}`,
      tenantName: 'SMA IT & Pondok Pesantren Al-Hikmah Digital',
    };

    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
    setActiveReceipt(receipt);
  };

  // Filtered Invoices
  const filteredInvoices = invoices.filter((inv) => {
    if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
    if (filterCategory !== 'all' && inv.billingCategoryName !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.invoiceNumber.toLowerCase().includes(q);
      const matchName = (inv.studentName || '').toLowerCase().includes(q);
      const matchNis = (inv.studentNis || '').toLowerCase().includes(q);
      if (!matchNum && !matchName && !matchNis) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>💰</span> Manajemen Finansial, SPP & Gateway Pembayaran
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Penagihan berkala SPP, penerimaan kasir, integrasi pembayaran digital (QRIS & Virtual Account), struk digital anti-fraud, dan pencatatan buku kas double-entry.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧾 Faktur & Tagihan
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'payments' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💳 Transaksi Penerimaan
          </button>
          <button
            onClick={() => setActiveTab('accounting')}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'accounting' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📖 Buku Kas & Jurnal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Tagihan Terbit</span>
          <p className="text-xl font-black text-slate-900 mt-1">Rp {summary.totalInvoiced.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-slate-500">{summary.paidInvoicesCount + summary.unpaidInvoicesCount + summary.partiallyPaidCount} Faktur terbit</span>
        </div>
        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Total Diterima (Kas Masuk)</span>
          <p className="text-xl font-black text-emerald-700 mt-1">Rp {summary.totalCollected.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">{summary.collectionRatePercentage}% rasio pelunasan</span>
        </div>
        <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Piutang & Tunggakan</span>
          <p className="text-xl font-black text-rose-700 mt-1">Rp {summary.totalOutstanding.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-rose-600 font-semibold">{summary.overdueInvoicesCount} Faktur lewat jatuh tempo</span>
        </div>
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-200 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Total Saldo Kas & Bank</span>
          <p className="text-xl font-black text-indigo-700 mt-1">Rp {summary.totalCashBalance.toLocaleString('id-ID')}</p>
          <span className="text-[10px] text-indigo-600">3 Rekening terhubung</span>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-sm text-white">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status Gateway</span>
          <p className="text-base font-black text-emerald-400 mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            QRIS & VA AKTIF
          </p>
          <span className="text-[10px] text-slate-400">Verifikasi instan real-time</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* TAB 1: INVOICES & BILLING */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {/* Action Bar & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex flex-1 items-center gap-2 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Nomor Faktur, Nama Santri, atau NIS..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Status</option>
                <option value="UNPAID">Belum Lunas</option>
                <option value="PARTIALLY_PAID">Dicicil (Sebagian)</option>
                <option value="PAID">Lunas</option>
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Semua Kategori</option>
                <option value="SPP Bulanan">SPP Bulanan</option>
                <option value="Uang Pangkal & Pembangunan">Uang Pangkal</option>
                <option value="Kitab & Seragam Pesantren">Kitab & Seragam</option>
              </select>

              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <span>⚡</span> Generate SPP Massal
              </button>

              <button
                onClick={() => setIsNewInvoiceModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                + Buat Tagihan Baru
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">No. Faktur</th>
                    <th className="py-3 px-4">Santri</th>
                    <th className="py-3 px-4">Deskripsi Tagihan</th>
                    <th className="py-3 px-4">Total Biaya</th>
                    <th className="py-3 px-4">Sudah Dibayar</th>
                    <th className="py-3 px-4">Sisa Tagihan</th>
                    <th className="py-3 px-4">Jatuh Tempo</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{inv.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIS: {inv.studentNis} • {inv.classGroupName}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{inv.title}</div>
                        <span className="text-[10px] text-slate-400">{inv.billingCategoryName}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        Rp {inv.totalAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-emerald-600 font-medium">
                        Rp {inv.paidAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        Rp {inv.remainingAmount.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{inv.dueDate}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {inv.status === 'PAID' ? 'LUNAS' : inv.status === 'PARTIALLY_PAID' ? 'CICILAN' : 'BELUM LUNAS'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {inv.status !== 'PAID' ? (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setPayAmount(inv.remainingAmount);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-semibold shadow-sm transition-colors"
                          >
                            Bayar / Kasir
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setActiveReceipt({
                                receiptNumber: `REC-${inv.invoiceNumber.replace('INV/', '')}`,
                                transactionCode: `TRX-${inv.invoiceNumber.replace('INV/', '')}`,
                                invoiceNumber: inv.invoiceNumber,
                                invoiceTitle: inv.title,
                                studentName: inv.studentName || 'Santri',
                                studentNis: inv.studentNis || '-',
                                classGroupName: inv.classGroupName,
                                amountPaid: inv.totalAmount,
                                totalInvoiceAmount: inv.totalAmount,
                                remainingBalance: 0,
                                paymentMethod: 'BANK_TRANSFER' as any,
                                paidAt: inv.updatedAt,
                                verificationHash: `VERIFIED_${inv.id.substring(0, 12).toUpperCase()}`,
                                tenantName: 'SMA IT & Pondok Pesantren Al-Hikmah Digital',
                              });
                            }}
                            className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md text-[11px] font-medium border border-slate-200 transition-colors"
                          >
                            Kuitansi
                          </button>
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

      {/* --------------------------------------------------------------------- */}
      {/* TAB 2: PAYMENTS & GATEWAY */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Catatan Penerimaan Pembayaran & Gateway</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail pembayaran masuk via QRIS otomatis, Virtual Account antarbank, atau setoran tunai kasir bendahara.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">No. Kuitansi</th>
                  <th className="py-3 px-4">Kode Transaksi</th>
                  <th className="py-3 px-4">Santri</th>
                  <th className="py-3 px-4">No. Faktur</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4">Jumlah Diterima</th>
                  <th className="py-3 px-4">Waktu Pembayaran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Kuitansi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">{p.receiptNumber || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{p.transactionCode}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.studentName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.invoiceNumber}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {p.paymentMethod === 'QRIS' ? '📱 QRIS Instan' : p.paymentMethod === 'VIRTUAL_ACCOUNT' ? '🏦 Virtual Account' : '💵 Tunai'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      Rp {p.amountPaid.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {new Date(p.paidAt).toLocaleDateString('id-ID')} {new Date(p.paidAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {p.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setActiveReceipt({
                            receiptNumber: p.receiptNumber || 'REC-DEMO',
                            transactionCode: p.transactionCode,
                            invoiceNumber: p.invoiceNumber || '-',
                            invoiceTitle: 'Pembayaran Pendidikan Terverifikasi',
                            studentName: p.studentName || 'Santri',
                            studentNis: '2026001',
                            amountPaid: p.amountPaid,
                            totalInvoiceAmount: p.amountPaid,
                            remainingBalance: 0,
                            paymentMethod: p.paymentMethod,
                            paidAt: p.paidAt,
                            verificationHash: `DIGITAL_VERIFY_${p.transactionCode.replace(/\//g, '')}`,
                            tenantName: 'SMA IT & Pondok Pesantren Al-Hikmah Digital',
                          });
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md text-[11px] font-medium border border-slate-200 transition-colors"
                      >
                        Buka Struk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* TAB 3: ACCOUNTING & CASH LEDGERS */}
      {/* --------------------------------------------------------------------- */}
      {activeTab === 'accounting' && (
        <div className="space-y-6">
          {/* Cash Accounts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {cashAccounts.map((acc) => (
              <div key={acc.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{acc.bankName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Aktif
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{acc.accountName}</h3>
                <p className="text-[11px] text-slate-400 font-mono">No. Rek: {acc.accountNumber || 'Kas Fisik Bendahara'}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">Saldo Berjalan:</span>
                  <span className="text-base font-black text-slate-900">Rp {acc.currentBalance.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Journal Entries Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Jurnal Umum & Double-Entry Bookkeeping</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Setiap pembayaran yang diterima otomatis membukukan entri Debit ke akun Kas/Bank dan entri Credit ke akun Pendapatan.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">No. Referensi Jurnal</th>
                    <th className="py-3 px-4">Uraian / Deskripsi Transaksi</th>
                    <th className="py-3 px-4">Pos Akun & Mutasi</th>
                    <th className="py-3 px-4 text-right">Debit</th>
                    <th className="py-3 px-4 text-right">Credit</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {journals.map((j) => (
                    <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{j.entryDate}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{j.referenceNo}</td>
                      <td className="py-3 px-4 font-medium text-slate-900">{j.description}</td>
                      <td className="py-3 px-4 space-y-1">
                        {j.lines.map((l) => (
                          <div key={l.id} className="text-[11px]">
                            <span className="font-semibold text-slate-800">{l.accountName}</span> ({l.lineType})
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-700">
                        Rp {j.totalDebit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                        Rp {j.totalCredit.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          SEIMBANG
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: PAYMENT MODAL */}
      {/* --------------------------------------------------------------------- */}
      {isPaymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Catat Penerimaan Pembayaran</h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>No. Faktur: <strong className="text-slate-900">{selectedInvoice.invoiceNumber}</strong></p>
              <p>Santri: <strong className="text-slate-900">{selectedInvoice.studentName}</strong> ({selectedInvoice.studentNis})</p>
              <p>Judul: <strong className="text-slate-900">{selectedInvoice.title}</strong></p>
              <p>Sisa Tagihan: <strong className="text-emerald-700 font-mono text-sm">Rp {selectedInvoice.remainingAmount.toLocaleString('id-ID')}</strong></p>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal Pembayaran (Bisa Dicicil)</label>
                <input
                  type="number"
                  value={payAmount}
                  max={selectedInvoice.remainingAmount}
                  min={1000}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Metode Pembayaran</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="CASH">Kas Tunai (Kasir Bendahara)</option>
                  <option value="QRIS">QRIS Nasional Instan</option>
                  <option value="VIRTUAL_ACCOUNT">Virtual Account (BSI / Mandiri / BRI)</option>
                  <option value="BANK_TRANSFER">Transfer Bank Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rekening Kas Tujuan (Jurnal Otomatis)</label>
                <select
                  value={selectedCashAccount}
                  onChange={(e) => setSelectedCashAccount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {cashAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.accountName} ({a.bankName})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Konfirmasi Pembayaran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: BATCH SPP GENERATOR */}
      {/* --------------------------------------------------------------------- */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Generate Tagihan SPP Massal</h3>
              <button onClick={() => setIsBatchModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Sistem akan secara idempoten menerbitkan faktur tagihan berkala untuk seluruh santri aktif pada rombel yang dipilih.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Faktur</label>
                <input
                  type="text"
                  value={batchTitle}
                  onChange={(e) => setBatchTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rombel Sasaran</label>
                <select
                  value={batchClassGroup}
                  onChange={(e) => setBatchClassGroup(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="10 MIPA 1">10 MIPA 1 (SMA IT)</option>
                  <option value="Ula A - Kitab Kuning">Ula A - Kitab Kuning (Pesantren)</option>
                  <option value="all">Semua Rombel Terdaftar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal per Santri (Rp)</label>
                <input
                  type="number"
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batas Jatuh Tempo</label>
                <input
                  type="date"
                  value={batchDueDate}
                  onChange={(e) => setBatchDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  alert(`Berhasil membuat tagihan massal untuk rombel ${batchClassGroup}!`);
                  setIsBatchModalOpen(false);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Terbitkan Tagihan Massal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: SINGLE NEW INVOICE */}
      {/* --------------------------------------------------------------------- */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Buat Faktur Tagihan Baru</h3>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <p className="text-xs text-slate-500">Penerbitan tagihan individual santri untuk biaya non-rutin.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Judul Tagihan</label>
                <input
                  type="text"
                  placeholder="Misal: Biaya Remedial / Ujian Susulan"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="300000"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Terbitkan Faktur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* MODAL: DIGITAL RECEIPT VIEWER */}
      {/* --------------------------------------------------------------------- */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 space-y-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header Kuitansi */}
            <div className="flex items-start justify-between border-b border-dashed border-slate-300 pb-4">
              <div>
                <span className="text-xs font-black tracking-wider text-emerald-700 uppercase">Kuitansi Pembayaran Sah</span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{activeReceipt.tenantName}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">No: {activeReceipt.receiptNumber}</p>
              </div>
              <button onClick={() => setActiveReceipt(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            {/* Rincian Pembayaran */}
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Telah Diterima Dari</span>
                <span className="font-bold text-slate-900">{activeReceipt.studentName} ({activeReceipt.studentNis})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Rombel / Kelas</span>
                <span className="font-semibold text-slate-900">{activeReceipt.classGroupName || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Untuk Pembayaran</span>
                <span className="font-semibold text-slate-900">{activeReceipt.invoiceTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Metode Pembayaran</span>
                <span className="font-semibold text-emerald-700">{activeReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Kode Transaksi</span>
                <span className="font-mono text-slate-600">{activeReceipt.transactionCode}</span>
              </div>
              <div className="flex justify-between py-2 bg-emerald-50 px-3 rounded-lg mt-2">
                <span className="font-bold text-emerald-900 text-sm">Jumlah Pembayaran</span>
                <span className="font-black text-emerald-900 text-sm">Rp {activeReceipt.amountPaid.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-500 text-[11px]">
                <span>Sisa Saldo Tagihan</span>
                <span className="font-bold text-slate-700">Rp {activeReceipt.remainingBalance.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Watermark & Anti-Fraud Security Hash */}
            <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <div className="truncate max-w-xs">
                Digital Hash: {activeReceipt.verificationHash}
              </div>
              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-slate-900 text-white rounded-md text-[11px] font-semibold hover:bg-slate-800 transition-colors"
              >
                🖨️ Cetak PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
