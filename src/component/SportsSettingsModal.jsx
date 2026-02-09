import React from 'react'
import './SportsSettingsModal.css'

// For now we use static sports; later can come from API
const DEFAULT_SPORTS = [
  'Cricket',
  'Casino',
  'Tennis',
  'Soccer',
  'Horse Racing',
  'Politics',
  'Greyhound Racing',
  'Basketball',
  'Lottery',
]

function SportsSettingsModal({ isOpen, onClose, sports = DEFAULT_SPORTS, activeSports = {}, onToggle }) {
  if (!isOpen) return null

  const handleToggle = (name) => {
    onToggle?.(name, !activeSports[name])
  }

  return (
    <div className="sports-modal-overlay">
      <div className="sports-modal">
        <div className="sports-modal-header">
          <div className="sports-modal-title">Sports Settings</div>
          <button className="sports-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="sports-modal-body">
          <table className="sports-table">
            <thead>
              <tr>
                <th>Sr.No.</th>
                <th>Sport Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sports.map((name, index) => {
                const enabled = !!activeSports[name]
                return (
                  <tr key={name}>
                    <td>{index + 1}</td>
                    <td>{name}</td>
                    <td>
                      <button
                        type="button"
                        className={`sports-toggle ${enabled ? 'on' : 'off'}`}
                        onClick={() => handleToggle(name)}
                      >
                        {enabled ? '✔' : '✕'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SportsSettingsModal

