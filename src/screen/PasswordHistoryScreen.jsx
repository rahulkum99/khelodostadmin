import React, { useState } from 'react'
import Navbar from '../component/Navbar'
import './PasswordHistoryScreen.css'

function PasswordHistoryScreen() {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sample data - replace with API call
  const sampleData = [
    {
      id: 1,
      username: 'demo2026',
      remarks: 'Password Changed By Self.',
      dateTime: 'Dec 21, 2025, 2:15:18 PM'
    },
    {
      id: 2,
      username: 'demo2026',
      remarks: 'User Password Changed By sixtynine1.',
      dateTime: 'Dec 21, 2025, 1:54:15 PM'
    },
    {
      id: 3,
      username: 'demo2026',
      remarks: 'Password Changed By Self.',
      dateTime: 'Dec 19, 2025, 7:18:18 PM'
    },
    {
      id: 4,
      username: 'demo2026',
      remarks: 'User Password Changed By sixtynine1.',
      dateTime: 'Dec 19, 2025, 7:17:30 PM'
    },
    {
      id: 5,
      username: 'demo2026',
      remarks: 'Password Changed By Self.',
      dateTime: 'Nov 19, 2025, 11:32:56 AM'
    },
    {
      id: 6,
      username: 'dev2026',
      remarks: 'Password Changed By Self.',
      dateTime: 'Nov 19, 2025, 11:24:43 AM'
    },
    {
      id: 7,
      username: 'dev2026',
      remarks: 'User Password Changed By sixtynine1.',
      dateTime: 'Nov 19, 2025, 11:19:43 AM'
    },
    {
      id: 8,
      username: 'dev2026',
      remarks: 'Password Changed By Self.',
      dateTime: 'Oct 26, 2025, 5:40:55 PM'
    }
  ];

  // Filter data based on search term
  const filteredData = sampleData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.username.toLowerCase().includes(searchLower) ||
      item.remarks.toLowerCase().includes(searchLower) ||
      item.dateTime.toLowerCase().includes(searchLower)
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

  return (
    <div className="password-history-container">
      <Navbar />
      <div className="password-history-content">
        <div className="password-history-section">
          <div className="password-history-header">Password Change History</div>
          <div className="password-history-table-container">
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
              <table className="password-history-table">
                <thead>
                  <tr>
                    <th>Username <span className="sort-arrows">▲▼</span></th>
                    <th>Remarks <span className="sort-arrows">▲▼</span></th>
                    <th>Date & Time <span className="sort-arrows">▲▼</span></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="no-data">No data available</td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.username}</td>
                        <td>{item.remarks}</td>
                        <td>{item.dateTime}</td>
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
      </div>
    </div>
  )
}

export default PasswordHistoryScreen
