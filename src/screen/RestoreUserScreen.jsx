import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import Navbar from '../component/Navbar'
import { useGetHierarchyUsersByStatusQuery, useUpdateUserStatusMutation } from '../redux/api/authApi'
import './ReportEventScreen.css'

function RestoreUserScreen() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [restoreUser, setRestoreUser] = useState(null)
  const [restorePassword, setRestorePassword] = useState('')
  const [restoreError, setRestoreError] = useState('')

  const { data, isLoading, isError, error, refetch } = useGetHierarchyUsersByStatusQuery({
    status: 'suspended,locked',
  })
  const [updateStatus, { isLoading: isRestoring }] = useUpdateUserStatusMutation()

  const users = useMemo(() => data?.data ?? [], [data])
  const meta = data?.meta ?? {}
  const totalFromApi = meta.total ?? users.length

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users
    const q = searchTerm.trim().toLowerCase()
    return users.filter(
      (u) =>
        (u.username || '').toLowerCase().includes(q) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.status || '').toLowerCase().includes(q)
    )
  }, [users, searchTerm])

  const totalEntries = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage))
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    return filteredUsers.slice(start, start + entriesPerPage)
  }, [filteredUsers, currentPage, entriesPerPage])

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

  const handleOpenRestore = (user) => {
    setRestoreUser(user)
    setRestorePassword('')
    setRestoreError('')
  }

  const handleCloseRestore = () => {
    setRestoreUser(null)
    setRestorePassword('')
    setRestoreError('')
  }

  const handleConfirmRestore = async () => {
    if (!restoreUser) return
    setRestoreError('')
    if (!restorePassword.trim()) {
      setRestoreError('Please enter your password.')
      return
    }
    const userId = restoreUser._id || restoreUser.id
    if (!userId) {
      setRestoreError('User ID missing.')
      return
    }
    try {
      const res = await updateStatus({
        userId,
        status: 'active',
        adminPassword: restorePassword,
      }).unwrap()
      toast.success(res?.message || 'User restored to active.')
      handleCloseRestore()
      refetch()
    } catch (err) {
      setRestoreError(err?.data?.message || err?.message || 'Failed to restore user.')
    }
  }

  return (
    <div className="report-event-page">
      <Navbar />
      <div className="report-event-content">
        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Restore User</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* <span style={{ fontSize: '13px', color: '#666' }}>
                Total: {totalFromApi} · Filter: {Array.isArray(meta.filter) ? meta.filter.join(', ') : 'suspended, locked'}
              </span> */}
              <button className="download-btn" onClick={() => refetch()} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
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
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Username, name, role, status..."
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="report-table-wrapper">
              <table className="report-table">
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
                        <span>Name</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>Role</span>
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
                        <span>Active</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>Locked</span>
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
                      <td colSpan="7" className="no-data">
                        Loading suspended/locked users...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        {error?.data?.message || error?.message || 'Failed to load users'}
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No suspended or locked users found.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => (
                      <tr key={user._id || user.id}>
                        <td>{user.username ?? '-'}</td>
                        <td>{user.name ?? '-'}</td>
                        <td>{user.role ?? '-'}</td>
                        <td>
                          <span className={`status-badge ${(user.status || '').toLowerCase()}`}>
                            {user.status ?? '-'}
                          </span>
                        </td>
                        <td>{user.isActive ? 'Yes' : 'No'}</td>
                        <td>{user.isAccountLocked ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            type="button"
                            className="report-get-btn"
                            style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}
                            onClick={() =>
                              navigate(`/user-detail/${user._id || user.id}`, {
                                state: { user },
                              })
                            }
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="report-get-btn"
                            style={{
                              padding: '4px 10px',
                              fontSize: '12px',
                              backgroundColor: '#28a745',
                              color: '#fff',
                              border: 'none',
                            }}
                            onClick={() => handleOpenRestore(user)}
                            disabled={isRestoring}
                          >
                            Active
                          </button>
                        </td>
                      </tr>
                    ))
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
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(1)}
                >
                  First
                </button>
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
        </div>
      </div>

      {restoreUser && (
        <div
          className="status-modal-overlay"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            className="status-modal"
            style={{ width: '360px', background: '#fff', borderRadius: '6px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong>Restore to Active</strong>
              <button
                type="button"
                onClick={handleCloseRestore}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
            <p style={{ fontSize: '13px', color: '#555', marginBottom: '12px' }}>
              Set <strong>{restoreUser.username}</strong> to active. Enter your password to confirm.
            </p>
            {restoreError && (
              <div style={{ background: '#fee', color: '#c00', padding: '8px', fontSize: '13px', marginBottom: '10px', borderRadius: '4px' }}>
                {restoreError}
              </div>
            )}
            <input
              type="password"
              placeholder="Your password"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', marginBottom: '12px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' }}
              autoComplete="off"
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="report-get-btn"
                onClick={handleCloseRestore}
                style={{ padding: '6px 14px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="report-get-btn"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                style={{ padding: '6px 14px', backgroundColor: '#28a745', color: '#fff', border: 'none' }}
              >
                {isRestoring ? 'Restoring...' : 'Restore to Active'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestoreUserScreen
