import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { FloatingBottomNav, TabType } from './components/FloatingBottomNav';
import { DashboardView } from './components/DashboardView';
import { MembersView } from './components/MembersView';
import { TransactView } from './components/TransactView';
import { BatchSendModal } from './components/BatchSendModal';
import { WhatsAppGateway } from './components/WhatsAppGateway';
import { Member, Transaction, WhatsAppStatus, BatchSendResult, TransactionType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<WhatsAppStatus>({
    status: 'DISCONNECTED',
  });
  const [batchLogs, setBatchLogs] = useState<BatchSendResult[]>([]);
  const [selectedMemberForTransact, setSelectedMemberForTransact] = useState<string | undefined>(undefined);

  // Gateway authentication state
  const [isAuthenticatedGateway, setIsAuthenticatedGateway] = useState<boolean>(false);

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data from server APIs
  const fetchAllData = async () => {
    try {
      const [membersRes, txRes, waRes, logsRes] = await Promise.all([
        fetch('/api/members').then((r) => r.json()),
        fetch('/api/transactions').then((r) => r.json()),
        fetch('/api/whatsapp/status').then((r) => r.json()),
        fetch('/api/whatsapp/logs').then((r) => r.json()),
      ]);

      if (Array.isArray(membersRes)) setMembers(membersRes);
      if (Array.isArray(txRes)) setTransactions(txRes);
      if (waRes && waRes.status) {
        setWhatsappStatus(waRes);
        if (waRes.status === 'CONNECTED') {
          setIsAuthenticatedGateway(true);
        }
      }
      if (Array.isArray(logsRes)) setBatchLogs(logsRes);
    } catch (err) {
      console.error('Error connecting to backend APIs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // WhatsApp Handlers
  const handleConnectWhatsApp = async () => {
    try {
      const res = await fetch('/api/whatsapp/connect', { method: 'POST' });
      const data = await res.json();
      setWhatsappStatus(data);
    } catch (err) {
      console.error('Failed to initiate WhatsApp connection:', err);
    }
  };

  const handleConfirmPair = async (phone = '+27 82 910 8820') => {
    try {
      const res = await fetch('/api/whatsapp/pair-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone }),
      });
      const data = await res.json();
      setWhatsappStatus(data);
      if (data.status === 'CONNECTED') {
        setIsAuthenticatedGateway(true);
      }
    } catch (err) {
      console.error('Failed to pair WhatsApp:', err);
    }
  };

  const handleRequestPairingCode = async (phone: string) => {
    try {
      const res = await fetch('/api/whatsapp/request-pairing-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      setWhatsappStatus(data);
      return data;
    } catch (err) {
      console.error('Failed to request pairing code:', err);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      const res = await fetch('/api/whatsapp/disconnect', { method: 'POST' });
      const data = await res.json();
      setWhatsappStatus(data);
      setIsAuthenticatedGateway(false);
    } catch (err) {
      console.error('Failed to disconnect WhatsApp:', err);
    }
  };

  // Member CRUD Handlers
  const handleAddMember = async (memberData: Omit<Member, 'id' | 'joined_date'>) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to add member:', err);
    }
  };

  const handleEditMember = async (id: string, memberData: Partial<Member>) => {
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memberData),
      });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to edit member:', err);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAllData();
      }
    } catch (err) {
      console.error('Failed to delete member:', err);
    }
  };

  // Transaction Handler
  const handleSubmitTransaction = async (data: {
    member_id: string;
    type: TransactionType;
    amount: number;
    note?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await fetchAllData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to record transaction:', err);
      return false;
    }
  };

  // Batch Send WhatsApp Handler
  const handleConfirmSendBatch = async (): Promise<BatchSendResult | null> => {
    try {
      const res = await fetch('/api/whatsapp/send-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const body = await res.json();
        await fetchAllData();
        return body.batchResult;
      }
      return null;
    } catch (err) {
      console.error('Failed to dispatch batch WhatsApp statements:', err);
      return null;
    }
  };

  const handleNavigateToTransact = (memberId?: string) => {
    if (memberId) {
      setSelectedMemberForTransact(memberId);
    }
    setActiveTab('transact');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">Initializing God-First Admin Portal...</p>
      </div>
    );
  }

  // Render WhatsApp Session Integration as initial page before redirecting to dashboard
  if (!isAuthenticatedGateway) {
    return (
      <WhatsAppGateway
        whatsappStatus={whatsappStatus}
        onConnectWhatsApp={handleConnectWhatsApp}
        onConfirmPair={handleConfirmPair}
        onRequestPairingCode={handleRequestPairingCode}
        onAuthenticateAndProceed={() => setIsAuthenticatedGateway(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-slate-900 font-sans selection:bg-amber-200">
      {/* iOS Header */}
      <Header
        whatsappStatus={whatsappStatus}
        onRefreshStatus={fetchAllData}
        onOpenWhatsAppCard={() => setIsAuthenticatedGateway(false)}
      />

      {/* Main View Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-28 sm:pb-32">
        {activeTab === 'dashboard' && (
          <DashboardView
            members={members}
            transactions={transactions}
            whatsappStatus={whatsappStatus}
            batchLogs={batchLogs}
            onConnectWhatsApp={handleConnectWhatsApp}
            onConfirmPair={handleConfirmPair}
            onDisconnectWhatsApp={handleDisconnectWhatsApp}
            onOpenBatchModal={() => setIsBatchModalOpen(true)}
            onNavigateToTransact={handleNavigateToTransact}
          />
        )}

        {activeTab === 'members' && (
          <MembersView
            members={members}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onNavigateToTransact={handleNavigateToTransact}
          />
        )}

        {activeTab === 'transact' && (
          <TransactView
            members={members}
            initialMemberId={selectedMemberForTransact}
            onSubmitTransaction={handleSubmitTransaction}
          />
        )}
      </main>

      {/* Floating Bottom Pill Bar */}
      <FloatingBottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Batch Send WhatsApp Modal */}
      <BatchSendModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        members={members}
        whatsappStatus={whatsappStatus}
        onConfirmSendBatch={handleConfirmSendBatch}
      />
    </div>
  );
}
