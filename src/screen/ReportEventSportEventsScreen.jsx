import React, { useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'
import { useGetHierarchyProfitLossQuery } from '../redux/api/authApi'

function ReportEventSportEventsScreen() {
  const { sportName } = useParams()
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

  const { data, isLoading, isError } = useGetHierarchyProfitLossQuery(
    {
      sport: decodedSport?.toLowerCase() || undefined,
      from,
      to,
    },
    {
      skip: !from || !to,
    }
  )

  const apiRows = useMemo(() => Array.isArray(data?.data) ? data.data : [], [data])

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()

    let rows = apiRows
      .filter((item) =>
        (item.sport || '').toLowerCase() === decodedSport.toLowerCase()
      )
      .map((item, index) => ({
        id: item.eventId || index,
        sportName: (item.sport || '').toUpperCase(),
        eventName: item.eventName || '-',
        profitLoss: Number(item.profitLoss || 0),
        downlineProfitLoss: Number(item.downlineProfitLoss || 0),
        commission: Number(item.commission || 0),
      }))

    if (q) {
      rows = rows.filter((row) =>
        row.eventName.toLowerCase().includes(q)
      )
    }

    return rows
  }, [apiRows, decodedSport, searchTerm])

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

  const handleDownloadXls = () => {
    if (!filteredRows || filteredRows.length === 0) return

    const headers = [
      'Sport Name',
      'Event Name',
      'Profit & Loss',
      'Downline Profit/Loss',
      'Commission',
    ]

    const rows = filteredRows.map((row) => [
      row.sportName ?? '',
      row.eventName ?? '',
      row.profitLoss ?? 0,
      row.downlineProfitLoss ?? 0,
      row.commission ?? 0,
    ])

    const escapeCell = (value) => {
      const str = String(value ?? '')
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
    link.download = 'profit-loss-events.xls'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleEventClick = (row) => {
    if (!row) return
    navigate(
      `/report-event/sport/${encodeURIComponent(decodedSport || '')}/event/${row.id}`,
      {
        state: {
          eventName: row.eventName,
          settleTime: row.lastSettledAt,
          fromIso: from,
          toIso: to,
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
              Profit &amp; Loss Events – {decodedSport || 'All Sports'}
            </div>
          </div>
        </div>

        <div className="report-table-section">
          <div className="report-table-header">
            <div className="report-title">Profit &amp; Loss Events</div>
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
                    <th>Profit &amp; Loss</th>
                    <th>Downline Profit/Loss</th>
                    <th>Commission</th>
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
                      {paginatedRows.map((row) => (
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
                          <td className={row.downlineProfitLoss >= 0 ? 'pl-positive' : 'pl-negative'}>
                            {Number(row.downlineProfitLoss || 0).toLocaleString('en-IN', {
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
                        </tr>
                      ))}

                      <tr className="total-row">
                        <td colSpan={2}>Total</td>
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

export default ReportEventSportEventsScreen

