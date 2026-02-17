import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { getAllTeachers, updateTeacher, deleteTeacher, getAuditLog, getTeacherWalletHistory, updateTeacherWallet } from '../services/api';
import { FaEdit, FaTrash, FaHistory, FaEye } from 'react-icons/fa';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [modalType, setModalType] = useState(null); // 'update', 'preview', 'audit', 'wallet'
  const [auditData, setAuditData] = useState([]);
  const [formData, setFormData] = useState({});
  const [walletData, setWalletData] = useState(null);
  const [walletEarnings, setWalletEarnings] = useState([]);
  const [walletWithdrawals, setWalletWithdrawals] = useState([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletForm, setWalletForm] = useState({ total_balance: '', available_balance: '' });

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const data = await getAllTeachers();
      setTeachers(data);
    } catch (error) {
      console.error('Error loading teachers:', error);
      alert('Failed to load teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      full_name: teacher.profile?.full_name || '',
      email: teacher.profile?.email || '',
      specializations: teacher.specializations || '',
      price_per_call: teacher.price_per_call || '',
      bio: teacher.bio || '',
      experience_years: teacher.experience_years || '',
    });
    setModalType('update');
  };

  const handlePreview = (teacher) => {
    setSelectedTeacher(teacher);
    setModalType('preview');
  };

  const handleAudit = async (teacher) => {
    try {
      setSelectedTeacher(teacher);
      setModalType('audit');
      const auditLog = await getAuditLog(teacher.id, 'teacher');
      setAuditData(auditLog);
    } catch (error) {
      console.error('Error loading audit log:', error);
      alert('Failed to load audit log.');
    }
  };

  const handleDelete = async (teacher) => {
    if (!window.confirm(`Are you sure you want to delete ${teacher.profile?.full_name || 'this teacher'}?`)) {
      return;
    }

    try {
      await deleteTeacher(teacher.id);
      alert('Teacher deleted successfully!');
      loadTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Failed to delete teacher. Please try again.');
    }
  };

  const handleOpenWallet = async (teacher) => {
    setSelectedTeacher(teacher);
    setModalType('wallet');
    setWalletData(null);
    setWalletEarnings([]);
    setWalletWithdrawals([]);
    setWalletForm({ total_balance: '', available_balance: '' });
    try {
      setWalletLoading(true);
      const { wallet, earnings, withdrawals } = await getTeacherWalletHistory(teacher.id);
      setWalletData(wallet);
      setWalletEarnings(earnings);
      setWalletWithdrawals(withdrawals);
      setWalletForm({
        total_balance: String(wallet.total_balance ?? 0),
        available_balance: String(wallet.available_balance ?? 0),
      });
    } catch (error) {
      console.error('Error loading wallet:', error);
      alert(error.message || 'Failed to load wallet.');
    } finally {
      setWalletLoading(false);
    }
  };

  const handleSaveWallet = async () => {
    if (!selectedTeacher) return;
    const total_balance = parseFloat(walletForm.total_balance) || 0;
    const available_balance = parseFloat(walletForm.available_balance) || 0;
    try {
      await updateTeacherWallet(selectedTeacher.id, { total_balance, available_balance });
      alert('Wallet updated successfully!');
      setWalletData(prev => (prev ? { ...prev, total_balance, available_balance } : { total_balance, available_balance }));
      setWalletForm({ total_balance: String(total_balance), available_balance: String(available_balance) });
    } catch (error) {
      console.error('Error updating wallet:', error);
      alert(error.message || 'Failed to update wallet.');
    }
  };

  const handleSaveUpdate = async () => {
    try {
      await updateTeacher(selectedTeacher.id, {
        profile: {
          full_name: formData.full_name,
        },
        teacherProfile: {
          specializations: formData.specializations,
          price_per_call: parseFloat(formData.price_per_call) || 0,
          bio: formData.bio,
          experience_years: parseInt(formData.experience_years) || 0,
        },
      });
      alert('Teacher updated successfully!');
      setModalType(null);
      loadTeachers();
    } catch (error) {
      console.error('Error updating teacher:', error);
      alert('Failed to update teacher. Please try again.');
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: (row) => row.profile?.full_name || 'N/A',
    },
    {
      header: 'Email',
      accessor: (row) => row.profile?.email || 'N/A',
    },
    {
      header: 'Specializations',
      accessor: (row) => row.specializations || 'N/A',
    },
    {
      header: 'Price/Call',
      accessor: (row) => `₹${row.price_per_call || 0}`,
    },
    {
      header: 'Experience',
      accessor: (row) => `${row.experience_years || 0} years`,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.profile?.email_verified
            ? 'bg-[#34D399]/20 text-[#34D399]'
            : 'bg-amber-500/20 text-amber-400'
        }`}>
          {row.profile?.email_verified ? 'Verified' : 'Pending'}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-6">
          <h1 className="text-responsive-title font-bold text-white">Teachers</h1>
          <button
            type="button"
            onClick={loadTeachers}
            className="px-4 py-2.5 bg-[#5568FE] text-white rounded-lg font-medium shrink-0 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-lg hover:shadow-[#5568FE]/30 active:translate-y-0 active:scale-[0.98]"
          >
            Refresh
          </button>
        </div>

        <DataTable
          data={teachers}
          columns={columns}
          loading={loading}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onAudit={handleAudit}
          onPreview={handlePreview}
          onWallet={handleOpenWallet}
        />

        {/* Update Modal */}
        <Modal
          isOpen={modalType === 'update'}
          onClose={() => setModalType(null)}
          title="Update Teacher"
          size="md"
        >
          {selectedTeacher && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Specializations</label>
                <input
                  type="text"
                  value={formData.specializations}
                  onChange={(e) => setFormData({ ...formData, specializations: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Price per Call (₹)</label>
                <input
                  type="number"
                  value={formData.price_per_call}
                  onChange={(e) => setFormData({ ...formData, price_per_call: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Experience (Years)</label>
                <input
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Bio</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 border border-[#2D3748] rounded-lg text-[#9CA3AF] hover:bg-[#2D3748] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveUpdate}
                  className="px-4 py-2 bg-[#5568FE] text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Preview Modal */}
        <Modal
          isOpen={modalType === 'preview'}
          onClose={() => setModalType(null)}
          title="Teacher Preview"
          size="md"
        >
          {selectedTeacher && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Name</p>
                  <p className="text-base text-white">{selectedTeacher.profile?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Email</p>
                  <p className="text-base text-white break-all">{selectedTeacher.profile?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Specializations</p>
                  <p className="text-base text-white">{selectedTeacher.specializations || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Price per Call</p>
                  <p className="text-base text-white">₹{selectedTeacher.price_per_call || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Experience</p>
                  <p className="text-base text-white">{selectedTeacher.experience_years || 0} years</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Status</p>
                  <p className="text-base text-white">
                    {selectedTeacher.profile?.email_verified ? 'Verified' : 'Pending'}
                  </p>
                </div>
              </div>
              {selectedTeacher.bio && (
                <div>
                  <p className="text-sm font-medium text-[#9CA3AF]">Bio</p>
                  <p className="text-base text-white">{selectedTeacher.bio}</p>
                </div>
              )}
            </div>
          )}
        </Modal>

        {/* Wallet Modal */}
        <Modal
          isOpen={modalType === 'wallet'}
          onClose={() => setModalType(null)}
          title={`Wallet - ${selectedTeacher?.profile?.full_name || 'Teacher'}`}
          size="lg"
        >
          {selectedTeacher && (
            <div className="space-y-4">
              {walletLoading ? (
                <p className="text-center text-[#9CA3AF] py-4">Loading wallet...</p>
              ) : (
                <>
                  {walletData && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-[#1C1F4A] rounded-lg">
                      <div>
                        <p className="text-xs font-medium text-[#9CA3AF]">Total balance (₹)</p>
                        <p className="text-lg font-semibold text-white">₹{Number(walletData.total_balance ?? 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[#9CA3AF]">Available balance (₹)</p>
                        <p className="text-lg font-semibold text-white">₹{Number(walletData.available_balance ?? 0).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Total balance (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={walletForm.total_balance}
                        onChange={(e) => setWalletForm({ ...walletForm, total_balance: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#9CA3AF] mb-1">Available balance (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={walletForm.available_balance}
                        onChange={(e) => setWalletForm({ ...walletForm, available_balance: e.target.value })}
                        className="w-full px-3 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
                      />
                    </div>
                  </div>

                  {/* Wallet history: Earnings + Withdrawals */}
                  <div className="border-t border-[#2D3748] pt-4 space-y-4">
                    <p className="text-sm font-medium text-[#9CA3AF]">Wallet history</p>
                    <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-[#5568FE] mb-2 uppercase">Earnings (credits)</p>
                        {walletEarnings.length === 0 ? (
                          <p className="text-sm text-[#9CA3AF]">No earnings yet</p>
                        ) : (
                          <table className="min-w-full divide-y divide-[#2D3748] text-sm">
                            <thead className="bg-[#0B0D2A] sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase">Date</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-[#9CA3AF] uppercase">Amount</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2D3748]">
                              {walletEarnings.map((e) => (
                                <tr key={e.id}>
                                  <td className="px-2 py-2 text-white whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                                  <td className="px-2 py-2 text-right text-[#34D399]">+₹{Number(e.teacher_earn ?? 0).toLocaleString()}</td>
                                  <td className="px-2 py-2">
                                    <span className="px-2 py-0.5 rounded text-xs bg-[#34D399]/20 text-[#34D399]">{e.status || '—'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-amber-400 mb-2 uppercase">Withdrawals</p>
                        {walletWithdrawals.length === 0 ? (
                          <p className="text-sm text-[#9CA3AF]">No withdrawals yet</p>
                        ) : (
                          <table className="min-w-full divide-y divide-[#2D3748] text-sm">
                            <thead className="bg-[#0B0D2A] sticky top-0">
                              <tr>
                                <th className="px-2 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase">Date</th>
                                <th className="px-2 py-2 text-right text-xs font-medium text-[#9CA3AF] uppercase">Amount</th>
                                <th className="px-2 py-2 text-left text-xs font-medium text-[#9CA3AF] uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2D3748]">
                              {walletWithdrawals.map((w) => (
                                <tr key={w.id}>
                                  <td className="px-2 py-2 text-white whitespace-nowrap">{new Date(w.requested_at || w.created_at).toLocaleString()}</td>
                                  <td className="px-2 py-2 text-right text-amber-400">−₹{Number(w.amount ?? 0).toLocaleString()}</td>
                                  <td className="px-2 py-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${
                                      w.status === 'processing' ? 'bg-[#5568FE]/20 text-[#5568FE]' :
                                      w.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                      'bg-[#9CA3AF]/20 text-[#9CA3AF]'
                                    }`}>{w.status || '—'}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-[#2D3748]">
                    <button
                      type="button"
                      onClick={() => setModalType(null)}
                      className="px-4 py-2 border border-[#2D3748] rounded-lg text-[#9CA3AF] hover:bg-[#2D3748] transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveWallet}
                      disabled={walletLoading}
                      className="px-4 py-2 bg-[#5568FE] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                    >
                      Save wallet
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>

        {/* Audit Modal */}
        <Modal
          isOpen={modalType === 'audit'}
          onClose={() => setModalType(null)}
          title={`Audit Log - ${selectedTeacher?.profile?.full_name || 'Teacher'}`}
          size="lg"
        >
          <div className="max-h-96 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            {auditData.length === 0 ? (
              <p className="text-center text-[#9CA3AF] py-8">No audit data available</p>
            ) : (
              <table className="min-w-full divide-y divide-[#2D3748]">
                <thead className="bg-[#0B0D2A] sticky top-0">
                  <tr>
                    <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-[#9CA3AF] uppercase">Date</th>
                    <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-[#9CA3AF] uppercase">Subject</th>
                    <th className="px-3 py-3 sm:px-4 text-left text-xs font-medium text-[#9CA3AF] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D3748]">
                  {auditData.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-3 sm:px-4 text-sm text-white whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                      <td className="px-3 py-3 sm:px-4 text-sm text-white">{item.subject || 'N/A'}</td>
                      <td className="px-3 py-3 sm:px-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.status === 'completed' ? 'bg-[#34D399]/20 text-[#34D399]' :
                          item.status === 'confirmed' ? 'bg-[#5568FE]/20 text-[#5568FE]' :
                          item.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-[#F87171]/20 text-[#F87171]'
                        }`}>
                          {item.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Teachers;
