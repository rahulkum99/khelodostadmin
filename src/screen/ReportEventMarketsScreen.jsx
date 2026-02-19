import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'
import { useGetHierarchySettledBetsQuery } from '../redux/api/authApi'

function ReportEventMarketsScreen() {
  const { sportName, eventId } = useParams()
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

  const from = location.state?.fromIso
  const to = location.state?.toIso

  const { data, isLoading, isError } = useGetHierarchySettledBetsQuery(
    {
      sport: decodedSport?.toLowerCase() || undefined,
      eventId,
      from,
      to,
      // Align with external API example: MATCH_ODDS
      marketName: 'MATCH_ODDS',
    },
    {
      skip: !from || !to,
    }
  )

  const apiRows = useMemo(() => {
    const all = Array.isArray(data?.data) ? data.data : []
    // Ensure we only work with rows for the currently selected event
    return all.filter((item) => String(item.eventId) === String(eventId))
  }, [data, eventId])

  const baseRows = useMemo(() => {
    const map = new Map()

    apiRows.forEach((item, index) => {
      const key = item.marketId || `market-${index}`

      const existing = map.get(key) || {
        id: key,
        sportName: (item.sport || '').toUpperCase(),
        eventName: item.eventName || '-',
        marketName: item.marketName || 'Match Odds',
        result: item.result || '-',
        profitLoss: 0,
        commission: 0,
        settleTime: item.settlementtime || item.lastSettledAt || null,
      }

      existing.profitLoss += Number(item.profitLoss ?? 0)

      const candidateTime = item.settlementtime || item.lastSettledAt
      if (candidateTime) {
        if (!existing.settleTime) {
          existing.settleTime = candidateTime
        } else if (new Date(candidateTime) > new Date(existing.settleTime)) {
          existing.settleTime = candidateTime
        }
      }

      // Prefer a non-placeholder result if available
      if (item.result && existing.result === '-') {
        existing.result = item.result
      }

      map.set(key, existing)
    })

    return Array.from(map.values())
  }, [apiRows])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let rows = [...baseRows]
    if (q) {
      rows = rows.filter((row) => {
        return (
          row.sportName.toLowerCase().includes(q) ||
          row.eventName.toLowerCase().includes(q) ||
          row.marketName.toLowerCase().includes(q) ||
          row.result.toLowerCase().includes(q)
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

  const handleDownloadXls = () => {
    if (!filteredRows || filteredRows.length === 0) return

    const headers = [
      'Sport Name',
      'Event Name',
      'Market Name',
      'Result',
      'Profit & Loss',
      'Commission',
      'Settle Time',
    ]

    const rows = filteredRows.map((row) => [
      row.sportName ?? '',
      row.eventName ?? '',
      row.marketName ?? '',
      row.result ?? '',
      row.profitLoss ?? 0,
      row.commission ?? 0,
      row.settleTime
        ? new Date(row.settleTime).toLocaleString()
        : '',
    ])

    const escapeCell = (value) => {
      const str = String(value ?? '')
      // Escape quotes and wrap in quotes to be safe for Excel/CSV
      return `"${str.replace(/"/g, '""')}"`
    }

    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map((row) => row.map(escapeCell).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'profit-loss-markets.xls'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleMarketClick = (row) => {
    if (!row) return
    const rowsForMarket = apiRows.filter((item) => {
      const sameMarket = (item.marketId || row.id) === row.id
      const sameEvent = String(item.eventId) === String(eventId)
      return sameMarket && sameEvent
    })
    navigate(
      `/report-event/sport/${encodeURIComponent(decodedSport || '')}/event/${eventId}/market/${row.id}/users`,
      {
        state: {
          rows: rowsForMarket,
        },
      }
    )
  }

  return (
    <div className="report-event-page">
      <Navbar />

      <div className="report-event-content">
        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Profit &amp; Loss Markets</div>
            <button className="download-btn" onClick={handleDownloadXls}>
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

export default ReportEventMarketsScreen

