import React, { useMemo, useState } from 'react'
import '../screen/BetlistScreen.css'
import { useGetUserBetsQuery } from '../redux/api/authApi'

function UserBetHistory({ userId, username }) {
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useGetUserBetsQuery(
    { userId, page: currentPage, limit: entriesPerPage },
    { skip: !userId }
  )

  const bets = data?.data?.bets || []
  const apiTotal = data?.data?.total
  const apiTotalPages = data?.data?.totalPages

  const formattedBets = useMemo(
    () =>
      bets.map((bet) => ({
        id: bet._id,
        sportName: bet.sport || '-',
        event: bet.eventName || '-',
        market: bet.marketName || bet.marketType || '-',
        selection: bet.selectionName || '-',
        type: (bet.betType || '').toUpperCase(),
        odds: bet.odds ?? '-',
        stake: bet.stake ?? 0,
        exposure: bet.exposure ?? 0,
        status: bet.status || '-',
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
        bet.sportName.toLowerCase().includes(q) ||
        bet.event.toLowerCase().includes(q) ||
        bet.market.toLowerCase().includes(q) ||
        bet.selection.toLowerCase().includes(q) ||
        bet.type.toLowerCase().includes(q) ||
        bet.status.toLowerCase().includes(q)
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

  if (!userId) {
    return (
      <div className="betlist-table-section">
        <div className="betlist-header-bar">Bet History</div>
        <div className="betlist-table-container">
          <div className="no-data">No user selected.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="betlist-table-section">
      <div className="betlist-header-bar">
        Bet History{username ? ` - ${username}` : ''}
      </div>
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
          <button
            className="betlist-get-btn"
            onClick={() => {
              setCurrentPage(1)
              refetch()
            }}
          >
            Refresh
          </button>
        </div>

        <div className="betlist-table-wrapper">
          <table className="betlist-table">
            <thead>
              <tr>
                <th>
                  <span className="th-title-with-icon">
                    <span>Sport</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Event</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Market</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Selection</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Type</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Odds</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Stake</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Exposure</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Status</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Place Time</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Settle Time</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    Loading bets...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    Failed to load bets.
                  </td>
                </tr>
              ) : paginatedBets.length === 0 ? (
                <tr>
                  <td colSpan="11" className="no-data">
                    No data available
                  </td>
                </tr>
              ) : (
                paginatedBets.map((bet) => (
                  <tr key={bet.id}>
                    <td>{bet.sportName}</td>
                    <td>{bet.event}</td>
                    <td>{bet.market}</td>
                    <td>{bet.selection}</td>
                    <td className={`bet-type ${bet.type.toLowerCase()}`}>{bet.type}</td>
                    <td>{bet.odds}</td>
                    <td>{bet.stake}</td>
                    <td>{bet.exposure}</td>
                    <td>{bet.status}</td>
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
  )
}

export default UserBetHistory

