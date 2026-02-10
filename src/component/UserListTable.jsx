import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetUsersQuery } from '../redux/api/authApi'
import { toast } from 'react-toastify'
import './UserListTable.css'
import AddUserModal from './AddUserModal'
import BankingModal from './BankingModal'
import StatusModal from './StatusModal'
import SportsSettingsModal from './SportsSettingsModal'

function UserListTable({ title = "User List" }) {
  const navigate = useNavigate();
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isBankingModalOpen, setIsBankingModalOpen] = useState(false);
  const [selectedBankingUser, setSelectedBankingUser] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatusUser, setSelectedStatusUser] = useState(null);
  const [isSportsModalOpen, setIsSportsModalOpen] = useState(false);
  const [sportsState, setSportsState] = useState({}); // per-user sports config later

  // Determine role based on title
  const role = title.toLowerCase().includes('master') ? 'master' : 'user';

  // Fetch users from API
  const { data, isLoading, error, refetch } = useGetUsersQuery({ 
    role, 
    page: currentPage, 
    limit: entriesPerPage 
  });

  // Extract users and pagination from API response
  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { page: 1, limit: 10, total: 0, pages: 1 };

  // Filter users based on search term (client-side filtering)
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

  // Calculate summary data (placeholder - might need separate API)
  const summaryData = {
    totalBalance: 4312,
    totalExposure: 0,
    availableBalance: 4312,
    balance: 2250,
    totalAvailBal: 6562,
    uplinePL: 6562
  };

  // Map API users to table format
  const tableData = filteredUsers.map(user => ({
    id: user._id || user.id,
    username: user.username || '',
    userType: user.role === 'master' ? 'MASTER' : 'USER',
    creditRef: 0.00, // TODO: Get from separate API if available
    balance: 0, // TODO: Get from separate API if available
    exposure: 0, // TODO: Get from separate API if available
    exposureLimit: user.exposureLimit || 0,
    availBal: 0, // TODO: Calculate from balance - exposure
    refPL: 0, // TODO: Get from separate API if available
    partnership: user.commission || 0,
    status: user.isActive ? 'active' : 'inactive',
    userData: user // Store full user data for reference
  }));

  // Pagination from API
  const totalEntries = pagination.total || 0;
  const totalPages = pagination.pages || 1;
  const showingFrom = totalEntries > 0 ? ((currentPage - 1) * entriesPerPage) + 1 : 0;
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries);

  // Refetch when page or limit changes
  useEffect(() => {
    refetch();
  }, [currentPage, entriesPerPage, refetch]);

  // Handle user creation success
  const handleUserCreated = () => {
    refetch();
    toast.success('User created successfully');
  };

  const handleOpenBanking = (userRow) => {
    setSelectedBankingUser(userRow);
    setIsBankingModalOpen(true);
  };

  const handleSubmitBanking = (payload) => {
    // TODO: wire to actual banking API
    console.log('Banking submit:', payload);
    setIsBankingModalOpen(false);
    setSelectedBankingUser(null);
  };

  const handleOpenStatus = (userRow) => {
    setSelectedStatusUser(userRow);
    setIsStatusModalOpen(true);
  };

  const handleSubmitStatus = (payload) => {
    // TODO: wire to actual status-change API
    console.log('Status change submit:', payload);
    setIsStatusModalOpen(false);
    setSelectedStatusUser(null);
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

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  return (
    <div className="user-list-container">
      {/* Top Actions */}
      <div className="user-list-header-actions">
        <button className="refresh-btn" title="Refresh" onClick={() => refetch()}>
          <span>🔄</span>
        </button>
        <button className="add-user-btn" onClick={() => setIsAddUserModalOpen(true)}>
          <span>👤</span>
          <span>Add User</span>
        </button>
      </div>

      {/* Summary Metrics */}
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

      {/* Main Table Section */}
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
                    setSearchTerm(e.target.value);
                    // Don't reset page on search, just filter client-side
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
                      <span>Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    {error?.data?.message || 'Error loading users'}
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '48px' }}>📭</span>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>No users found</div>
                        <div style={{ fontSize: '13px', color: '#adb5bd' }}>
                          {searchTerm ? 'Try adjusting your search' : 'Create your first user to get started'}
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
                          💰
                        </button>
                        <button className="action-icon-btn" title="Transfer">↕️</button>
                        <button className="action-icon-btn" title="More">☰</button>
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
                          ⚙️
                        </button>
                        <button
                          className="action-icon-btn"
                          title="User"
                          onClick={() =>
                            navigate(`/user-detail/${item.id}`, {
                              state: { user: item.userData },
                            })
                          }
                        >
                          👤
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Balance"
                          onClick={handleOpenSports}
                        >
                          Ba
                        </button>
                        <button className="action-icon-btn delete-btn" title="Delete">🗑️</button>
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

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onSubmit={handleUserCreated}
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

export default UserListTable

