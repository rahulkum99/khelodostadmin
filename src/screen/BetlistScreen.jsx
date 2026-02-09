import React, { useState, useMemo } from 'react'
import Navbar from '../component/Navbar'
import './BetlistScreen.css'
import { useGetAdminBetListQuery } from '../redux/api/authApi'

function BetlistScreen() {
  const [entriesPerPage, setEntriesPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const { data, isLoading, error, refetch } = useGetAdminBetListQuery({
    page: currentPage,
    limit: entriesPerPage,
  })

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

  return (
    <div className="betlist-page">
      <Navbar />
      <div className="betlist-content">
        {/* Filter Bar */}
        <div className="betlist-filter-section">
            <div className="betlist-filter-row">
            <div className="filter-group">
              <label className="filter-label">Data Source</label>
              <select className="filter-select">
                <option>LIVE DATA</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Choose Type</label>
              <select className="filter-select">
                <option>Settle</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">Choose Sport</label>
              <select className="filter-select">
                <option>Cricket</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-label">From</label>
              <input type="date" className="filter-date" />
            </div>
            <div className="filter-group">
              <label className="filter-label">To</label>
              <input type="date" className="filter-date" />
            </div>
            <button
              className="betlist-get-btn"
              onClick={() => {
                setCurrentPage(1)
                refetch()
              }}
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