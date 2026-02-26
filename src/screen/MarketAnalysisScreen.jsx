import React from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../component/Navbar'
import './MarketAnalysisScreen.css'
import { useGetTodayInplayPlacedBetsQuery } from '../redux/api/authApi'

function MarketAnalysisScreen() {
  const navigate = useNavigate()
  const {
    data: groups = [],
    isLoading,
    isError,
  } = useGetTodayInplayPlacedBetsQuery()

  const formatSportLabel = (sport) => {
    if (!sport) return ''
    const lower = String(sport).toLowerCase()
    return lower.charAt(0).toUpperCase() + lower.slice(1)
  }

  return (
    <div className="market-analysis-page">
      <Navbar />
      <div className="market-analysis-content">
        {isLoading && (
          <div className="market-group">
            <div className="market-group-header">
              <span>Loading in-play bets...</span>
            </div>
          </div>
        )}

        {isError && !isLoading && (
          <div className="market-group">
            <div className="market-group-header">
              <span>Failed to load in-play bets.</span>
            </div>
          </div>
        )}

        {!isLoading && !isError && groups.length === 0 && (
          <div className="market-group">
            <div className="market-group-header">
              <span>No in-play bets found for today.</span>
            </div>
          </div>
        )}

        {!isLoading && !isError && groups.map((group) => {
          const events = group.events || []
          const groupTotalBets = events.reduce(
            (sum, evt) => sum + (evt.totalBets || 0),
            0
          )

          return (
            <div key={group.sport} className="market-group">
              <div className="market-group-header">
                <span>{formatSportLabel(group.sport)}</span>
                <span>Total Bets {groupTotalBets}</span>
              </div>
              <div className="market-group-body">
                {events.map((event) => (
                  <div
                    key={event.eventId}
                    className="market-row d-flex justify-content-between"
                  >
                    <button
                      type="button"
                      className="market-link-button"
                      onClick={() =>
                        navigate('/market-details', {
                          state: {
                            event: {
                              eventId: event.eventId,
                              matchName: event.eventName,
                              sport: group.sport,
                            },
                          },
                        })
                      }
                    >
                      {event.eventName}
                    </button>
                    <span>Total Bets {event.totalBets}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MarketAnalysisScreen