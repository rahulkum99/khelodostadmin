import React, { useState, useMemo } from 'react'
import Navbar from '../component/Navbar'
import './BetlistScreen.css'
import { useGetAdminBetListQuery } from '../redux/api/authApi'

function toDateInputValue(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getRangeForSource(source) {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (source === 'live') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { fromIso: start.toISOString(), toIso: end.toISOString(), fromInput: toDateInputValue(start), toInput: toDateInputValue(end) }
  }

  if (source === 'backup') {
    start.setDate(start.getDate() - 6)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { fromIso: start.toISOString(), toIso: end.toISOString(), fromInput: toDateInputValue(start), toInput: toDateInputValue(end) }
  }

  if (source === 'old') {
    start.setDate(start.getDate() - 29)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    return { fromIso: start.toISOString(), toIso: end.toISOString(), fromInput: toDateInputValue(start), toInput: toDateInputValue(end) }
  }

  return { fromIso: '', toIso: '', fromInput: '', toInput: '' }
}

function BetlistScreen() {
  const initialLiveRange = useMemo(() => getRangeForSource('live'), [])
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [dataSource, setDataSource] = useState('live')
  const [settlement, setSettlement] = useState('')
  const [sport, setSport] = useState('')
  const [fromDate, setFromDate] = useState(initialLiveRange.fromInput)
  const [toDate, setToDate] = useState(initialLiveRange.toInput)
  const [appliedFilters, setAppliedFilters] = useState({
    sport: '',
    settlement: '',
    status: '',
    settlementResult: '',
    from: initialLiveRange.fromIso,
    to: initialLiveRange.toIso,
  })

  const queryArgs = useMemo(
    () => ({
      page: currentPage,
      limit: entriesPerPage,
      ...(appliedFilters.sport ? { sport: appliedFilters.sport } : {}),
      ...(appliedFilters.settlement ? { settlement: appliedFilters.settlement } : {}),
      ...(appliedFilters.status ? { status: appliedFilters.status } : {}),
      ...(appliedFilters.settlementResult ? { settlementResult: appliedFilters.settlementResult } : {}),
      ...(appliedFilters.from ? { from: appliedFilters.from } : {}),
      ...(appliedFilters.to ? { to: appliedFilters.to } : {}),
    }),
    [currentPage, entriesPerPage, appliedFilters]
  )

  const { data, isLoading, error } = useGetAdminBetListQuery(queryArgs)

  const bets = data?.data?.bets || []
  const apiTotal = data?.data?.total
  const apiTotalPages = data?.data?.totalPages

  const formattedBets = useMemo(
    () =>
      bets.map((bet) => ({
        id: bet._id,
        username: bet.userId?.username || bet.userId?.name || '-',
        sportName: bet.sport || '-',
        event: bet.eventName || '-',
        market: bet.marketName || bet.marketType || '-',
        selection: bet.selectionName || '-',
        type: (bet.betType || '').toUpperCase(),
        odds: bet.odds ?? '-',
        stake: bet.stake ?? 0,
        placeTime: bet.createdAt
          ? new Date(bet.createdAt).toLocaleString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })
          : '-',
        settleTime: bet.settledAt
          ? new Date(bet.settledAt).toLocaleString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            })
          : '-',
      })),
    [bets]
  )

  const filteredBets = useMemo(() => {
    if (!searchTerm) return formattedBets
    const q = searchTerm.toLowerCase()
    return formattedBets.filter((bet) => {
      return (
        bet.username.toLowerCase().includes(q) ||
        bet.sportName.toLowerCase().includes(q) ||
        bet.event.toLowerCase().includes(q) ||
        bet.market.toLowerCase().includes(q) ||
        bet.selection.toLowerCase().includes(q) ||
        bet.type.toLowerCase().includes(q)
      )
    })
  }, [formattedBets, searchTerm])

  const totalEntries = searchTerm ? filteredBets.length : apiTotal ?? formattedBets.length

  const pagesFromApiOrCalc = searchTerm
    ? Math.ceil(filteredBets.length / entriesPerPage) || 1
    : apiTotalPages ?? 1

  const totalPages = Math.max(1, pagesFromApiOrCalc)

  const paginatedBets = searchTerm
    ? filteredBets.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
    : filteredBets

  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

  const handleGetHistory = () => {
    let fromIso = ''
    let toIso = ''
    let nextFromInput = fromDate
    let nextToInput = toDate

    if (dataSource === 'live' || dataSource === 'backup' || dataSource === 'old') {
      const range = getRangeForSource(dataSource)
      fromIso = range.fromIso
      toIso = range.toIso
      nextFromInput = range.fromInput
      nextToInput = range.toInput
    } else {
      if (fromDate) fromIso = new Date(`${fromDate}T00:00:00.000Z`).toISOString()
      if (toDate) toIso = new Date(`${toDate}T23:59:59.999Z`).toISOString()
    }

    setFromDate(nextFromInput)
    setToDate(nextToInput)

    let nextStatus = ''
    let nextSettlementResult = ''
    if (settlement === 'settled') nextStatus = 'settled'
    if (settlement === 'unsettled') nextStatus = 'open'
    if (settlement === 'void') {
      nextStatus = 'settled'
      nextSettlementResult = 'void'
    }

    setAppliedFilters({
      sport,
      settlement,
      status: nextStatus,
      settlementResult: nextSettlementResult,
      from: fromIso,
      to: toIso,
    })
    setCurrentPage(1)
  }

  return (
    <div className="betlist-page">
      <Navbar />
      <div className="betlist-content">
        {/* Filter Bar */}
        <div className="betlist-filter-section">
            <div className="betlist-filter-row">
            <div className="filter-group">
              <label className="filter-label">Data Source</label>
              <select
                className="filter-select"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
              >
                <option value="live">LIVE DATA</option>
                <option value="backup">BACKUP DATA</option>
                <option value="old">OLD DATA</option>
            
              </select>
              
            </div>
            <div className="filter-group">
              <label className="filter-label">Choose Type</label>
              <select
                className="filter-select"
                value={settlement}
                onChange={(e) => setSettlement(e.target.value)}
              >
                <option value="">All</option>
                <option value="settled">Settled</option>
                <option value="unsettled">Unsettled</option>
                <option value="void">Void</option>

              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Choose Sport</label>
              <select
                className="filter-select"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
              >
                <option value="">All</option>
                <option value="cricket">Cricket</option>
                <option value="soccer">Soccer</option>
                <option value="tennis">Tennis</option>
                <option value="casino">Casino</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">From</label>
              <input
                type="date"
                className="filter-date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <label className="filter-label">To</label>
              <input
                type="date"
                className="filter-date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <button
              className="betlist-get-btn"
              onClick={handleGetHistory}
            >
              Get History
            </button>
          </div>
        </div>

        {/* Bet History Table */}
        <div className="betlist-table-section">
          <div className="betlist-header-bar">Bet History</div>
          <div className="betlist-table-container">
            <div className="betlist-table-controls">
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

            <div className="betlist-table-wrapper">
              <table className="betlist-table">
                <thead>
                  <tr>
                    <th>User Name</th>
                    <th>SportName</th>
                    <th>Event</th>
                    <th>Market</th>
                    <th>Selection</th>
                    <th>Type</th>
                    <th>Odds Req.</th>
                    <th>Stack</th>
                    <th>Place Time</th>
                    <th>Settle Time</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="10" className="no-data">
                        Loading bets...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="10" className="no-data">
                        Failed to load bets.
                      </td>
                    </tr>
                  ) : paginatedBets.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="no-data">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    paginatedBets.map((bet) => (
                      <tr key={bet.id}>
                        <td className="betlist-link">{bet.username}</td>
                        <td>{bet.sportName}</td>
                        <td>{bet.event}</td>
                        <td>{bet.market}</td>
                        <td>{bet.selection}</td>
                        <td className={`bet-type ${bet.type.toLowerCase()}`}>{bet.type}</td>
                        <td>{bet.odds}</td>
                        <td>{bet.stake}</td>
                        <td>{bet.placeTime}</td>
                        <td>{bet.settleTime}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="betlist-footer">
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

export default BetlistScreen