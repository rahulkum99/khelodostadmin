import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'

function ReportEventUserBetsScreen() {
  const { sportName, eventId, marketId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const decodedSport = useMemo(() => {
    try {
      return decodeURIComponent((sportName || '').toString())
    } catch {
      return (sportName || '').toString()
    }
  }, [sportName])

  const baseRows = useMemo(() => {
    const rows = Array.isArray(location.state?.rows) ? location.state.rows : []
    return rows.map((item, index) => ({
      id: index,
      username: item.username || 'DEMO2026',
      sportName: item.sport || decodedSport || 'Cricket',
      eventName: item.eventName || 'New Zealand v South Africa',
      marketName: item.marketName || 'Match Odds',
      result: item.result || 'South Africa',
      profitLoss: Number(item.profitLoss ?? -100),
      commission: Number(item.commission ?? 0),
      settleTime: item.settlementtime || item.lastSettledAt || new Date().toISOString(),
    }))
  }, [decodedSport, location.state])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let rows = [...baseRows]
    if (q) {
      rows = rows.filter((row) => {
        return (
          (row.username || '').toLowerCase().includes(q) ||
          (row.sportName || '').toLowerCase().includes(q) ||
          (row.eventName || '').toLowerCase().includes(q) ||
          (row.marketName || '').toLowerCase().includes(q)
        )
      })
    }
    return rows
  }, [baseRows, searchTerm])

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
        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Profit Loss User</div>
            <button className="download-btn">
              Download XLS
            </button>
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
                    <th>User Name</th>
                    <th>Sport Name</th>
                    <th>Event Name</th>
                    <th>Market Name</th>
                    <th>Result</th>
                    <th>Profit Loss</th>
                    <th>Commission</th>
                    <th>Settle Time</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">
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
                          <td className="sport-link">{row.username}</td>
                          <td>{row.sportName}</td>
                          <td>{row.eventName}</td>
                          <td>{row.marketName}</td>
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

export default ReportEventUserBetsScreen

