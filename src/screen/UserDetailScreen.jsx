import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FaRegEdit } from 'react-icons/fa'
import { toast } from 'react-toastify'
import Navbar from '../component/Navbar'
import AccountStatement from '../component/AccountStatement'
import UserActivityLog from '../component/UserActivityLog'
import UserBetHistory from '../component/UserBetHistory'
import ExposureLimitModal from '../component/ExposureLimitModal'
import HierarchyUserPasswordModal from '../component/HierarchyUserPasswordModal'
import './MyAccountScreen.css'
import './ReportEventScreen.css'
import { useGetUserProfitLossQuery, useGetUserHierarchyQuery } from '../redux/api/authApi'
import { userSelector } from '../redux/slices/authReducer'
import {
  canManageExposureByRole,
  canEditExposureForTarget,
  hierarchyResponseToUserIdSet,
} from '../utils/exposureEditAccess'
import {
  PROFIT_LOSS_LIVE,
  PROFIT_LOSS_OLD,
  PROFIT_LOSS_OLD_MONTH,
  getPresetDateInputs,
  dateInputRangeToIso,
} from '../utils/profitLossDateRange'

function mapProfileUserType(role) {
  const r = (role || '').toLowerCase()
  if (r === 'master') return 'MASTER'
  if (r === 'admin') return 'ADMIN'
  if (r === 'agent') return 'AGENT'
  if (r === 'super_master') return 'SUPER MASTER'
  if (r === 'super_admin') return 'SUPER ADMIN'
  return 'USER'
}

const SIDE_MENU_TABS = [
  { id: 'profile', label: 'User Profile' },
  { id: 'bet-history', label: 'Bet History' },
  { id: 'profit-loss', label: 'Profit & Loss' },
  { id: 'statement', label: 'Account Statement' },
  { id: 'activity', label: 'Activity Log' },
]

