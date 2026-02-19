import React, { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'
import { useGetHierarchyProfitLossQuery } from '../redux/api/authApi'

function ReportEventScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dataSource, setDataSource] = useState('LIVE_DATA')
  const [fromDate, setFromDate] = useState('2025-02-01')
  const [fromTime, setFromTime] = useState('00:00')
  const [toDate, setToDate] = useState('2026-02-09')
  const [toTime, setToTime] = useState('23:59')
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  const buildDateTime = (date, time, isEnd) => {
    if (!date) return undefined
    if (!time) {
      return isEnd ? `${date}T23:59:59Z` : `${date}T00:00:00Z`
    }
    const suffix = isEnd ? ':59Z' : ':00Z'
    return `${date}T${time}${suffix}`
  }

  const fromIso = buildDateTime(fromDate, fromTime, false)
  const toIso = buildDateTime(toDate, toTime, true)

  const { data, isLoading, isError } = useGetHierarchyProfitLossQuery(
    {
      // Explicitly request cricket to match backend example
      sport: 'cricket',
      from: fromIso,
      to: toIso,
    },
    {
      skip: !fromIso || !toIso,
    }
  )

  const apiRows = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])

  const groupedBySport = useMemo(() => {
    const map = new Map()
    apiRows.forEach((item) => {
      const sportName = (item.sport || 'UNKNOWN').toUpperCase()
      const profit = Number(item.profitLoss || 0)

      const current = map.get(sportName) || {
        id: sportName,
        sportName,
        uplineProfitLoss: 0,
        downlineProfitLoss: 0,
        commission: 0,
      }

      current.uplineProfitLoss += profit
      current.downlineProfitLoss += profit
      map.set(sportName, current)
    })

    return Array.from(map.values())
  }, [apiRows])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let rows = [...groupedBySport]

    if (q) {
      rows = rows.filter((row) =>
        row.sportName.toLowerCase().includes(q)
      )
    }

    return rows
  }, [groupedBySport, searchTerm])

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
        acc.upline += Number(row.uplineProfitLoss || 0)
        acc.downline += Number(row.downlineProfitLoss || 0)
        acc.commission += Number(row.commission || 0)
        return acc
      },
      { upline: 0, downline: 0, commission: 0 }
    )
  }, [filteredRows])

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

  const handleGetPL = () => {
    setCurrentPage(1)
  }

  const handleSportClick = (row) => {
    if (!row?.sportName) return
    navigate(`/report-event/sport/${encodeURIComponent(row.sportName)}`, {
      state: {
        from: location.pathname,
        fromIso,
        toIso,
      },
    })
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
                    <th>Sport Name</th>
                    <th>Upline Profit/Loss</th>
                    <th>Downline profit/Loss</th>
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
                          <td
                            className="sport-link"
                            onClick={() => handleSportClick(row)}
                          >
                            {row.sportName}
                          </td>
                          <td className={row.uplineProfitLoss >= 0 ? 'pl-positive' : 'pl-negative'}>
                            {row.uplineProfitLoss.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className={row.downlineProfitLoss >= 0 ? 'pl-positive' : 'pl-negative'}>
                            {row.downlineProfitLoss.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td>
                            {row.commission.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                        </tr>
                      ))}

                      {/* Total row */}
                      <tr className="total-row">
                        <td>Total</td>
                        <td className={totals.upline >= 0 ? 'pl-positive' : 'pl-negative'}>
                          {totals.upline.toLocaleString('en-IN', {
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
                            minimumFractionDigits: 2,
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

export default ReportEventScreen