import React, { useState } from 'react'
import './UserListTable.css'

function UserListTable({ title = "User List" }) {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sample summary data
  const summaryData = {
    totalBalance: 4312,
    totalExposure: 0,
    availableBalance: 4312,
    balance: 2250,
    totalAvailBal: 6562,
    uplinePL: 6562
  };

  // Sample table data
  const sampleData = [
    {
      id: 1,
      username: 'demo2026',
      userType: 'USER',
      creditRef: 0.00,
      balance: 1719,
      exposure: 0,
      exposureLimit: 2000000,
      availBal: 1719,
      refPL: 1719,
      partnership: 100,
      status: 'active'
    },
    {
      id: 2,
      username: 'dev2026',
      userType: 'USER',
      creditRef: 0.00,
      balance: 1697,
      exposure: 0,
      exposureLimit: 2000000,
      availBal: 1697,
      refPL: 1697,
      partnership: 100,
      status: 'active'
    }
  ];

  // Filter data based on search term
  const filteredData = sampleData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.username.toLowerCase().includes(searchLower) ||
      item.userType.toLowerCase().includes(searchLower) ||
      item.status.toLowerCase().includes(searchLower)
    );
  });

  // Calculate pagination
  const totalEntries = filteredData.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const showingFrom = totalEntries > 0 ? startIndex + 1 : 0;
  const showingTo = Math.min(endIndex, totalEntries);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  return (
    <div className="user-list-container">
      {/* Top Actions */}
      <div className="user-list-header-actions">
        <button className="refresh-btn" title="Refresh">
          <span>🔄</span>
        </button>
        <button className="add-user-btn">
          <span>👤</span>
          <span>Add User</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="summary-metrics">
        <div className="metric-box">
          <div className="metric-label">Total Balance</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.totalBalance)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Total Exposure</div>
          <div className="metric-value exposure-zero">IRP ({summaryData.totalExposure})</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Available Balance</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.availableBalance)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Balance</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.balance)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Total Avail. bal.</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.totalAvailBal)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-label">Upline P/L</div>
          <div className="metric-value">IRP {formatCurrency(summaryData.uplinePL)}</div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="user-list-table-section">
        <div className="table-controls">
          <div className="entries-control">
            <label>Show</label>
            <select 
              className="entries-select"
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
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
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder=""
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="user-list-table">
            <thead>
              <tr>
                <th>Username <span className="sort-arrows">▲▼</span></th>
                <th>Credit Ref. <span className="sort-arrows">▲▼</span></th>
                <th>Balance <span className="sort-arrows">▲▼</span></th>
                <th>Exposure <span className="sort-arrows">▲▼</span></th>
                <th>Exposure Limit <span className="sort-arrows">▲▼</span></th>
                <th>Avail.Bal. <span className="sort-arrows">▲▼</span></th>
                <th>Ref. P/L <span className="sort-arrows">▲▼</span></th>
                <th>Partnership <span className="sort-arrows">▲▼</span></th>
                <th>Status <span className="sort-arrows">▲▼</span></th>
                <th>Actions <span className="sort-arrows">▲▼</span></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="10" className="no-data">No data available</td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className="user-badge">{item.userType}</span>
                      <span className="username-text">{item.username}</span>
                    </td>
                    <td>
                      <span>{formatCurrency(item.creditRef)}</span>
                      <span className="action-icons">
                        <button className="icon-btn" title="Edit">✏️</button>
                        <button className="icon-btn" title="View">👁️</button>
                      </span>
                    </td>
                    <td>{formatCurrency(item.balance)}</td>
                    <td className={item.exposure === 0 ? 'exposure-zero' : ''}>
                      ({formatCurrency(item.exposure)})
                    </td>
                    <td>
                      <span>{formatCurrency(item.exposureLimit)}</span>
                      <button className="icon-btn" title="Edit">✏️</button>
                    </td>
                    <td>{formatCurrency(item.availBal)}</td>
                    <td>({formatCurrency(item.refPL)})</td>
                    <td>{item.partnership}%</td>
                    <td>
                      <span className={`status-badge ${item.status === 'active' ? 'active' : ''}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-group">
                        <button className="action-icon-btn" title="Banking">💰</button>
                        <button className="action-icon-btn" title="Transfer">↕️</button>
                        <button className="action-icon-btn" title="More">☰</button>
                        <button className="action-icon-btn" title="Settings">⚙️</button>
                        <button className="action-icon-btn" title="User">👤</button>
                        <button className="action-icon-btn" title="Balance">Ba</button>
                        <button className="action-icon-btn" title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
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
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
            <button 
              className="pagination-btn"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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

export default UserListTable

