import React, { useState } from 'react'
import './AccountStatement.css'

function AccountStatement() {
  const [dataSource, setDataSource] = useState('');
  const [fromDate, setFromDate] = useState('2026-01-05');
  const [toDate, setToDate] = useState('2026-01-05');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const handleGetStatement = () => {
    // TODO: Implement API call to fetch statement
    console.log('Get Statement:', { dataSource, fromDate, toDate });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="account-statement-container">
      {/* Filter Section */}
      <div className="statement-section">
        <div className="statement-header">Account Statement</div>
        <div className="statement-filters">
          <div className="filter-group">
            <label className="filter-label">Data Source</label>
            <div className="select-wrapper">
              <select 
                className="filter-select"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
              >
                <option value="">Data Source</option>
                <option value="all">All</option>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
              </select>
              <span className="select-arrow">▼</span>
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">From</label>
            <div className="date-wrapper">
              <input
                type="date"
                className="filter-date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
              <span className="date-icon">📅</span>
            </div>
          </div>
          <div className="filter-group">
            <label className="filter-label">To</label>
            <div className="date-wrapper">
              <input
                type="date"
                className="filter-date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
              <span className="date-icon">📅</span>
            </div>
          </div>
          <button className="get-statement-btn" onClick={handleGetStatement}>
            Get Statement
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="statement-section">
        <div className="statement-header">Account Statement</div>
        <div className="statement-table-container">
          <div className="table-controls">
            <div className="entries-control">
              <label>Show</label>
              <select 
                className="entries-select"
                value={entriesPerPage}
                onChange={(e) => setEntriesPerPage(Number(e.target.value))}
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
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder=""
              />
            </div>
          </div>

          <div className="table-wrapper">
            <table className="statement-table">
              <thead>
                <tr>
                  <th>Date/Time <span className="sort-arrows">▲▼</span></th>
                  <th>Deposit <span className="sort-arrows">▲▼</span></th>
                  <th>Withdraw <span className="sort-arrows">▲▼</span></th>
                  <th>Balance <span className="sort-arrows">▲▼</span></th>
                  <th>Remark <span className="sort-arrows">▲▼</span></th>
                  <th>from//To <span className="sort-arrows">▲▼</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="6" className="no-data">No data!</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <div className="pagination-info">
              Showing 0 to 0 of 0 entries
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button 
                className="pagination-btn"
                disabled
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
              <button 
                className="pagination-btn"
                disabled
                onClick={() => setCurrentPage(1)}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountStatement

