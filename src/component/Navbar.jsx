import React from 'react'

function Navbar() {
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
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/dashboard">In-Play</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/my-account">My Account</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="#">Greyhound Racing</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/betlist">Betlist</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/market-analysis">Market Analysis</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="#">Live Casino</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="#">Tips & Reviews</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/password-history">Password History</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" aria-current="page" href="/restore-username">Restore User</a>
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