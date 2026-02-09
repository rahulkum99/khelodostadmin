import React, { useMemo, useState } from 'react'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'

// Temporary mock data for design/demo purposes
const MOCK_DOWNLINE_PL = [
  {
    id: 1,
    userName: 'MARYAM1',
    profitLoss: 0,
    downlineProfitLoss: 0,
    commission: 0,
  },
  {
    id: 2,
    userName: 'DEV2026',
    profitLoss: 0,
    downlineProfitLoss: 0,
    commission: 0,
  },
  {
    id: 3,
    userName: 'DEMO2026',
    profitLoss: 0,
    downlineProfitLoss: 0,
    commission: 0,
  },
]

function ReportDownlineScreen() {
  const [dataSource, setDataSource] = useState('LIVE_DATA')
  const [fromDate, setFromDate] = useState('2026-02-08')
  const [fromTime, setFromTime] = useState('00:00')
  const [toDate, setToDate] = useState('2026-02-08')
  const [toTime, setToTime] = useState('23:59')
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let rows = [...MOCK_DOWNLINE_PL]

    if (q) {
      rows = rows.filter((row) =>
        row.userName.toLowerCase().includes(q)
      )
    }

    return rows
  }, [searchTerm])

  const totalEntries = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage))

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    const end = start + entriesPerPage
    return filteredRows.slice(start, end)
  }, [filteredRows, currentPage, entriesPerPage])

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => {
        acc.pl += Number(row.profitLoss || 0)
        acc.downline += Number(row.downlineProfitLoss || 0)
        acc.commission += Number(row.commission || 0)
        return acc
      },
      { pl: 0, downline: 0, commission: 0 }
    )
  }, [filteredRows])

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

  const handleGetPL = () => {
    // For now this just resets the page and would trigger API in future
    setCurrentPage(1)
  }

  const handleReset = () => {
    setDataSource('LIVE_DATA')
    setFromDate('2026-02-08')
    setFromTime('00:00')
    setToDate('2026-02-08')
    setToTime('23:59')
    setSearchTerm('')
    setEntriesPerPage(10)
    setCurrentPage(1)
  }

  return (
    <div className="report-event-page">
      <Navbar />

      <div className="report-event-content">
        {/* Filter Bar */}
        <div className="report-filter-section">
          <div className="report-filter-row">
            <div className="filter-group">
              <label className="filter-label">Data Source</label>
              <div className="select-wrapper">
                <select
                  className="filter-select"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
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
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <input
                  type="time"
                  className="filter-time"
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
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
                  onChange={(e) => setToDate(e.target.value)}
                />
                <input
                  type="time"
                  className="filter-time"
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                />
              </div>
            </div>

            <button className="report-get-btn" onClick={handleGetPL}>
              Get P&amp;L
            </button>
            <button className="report-get-btn report-reset-btn" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>

        {/* Profit / Loss Table Section */}
        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Profit Loss</div>
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
                    <th>Profit/Loss</th>
                    <th>Downline Profit/Loss</th>
                    <th>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    <>
                      {paginatedRows.map((row) => (
                        <tr key={row.id}>
                          <td className="sport-link">{row.userName}</td>
                          <td className={row.profitLoss >= 0 ? 'pl-positive' : 'pl-negative'}>
                            {row.profitLoss.toLocaleString('en-IN', {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className={row.downlineProfitLoss >= 0 ? 'pl-positive' : 'pl-negative'}>
                            {row.downlineProfitLoss.toLocaleString('en-IN', {
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
                        </tr>
                      ))}

                      {/* Total row */}
                      <tr className="total-row">
                        <td>Total</td>
                        <td className={totals.pl >= 0 ? 'pl-positive' : 'pl-negative'}>
                          {totals.pl.toLocaleString('en-IN', {
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className={totals.downline >= 0 ? 'pl-positive' : 'pl-negative'}>
                          {totals.downline.toLocaleString('en-IN', {
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

export default ReportDownlineScreen