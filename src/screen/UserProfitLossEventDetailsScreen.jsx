import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'
import { useGetUserEventProfitLossQuery } from '../redux/api/authApi'

function UserProfitLossEventDetailsScreen() {
  const { userId, sportName, eventId, marketId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const user = location.state?.user

  const decodedSport = (() => {
    try {
      return decodeURIComponent((sportName || '').toString())
    } catch {
      return (sportName || '').toString()
    }
  })()
  const canonicalUserId = user?._id || userId

  const { data, isLoading, isError } = useGetUserEventProfitLossQuery(
    {
      userId: canonicalUserId,
      eventId,
      by: 'bet',
    },
    { skip: !canonicalUserId || !eventId }
  )

  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const rows = useMemo(() => {
    const items = Array.isArray(data?.data) ? data.data : []
    return items.map((item, index) => ({
      id: index,
      sportName: item.sport || decodedSport || 'Unknown',
      eventName: item.eventName || '-',
      marketName: item.marketName || '-',
      selectionName: item.selectionName || '-',
      betType: item.betType || '-',
      odd: item.odd,
      stake: item.stake,
      profitLoss: Number(item.profitLoss || 0),
      commission: Number(item.commission || 0),
      placedDate: item.placedDate,
      settlementtime: item.settlementtime || item.lastSettledAt || null,
      result: item.result || '-',
    }))
  }, [data, decodedSport])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let list = [...rows]
    if (q) {
      list = list.filter(
        (r) =>
          r.sportName.toLowerCase().includes(q) ||
          (r.eventName || '').toLowerCase().includes(q) ||
          (r.marketName || '').toLowerCase().includes(q) ||
          (r.selectionName || '').toLowerCase().includes(q) ||
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
              {eventId ? ` | Event ID: ${eventId}` : ''}
              {marketId ? ` | Market ID: ${marketId}` : ''}
            </div>
          </div>
        </div>

        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Event Profit &amp; Loss Details</div>
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
                    <th>Market Name</th>
                    <th>Selection Name</th>
                    <th>Bet Type</th>
                    <th>Odd</th>
                    <th>Stake</th>
                    <th>Profit &amp; Loss</th>
                    <th>Commission</th>
                    <th>Placed Date</th>
                    <th>Settlement Time</th>
                    <th>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="12" className="no-data">
                        Loading...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan="12" className="no-data">
                        Failed to load data
                      </td>
                    </tr>
                  ) : paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="no-data">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => {
                      const profitLoss = Number(row.profitLoss || 0)
                      const commission = Number(row.commission || 0)
                      const formattedPlacedDate = row.placedDate
                        ? new Date(row.placedDate).toLocaleString()
                        : '-'
                      const formattedSettleTime = row.settlementtime
                        ? new Date(row.settlementtime).toLocaleString()
                        : '-'

                      return (
                        <tr key={row.id}>
                          <td>{row.sportName}</td>
                          <td>{row.eventName}</td>
                          <td>{row.marketName}</td>
                          <td>{row.selectionName}</td>
                          <td>{row.betType}</td>
                          <td>{row.odd != null ? row.odd : '-'}</td>
                          <td>{row.stake != null ? row.stake : '-'}</td>
                          <td className={profitLoss >= 0 ? 'pl-positive' : 'pl-negative'}>
                            {profitLoss.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            {commission.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>{formattedPlacedDate}</td>
                          <td>{formattedSettleTime}</td>
                          <td>{row.result}</td>
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

export default UserProfitLossEventDetailsScreen

