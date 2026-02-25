import React from 'react'
import Navbar from '../component/Navbar'
import './MarketDetailsScreen.css'

function MarketDetailsScreen() {
  return (
    <div className="market-details-page">
      <Navbar />
      <div className="market-details-content">
        <div className="market-details-main">
          {/* Match Odds */}
          <section className="market-section">
            <div className="market-section-header">
              <span className="market-section-title">Match Odds</span>
              <span className="market-section-meta">Matched € 29.70M</span>
            </div>
            <table className="market-table">
              <thead>
                <tr>
                  <th>&nbsp;</th>
                  <th>Back</th>
                  <th>Lay</th>
                  <th>Min / Max</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="runner-name">India</span>
                    <span className="runner-sub">547.20K</span>
                  </td>
                  <td className="price-cell price-back">1.07</td>
                  <td className="price-cell price-lay">1.1</td>
                  <td>100–100000</td>
                </tr>
                <tr>
                  <td>
                    <span className="runner-name">Netherlands</span>
                    <span className="runner-sub">516.09</span>
                  </td>
                  <td className="price-cell price-back">13.5</td>
                  <td className="price-cell price-lay">18</td>
                  <td>100–50000</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Tied Match */}
          <section className="market-section">
            <div className="market-section-header">
              <span className="market-section-title">Tied Match</span>
              <span className="market-section-meta">Matched € 34K</span>
            </div>
            <table className="market-table">
              <thead>
                <tr>
                  <th>&nbsp;</th>
                  <th>Back</th>
                  <th>Lay</th>
                  <th>Min / Max</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="runner-name">Yes</span>
                  </td>
                  <td className="price-cell price-back">100</td>
                  <td className="price-cell price-lay">0</td>
                  <td>100–50000</td>
                </tr>
                <tr>
                  <td>
                    <span className="runner-name">No</span>
                  </td>
                  <td className="price-cell price-back">0</td>
                  <td className="price-cell price-lay">1.03</td>
                  <td>100–250000</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Bookmaker */}
          <section className="market-section">
            <div className="market-section-header">
              <span className="market-section-title">Bookmaker</span>
              <span className="market-section-meta">Matched € 219.60M</span>
            </div>
            <table className="market-table">
              <thead>
                <tr>
                  <th>&nbsp;</th>
                  <th>Back</th>
                  <th>Lay</th>
                  <th>Min / Max</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <span className="runner-name">India</span>
                  </td>
                  <td className="price-cell price-bookmaker-back">4.5</td>
                  <td className="price-cell price-bookmaker-lay">5.0</td>
                  <td>100–250000</td>
                </tr>
                <tr>
                  <td>
                    <span className="runner-name">Netherlands</span>
                  </td>
                  <td className="price-cell price-bookmaker-back">0</td>
                  <td className="price-cell price-bookmaker-lay">0</td>
                  <td>100–250000</td>
                </tr>
              </tbody>
            </table>
          </section>
        </div>

        {/* Right side: streaming + book */}
        <div className="market-details-side">
          <section className="side-card">
            <div className="side-card-header">Live Streaming</div>
            <div className="side-card-body">
              <div className="score-card">
                <div className="score-card-main">
                  <div>
                    <div>Ind /</div>
                    <div className="score-card-sub">153/4 (17.2/20)</div>
                  </div>
                  <div>
                    <div>Net</div>
                    <div className="score-card-sub">0</div>
                  </div>
                </div>
                <div className="score-card-sub">TOSS: INDIA ELECTED TO BAT. CRR: 8.8</div>
              </div>

              <div className="book-buttons">
                <button className="book-button">Master Book</button>
                <button className="book-button">User Book</button>
              </div>

              <div className="book-footer-buttons">
                <button className="book-footer-button">Live Bet</button>
                <button className="book-footer-button">Partnership Book</button>
                <button className="book-footer-button">View More</button>
              </div>

              <div className="no-bets-text">There are no any bet.</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default MarketDetailsScreen

