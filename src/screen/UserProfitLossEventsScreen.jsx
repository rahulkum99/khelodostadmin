import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'
import { useGetUserProfitLossQuery } from '../redux/api/authApi'
import { getUserProfitLossDateRange, PROFIT_LOSS_LIVE } from '../utils/profitLossDateRange'

function UserProfitLossEventsScreen() {
  const { userId, sportName } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = location.state?.user

  const filters = location.state?.filters || {}
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const canonicalUserId = user?._id || userId

  const decodedSport = useMemo(() => {
    try {
      return decodeURIComponent((sportName || '').toString())
    } catch {
      return (sportName || '').toString()
    }
  }, [sportName])

  const { from: plFrom, to: plTo } = useMemo(() => {
    if (filters?.from && filters?.to) {
      return { from: filters.from, to: filters.to }
    }
    return getUserProfitLossDateRange(filters?.dataSource || PROFIT_LOSS_LIVE)
  }, [filters?.from, filters?.to, filters?.dataSource])

  const { data, isLoading, isError } = useGetUserProfitLossQuery(
    {
      userId: canonicalUserId,
      sport: decodedSport || undefined,
      from: plFrom,
      to: plTo,
      limit: 500,
    },
    { skip: !canonicalUserId }
  )

  const rows = useMemo(() => {
    const items = data?.data || []
    if (!Array.isArray(items)) return []
    return items.map((item, index) => ({
      id: item.eventId || index,
      sportName: item.sport || decodedSport || 'Unknown',
      eventName: item.eventName || '-',
      profitLoss: Number(item.profitLoss || 0),
      commission: Number(item.commission || 0),
    }))
  }, [data, decodedSport])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let next = [...rows]
    if (q) {
      next = next.filter((r) => {
        return (
          r.sportName.toLowerCase().includes(q) ||
          (r.eventName || '').toLowerCase().includes(q)
        )
      })
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

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.pl += Number(r.profitLoss || 0)
        acc.commission += Number(r.commission || 0)
        return acc
      },
      { pl: 0, commission: 0 }
    )
  }, [filteredRows])

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

  const titleSport = decodedSport

  const handleEventClick = (row) => {
    if (!row) return
    navigate(
      `/user-detail/${canonicalUserId}/profit-loss/${encodeURIComponent(decodedSport || '')}/event/${
        row.id
      }`,
      {
        state: {
          user,
          filters,
          eventRow: row,
        },
      }
    )
  }

  return (
    <div className="report-event-page">
      <Navbar />

      <div className="report-event-content">
        <div className="report-filter-section">
          <div className="report-filter-row" style={{ alignItems: 'center' }}>
            <button
              type="button"
              className="report-get-btn"
              onClick={() => navigate(-1)}
              style={{ background: '#6c757d' }}
            >
              ← Back
            </button>
            <div style={{ color: '#333', fontWeight: 600 }}>
              {user?.username ? `User: ${user.username}` : `User ID: ${userId}`}
              {titleSport ? ` | Sport: ${titleSport}` : ''}
            </div>
          </div>
          {(filters?.fromDate || filters?.toDate || filters?.dataSource) && (
            <div style={{ marginTop: 10, color: '#666', fontSize: 14 }}>
              {filters?.dataSource ? <span style={{ marginRight: 12 }}>Source: {filters.dataSource}</span> : null}
              {filters?.fromDate ? <span style={{ marginRight: 12 }}>From: {filters.fromDate}</span> : null}
              {filters?.toDate ? <span>To: {filters.toDate}</span> : null}
            </div>
          )}
        </div>

        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Profit &amp; Loss Events</div>
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
                    <th>Event Name</th>
                    <th>Profit &amp; Loss</th>
                    <th>Commission</th>
                    <th>Total P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        Loading...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        Failed to load data
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    <>
                      {paginatedRows.map((row) => {
                        const totalPL = Number(row.profitLoss || 0)
                        return (
                          <tr key={row.id}>
                            <td>{row.sportName}</td>
                            <td
                              className="sport-link"
                              onClick={() => handleEventClick(row)}
                            >
                              {row.eventName}
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
                            <td className={totalPL >= 0 ? 'pl-positive' : 'pl-negative'}>
                              {totalPL.toLocaleString('en-IN', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </tr>
                        )
                      })}

                      <tr className="total-row">
                        <td colSpan={2}>Total</td>
                        <td className={totals.pl >= 0 ? 'pl-positive' : 'pl-negative'}>
                          {totals.pl.toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td>
                          {totals.commission.toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={totals.pl >= 0 ? 'pl-positive' : 'pl-negative'}>
                          {totals.pl.toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
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
    </div>
  )
}

export default UserProfitLossEventsScreen

