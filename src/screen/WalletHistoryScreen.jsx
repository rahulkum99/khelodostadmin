import React, { useState, useMemo } from 'react'
import Navbar from '../component/Navbar'
import './WalletHistoryScreen.css'
import { useGetWalletDetailsQuery, useGetWalletTransactionsQuery } from '../redux/api/authApi'

function WalletHistoryScreen() {
    const [entriesPerPage, setEntriesPerPage] = useState(20)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [actionFilter, setActionFilter] = useState('')

    const { data: walletData, isLoading: isWalletLoading, error: walletError } = useGetWalletDetailsQuery()
    const wallet = walletData?.data?.wallet

    const {
        data: txData,
        isLoading: isTxLoading,
        error: txError,
    } = useGetWalletTransactionsQuery({
        page: currentPage,
        limit: entriesPerPage,
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(actionFilter && { action: actionFilter }),
    })

    const transactions = txData?.data?.transactions || []
    const pagination = txData?.data?.pagination || { page: 1, limit: entriesPerPage, total: 0, pages: 1 }

    const formatDateTime = (dateString) => {
        if (!dateString) return '-'
        const date = new Date(dateString)
        return date.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        })
    }

    const formatAmount = (amount, type) => {
        if (amount == null) return '0.00'
        const value = Number(amount)
        const sign = type === 'debit' ? '-' : '+'
        return `${sign}${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }

    const formattedTransactions = useMemo(
        () =>
            transactions.map((tx) => {
                const performedByUsername = tx.performedBy?.username || ''
                const performedByName = tx.performedBy?.name || ''
                const performedByDisplay =
                    performedByUsername && performedByName
                        ? `${performedByUsername} (${performedByName})`
                        : performedByUsername || performedByName || '-'

                return {
                    id: tx.id || tx._id,
                    dateTime: formatDateTime(tx.createdAt),
                    type: tx.transactionType,
                    amount: tx.amount,
                    balanceBefore: tx.balanceBefore,
                    balanceAfter: tx.balanceAfter,
                    description: tx.description || '-',
                    referenceId: tx.referenceId || '-',
                    status: tx.status || '-',
                    performedBy: performedByDisplay,
                }
            }),
        [transactions]
    )

    const filteredTransactions = useMemo(() => {
        if (!searchTerm) return formattedTransactions
        const q = searchTerm.toLowerCase()
        return formattedTransactions.filter((tx) => {
            return (
                tx.type?.toLowerCase().includes(q) ||
                tx.description?.toLowerCase().includes(q) ||
                tx.referenceId?.toLowerCase().includes(q) ||
                tx.status?.toLowerCase().includes(q) ||
                tx.performedBy?.toLowerCase().includes(q)
            )
        })
    }, [formattedTransactions, searchTerm])

    const totalEntries = pagination?.total ?? filteredTransactions.length

    const pagesFromApiOrCalc =
        pagination?.pages ?? Math.ceil(filteredTransactions.length / entriesPerPage)

    const totalPages = pagesFromApiOrCalc || 1

    const showingFrom = totalEntries > 0 ? (currentPage - 1) * entriesPerPage + 1 : 0
    const showingTo = Math.min(currentPage * entriesPerPage, totalEntries)

    return (
        <div className="wallet-history-page">
            <Navbar />
            <div className="wallet-history-content">
                <div className="wallet-summary-section">
                    <div className="wallet-summary-header">Wallet Summary</div>
                    <div className="wallet-summary-body">
                        {isWalletLoading ? (
                            <div className="wallet-summary-loading">Loading wallet...</div>
                        ) : walletError ? (
                            <div className="wallet-summary-error">Failed to load wallet.</div>
                        ) : wallet ? (
                            <div className="wallet-summary-grid">
                                <div className="wallet-summary-card">
                                    <div className="wallet-summary-label">Total Balance</div>
                                    <div className="wallet-summary-value">
                                        {wallet.totalBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                        {wallet.currency}
                                    </div>
                                </div>
                                <div className="wallet-summary-card">
                                    <div className="wallet-summary-label">Available Balance</div>
                                    <div className="wallet-summary-value">
                                        {wallet.availableBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                        {wallet.currency}
                                    </div>
                                </div>
                                <div className="wallet-summary-card">
                                    <div className="wallet-summary-label">Locked Balance</div>
                                    <div className="wallet-summary-value">
                                        {wallet.lockedBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                                        {wallet.currency}
                                    </div>
                                </div>
                                <div className="wallet-summary-card">
                                    <div className="wallet-summary-label">Status</div>
                                    <div className="wallet-summary-value">
                                        {wallet.isActive ? 'Active' : 'Inactive'} {wallet.isLocked ? '(Locked)' : ''}
                                    </div>
                                </div>
                                <div className="wallet-summary-card">
                                    <div className="wallet-summary-label">Last Transaction</div>
                                    <div className="wallet-summary-value">{formatDateTime(wallet.lastTransactionAt)}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="wallet-summary-error">No wallet data found.</div>
                        )}
                    </div>
                </div>

                <div className="wallet-history-section">
                    {/* <div className="wallet-history-header">Wallet Transactions</div> */}
                    <div className="wallet-history-table-container">
                        <div className="wallet-history-controls">
                            <div className="wallet-history-filters">
                                <div className="filter-group">
                                    <label>From</label>
                                    <input
                                        type="date"
                                        className="filter-date-input"
                                        value={fromDate}
                                        onChange={(e) => {
                                            setFromDate(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label>To</label>
                                    <input
                                        type="date"
                                        className="filter-date-input"
                                        value={toDate}
                                        onChange={(e) => {
                                            setToDate(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                    />
                                </div>
                                <div className="filter-group">
                                    <label>Action</label>
                                    <select
                                        className="filter-action-select"
                                        value={actionFilter}
                                        onChange={(e) => {
                                            setActionFilter(e.target.value)
                                            setCurrentPage(1)
                                        }}
                                    >
                                        <option value="">All</option>
                                        <option value="deposit">Deposit</option>
                                        <option value="withdrawal">Withdrawal</option>
                                    </select>
                                </div>
                            </div>
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
                                    <option value={20}>20</option>
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
                                    placeholder="Search in results"
                                />
                            </div>
                        </div>

                        <div className="wallet-history-table-wrapper">
                            <table className="wallet-history-table">
                                <thead>
                                    <tr>
                                        <th>
                                            <span className="th-title-with-icon">
                                                <span>Date &amp; Time</span>
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
                                                <span>Amount</span>
                                                <span className="sort-arrows">▲▼</span>
                                            </span>
                                        </th>
                                        <th>
                                            <span className="th-title-with-icon">
                                                <span>Balance Before</span>
                                                <span className="sort-arrows">▲▼</span>
                                            </span>
                                        </th>
                                        <th>
                                            <span className="th-title-with-icon">
                                                <span>Balance After</span>
                                                <span className="sort-arrows">▲▼</span>
                                            </span>
                                        </th>
                                        <th>
                                            <span className="th-title-with-icon">
                                                <span>Description</span>
                                                <span className="sort-arrows">▲▼</span>
                                            </span>
                                        </th>
                                        <th>
                                            <span className="th-title-with-icon">
                                                <span>Performed By</span>
                                                <span className="sort-arrows">▲▼</span>
                                            </span>
                                        </th>
                                        <th>
                                            <span className="th-title-with-icon">
                                                <span>Reference ID</span>
                                                <span className="sort-arrows">▲▼</span>
                                            </span>
                                        </th>
                                        <th>
                                            <span className="th-title-with-icon">
                                                <span>Status</span>
                                                <span className="sort-arrows">▲▼</span>
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isTxLoading ? (
                                        <tr>
                                            <td colSpan="9" className="no-data">
                                                Loading transactions...
                                            </td>
                                        </tr>
                                    ) : txError ? (
                                        <tr>
                                            <td colSpan="9" className="no-data">
                                                Failed to load transactions.
                                            </td>
                                        </tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="9" className="no-data">
                                                No transactions found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredTransactions.map((tx) => (
                                            <tr key={tx.id}>
                                                <td>{tx.dateTime}</td>
                                                <td>
                                                    <span className={`tx-type-badge ${tx.type}`}>
                                                        {tx.type === 'credit' ? 'Credit' : tx.type === 'debit' ? 'Debit' : tx.type}
                                                    </span>
                                                </td>
                        <td
                          className={
                            tx.type === 'credit'
                              ? 'amount-credit'
                              : tx.type === 'debit'
                              ? 'amount-debit'
                              : ''
                          }
                        >
                          {formatAmount(tx.amount, tx.type)}
                        </td>
                                                <td>
                                                    {tx.balanceBefore?.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td>
                                                    {tx.balanceAfter?.toLocaleString('en-IN', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td>{tx.description}</td>
                                                <td>{tx.performedBy}</td>
                        <td>{tx.referenceId}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              (tx.status || '').toLowerCase()
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="wallet-history-footer">
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

export default WalletHistoryScreen