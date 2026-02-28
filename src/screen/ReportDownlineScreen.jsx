import React, { useMemo, useState } from 'react'
import Navbar from '../component/Navbar'
import './ReportEventScreen.css'
import { useGetUserHierarchyQuery } from '../redux/api/authApi'

const flattenHierarchy = (nodes, level = 0, parentId = null) => {
  if (!Array.isArray(nodes)) return []

  const flat = []

  nodes.forEach((node) => {
    const { children, ...rest } = node
    const currentId = node._id || node.id || null
    const hasChildren = Array.isArray(children) && children.length > 0

    flat.push({
      ...rest,
      level,
      parentId,
      id: currentId,
      hasChildren,
    })

    if (hasChildren) {
      flat.push(...flattenHierarchy(children, level + 1, currentId))
    }
  })

  return flat
}

function ReportDownlineScreen() {
  const [dataSource, setDataSource] = useState('LIVE_DATA')
  const [fromDate, setFromDate] = useState('2026-02-08')
  const [fromTime, setFromTime] = useState('00:00')
  const [toDate, setToDate] = useState('2026-02-08')
  const [toTime, setToTime] = useState('23:59')
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedIds, setExpandedIds] = useState(() => new Set())

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

  const { data, isLoading, isError } = useGetUserHierarchyQuery(
    {
      from: fromIso,
      to: toIso,
    },
    {
      skip: !fromIso || !toIso,
    }
  )

  const apiRows = useMemo(() => {
    if (!Array.isArray(data?.data)) return []
    return flattenHierarchy(data.data)
  }, [data])

  const rootProfitLoss = data?.meta?.rootProfitLoss ?? null

  const filteredRows = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    let rows = [...apiRows]

    if (q) {
      rows = rows.filter((row) => {
        const name = (row.username || row.userName || '').toLowerCase()
        return name.includes(q)
      })
    }

    return rows
  }, [apiRows, searchTerm])

  const visibleRows = useMemo(() => {
    if (!filteredRows.length) return []

    const byId = new Map(filteredRows.map((row) => [row.id, row]))

    const isVisible = (row) => {
      if (!row.parentId) return true

      let parentId = row.parentId
      while (parentId) {
        if (!expandedIds.has(parentId)) return false
        const parent = byId.get(parentId)
        parentId = parent?.parentId || null
      }

      return true
    }

    return filteredRows.filter(isVisible)
  }, [filteredRows, expandedIds])

  const totalEntries = visibleRows.length
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage))

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage
    const end = start + entriesPerPage
    return visibleRows.slice(start, end)
  }, [visibleRows, currentPage, entriesPerPage])

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

  const toggleExpand = (id, hasChildren) => {
    if (!id || !hasChildren) return
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

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
            {rootProfitLoss != null && (
              <div
                className={
                  Number(rootProfitLoss) >= 0 ? 'pl-positive' : 'pl-negative'
                }
              >
                Root P&amp;L:{' '}
                {Number(rootProfitLoss).toLocaleString('en-IN', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
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
                      {paginatedRows.map((row) => {
                        const profit = Number(row.profitLoss ?? 0)
                        const downline = Number(row.downlineProfitLoss ?? 0)
                        const commission = Number(row.commission ?? 0)

                        return (
                          <tr key={row._id || row.id}>
                            <td
                              className="sport-link"
                              onClick={() => toggleExpand(row.id, row.hasChildren)}
                              style={{ paddingLeft: `${16 * (row.level || 0)}px`, cursor: row.hasChildren ? 'pointer' : 'default' }}
                            >
                              {row.hasChildren && (
                                <span style={{ marginRight: 8 }}>
                                  {expandedIds.has(row.id) ? '-' : '+'}
                                </span>
                              )}
                              {row.username || row.userName}
                            </td>
                            <td
                              className={
                                profit >= 0 ? 'pl-positive' : 'pl-negative'
                              }
                            >
                              {profit.toLocaleString('en-IN', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td
                              className={
                                downline >= 0 ? 'pl-positive' : 'pl-negative'
                              }
                            >
                              {downline.toLocaleString('en-IN', {
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
                          </tr>
                        )
                      })}

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