import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import './BankingTable.css'
import BankingModal from './BankingModal'
import { useWalletBulkActionMutation, useGetBankingUsersQuery } from '../redux/api/authApi'
import { FaRegEdit } from "react-icons/fa";

function toArray(data) {
  if (Array.isArray(data)) return data
  if (data && Array.isArray(data.data)) return data.data
  if (data && Array.isArray(data.users)) return data.users
  return []
}

// Maps API response: { data: [{ userId, username, balance, exposer }, ...] } or legacy _id
function mapBankingUsersToTableData(apiData) {
  const list = toArray(apiData)
  return list.map((row, index) => ({
    id: row.username ?? index,
    userId: row.userId ?? row._id ?? null,
    uid: row.username ?? '',
    balance: row.balance ?? 0,
    availableDW: '',
    exposure: row.exposer ?? 0,
    creditRef: 0,
    refPL: row.balance ?? 0,
    depositWithdraw: 0,
    remark: ''
  }))
}

function BankingTable({ title = "Banking", data: externalData, isLoading, error, onBankingSubmit, masterBalance = 0 }) {
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({});
  const [bankingModalOpen, setBankingModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletBulkAction, { isLoading: isSubmitting }] = useWalletBulkActionMutation();
  const { refetch: refetchBankingUsers } = useGetBankingUsersQuery();

  // Keep table data in state so it does not disappear on click/re-render. Update only when prop has new non-empty data.
  const [tableData, setTableData] = useState([]);
  const lastDataRef = useRef(null);

  useEffect(() => {
    const raw = toArray(externalData);
    if (raw.length === 0) return;
    // Update when we get new data (by reference or when we didn't have this data before)
    if (externalData === lastDataRef.current) return;
    lastDataRef.current = externalData;
    setTableData(mapBankingUsersToTableData(externalData));
  }, [externalData]);

  // Filter data based on search term (trim and avoid filtering when empty)
  const searchLower = (searchTerm || '').trim().toLowerCase();
  const filteredData = searchLower === ''
    ? tableData
    : tableData.filter(item => {
        const uid = item?.uid != null ? String(item.uid) : '';
        return uid.toLowerCase().includes(searchLower);
      });
  const hasNoSearchResults = tableData.length > 0 && filteredData.length === 0;

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

  const handleSubmitPayment = async () => {
    const adminPassword = (password || '').trim();
    if (!adminPassword) {
      toast.error('Admin password is required for bulk action');
      return;
    }

    const entries = [];
    for (const item of tableData) {
      const fd = formData[item.id];
      if (!fd?.transactionType || !item.userId) continue;
      const rawAmount = fd.depositWithdraw;
      const amount = Number(String(rawAmount ?? '').replace(/,/g, ''));
      if (!Number.isFinite(amount) || amount <= 0) continue;
      const entry = {
        userId: item.userId,
        amount: Math.round(amount * 100) / 100,
        action: fd.transactionType,
      };
      const desc = fd.remark != null ? String(fd.remark).trim() : '';
      if (desc) entry.description = desc;
      entries.push(entry);
    }

    if (entries.length === 0) {
      const hasAnyFormData = tableData.some((item) => formData[item.id]?.transactionType);
      const hasUserIds = tableData.some((item) => item.userId);
      if (!hasUserIds) {
        toast.error('User IDs missing. Ensure the banking users API returns _id or userId for each user.');
      } else if (!hasAnyFormData) {
        toast.error('Select Deposit (D) or Withdraw (W) and enter an amount for at least one user.');
      } else {
        toast.error('Enter a valid amount (greater than 0) for each selected deposit or withdraw.');
      }
      return;
    }
    if (entries.length > 100) {
      toast.error('Maximum 100 entries per request.');
      return;
    }

    try {
      const result = await walletBulkAction({ adminPassword, entries }).unwrap();
      const msg = result?.message ?? 'Bulk action completed';
      const failed = result?.data?.failed?.length ?? 0;
      if (failed > 0) {
        toast.warning(`${msg} (${failed} failed)`);
      } else {
        toast.success(msg);
      }
      handleClearAll();
      await refetchBankingUsers();
    } catch (err) {
      const msg = err?.data?.message ?? err?.message ?? 'Bulk action failed';
      const errors = err?.data?.errors;
      if (Array.isArray(errors) && errors.length) {
        toast.error(errors.map((e) => e.msg || e.message).join('. '));
      } else {
        toast.error(msg);
      }
    }
  };

  const handleRowClick = (item) => {
    setSelectedUser({ username: item.uid, balance: item.balance, userType: 'USER' });
    setBankingModalOpen(true);
  };

  const handleBankingModalSubmit = (payload) => {
    onBankingSubmit?.(payload);
    setBankingModalOpen(false);
    setSelectedUser(null);
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
              <label htmlFor="banking-search">Search:</label>
              <input
                id="banking-search"
                type="search"
                name="banking-uid-search"
                className="search-input"
                value={searchTerm}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchTerm(v === 'superadmin' ? '' : v);
                  setCurrentPage(1);
                }}
                onFocus={() => {
                  if (searchTerm === 'superadmin') setSearchTerm('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                placeholder="Search by UID"
                autoComplete="nope"
                data-lpignore="true"
                data-form-type="other"
                data-1p-ignore
              />
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="banking-table">
            <thead>
              <tr>
                <th>
                  <span className="th-title-with-icon">
                    <span>UID</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Balance</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Available D / W</span>
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
                    <span>Credit Reference</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Reference P/L</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Deposit/Withdraw</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Full</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
                <th>
                  <span className="th-title-with-icon">
                    <span>Remark</span>
                    <span className="sort-arrows">▲▼</span>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && tableData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">Loading...</td>
                </tr>
              ) : error && tableData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">Failed to load banking users.</td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="no-data">
                    {hasNoSearchResults ? 'No matching users for this search.' : 'No data available'}
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => (
                  <tr key={item.id}>
                    <td
                      className="uid-cell-clickable"
                      onClick={() => handleRowClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleRowClick(item); } }}
                    >
                      {item.uid}
                    </td>
                    <td>{formatCurrency(item.balance)}</td>
                    <td>{item.availableDW || '-'}</td>
                    <td className={item.exposure === 0 ? 'exposure-zero' : ''}>
                      ({formatCurrency(item.exposure)})
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span className="td-content-inline">
                        <span>{formatCurrency(item.creditRef)}</span>
                        <button className="icon-btn" title="Edit">
                          <FaRegEdit size={16} />
                        </button>
                      </span>
                    </td>
                    <td className="ref-pl-positive">{formatCurrency(item.refPL)}</td>
                    <td onClick={(e) => e.stopPropagation()}>
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
                    <td onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="full-btn"
                        onClick={() => handleFull(item.id, item.balance)}
                      >
                        Full
                      </button>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
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
          <button
            className="submit-payment-btn"
            onClick={handleSubmitPayment}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Payment'}
          </button>
        </div>
      </div>

      <BankingModal
        isOpen={bankingModalOpen}
        onClose={() => {
          setBankingModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        masterBalance={masterBalance}
        onSubmit={handleBankingModalSubmit}
      />
    </div>
  )
}

export default BankingTable

