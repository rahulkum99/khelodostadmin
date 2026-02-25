import React from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './MarketAnalysisScreen.css'

const SAMPLE_MARKETS = [
  {
    sport: 'Cricket',
    totalBets: 1,
    events: [
      { id: 'india-v-netherlands', name: 'India v Netherlands' },
    ],
  },
]

function MarketAnalysisScreen() {
  const navigate = useNavigate()

  return (
    <div className="market-analysis-page">
      <Navbar />
      <div className="market-analysis-content">
        {SAMPLE_MARKETS.map((group) => (
          <div key={group.sport} className="market-group">
            <div className="market-group-header">
              <span>{group.sport}</span>
              <span>Total Bets {group.totalBets}</span>
            </div>
            <div className="market-group-body">
              {group.events.map((event) => (
                <div key={event.id} className="market-row">
                  <button
                    type="button"
                    className="market-link-button"
                    onClick={() => navigate('/market-details')}
                  >
                    {event.name}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MarketAnalysisScreen