import React, { useState, useMemo } from 'react'
import Navbar from '../component/Navbar'
import './PasswordHistoryScreen.css'
import { useGetPasswordChangeHistoryQuery } from '../redux/api/authApi'

function PasswordHistoryScreen() {
  const [entriesPerPage, setEntriesPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Fetch password change history from API
  const { data, isLoading, error } = useGetPasswordChangeHistoryQuery({
    page: currentPage,
    limit: entriesPerPage,
  });

  // Format date to readable format
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  };

  // Format remarks based on changeType and changedBy
  const formatRemarks = (changeType, changedBy) => {
    if (changeType === 'self') {
      return 'Password Changed By Self.';
    }
    if (changedBy?.username || changedBy?.name) {
      return `User Password Changed By ${changedBy.username || changedBy.name}.`;
    }
    return 'Password Changed.';
  };

  // Transform API data to display format
  const historyData = useMemo(() => {
    if (!data?.data?.history) return [];
    
    return data.data.history.map((item) => ({
      id: item.id || item._id,
      username: item.changedBy?.username || item.changedBy?.name || '-',
      remarks: formatRemarks(item.changeType, item.changedBy),
      dateTime: formatDateTime(item.createdAt),
      ipAddress: item.ipAddress || '-',
      device: item.device || '-',
      browser: item.browser || '-',
      os: item.os || '-',
      userAgent: item.userAgent || '-',
      changeType: item.changeType || '-',
      rawData: item // Keep raw data for search
    }));
  }, [data]);

  // Toggle row expansion
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return historyData;
    const searchLower = searchTerm.toLowerCase();
    return historyData.filter(item => {
      return (
        item.username.toLowerCase().includes(searchLower) ||
        item.remarks.toLowerCase().includes(searchLower) ||
        item.dateTime.toLowerCase().includes(searchLower) ||
        item.ipAddress.toLowerCase().includes(searchLower) ||
        item.device.toLowerCase().includes(searchLower) ||
        item.browser.toLowerCase().includes(searchLower) ||
        item.os.toLowerCase().includes(searchLower) ||
        item.userAgent.toLowerCase().includes(searchLower)
      );
    });
  }, [historyData, searchTerm]);

  // Get pagination info from API or calculate from filtered data
  const pagination = data?.data?.pagination;
  
  // Use server-side pagination when no search, client-side when searching
  const totalEntries = searchTerm ? filteredData.length : (pagination?.total ?? 0);
  const totalPages = searchTerm 
    ? Math.ceil(filteredData.length / entriesPerPage) 
    : (pagination?.pages ?? 1);
  
  // For client-side pagination when using search, server-side otherwise
  const paginatedData = searchTerm 
    ? filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
    : filteredData;
  
  const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0;
  const showingTo = Math.min(currentPage * entriesPerPage, totalEntries);

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
                  <option value={20}>20</option>
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
                    <th>
                      <span className="th-title-with-icon">
                        <span>Username</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>Remarks</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>Date &amp; Time</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>IP Address</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>Device</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>Browser</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>OS</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                    <th>
                      <span className="th-title-with-icon">
                        <span>Details</span>
                        <span className="sort-arrows">▲▼</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="8" className="no-data">Loading...</td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan="8" className="no-data">Error loading data. Please try again.</td>
                    </tr>
                  ) : paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="no-data">No data available</td>
                    </tr>
                  ) : (
                    paginatedData.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr className={expandedRows.has(item.id) ? 'expanded' : ''}>
                          <td>{item.username}</td>
                          <td>{item.remarks}</td>
                          <td>{item.dateTime}</td>
                          <td>{item.ipAddress}</td>
                          <td>{item.device}</td>
                          <td>{item.browser}</td>
                          <td>{item.os}</td>
                          <td>
                            <button
                              className="details-toggle-btn"
                              onClick={() => toggleRowExpansion(item.id)}
                              title={expandedRows.has(item.id) ? 'Hide details' : 'Show details'}
                            >
                              {expandedRows.has(item.id) ? '▼' : '▶'}
                            </button>
                          </td>
                        </tr>
                        {expandedRows.has(item.id) && (
                          <tr className="details-row">
                            <td colSpan="8">
                              <div className="details-content">
                                <div className="details-grid">
                                  <div className="detail-item">
                                    <span className="detail-item-label">Change Type:</span>
                                    <span className="detail-item-value">{item.changeType}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-item-label">IP Address:</span>
                                    <span className="detail-item-value">{item.ipAddress}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-item-label">Device:</span>
                                    <span className="detail-item-value">{item.device}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-item-label">Browser:</span>
                                    <span className="detail-item-value">{item.browser}</span>
                                  </div>
                                  <div className="detail-item">
                                    <span className="detail-item-label">Operating System:</span>
                                    <span className="detail-item-value">{item.os}</span>
                                  </div>
                                  <div className="detail-item full-width">
                                    <span className="detail-item-label">User Agent:</span>
                                    <span className="detail-item-value">{item.userAgent}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
