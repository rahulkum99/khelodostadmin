import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../component/Navbar'
import AccountStatement from '../component/AccountStatement'
import UserActivityLog from '../component/UserActivityLog'
import UserBetHistory from '../component/UserBetHistory'
import './MyAccountScreen.css'
import './ReportEventScreen.css'
import { useGetUserProfitLossQuery } from '../redux/api/authApi'

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

  const [dataSource, setDataSource] = useState('LIVE_DATA')
  const [fromDate, setFromDate] = useState('2026-01-01')
  const [toDate, setToDate] = useState('2026-02-09')
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const canonicalUserId = user?._id || userId

  const { data, isLoading, isError } = useGetUserProfitLossQuery(
    {
      userId: canonicalUserId,
      // sport undefined here: this tab shows summary across all sports
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
      const existing = bySport.get(sportName) || {
        id: `${sportName}-${index}`,
        sportName,
        profitLoss: 0,
        commission: 0,
      }
      existing.profitLoss += profitLoss
      bySport.set(sportName, existing)
    })
    return Array.from(bySport.values())
  }, [apiRows])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let next = [...rows]
    if (q) {
      next = next.filter((r) => r.sportName.toLowerCase().includes(q))
    }
    return next
  }, [rows, searchTerm])

  const totalEntries = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    const end = start + entriesPerPage
    return filteredRows.slice(start, end)
  }, [filteredRows, currentPage, entriesPerPage])

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
          fromDate,
          toDate,
        },
      },
    })
  }

  return (
    <div className="report-event-content full-width" style={{ padding: 0 }}>
      <div className="report-filter-section" style={{ marginBottom: 16 }}>
        <div className="report-filter-row">
          <div className="filter-group">
            <label className="filter-label">Data Source</label>
            <div className="select-wrapper">
              <select
                className="filter-select"
                value={dataSource}
                onChange={(e) => {
                  setDataSource(e.target.value)
                  setCurrentPage(1)
                }}
              >
                <option value="LIVE_DATA">LIVE DATA</option>
                <option value="SETTLED_DATA">SETTLED DATA</option>
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

          <button className="report-get-btn" onClick={() => setCurrentPage(1)}>
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

            <div className="search-control">
              <label>Search:</label>
              <input
                type="text"
                className="search-input"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
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
                      <tr key={row.id}>
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
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get('tab')
    if (tab && SIDE_MENU_TABS.some((t) => t.id === tab)) {
      setActiveTab(tab)
    }
  }, [location.search])

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
              <button
                type="button"
                className="password-modal-submit"
                onClick={() => navigate('/downline-userlist')}
              >
                Back to User List
              </button>
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
        <div className="detail-row">
          <span className="detail-label">Username:</span>
          <span className="detail-value">{user?.username || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Name:</span>
          <span className="detail-value">{user?.name || user?.username || '-'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Commission:</span>
          <span className="detail-value">{user?.commission ?? 0}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Rolling Commission:</span>
          <span className="detail-value">{formatRollingCommission(user?.rollingCommission)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Agent Rolling Commission:</span>
          <span className="detail-value">{formatRollingCommission(user?.agentRollingCommission)}</span>
        </div>
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
            <span className="detail-value">{user.exposureLimit}</span>
          </div>
        )}
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

  return (
    <div className="my-account-container">
      <Navbar />
      <div className="my-account-content full-width">
        <div className="account-sidebar">
          <div className="sidebar-header">User Detail</div>
          <ul className="sidebar-nav">
            {SIDE_MENU_TABS.map((tab) => (
              <li
                key={tab.id}
                className={`sidebar-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </li>
            ))}
          </ul>
          <div style={{ padding: '15px 20px', borderTop: '1px solid #e9ecef' }}>
            <button
              type="button"
              className="password-modal-cancel"
              style={{ width: '100%' }}
              onClick={() => navigate(-1)}
            >
              ← Back to List
            </button>
          </div>
        </div>

        <div className="account-main">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default UserDetailScreen
