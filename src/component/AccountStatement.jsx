import React, { useMemo, useState } from 'react'
import './AccountStatement.css'
import { useGetWalletTransactionsQuery } from '../redux/api/authApi'

function AccountStatement() {
  const [dataSource, setDataSource] = useState('');
  // Start with no date filters so all data shows
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useGetWalletTransactionsQuery({
    page: currentPage,
    limit: entriesPerPage,
  });

  const handleGetStatement = () => {
    // Reset to first page and refetch with current filters
    setCurrentPage(1);
    refetch();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const rawTransactions = data?.data?.transactions || [];
  const pagination = data?.data?.pagination || {};
  const totalPages = pagination.pages || 1;
  const totalEntries = pagination.total || 0;
  const page = pagination.page || currentPage;

  const filteredTransactions = useMemo(() => {
    let txns = [...rawTransactions];

    // Filter by data source (credit/debit)
    if (dataSource === 'deposit') {
      txns = txns.filter((t) => t.transactionType === 'credit');
    } else if (dataSource === 'withdraw') {
      txns = txns.filter((t) => t.transactionType === 'debit');
    }

    // Filter by date range (inclusive)
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      txns = txns.filter((t) => new Date(t.createdAt) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      txns = txns.filter((t) => new Date(t.createdAt) <= to);
    }

    // Text search
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      txns = txns.filter((t) => {
        const fields = [
          t.description,
          t.referenceId,
          t.metadata?.transferType,
          t.metadata?.toUser,
          t.metadata?.addedBy,
          t.metadata?.targetUser,
          t.performedBy?.name,
          t.performedBy?.username,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return fields.includes(term);
      });
    }

    return txns;
  }, [rawTransactions, dataSource, fromDate, toDate, searchTerm]);

  const showingFrom = totalEntries === 0 ? 0 : (page - 1) * entriesPerPage + 1;
  const showingTo = totalEntries === 0
    ? 0
    : Math.min(page * entriesPerPage, totalEntries);

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
                  <th>From/To <span className="sort-arrows">▲▼</span></th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan="6" className="no-data">Loading...</td>
                  </tr>
                )}
                {isError && !isLoading && (
                  <tr>
                    <td colSpan="6" className="no-data">Failed to load data</td>
                  </tr>
                )}
                {!isLoading && !isError && filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="6" className="no-data">No data!</td>
                  </tr>
                )}
                {!isLoading && !isError && filteredTransactions.map((txn) => (
                  <tr key={txn.id || txn._id}>
                    <td>{formatDate(txn.createdAt)}</td>
                    <td>
                      {txn.transactionType === 'credit'
                        ? txn.formattedAmount || Number(txn.amount).toFixed(2)
                        : '-'}
                    </td>
                    <td>
                      {txn.transactionType === 'debit'
                        ? txn.formattedAmount || Number(txn.amount).toFixed(2)
                        : '-'}
                    </td>
                    <td>{Number(txn.balanceAfter ?? txn.balanceBefore ?? 0).toFixed(2)}</td>
                    <td>{txn.description}</td>
                    <td>
                      {txn.metadata?.toUser ||
                        txn.metadata?.targetUser ||
                        txn.metadata?.addedBy ||
                        txn.performedBy?.name ||
                        txn.performedBy?.username ||
                        '-'}
                    </td>
                  </tr>
                ))}
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
                disabled={page === 1 || isLoading}
                onClick={() => !isLoading && setCurrentPage(1)}
              >
                First
              </button>
              <button 
                className="pagination-btn"
                disabled={page === 1 || isLoading}
                onClick={() => !isLoading && setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </button>
              <button 
                className="pagination-btn"
                disabled={page === totalPages || isLoading}
                onClick={() => !isLoading && setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </button>
              <button 
                className="pagination-btn"
                disabled={page === totalPages || isLoading}
                onClick={() => !isLoading && setCurrentPage(totalPages)}
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

