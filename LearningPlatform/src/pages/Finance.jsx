import { useEffect, useState } from 'react';
import {
  FaMoneyBillWave,
  FaChartLine,
  FaEye,
  FaEyeSlash,
  FaCheckCircle,
  FaRupeeSign,
} from 'react-icons/fa';
import {
  getAdminWithdrawals,
  getAdminWithdrawalDetail,
  getAdminWithdrawalReveal,
  approveAdminWithdrawal,
  getAdminAnalytics,
  getAllTeachers,
  getAdminCharges,
  setAdminCharges,
} from '../services/api';
import { supabase } from '../config/supabase';

const TAB_CHARGES = 'charges';
const TAB_PAYMENTS = 'payments';
const TAB_ANALYTICS = 'analytics';

const Finance = () => {
  const [activeTab, setActiveTab] = useState(TAB_PAYMENTS);
  const [withdrawals, setWithdrawals] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Detail modal (same as mobile admin)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestDetail, setRequestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [revealedAccount, setRevealedAccount] = useState(null);
  const [approving, setApproving] = useState(false);

  // Charges tab
  const [teachers, setTeachers] = useState([]);
  const [chargesLoading, setChargesLoading] = useState(false);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [baseCharge, setBaseCharge] = useState('600');
  const [adminCharge, setAdminCharge] = useState('150');
  const [savingCharge, setSavingCharge] = useState(false);

  const loadWithdrawals = async () => {
    try {
      setWithdrawalsLoading(true);
      const data = await getAdminWithdrawals();
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const data = await getAdminAnalytics();
      setAnalytics(data);
    } catch (e) {
      console.error(e);
      setAnalytics(null);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  useEffect(() => {
    if (activeTab === TAB_ANALYTICS) loadAnalytics();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === TAB_CHARGES) loadTeachersForCharges();
  }, [activeTab]);

  const loadTeachersForCharges = async () => {
    try {
      setChargesLoading(true);
      const data = await getAllTeachers();
      setTeachers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setTeachers([]);
    } finally {
      setChargesLoading(false);
    }
  };

  const openChargeModal = async (teacher) => {
    setSelectedTeacher(teacher);
    setBaseCharge(String(teacher.price_per_call ?? 600));
    setAdminCharge('150');
    setChargeModalOpen(true);
    try {
      const charges = await getAdminCharges(teacher.id);
      if (charges) {
        setBaseCharge(String(charges.base_charge_amount ?? teacher.price_per_call ?? 600));
        setAdminCharge(String(charges.admin_charge_amount ?? 150));
      }
    } catch (_) {}
  };

  const closeChargeModal = () => {
    setChargeModalOpen(false);
    setSelectedTeacher(null);
  };

  const handleSaveCharge = async () => {
    if (!selectedTeacher) return;
    const base = parseFloat(baseCharge);
    const admin = parseFloat(adminCharge);
    if (isNaN(base) || isNaN(admin) || base < 0 || admin < 0) {
      alert('Enter valid numbers for base and admin charge.');
      return;
    }
    setSavingCharge(true);
    try {
      await setAdminCharges(selectedTeacher.id, base, admin);
      closeChargeModal();
      await loadTeachersForCharges();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to save charges');
    } finally {
      setSavingCharge(false);
    }
  };

  const openDetail = async (req) => {
    setSelectedRequest(req);
    setDetailModalOpen(true);
    setRequestDetail(null);
    setRevealedAccount(null);
    setDetailLoading(true);
    try {
      const data = await getAdminWithdrawalDetail(req.id);
      setRequestDetail(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetailModalOpen(false);
    setSelectedRequest(null);
    setRequestDetail(null);
    setRevealedAccount(null);
  };

  const toggleReveal = async () => {
    if (revealedAccount) {
      setRevealedAccount(null);
      return;
    }
    if (!selectedRequest?.id) return;
    try {
      const data = await getAdminWithdrawalReveal(selectedRequest.id);
      setRevealedAccount(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async () => {
    if (!requestDetail?.id || !requestDetail?.teacher_id) return;
    if (!window.confirm(`Approve ₹${requestDetail.amount} transfer to ${requestDetail.sender?.full_name || requestDetail.account_holder_name}? The transfer will be initiated after approval.`)) return;
    setApproving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await approveAdminWithdrawal(requestDetail.id, user?.id || null);
      closeDetail();
      await loadWithdrawals();
    } catch (e) {
      console.error(e);
      alert(e.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="min-vh-100 bg-dark text-white py-4">
      <div className="container">
        <h2 className="fw-bold mb-2">Finance</h2>
        <p className="text-secondary mb-4">Payment requests, withdrawals & analytics</p>

        {/* Tabs (same as mobile admin: Charges, Payment Requests, Analytics) */}
        <ul className="nav nav-tabs border-secondary mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === TAB_CHARGES ? 'active bg-dark border-dark text-warning' : 'text-secondary border-secondary'}`}
              onClick={() => setActiveTab(TAB_CHARGES)}
            >
              <FaRupeeSign className="me-2" />
              Charges
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === TAB_PAYMENTS ? 'active bg-dark border-dark text-warning' : 'text-secondary border-secondary'}`}
              onClick={() => setActiveTab(TAB_PAYMENTS)}
            >
              <FaMoneyBillWave className="me-2" />
              Payment requests
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === TAB_ANALYTICS ? 'active bg-dark border-dark text-warning' : 'text-secondary border-secondary'}`}
              onClick={() => setActiveTab(TAB_ANALYTICS)}
            >
              <FaChartLine className="me-2" />
              Analytics
            </button>
          </li>
        </ul>

        {/* Tab: Charges – manage teacher base + admin charge (same as mobile admin) */}
        {activeTab === TAB_CHARGES && (
          <section>
            <p className="text-secondary small mb-3">Set base price and admin charge per teacher. Total (base + admin) is what students pay.</p>
            {chargesLoading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-warning" role="status" />
              </div>
            ) : teachers.length === 0 ? (
              <div className="card bg-secondary bg-opacity-10 border border-secondary">
                <div className="card-body text-center py-5 text-secondary">No teachers found.</div>
              </div>
            ) : (
              <div className="card bg-secondary bg-opacity-10 border border-secondary shadow-lg">
                <div className="card-body p-0">
                  <ul className="list-group list-group-flush list-group-dark">
                    {teachers.map((t) => (
                      <li
                        key={t.id}
                        className="list-group-item bg-transparent border-secondary d-flex justify-content-between align-items-center list-group-item-action"
                        style={{ cursor: 'pointer' }}
                        onClick={() => openChargeModal(t)}
                      >
                        <div>
                          <div className="fw-bold text-white">{t.profile?.full_name || 'Teacher'}</div>
                          <div className="small text-secondary">{t.profile?.email}</div>
                          <div className="small text-warning mt-1">Current: ₹{t.price_per_call ?? 0}/hr</div>
                        </div>
                        <span className="text-secondary">Edit charges →</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Set charge modal */}
            {chargeModalOpen && selectedTeacher && (
              <div className="modal d-block bg-dark bg-opacity-75" tabIndex={-1} onClick={closeChargeModal}>
                <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-content bg-dark border border-secondary">
                    <div className="modal-header border-secondary">
                      <h5 className="modal-title text-white">Set charges</h5>
                      <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeChargeModal} />
                    </div>
                    <div className="modal-body">
                      <p className="text-secondary small mb-3">{selectedTeacher.profile?.full_name}</p>
                      <div className="mb-3">
                        <label className="form-label text-secondary">Teacher rate (base) ₹/hr</label>
                        <input
                          type="number"
                          className="form-control bg-secondary bg-opacity-25 border-secondary text-white"
                          placeholder="600"
                          value={baseCharge}
                          onChange={(e) => setBaseCharge(e.target.value)}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label text-secondary">Admin charge ₹</label>
                        <input
                          type="number"
                          className="form-control bg-secondary bg-opacity-25 border-secondary text-white"
                          placeholder="150"
                          value={adminCharge}
                          onChange={(e) => setAdminCharge(e.target.value)}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="p-2 rounded bg-secondary bg-opacity-25 border border-secondary mb-3">
                        <div className="d-flex justify-content-between small">
                          <span className="text-secondary">Total (student pays)</span>
                          <span className="text-warning fw-bold">₹{(parseFloat(baseCharge) || 0) + (parseFloat(adminCharge) || 0)}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-warning w-100 text-dark"
                        onClick={handleSaveCharge}
                        disabled={savingCharge}
                      >
                        {savingCharge ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : null}
                        Save charges
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab: Payment requests */}
        {activeTab === TAB_PAYMENTS && (
          <section>
            <p className="text-secondary small mb-3">Review teacher redemption requests. Click a row to see full details and approve.</p>
            {withdrawalsLoading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-warning" role="status" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="card bg-secondary bg-opacity-10 border border-secondary">
                <div className="card-body text-center py-5 text-secondary">
                  <FaMoneyBillWave size={48} className="mb-3 opacity-50" />
                  <p className="mb-0">No pending payment requests</p>
                </div>
              </div>
            ) : (
              <div className="card bg-secondary bg-opacity-10 border border-secondary shadow-lg">
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-dark table-hover mb-0">
                      <thead>
                        <tr>
                          <th className="border-secondary">Name</th>
                          <th className="border-secondary">Account</th>
                          <th className="border-secondary">IFSC</th>
                          <th className="border-secondary text-end">Amount</th>
                          <th className="border-secondary">Requested</th>
                          <th className="border-secondary text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((req) => (
                          <tr
                            key={req.id}
                            style={{ cursor: 'pointer' }}
                            onClick={() => openDetail(req)}
                          >
                            <td className="border-secondary">{req.sender?.full_name || req.account_holder_name || '—'}</td>
                            <td className="border-secondary font-monospace">{req.bank_account_number_masked || '******'}</td>
                            <td className="border-secondary">{req.bank_ifsc_code || '—'}</td>
                            <td className="border-secondary text-end text-warning fw-bold">₹{Number(req.amount).toLocaleString()}</td>
                            <td className="border-secondary text-secondary">{req.requested_at ? new Date(req.requested_at).toLocaleString() : '—'}</td>
                            <td className="border-secondary text-center">
                              <span className="badge bg-secondary">View details →</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Tab: Analytics */}
        {activeTab === TAB_ANALYTICS && (
          <section>
            {analyticsLoading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-warning" role="status" />
              </div>
            ) : analytics ? (
              <div className="row g-4">
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-secondary bg-opacity-10 border border-secondary h-100">
                    <div className="card-body">
                      <p className="text-secondary mb-1">Total revenue</p>
                      <h4 className="fw-bold text-white">₹{(analytics.totalRevenue || 0).toLocaleString()}</h4>
                      <small className="text-secondary">{analytics.totalPayments || 0} transactions</small>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="card bg-secondary bg-opacity-10 border border-success h-100">
                    <div className="card-body">
                      <p className="text-secondary mb-1">Pending withdrawals</p>
                      <h4 className="fw-bold text-warning">₹{(analytics.pendingWithdrawals || 0).toLocaleString()}</h4>
                      <small className="text-secondary">Awaiting processing</small>
                    </div>
                  </div>
                </div>
                {Array.isArray(analytics.topTeachers) && analytics.topTeachers.length > 0 && (
                  <div className="col-12">
                    <h6 className="text-white mb-2">Top earning teachers</h6>
                    <div className="card bg-secondary bg-opacity-10 border border-secondary">
                      <div className="card-body p-0">
                        <ul className="list-group list-group-flush list-group-dark">
                          {analytics.topTeachers.slice(0, 10).map((item, idx) => (
                            <li key={idx} className="list-group-item bg-transparent border-secondary d-flex justify-content-between">
                              <span className="text-secondary">#{idx + 1} Teacher {item.teacher_id?.substring(0, 8)}…</span>
                              <span className="text-success fw-bold">₹{(item.teacher_earn || 0).toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card bg-secondary bg-opacity-10 border border-secondary">
                <div className="card-body text-center py-5 text-secondary">No analytics data</div>
              </div>
            )}
          </section>
        )}
      </div>

      {/* Detail modal (same as mobile admin) */}
      {detailModalOpen && (
        <div className="modal d-block bg-dark bg-opacity-75" tabIndex={-1} onClick={closeDetail}>
          <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content bg-dark border border-secondary">
              <div className="modal-header border-secondary d-flex justify-content-between align-items-center">
                <h5 className="modal-title text-white">Payment request details</h5>
                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeDetail} />
              </div>
              <div className="modal-body">
                {detailLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning" role="status" />
                    <p className="text-secondary mt-2">Loading request…</p>
                  </div>
                ) : requestDetail ? (
                  <>
                    <h6 className="text-warning mb-2">Sender info</h6>
                    <div className="card bg-secondary bg-opacity-10 border border-secondary mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary">Name</span>
                          <span className="text-white">{requestDetail.sender?.full_name || requestDetail.account_holder_name || '—'}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-secondary">Email</span>
                          <span className="text-white">{requestDetail.sender?.email || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <h6 className="text-warning mb-2">Balance</h6>
                    <div className="card bg-secondary bg-opacity-10 border border-secondary mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary">Available balance</span>
                          <span className="text-white">₹{Number(requestDetail.available_balance ?? 0).toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-secondary">Total balance</span>
                          <span className="text-white">₹{Number(requestDetail.total_balance ?? 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <h6 className="text-warning mb-2">Account info</h6>
                    <div className="card bg-secondary bg-opacity-10 border border-secondary mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary">Bank name</span>
                          <span className="text-white">{revealedAccount?.bank_name || requestDetail.bank_name || '—'}</span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <span className="text-secondary d-block small">Account number</span>
                            <span className="text-white font-monospace">
                              {revealedAccount ? revealedAccount.bank_account_number : (requestDetail.bank_account_number_masked || '******')}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            onClick={toggleReveal}
                            title={revealedAccount ? 'Hide' : 'Show full account'}
                          >
                            {revealedAccount ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary">IFSC</span>
                          <span className="text-white font-monospace">{requestDetail.bank_ifsc_code || '—'}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-secondary">Account holder</span>
                          <span className="text-white">{requestDetail.account_holder_name || '—'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="card bg-secondary bg-opacity-10 border border-secondary mb-3">
                      <div className="card-body">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary">Requested amount</span>
                          <span className="text-warning fw-bold">₹{Number(requestDetail.amount).toLocaleString()}</span>
                        </div>
                        <div className="d-flex justify-content-between">
                          <span className="text-secondary">Requested at</span>
                          <span className="text-white">{requestDetail.requested_at ? new Date(requestDetail.requested_at).toLocaleString() : '—'}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-success w-100"
                      onClick={handleApprove}
                      disabled={approving}
                    >
                      {approving ? <span className="spinner-border spinner-border-sm me-2" role="status" /> : <FaCheckCircle className="me-2" />}
                      Approve & start transfer
                    </button>
                  </>
                ) : (
                  <p className="text-secondary">Could not load request.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
