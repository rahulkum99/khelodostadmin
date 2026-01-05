import React, { useState } from 'react'

function Navbar() {
  const [openDropdowns, setOpenDropdowns] = useState({
    downlineList: false,
    myReports: false,
    banking: false,
    commission: false
  });

  const handleDropdownToggle = (dropdownName, isOpen) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [dropdownName]: isOpen
    }));
  };
  return (
    <>
      <nav className="navbar navbar-expand-lg navbar">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            <img src="/images/logo.png" alt="logo" width={150} height={50} />
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="#">Login</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <nav className="navbar navbar-expand-lg navbarlink py-0 px-3">
        <div className="container-fluid">
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link active" aria-current="page" href="/dashboard">Dashboard</a>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.downlineList ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('downlineList', true)}
                onMouseLeave={() => handleDropdownToggle('downlineList', false)}
              >
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  aria-expanded={openDropdowns.downlineList}
                >
                  Downline List
                </a>
                <ul className={`dropdown-menu ${openDropdowns.downlineList ? 'show' : ''}`}>
                  <li><a className="dropdown-item" href="/downline-userlist">User Downline List</a></li>
                  <li><a className="dropdown-item" href="/downline-masterlist">Master Downline List</a></li>
                </ul>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/my-account">My Account</a>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.myReports ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('myReports', true)}
                onMouseLeave={() => handleDropdownToggle('myReports', false)}
              >
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  aria-expanded={openDropdowns.myReports}
                >
                  My Reports
                </a>
                <ul className={`dropdown-menu ${openDropdowns.myReports ? 'show' : ''}`}>
                  <li><a className="dropdown-item" href="/report-event">User Profit/Loss Report</a></li>
                  <li><a className="dropdown-item" href="/report-downline">Downline Profit/Loss Report</a></li>
                </ul>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/betlist">Betlist</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/market-analysis">Market Analysis</a>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.banking ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('banking', true)}
                onMouseLeave={() => handleDropdownToggle('banking', false)}
              >
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  aria-expanded={openDropdowns.banking}
                >
                  Banking
                </a>
                <ul className={`dropdown-menu ${openDropdowns.banking ? 'show' : ''}`}>
                  <li><a className="dropdown-item" href="/banking-user">User banking</a></li>
                  <li><a className="dropdown-item" href="/banking-master">Master Banking</a></li>
                </ul>
              </li>
              <li
                className={`nav-item dropdown ${openDropdowns.commission ? 'show' : ''}`}
                onMouseEnter={() => handleDropdownToggle('commission', true)}
                onMouseLeave={() => handleDropdownToggle('commission', false)}
              >
                <a
                  className="nav-link dropdown-toggle"
                  href="#"
                  role="button"
                  aria-expanded={openDropdowns.commission}
                >
                Commission
                </a>
                <ul className={`dropdown-menu ${openDropdowns.commission ? 'show' : ''}`}>
                  <li><a className="dropdown-item" href="/commission-user">User Commission</a></li>
                  <li><a className="dropdown-item" href="/commission-agent">Agent Commission</a></li>
                </ul>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/password-history">Password History</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/restore-user">Restore User</a>
              </li>

            </ul>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/logout">Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </>

  )
}

export default Navbar