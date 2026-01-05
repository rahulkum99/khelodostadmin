import React, { useState } from 'react'
import './BankingTable.css'

function BankingTable({ title = "Banking" }) {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({});

  // Sample table data
  const sampleData = [
    {
      id: 1,
      uid: 'dev2026',
      balance: 1697.12,
      availableDW: '',
      exposure: 0,
      creditRef: 0,
      refPL: 1697.12,
      depositWithdraw: 0,
      remark: 'Remark'
    },
    {
      id: 2,
      uid: 'demo2026',
      balance: 1719,
      availableDW: '',
      exposure: 0,
      creditRef: 0,
      refPL: 1719,
      depositWithdraw: 0,
      remark: 'Remark'
    }
  ];

  // Filter data based on search term
  const filteredData = sampleData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return item.uid.toLowerCase().includes(searchLower);
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
    if (value === null || value === undefined) return '0';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: 2
    }).format(value);
  };

  const handleInputChange = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleDeposit = (id) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        transactionType: 'deposit'
      }
    }));
  };

  const handleWithdraw = (id) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        transactionType: 'withdraw'
      }
    }));
  };

  const handleFull = (id, balance) => {
    setFormData(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        depositWithdraw: balance
      }
    }));
  };

  const handleClearAll = () => {
    setFormData({});
    setPassword('');
  };

  const handleSubmitPayment = () => {
    // TODO: Implement API call
    console.log('Submit Payment:', { formData, password });
  };

  return (
    <div className="banking-container">
      <div className="banking-table-section">
        <div className="banking-header-controls">
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
        </div>

        <div className="table-wrapper">
          <table className="banking-table">
            <thead>
              <tr>
                <th>UID <span className="sort-arrows">▲▼</span></th>
                <th>Balance <span className="sort-arrows">▲▼</span></th>
                <th>Available D / W <span className="sort-arrows">▲▼</span></th>
                <th>Exposure <span className="sort-arrows">▲▼</span></th>
                <th>Credit Reference <span className="sort-arrows">▲▼</span></th>
                <th>Reference P/L <span className="sort-arrows">▲▼</span></th>
                <th>Deposit/Withdraw <span className="sort-arrows">▲▼</span></th>
                <th>Full <span className="sort-arrows">▲▼</span></th>
                <th>Remark <span className="sort-arrows">▲▼</span></th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">No data available</td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td>{item.uid}</td>
                    <td>{formatCurrency(item.balance)}</td>
                    <td>{item.availableDW || '-'}</td>
                    <td className={item.exposure === 0 ? 'exposure-zero' : ''}>
                      ({formatCurrency(item.exposure)})
                    </td>
                    <td>
                      <span>{formatCurrency(item.creditRef)}</span>
                      <button className="icon-btn" title="Edit">✏️</button>
                    </td>
                    <td className="ref-pl-positive">{formatCurrency(item.refPL)}</td>
                    <td>
                      <div className="deposit-withdraw-controls">
                        <button 
                          className={`dw-btn deposit-btn ${formData[item.id]?.transactionType === 'deposit' ? 'active' : ''}`}
                          onClick={() => handleDeposit(item.id)}
                        >
                          D
                        </button>
                        <button 
                          className={`dw-btn withdraw-btn ${formData[item.id]?.transactionType === 'withdraw' ? 'active' : ''}`}
                          onClick={() => handleWithdraw(item.id)}
                        >
                          W
                        </button>
                        <input
                          type="number"
                          className="dw-input"
                          value={formData[item.id]?.depositWithdraw || item.depositWithdraw || 0}
                          onChange={(e) => handleInputChange(item.id, 'depositWithdraw', e.target.value)}
                          placeholder="0"
                        />
                      </div>
                    </td>
                    <td>
                      <button 
                        className="full-btn"
                        onClick={() => handleFull(item.id, item.balance)}
                      >
                        Full
                      </button>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="remark-input"
                        value={formData[item.id]?.remark || item.remark || ''}
                        onChange={(e) => handleInputChange(item.id, 'remark', e.target.value)}
                        placeholder="Remark"
                      />
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

        {/* Bottom Actions */}
        <div className="banking-actions">
          <button className="clear-all-btn" onClick={handleClearAll}>
            Clear All
          </button>
          <input
            type="password"
            className="password-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password.."
          />
          <button className="submit-payment-btn" onClick={handleSubmitPayment}>
            Submit Payment
          </button>
        </div>
      </div>
    </div>
  )
}

export default BankingTable