function UserProfitLossTab({ userId, user }) {
  const navigate = useNavigate()
  const location = useLocation()

  /** Live/Old presets fill From–To; you can edit dates (settledAt window). */
  const [dataSource, setDataSource] = useState(PROFIT_LOSS_LIVE)
  const [fromDate, setFromDate] = useState(() => getPresetDateInputs(PROFIT_LOSS_LIVE).fromDate)
  const [toDate, setToDate] = useState(() => getPresetDateInputs(PROFIT_LOSS_LIVE).toDate)
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const canonicalUserId = user?._id || userId

  const { from: fromIso, to: toIso } = useMemo(
    () => dateInputRangeToIso(fromDate, toDate),
    [fromDate, toDate],
  )

  const { data, isLoading, isError } = useGetUserProfitLossQuery(
    {
      userId: canonicalUserId,
      from: fromIso,
      to: toIso,
      limit: 500,
    },
    { skip: !canonicalUserId }
  )

  const apiRows = useMemo(() => data?.data || [], [data])

  const rows = useMemo(() => {
    if (!Array.isArray(apiRows) || apiRows.length === 0) return []
    const bySport = new Map()
    apiRows.forEach((item, index) => {
      const sportName = (item.sport || 'Unknown').toString()
      const profitLoss = Number(item.profitLoss || 0)
      const commission = Number(item.commission || 0)
      const existing = bySport.get(sportName) || {
        id: `${sportName}-${index}`,
        sportName,
        profitLoss: 0,
        commission: 0,
      }
      existing.profitLoss += profitLoss
      existing.commission += commission
      bySport.set(sportName, existing)
    })
    return Array.from(bySport.values())
  }, [apiRows])

  const totalEntries = rows.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    const end = start + entriesPerPage
    return rows.slice(start, end)
  }, [rows, currentPage, entriesPerPage])

  const overallTotalPL = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.profitLoss || 0), 0),
    [rows]
  )

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

  const handleSportClick = (sportName) => {
    // Ensure browser back returns to Profit & Loss tab
    navigate(
      { pathname: location.pathname, search: '?tab=profit-loss' },
      { replace: true, state: location.state }
    )

    navigate(`/user-detail/${user?._id || userId}/profit-loss/${encodeURIComponent(sportName)}`, {
      state: {
        user,
        filters: {
          dataSource,
          from: fromIso,
          to: toIso,
        },
      },
    })
  }

  return (
    <div className="report-event-content full-width" style={{ padding: 0 }}>
      <div className="report-filter-section" style={{ marginBottom: 16 }}>
        <div className="report-filter-row" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="filter-group">
            <label className="filter-label">Data</label>
            <div className="select-wrapper">
              <select
                className="filter-select"
                value={dataSource}
                onChange={(e) => {
                  const v = e.target.value
                  setDataSource(v)
                  const p = getPresetDateInputs(v)
                  setFromDate(p.fromDate)
                  setToDate(p.toDate)
                  setCurrentPage(1)
                }}
              >
                <option value={PROFIT_LOSS_LIVE}>Live Data</option>
                <option value={PROFIT_LOSS_OLD}>Backup Data</option>
                <option value={PROFIT_LOSS_OLD_MONTH}>Old Data</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">From</label>
            <div className="datetime-wrapper">
              <input
                type="date"
                className="filter-date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          <div className="filter-group">
            <label className="filter-label">To</label>
            <div className="datetime-wrapper">
              <input
                type="date"
                className="filter-date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          <button
            type="button"
            className="report-get-btn"
            onClick={() => setCurrentPage(1)}
          >
            Get P&amp;L
          </button>

         
        </div>
      </div>

      <div className="report-table-section">
        <div className="report-table-header">
          <div className="report-title">Profit/Loss</div>
        </div>

        <div className="report-table-container">
          <div className="report-table-controls">
            <div className="entries-control">
              <label>Show</label>
              <select
                className="entries-select"
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <label>entries</label>
            </div>

          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Sport Name</th>
                  <th>Profit &amp; Loss</th>
                  <th>Commission</th>
                  <th>Total P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="no-data">
                      Loading...
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan="4" className="no-data">
                      Failed to load data
                    </td>
                  </tr>
                ) : paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="no-data">
                      No data available
                    </td>
                  </tr>
                ) : (
                  <>
                    {paginatedRows.map((row) => (
                      <tr key={row.sportName}>
                        <td
                          className="sport-link"
                          onClick={() => handleSportClick(row.sportName)}
                          title="View event-wise P&L"
                        >
                          {row.sportName}
                        </td>
                        <td className={row.profitLoss >= 0 ? 'pl-positive' : 'pl-negative'}>
                          {Number(row.profitLoss || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          {Number(row.commission || 0).toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={overallTotalPL >= 0 ? 'pl-positive' : 'pl-negative'}>
                          {overallTotalPL.toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="report-footer">
            <div className="pagination-info">
              Showing {showingFrom} to {showingTo} of {totalEntries} entries
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                First
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
              <button
                className="pagination-btn"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(totalPages)}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UserDetailScreen() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = location.state?.user
  const [exposureLimitOverride, setExposureLimitOverride] = useState(null)
  const [isExposureLimitModalOpen, setIsExposureLimitModalOpen] = useState(false)
  const [isHierarchyPasswordModalOpen, setIsHierarchyPasswordModalOpen] = useState(false)

  const authUser = useSelector(userSelector)
  const authRole = (authUser?.role || '').toLowerCase()
  const isSuperAdmin = authRole === 'super_admin'
  // Same scope as exposure / wallet hierarchy (agent+, super admin all, else self + descendants)
  const needsHierarchyForScopedActions =
    canManageExposureByRole(authUser) && !isSuperAdmin

  const { data: hierarchyData, isLoading: hierarchyLoading } = useGetUserHierarchyQuery(
    { from: '2000-01-01T00:00:00Z', to: '2100-12-31T23:59:59Z' },
    { skip: !needsHierarchyForScopedActions },
  )

  const hierarchyDescendantIds = useMemo(() => {
    if (!needsHierarchyForScopedActions) return null
    return hierarchyResponseToUserIdSet(hierarchyData)
  }, [hierarchyData, needsHierarchyForScopedActions])

  const profileSubjectId = user?._id || user?.id || userId

  const canManageHierarchySubject = (targetId) =>
    canEditExposureForTarget({
      authUser,
      targetUserId: targetId,
      descendantIdSet: hierarchyDescendantIds,
    })

  const showExposureLimitEdit =
    profileSubjectId &&
    canManageHierarchySubject(profileSubjectId) &&
    (!needsHierarchyForScopedActions || !hierarchyLoading)

  const showHierarchyPasswordEdit =
    profileSubjectId &&
    canManageHierarchySubject(profileSubjectId) &&
    (!needsHierarchyForScopedActions || !hierarchyLoading)

  const HIDE_PL_ROLES = ['agent', 'master', 'super_master', 'admin']
  const shouldHidePLTabs = HIDE_PL_ROLES.includes((user?.role || '').toLowerCase())
  const visibleTabs = shouldHidePLTabs
    ? SIDE_MENU_TABS.filter((t) => t.id !== 'profit-loss')
    : SIDE_MENU_TABS
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab')
    if (tab && visibleTabs.some((t) => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [location.search, visibleTabs])

  useEffect(() => {
    setExposureLimitOverride(null)
  }, [user?._id, user?.id])

  const formatRollingCommission = (rollingCommission) => {
    if (!rollingCommission || typeof rollingCommission !== 'object') {
      return 'Not set'
    }
    const entries = Object.entries(rollingCommission).filter(([_, value]) => value !== 0 && value !== '0')
    if (entries.length === 0) {
      return 'Not configured'
    }
    return `${entries.length} category${entries.length > 1 ? 'ies' : 'y'} configured`
  }

  if (!user) {
    return (
      <div className="my-account-container">
        <Navbar />
        <div className="my-account-content">
          <div className="account-main" style={{ padding: '40px' }}>
            <div className="account-details-header">User not found</div>
            <div className="account-details-panel">
              <p style={{ color: '#666', marginBottom: '16px' }}>
                No user data available. You may have arrived here directly without selecting a user.
              </p>
              {/* <button
                type="button"
                className="password-modal-submit"
                onClick={() => navigate('/downline-userlist')}
              >
                Back to User List
              </button> */}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderProfileContent = () => (
    <>
      <div className="account-details-header">Account Details</div>
      <div className="account-details-panel">
        {/* <div className="detail-row">
          <span className="detail-label">Username:</span>
          <span className="detail-value">{user?.username || '-'}</span>
        </div> */}
        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{user?.name || user?.username || '-'}</span>
        </div>
        {/* <div className="detail-row">
          <span className="detail-label">Commission:</span>
          <span className="detail-value">{user?.commission ?? 0}</span>
        </div> */}
        {/* <div className="detail-row">
          <span className="detail-label">Rolling Commission:</span>
          <span className="detail-value">{formatRollingCommission(user?.rollingCommission)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Agent Rolling Commission:</span>
          <span className="detail-value">{formatRollingCommission(user?.agentRollingCommission)}</span>
        </div> */}
        <div className="detail-row">
          <span className="detail-label">Currency:</span>
          <span className="detail-value">{user?.currency || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Partnership / Role:</span>
          <span className="detail-value">{user?.role || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Mobile Number:</span>
          <span className="detail-value">{user?.mobileNumber || 'Not found'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className="detail-value">
            <span className={`status-badge ${user?.isActive ? 'active' : ''}`} style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '4px', fontSize: '13px', backgroundColor: user?.isActive ? '#d4edda' : '#f8d7da', color: user?.isActive ? '#155724' : '#721c24' }}>
              {user?.isActive ? 'Active' : 'Inactive'}
            </span>
          </span>
        </div>
        {user?.exposureLimit != null && (
          <div className="detail-row">
            <span className="detail-label">Exposure Limit:</span>
            <span className="detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {exposureLimitOverride ?? user.exposureLimit}
              {showExposureLimitEdit && (
                <button
                  type="button"
                  className="icon-btn"
                  title="Edit exposure limit"
                  onClick={() => setIsExposureLimitModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: '#005792',
                    display: 'inline-flex',
                    alignItems: 'center',
                  }}
                >
                  <FaRegEdit size={16} />
                </button>
              )}
            </span>
          </div>
        )}

        <div className="detail-row">
          <span className="detail-label">Change Password:</span>
          <span className="detail-value" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            ********
            {showHierarchyPasswordEdit && (
              <button
                type="button"
                className="icon-btn"
                title="Change password"
                onClick={() => setIsHierarchyPasswordModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '2px',
                  cursor: 'pointer',
                  color: '#005792',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <FaRegEdit size={16} />
              </button>
            )}
          </span>
        </div>
      </div>
    </>
  )

  const renderPlaceholderPanel = (title, description) => (
    <>
      <div className="account-details-header">{title}</div>
      <div className="account-details-panel">
        <p style={{ color: '#666', margin: 0 }}>
          {description}
        </p>
      </div>
    </>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return renderProfileContent()
      case 'bet-history':
        return (
          <UserBetHistory
            userId={user?._id || userId}
            username={user?.username || user?.name}
          />
        )
      case 'profit-loss':
        return <UserProfitLossTab userId={userId} user={user} />
      case 'statement':
        return <AccountStatement userId={user?._id || userId} />
      case 'activity':
        return (
          <UserActivityLog
            userId={user?._id || userId}
            username={user?.username || user?.name}
          />
        )
      default:
        return renderProfileContent()
    }
  }

  const handleSubmitExposureLimit = (payload) => {
    const msg =
      payload?.response?.message || 'Exposure limit updated successfully'
    toast.success(msg)
    setExposureLimitOverride(payload?.exposureLimit)
  }

  const handleSubmitHierarchyPassword = (payload) => {
    const msg =
      payload?.response?.message || 'Password updated successfully'
    toast.success(msg)
  }

  return (
    <div className="my-account-container">
      <Navbar />
      <div className="my-account-content full-width">
        <div className="account-sidebar">
          <div className="sidebar-header">User Detail</div>
          <ul className="sidebar-nav">
            {visibleTabs.map((tab) => (
              <li
                key={tab.id}
                className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </li>
            ))}
          </ul>
          {/* <div style={{ padding: '15px 20px', borderTop: '1px solid #e9ecef' }}>
            <button
              type="button"
              className="password-modal-cancel"
              style={{ width: '100%' }}
              onClick={() => navigate(-1)}
            >
              ← Back to List
            </button>
          </div> */}
        </div>

        <div className="account-main">
          {renderContent()}
        </div>
      </div>

      <ExposureLimitModal
        isOpen={isExposureLimitModalOpen}
        onClose={() => setIsExposureLimitModalOpen(false)}
        user={
          profileSubjectId
            ? {
                id: profileSubjectId,
                username: user?.username || user?.name,
                userType: mapProfileUserType(user?.role),
                exposureLimit:
                  exposureLimitOverride ?? user?.exposureLimit ?? 0,
              }
            : null
        }
        onSubmit={handleSubmitExposureLimit}
      />

      <HierarchyUserPasswordModal
        isOpen={isHierarchyPasswordModalOpen}
        onClose={() => setIsHierarchyPasswordModalOpen(false)}
        user={
          profileSubjectId
            ? {
                id: profileSubjectId,
                username: user?.username || user?.name,
                userType: mapProfileUserType(user?.role),
              }
            : null
        }
        onSubmit={handleSubmitHierarchyPassword}
      />
    </div>
  )
}

export default UserDetailScreen
