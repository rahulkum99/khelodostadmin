import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  useGetUsersQuery,
  useGetUsersByAdminQuery,
  useGetUserHierarchyQuery,
  useDeleteUserMutation,
  useLazyGetUserExposureGameListQuery,
  useLazyGetUserMarketExposureBetsQuery,
} from '../redux/api/authApi'
import { userSelector } from '../redux/slices/authReducer'
import {
  canManageExposureByRole,
  canEditExposureForTarget,
  hierarchyResponseToUserIdSet,
} from '../utils/exposureEditAccess'
import { toast } from 'react-toastify'
import './UserListTable.css'
import AddUserModal from './AddUserModal'
import BankingModal from './BankingModal'
import StatusModal from './StatusModal'
import ExposureLimitModal from './ExposureLimitModal'
import SportsSettingsModal from './SportsSettingsModal'
import { IoIosRefresh } from "react-icons/io";
import { HiUserAdd } from "react-icons/hi";
import { FaRegEdit } from "react-icons/fa";
import { FaEye } from "react-icons/fa";
import {
  BankingIcon,
  BetHistoryIcon,
  ProfileIcon,
  ProfitLossIcon,
  SettingsIcon,
  SportSettingIcon,
  DeleteIcon,
} from '../icon'

function UserListTable({ title = "User List", adminId = null }) {
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
  const [balanceOverrides, setBalanceOverrides] = useState({}); // optimistic balance updates
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isExposureModalOpen, setIsExposureModalOpen] = useState(false);
  const [selectedExposureUser, setSelectedExposureUser] = useState(null);
  const [selectedExposureRows, setSelectedExposureRows] = useState([]);
  const [isMarketBetsModalOpen, setIsMarketBetsModalOpen] = useState(false);
  const [selectedMarketBetsRows, setSelectedMarketBetsRows] = useState([]);
  const [selectedMarketTitle, setSelectedMarketTitle] = useState('');
  const [isExposureLimitModalOpen, setIsExposureLimitModalOpen] = useState(false);
  const [selectedExposureLimitUser, setSelectedExposureLimitUser] = useState(null);
  const [fetchUserExposureGameList, { isFetching: isExposureLoading }] =
    useLazyGetUserExposureGameListQuery();
  const [fetchUserMarketExposureBets, { isFetching: isMarketBetsLoading }] =
    useLazyGetUserMarketExposureBetsQuery();

  const authUser = useSelector(userSelector);
  const authRole = (authUser?.role || '').toLowerCase();
  const isSuperAdmin = authRole === 'super_admin';
  const needsHierarchyForExposure =
    canManageExposureByRole(authUser) && !isSuperAdmin;

  const { data: hierarchyData, isLoading: hierarchyLoading } = useGetUserHierarchyQuery(
    { from: '2000-01-01T00:00:00Z', to: '2100-12-31T23:59:59Z' },
    { skip: !needsHierarchyForExposure },
  );

  const exposureDescendantIds = useMemo(() => {
    if (!needsHierarchyForExposure) return null;
    return hierarchyResponseToUserIdSet(hierarchyData);
  }, [hierarchyData, needsHierarchyForExposure]);

  const rowCanEditExposure = (targetId) =>
    canEditExposureForTarget({
      authUser,
      targetUserId: targetId,
      descendantIdSet: exposureDescendantIds,
    });

  const showExposureLimitEdit = (targetId) =>
    rowCanEditExposure(targetId) &&
    (!needsHierarchyForExposure || !hierarchyLoading);

  // Determine role based on title
  const role = title.toLowerCase().includes('master') ? 'master' : 'user';
  const normalizedAdminId = (adminId || '').toString().trim();
  const isByAdminMode = normalizedAdminId.length > 0;

  const usersQuery = useGetUsersQuery(
    {
      role,
      page: currentPage,
      limit: entriesPerPage
    },
    { skip: isByAdminMode },
  );
  const usersByAdminQuery = useGetUsersByAdminQuery(
    {
      adminId: normalizedAdminId,
      page: currentPage,
      limit: entriesPerPage,
    },
    { skip: !isByAdminMode },
  );
  const activeUsersQuery = isByAdminMode ? usersByAdminQuery : usersQuery;
  const { data, isLoading, error, refetch } = activeUsersQuery;
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Extract users/pagination from multiple response shapes
  const users =
    data?.data?.users ||
    data?.users ||
    [];
  const pagination = data?.data?.pagination || data?.pagination || { page: 1, limit: 10, total: users.length, pages: 1 };

  // When switching into/out of by-admin mode, clear stale filters/pagination
  useEffect(() => {
    setCurrentPage(1);
    setSearchTerm('');
  }, [normalizedAdminId]);

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

  // Clear balance overrides when fresh data arrives from refetch
  useEffect(() => {
    if (data) setBalanceOverrides({});
  }, [data]);

  // Never allow search to be "superadmin" (e.g. from browser autocomplete)
  useEffect(() => {
    if ((searchTerm || '').toLowerCase() === 'superadmin') setSearchTerm('');
  }, [searchTerm]);

  // Map API users to table format using latest response shape
  const tableData = filteredUsers.map(user => {
    const uid = user._id || user.id;
    const balance = balanceOverrides[uid] ?? Number(user.balance ?? 0);
    const exposure = Number(user.exposer ?? 0);
    const exposureLimit = Number(user.exposureLimit ?? 0);
    const availBal = balance - exposure;

    return {
      id: user._id || user.id,
      username: user.username || '',
      userType: user.role === 'master' ? 'MASTER' : 'USER',
      creditRef: exposureLimit, // using exposureLimit as effective credit reference
      balance,
      exposure,
      exposureLimit,
      availBal,
      refPL: 0, // still placeholder until backend provides it
      partnership: user.commission || 0,
      status: user.isActive ? 'active' : 'inactive',
      userData: user, // Store full user data for reference
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

  const normalizeExposureRows = (sourceRows = []) => {
    return (Array.isArray(sourceRows) ? sourceRows : []).map((row, index) => ({
      id: row._id || row.id || `${index}`,
      sportName: row.sportName || row.sport || '-',
      eventName: row.eventName || row.event || '-',
      marketName: row.marketName || row.market || row.marketType || '-',
      eventId: row.eventId || '',
      marketId: row.marketId || '',
      betCount: Number(row.betCount ?? row.count ?? row.totalBets ?? 0),
    }));
  };

  const normalizeMarketBetsRows = (sourceRows = []) => {
    return (Array.isArray(sourceRows) ? sourceRows : []).map((row, index) => ({
      id: row.betId || row._id || row.id || `${index}`,
      sportName: row.sport || '-',
      eventName: row.eventName || '-',
      marketName: row.marketName || '-',
      runnerName: row.runnerName || '-',
      betType: row.betType || '-',
      userPrice: row.userPrice ?? '-',
      rate: row.rate ?? '-',
      amount: row.amount ?? row.stake ?? '-',
      placeDate: row.placeDate || row.createdAt || null,
      matchDate: row.matchDate || row.updatedAt || null,
    }));
  };

  const handleOpenExposureModal = async (item) => {
    if (!item || Number(item.exposure || 0) === 0) return;
    setSelectedExposureUser(item);
    setSelectedExposureRows([]);
    setIsExposureModalOpen(true);
    try {
      const response = await fetchUserExposureGameList({ userId: item.id }).unwrap();
      setSelectedExposureRows(normalizeExposureRows(response));
    } catch (err) {
      setSelectedExposureRows([]);
      toast.error(err?.data?.message || err?.message || 'Failed to load exposure details');
    }
  };

  const getExposureModalTitle = () => {
    const username =
      selectedExposureUser?.username ||
      selectedExposureUser?.userData?.username ||
      selectedExposureUser?.userData?.name ||
      'User';
    return `Exposure Details- ${username}`;
  };

  const handleCloseExposureModal = () => {
    setIsExposureModalOpen(false);
    setSelectedExposureUser(null);
    setSelectedExposureRows([]);
  };

  const handleOpenMarketBetsModal = async (row) => {
    if (!selectedExposureUser?.id || !row?.marketId || !row?.eventId) return;
    setSelectedMarketBetsRows([]);
    setSelectedMarketTitle(row.marketName || 'Market Exposure');
    setIsMarketBetsModalOpen(true);
    try {
      const response = await fetchUserMarketExposureBets({
        userId: selectedExposureUser.id,
        marketId: row.marketId,
        eventId: row.eventId,
      }).unwrap();
      setSelectedMarketBetsRows(normalizeMarketBetsRows(response));
    } catch (err) {
      setSelectedMarketBetsRows([]);
      toast.error(err?.data?.message || err?.message || 'Failed to load market exposure bets');
    }
  };

  const handleCloseMarketBetsModal = () => {
    setIsMarketBetsModalOpen(false);
    setSelectedMarketBetsRows([]);
    setSelectedMarketTitle('');
  };

  const handleOpenExposureLimitModal = (item) => {
    setSelectedExposureLimitUser({
      id: item.id,
      username: item.username,
      userType: item.userType,
      exposureLimit: item.exposureLimit,
    });
    setIsExposureLimitModalOpen(true);
  };

  const handleCloseExposureLimitModal = () => {
    setIsExposureLimitModalOpen(false);
    setSelectedExposureLimitUser(null);
  };

  const handleSubmitExposureLimit = (payload) => {
    const msg =
      payload?.response?.message || 'Exposure limit updated successfully';
    toast.success(msg);
    refetch();
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

  const formatDateTime = (dateValue) => {
    if (!dateValue) return '-';
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="user-list-container">
      {/* Top Actions */}
      <div className="user-list-header-actions">

        <button className="add-user-btn" onClick={() => setIsAddUserModalOpen(true)}>
          <span className="mx-1">
            <HiUserAdd size={20} />
          </span>
          <span>Add User</span>
        </button>
        <button className="refresh-btn" title="Refresh" onClick={() => refetch()}>
          <IoIosRefresh size={20} />
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
                <th>
                  <span className="th-title-with-icon">
                    <span>Username</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Credit Ref.</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Balance</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Exposure</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Exposure Limit</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Avail.Bal.</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Ref. P/L</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Partnership</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Status</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Actions</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
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
                      <span className="td-content-inline">
                        <span className="user-badge">{item.userType}</span>
                        <span className="username-text">{item.username}</span>
                      </span>
                    </td>
                    <td>
                      <span className="td-content-inline">
                        <span>{formatCurrency(item.creditRef)}</span>
                        <span className="action-icons">
                          <button className="icon-btn" title="Edit">
                            <FaRegEdit size={16} />
                          </button>
                          <button className="icon-btn" title="View">
                            <FaEye size={16} />
                          </button>
                        </span>
                      </span>
                    </td>
                    <td>{formatCurrency(item.balance)}</td>
                    <td className={item.exposure === 0 ? 'exposure-zero' : ''}>
                      <button
                        type="button"
                        className={`exposure-link-btn ${item.exposure === 0 ? 'disabled' : ''}`}
                        disabled={item.exposure === 0}
                        onClick={() => handleOpenExposureModal(item)}
                        title={item.exposure === 0 ? 'No exposure available' : 'View exposure details'}
                      >
                        ({formatCurrency(item.exposure)})
                      </button>
                    </td>
                    <td>
                      <span className="td-content-inline">
                        <span>{formatCurrency(item.exposureLimit)}</span>
                        {showExposureLimitEdit(item.id) && (
                          <button
                            type="button"
                            className="icon-btn"
                            title="Edit exposure limit"
                            onClick={() => handleOpenExposureLimitModal(item)}
                          >
                            <FaRegEdit size={16} />
                          </button>
                        )}
                      </span>
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
                          title="Profit/Loss"
                          onClick={() =>
                            navigate(`/user-detail/${item.id}?tab=profit-loss`, {
                              state: { user: item.userData },
                            })
                          }
                        >
                          <ProfitLossIcon size={18} />
                        </button>
                        <button
                          className="action-icon-btn"
                          title="History"
                          onClick={() =>
                            navigate(`/user-detail/${item.id}?tab=bet-history`, {
                              state: { user: item.userData },
                            })
                          }
                        >
                          <BetHistoryIcon size={18} />
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
                        {!isByAdminMode && (
                          <>
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
                          </>
                        )}
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

      {isExposureModalOpen && selectedExposureUser && (
        <div className="exposure-modal-overlay" onClick={handleCloseExposureModal}>
          <div className="exposure-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exposure-modal-header">
              <h3 className="exposure-modal-title">{getExposureModalTitle()}</h3>
              <button
                type="button"
                className="exposure-modal-close"
                onClick={handleCloseExposureModal}
                aria-label="Close exposure details"
              >
                ×
              </button>
            </div>

            <div className="exposure-modal-body">
              {isExposureLoading ? (
                <div className="no-data">Loading exposure details...</div>
              ) : selectedExposureRows.length === 0 ? (
                <div className="no-data">No exposure details available.</div>
              ) : (
                <div className="table-wrapper exposure-table-wrapper">
                  <table className="user-list-table exposure-details-table">
                    <thead>
                      <tr>
                        <th>Sport Name</th>
                        <th>Event Name</th>
                        <th>Market Name</th>
                        <th>Bet Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedExposureRows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.sportName}</td>
                          <td>{row.eventName}</td>
                          <td>
                            <button
                              type="button"
                              className="exposure-market-link-btn"
                              onClick={() => handleOpenMarketBetsModal(row)}
                              title="View market exposure bets"
                            >
                              {row.marketName === 'Match_Odds'
                                ? 'Match Odds'
                                : row.marketName === 'fancy1'
                                  ? 'Toss Market'
                                  : row.marketName}
                            </button>
                          </td>
                          <td>{row.betCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isMarketBetsModalOpen && (
        <div className="exposure-modal-overlay" onClick={handleCloseMarketBetsModal}>
          <div className="exposure-modal market-bets-modal" onClick={(e) => e.stopPropagation()}>
            <div className="exposure-modal-header">
              <h3 className="exposure-modal-title"> Market Exposure</h3>
              <button
                type="button"
                className="exposure-modal-close"
                onClick={handleCloseMarketBetsModal}
                aria-label="Close market exposure bets"
              >
                ×
              </button>
            </div>

            <div className="exposure-modal-body">
              {isMarketBetsLoading ? (
                <div className="no-data">Loading market exposure bets...</div>
              ) : selectedMarketBetsRows.length === 0 ? (
                <div className="no-data">No market exposure bets available.</div>
              ) : (
                <div className="table-wrapper exposure-table-wrapper">
                  <table className="user-list-table exposure-details-table market-bets-table">
                    <thead>
                      <tr>
                        <th>Sport Name</th>
                        <th>Event Name</th>
                        <th>Market Name</th>
                        <th>Runner Name</th>
                        <th>Bet Type</th>
                        <th>User Price</th>
                        <th>Rate</th>
                        <th>Amount</th>
                        <th>Place Date</th>
                        <th>Match Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMarketBetsRows.map((row) => (
                        <tr
                          key={row.id}
                          className={
                            row.betType?.toString().toLowerCase() === 'lay'
                              ? 'market-row-lay'
                              : row.betType?.toString().toLowerCase() === 'back'
                                ? 'market-row-back'
                                : ''
                          }
                        >
                          <td>{row.sportName}</td>
                          <td>{row.eventName}</td>
                          <td>{row.runnerName}</td>
                          <td>{row.runnerName}</td>
                          <td>{row.betType}</td>
                          <td>{row.userPrice}</td>
                          <td>{row.rate}</td>
                          <td>{row.amount}</td>
                          <td>{formatDateTime(row.placeDate)}</td>
                          <td>{formatDateTime(row.matchDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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

      <ExposureLimitModal
        isOpen={isExposureLimitModalOpen}
        onClose={handleCloseExposureLimitModal}
        user={selectedExposureLimitUser}
        onSubmit={handleSubmitExposureLimit}
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

