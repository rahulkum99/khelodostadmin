import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetUsersQuery, useDeleteUserMutation } from '../redux/api/authApi'
import { toast } from 'react-toastify'
import './UserListTable.css'
import AddMasterModal from './AddMasterModal'
import BankingModal from './BankingModal'
import StatusModal from './StatusModal'
import SportsSettingsModal from './SportsSettingsModal'
import {
  BankingIcon,
  ProfileIcon,
  SettingsIcon,
  SportSettingIcon,
  DeleteIcon,
} from '../icon'

function MasterListTable({ title = "Master List" }) {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddMasterModalOpen, setIsAddMasterModalOpen] = useState(false);
  const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);
  const [selectedBankingUser, setSelectedBankingUser] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatusUser, setSelectedStatusUser] = useState(null);
  const [isSportsModalOpen, setIsSportsModalOpen] = useState(false);
  const [sportsState, setSportsState] = useState({});
  const [balanceOverrides, setBalanceOverrides] = useState({}); // optimistic balance updates
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Fetch all downline roles in one request: admin, master, agent, super_master
  const rolesQuery = 'admin,master,agent,super_master';

  const { data, isLoading, error, refetch } = useGetUsersQuery({
    role: rolesQuery,
    page: currentPage,
    limit: entriesPerPage
  });
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower) ||
      (user.isActive ? 'active' : 'inactive').includes(searchLower)
    );
  });

  // Clear balance overrides when fresh data arrives from refetch
  useEffect(() => {
    if (data) setBalanceOverrides({});
  }, [data]);

  // Map API users to table format using latest response shape
  const tableData = filteredUsers.map(user => {
    const uid = user._id || user.id;
    const balance = balanceOverrides[uid] ?? Number(user.balance ?? 0);
    const exposure = Number(user.exposer ?? 0);
    const exposureLimit = Number(user.exposureLimit ?? 0);
    const availBal = balance - exposure;

    const role = (user.role || '').toLowerCase();
    let userType = 'USER';
    if (role === 'master') userType = 'MASTER';
    else if (role === 'admin') userType = 'ADMIN';
    else if (role === 'agent') userType = 'AGENT';
    else if (role === 'super_master') userType = 'SUPER MASTER';

    return {
      id: user._id || user.id,
      username: user.username || '',
      userType,
      creditRef: exposureLimit, // using exposureLimit as effective credit reference
      balance,
      exposure,
      exposureLimit,
      availBal,
      refPL: 0,
      partnership: user.commission || 0,
      status: user.isActive ? 'active' : 'inactive',
      userData: user,
    };
  });

  // Calculate summary data from table rows
  const totalBalance = tableData.reduce((sum, u) => sum + (u.balance || 0), 0);
  const totalExposure = tableData.reduce((sum, u) => sum + (u.exposure || 0), 0);
  const totalAvailBal = tableData.reduce((sum, u) => sum + (u.availBal || 0), 0);

  const summaryData = {
    totalBalance,
    totalExposure,
    availableBalance: totalAvailBal,
    balance: totalBalance,
    totalAvailBal,
    uplinePL: 0,
  };

  const totalEntries = pagination.total || 0;
  const totalPages = pagination.pages || 1;
  const showingFrom = totalEntries > 0 ? ((currentPage - 1) * entriesPerPage) + 1 : 0;
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries);

  useEffect(() => {
    refetch();
  }, [currentPage, entriesPerPage, refetch]);

  // Never allow search to be "superadmin" (e.g. from browser autocomplete)
  useEffect(() => {
    if ((searchTerm || '').toLowerCase() === 'superadmin') setSearchTerm('');
  }, [searchTerm]);

  const handleMasterCreated = () => {
    refetch();
    toast.success('Master created successfully');
  };

  const handleOpenBanking = (userRow) => {
    setSelectedBankingUser(userRow);
    setIsBankingModalOpen(true);
  };

  const handleSubmitBanking = (payload) => {
    setIsBankingModalOpen(false);
    setSelectedBankingUser(null);
    // Optimistic update: show new balance immediately from API response
    if (payload?.response && payload?.user?.id) {
      const { toBalanceAfter, fromBalanceAfter } = payload.response;
      const newBalance = payload.action === 'deposit' ? toBalanceAfter : fromBalanceAfter;
      if (typeof newBalance === 'number') {
        setBalanceOverrides(prev => ({ ...prev, [payload.user.id]: newBalance }));
      }
    }
    refetch();
    const msg = payload?.response?.message || (payload?.action === 'deposit' ? 'Deposit successful' : 'Withdraw successful');
    toast.success(msg);
  };

  const handleOpenStatus = (userRow) => {
    setSelectedStatusUser(userRow);
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatus = (payload) => {
    setIsStatusModalOpen(false);
    setSelectedStatusUser(null);
    refetch();
    const msg = payload?.response?.message || 'Status updated successfully';
    toast.success(msg);
  };

  const handleOpenSports = () => {
    setIsSportsModalOpen(true);
  };

  const handleToggleSport = (name, enabled) => {
    setSportsState((prev) => ({
      ...prev,
      [name]: enabled,
    }));
  };

  const handleOpenDeleteModal = (item) => {
    setDeleteTargetUser(item);
    setDeletePassword('');
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeleteTargetUser(null);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    if (!deletePassword) {
      setDeleteError('Password is required to delete user');
      return;
    }

    try {
      await deleteUser({ userId: deleteTargetUser.id, adminPassword: deletePassword }).unwrap();
      toast.success('User deleted successfully');
      handleCloseDeleteModal();
      refetch();
    } catch (err) {
      setDeleteError(err?.data?.message || err?.message || 'Failed to delete user');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  return (
    <div className="user-list-container">
      <div className="user-list-header-actions">
        <button className="refresh-btn" title="Refresh" onClick={() => refetch()}>
          <span>🔄</span>
        </button>
        <button className="add-user-btn" onClick={() => setIsAddMasterModalOpen(true)}>
          <span>👤</span>
          <span>Add Master</span>
        </button>
      </div>

      <div className="summary-metrics">
        <div className="metric-box">
          <div className="metric-label">Total Balance</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.totalBalance)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Total Exposure</div>
          <div className="metric-value exposure-zero">IRP ({summaryData.totalExposure})</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Available Balance</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.availableBalance)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Balance</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.balance)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Total Avail. bal.</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.totalAvailBal)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Upline P/L</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.uplinePL)}</div>
        </div>
      </div>

      <div className="user-list-table-section">
        <div className="table-controls">
          <div className="entries-control">
            <label>Show</label>
            <select
              className="entries-select"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              disabled={isLoading}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <label>entries</label>
          </div>
          <div className="search-control">
            <label>Search:</label>
            <input
              type="text"
              className="search-input"
              value={searchTerm}
              onChange={(e) => {
                const v = e.target.value;
                setSearchTerm((v || '').toLowerCase() === 'superadmin' ? '' : v);
              }}
              placeholder="Search by username, name, or status..."
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="user-list-table">
            <thead>
              <tr>
                <th>Username <span className="sort-arrows">▲▼</span></th>
                <th>Credit Ref. <span className="sort-arrows">▲▼</span></th>
                <th>Balance <span className="sort-arrows">▲▼</span></th>
                <th>Exposure <span className="sort-arrows">▲▼</span></th>
                <th>Exposure Limit <span className="sort-arrows">▲▼</span></th>
                <th>Avail.Bal. <span className="sort-arrows">▲▼</span></th>
                <th>Ref. P/L <span className="sort-arrows">▲▼</span></th>
                <th>Partnership <span className="sort-arrows">▲▼</span></th>
                <th>Status <span className="sort-arrows">▲▼</span></th>
                <th>Actions <span className="sort-arrows">▲▼</span></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" className="no-data loading">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                      <span>🔄</span>
                      <span>Loading masters...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    {error?.data?.message || 'Error loading masters'}
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '48px' }}>📭</span>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>No masters found</div>
                        <div style={{ fontSize: '13px', color: '#adb5bd' }}>
                          {searchTerm ? 'Try adjusting your search' : 'Create your first master to get started'}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                tableData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="user-badge">{item.userType}</span>
                      <span className="username-text">{item.username}</span>
                    </td>
                    <td>
                      <span>{formatCurrency(item.creditRef)}</span>
                      <span className="action-icons">
                        <button className="icon-btn" title="Edit">✏️</button>
                        <button className="icon-btn" title="View">👁️</button>
                      </span>
                    </td>
                    <td>{formatCurrency(item.balance)}</td>
                    <td className={item.exposure === 0 ? 'exposure-zero' : ''}>
                      ({formatCurrency(item.exposure)})
                    </td>
                    <td>
                      <span>{formatCurrency(item.exposureLimit)}</span>
                      <button className="icon-btn" title="Edit">✏️</button>
                    </td>
                    <td>{formatCurrency(item.availBal)}</td>
                    <td>({formatCurrency(item.refPL)})</td>
                    <td>{item.partnership}%</td>
                    <td>
                      <span className={`status-badge ${item.status === 'active' ? 'active' : ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-group">
                        <button
                          className="action-icon-btn"
                          title="Banking"
                          onClick={() =>
                            handleOpenBanking({
                              id: item.id,
                              username: item.username,
                              userType: item.userType,
                              balance: item.balance,
                            })
                          }
                        >
                          <BankingIcon size={20} />
                        </button>

                        <button
                          className="action-icon-btn"
                          title="Settings"
                          onClick={() =>
                            handleOpenStatus({
                              id: item.id,
                              username: item.username,
                              userType: item.userType,
                              status: item.status,
                            })
                          }
                        >
                          <SettingsIcon size={18} />
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Profile"
                          onClick={() =>
                            navigate(`/user-detail/${item.id}`, {
                              state: { user: item.userData },
                            })
                          }
                        >
                          <ProfileIcon size={18} />
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Sport Settings"
                          onClick={handleOpenSports}
                        >
                          <SportSettingIcon size={18} />
                        </button>
                        <button
                          className="action-icon-btn delete-btn"
                          title="Delete"
                          onClick={() => handleOpenDeleteModal(item)}
                          disabled={isDeleting}
                        >
                          <DeleteIcon size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div className="pagination-info">
            Showing {showingFrom} to {showingTo} of {totalEntries} entries
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(1)}
            >
              First
            </button>
            <button
              className="pagination-btn"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
                disabled={isLoading}
              >
                {page}
              </button>
            ))}
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
            <button
              className="pagination-btn"
              disabled={currentPage === totalPages || totalPages === 0 || isLoading}
              onClick={() => setCurrentPage(totalPages)}
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {isDeleteModalOpen && deleteTargetUser && (
        <div
          className="status-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            className="status-modal"
            style={{
              width: '360px',
              background: '#fff',
              borderRadius: '6px',
              padding: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <strong>Delete User</strong>
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
              Are you sure you want to delete{' '}
              <strong>{deleteTargetUser.username}</strong>? This action cannot be undone.
            </p>
            {deleteError && (
              <div
                style={{
                  background: '#fee',
                  color: '#c00',
                  padding: '8px',
                  fontSize: '13px',
                  marginBottom: '10px',
                  borderRadius: '4px',
                }}
              >
                {deleteError}
              </div>
            )}
            <input
              type="password"
              placeholder="Your password"
              value={deletePassword}
              onChange={(e) => {
                setDeletePassword(e.target.value);
                if (deleteError) setDeleteError('');
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                marginBottom: '12px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box',
              }}
              autoComplete="off"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="report-get-btn"
                onClick={handleCloseDeleteModal}
                style={{ padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="report-get-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '6px 14px',
                  backgroundColor: '#dc3545',
                  color: '#fff',
                  border: 'none',
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddMasterModal
        isOpen={isAddMasterModalOpen}
        onClose={() => setIsAddMasterModalOpen(false)}
        onSubmit={handleMasterCreated}
      />

      <BankingModal
        isOpen={isBankingModalOpen}
        onClose={() => {
          setIsBankingModalOpen(false)
          setSelectedBankingUser(null)
        }}
        user={selectedBankingUser}
        masterBalance={summaryData.balance}
        onSubmit={handleSubmitBanking}
      />

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false)
          setSelectedStatusUser(null)
        }}
        user={selectedStatusUser}
        onSubmit={handleSubmitStatus}
      />

      <SportsSettingsModal
        isOpen={isSportsModalOpen}
        onClose={() => setIsSportsModalOpen(false)}
        activeSports={sportsState}
        onToggle={handleToggleSport}
      />
    </div>
  )
}

export default MasterListTable

