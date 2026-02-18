import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'
import { useGetUserEventProfitLossQuery } from '../redux/api/authApi'

function UserProfitLossMarketsScreen() {
  const { userId, sportName, eventId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = location.state?.user
  const filters = location.state?.filters || {}
  const rowFromState = location.state?.eventRow

  const canonicalUserId = user?._id || userId

  const decodedSport = useMemo(() => {
    try {
      return decodeURIComponent((sportName || '').toString())
    } catch {
      return (sportName || '').toString()
    }
  }, [sportName])

  const { data, isLoading, isError } = useGetUserEventProfitLossQuery(
    {
      userId: canonicalUserId,
      eventId,
      by: 'market',
    },
    { skip: !canonicalUserId || !eventId }
  )

  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : []
    return items.map((item, index) => ({
      id: item.marketId || index,
      sportName: item.sport || decodedSport || 'Unknown',
      eventName: item.eventName || rowFromState?.eventName || '-',
      marketName: item.marketName || 'Match Odds',
      result: item.result || '-',
      profitLoss: Number(item.profitLoss || 0),
      commission: Number(item.commission || 0),
      settleTime: item.settlementtime || item.lastSettledAt || null,
      // extra fields used by details screen
      selectionName: item.selectionName,
      betType: item.betType,
      odd: item.odd,
      stake: item.stake,
      placedDate: item.placedDate,
      settlementtime: item.settlementtime,
      raw: item,
    }))
  }, [data, decodedSport, rowFromState])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let list = [...rows]
    if (q) {
      list = list.filter(
        (r) =>
          r.sportName.toLowerCase().includes(q) ||
          (r.eventName || '').toLowerCase().includes(q) ||
          (r.marketName || '').toLowerCase().includes(q) ||
          (r.result || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [rows, searchTerm])

  const totalEntries = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage))

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    const end = start + entriesPerPage
    return filteredRows.slice(start, end)
  }, [filteredRows, currentPage, entriesPerPage])

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

  const handleMarketClick = (row) => {
    if (!row) return
    navigate(
      `/user-detail/${canonicalUserId}/profit-loss/${encodeURIComponent(
        decodedSport || ''
      )}/event/${eventId}/market/${row.id}`,
      {
        state: {
          user,
          filters,
          marketRow: row,
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
              {decodedSport ? ` | Sport: ${decodedSport}` : ''}
            </div>
          </div>
          {(filters?.fromDate || filters?.toDate || filters?.dataSource) && (
            <div style={{ marginTop: 10, color: '#666', fontSize: 14 }}>
              {filters?.dataSource ? (
                <span style={{ marginRight: 12 }}>Source: {filters.dataSource}</span>
              ) : null}
              {filters?.fromDate ? (
                <span style={{ marginRight: 12 }}>From: {filters.fromDate}</span>
              ) : null}
              {filters?.toDate ? <span>To: {filters.toDate}</span> : null}
            </div>
          )}
        </div>

        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Profit &amp; Loss Markets</div>
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
              <table className="report-table table-nowrap">
                <thead>
                  <tr>
                    <th>Sport Name</th>
                    <th>Event Name</th>
                    <th>Market Name</th>
                    <th>Result</th>
                    <th>Profit &amp; Loss</th>
                    <th>Commission</th>
                    <th>Settle Time</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        Loading...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        Failed to load data
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => {
                      const formattedSettleTime = row.settleTime
                        ? new Date(row.settleTime).toLocaleString()
                        : '-'

                      return (
                        <tr key={row.id}>
                          <td>{row.sportName}</td>
                          <td>{row.eventName}</td>
                          <td
                            className="sport-link"
                            onClick={() => handleMarketClick(row)}
                          >
                            {row.marketName}
                          </td>
                          <td>{row.result}</td>
                          <td
                            className={
                              row.profitLoss >= 0 ? 'pl-positive' : 'pl-negative'
                            }
                          >
                            {row.profitLoss.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            {row.commission.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{formattedSettleTime}</td>
                        </tr>
                      )
                    })
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
                  disabled={currentPage === 1 || totalEntries === 0}
                  onClick={() => setCurrentPage(1)}
                >
                  First
                </button>
                <button
                  className="pagination-btn"
                  disabled={currentPage === 1 || totalEntries === 0}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>
                <button className="pagination-btn active" disabled>
                  {currentPage}
                </button>
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages || totalEntries === 0}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                >
                  Next
                </button>
                <button
                  className="pagination-btn"
                  disabled={currentPage === totalPages || totalEntries === 0}
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

export default UserProfitLossMarketsScreen

