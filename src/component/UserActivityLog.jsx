import React from 'react'
import './ActivityLog.css'
import { useGetUserActivityLogsQuery } from '../redux/api/authApi'

function UserActivityLog({ userId, username }) {
  const {
    data,
    isLoading,
    error,
  } = useGetUserActivityLogsQuery(
    { userId, page: 1, limit: 20, activityType: 'login' },
    { skip: !userId }
  )

  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      const day = date.getDate()
      const month = date.getMonth() + 1
      const year = date.getFullYear()

      let hours = date.getHours()
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const ampm = hours >= 12 ? 'PM' : 'AM'
      hours = hours % 12
      hours = hours || 12
      const formattedHours = String(hours).padStart(2, '0')

      return `${day}-${month}-${year} ${formattedHours}:${minutes} ${ampm}`
    } catch (e) {
      return dateString
    }
  }

  const formatLoginStatus = (status) => {
    if (status === 'success') {
      return 'Login Successful'
    }
    return status || 'Unknown'
  }

  const formatLocation = (city, state, country) => {
    const parts = [city, state, country].filter(
      (part) => part && part !== '0' && part !== 'Local'
    )
    if (parts.length === 0) {
      return '0/0/0'
    }
    return parts.join('/')
  }

  const activityLogs = data?.data?.logs || []

  return (
    <div className="activity-log-container">
      <div className="activity-log-section">
        <div className="activity-log-header">
          Activity Log{username ? ` - ${username}` : ''}
        </div>
        <div className="activity-log-table-container">
          <div className="table-wrapper">
            <table className="activity-log-table">
              <thead>
                <tr>
                  <th>Login Date &amp; Time</th>
                  <th>Login Status</th>
                  <th>IP Address</th>
                  <th>ISP</th>
                  <th>City/State/Country</th>
                </tr>
              </thead>
              <tbody>
                {!userId ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No user selected
                    </td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan="5" className="loading-data">
                      Loading...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      {error?.data?.message || 'Error loading activity logs'}
                    </td>
                  </tr>
                ) : activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      No data available
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log, index) => (
                    <tr
                      key={log._id || log.id || index}
                      className={index % 2 === 0 ? 'even-row' : 'odd-row'}
                    >
                      <td>{formatDateTime(log.createdAt || log.formattedDate)}</td>
                      <td>
                        <span
                          className={`status-badge ${
                            log.loginStatus === 'success' ? 'success' : ''
                          }`}
                        >
                          {formatLoginStatus(log.loginStatus)}
                        </span>
                      </td>
                      <td>{log.ipAddress || '0'}</td>
                      <td>{log.isp || '0'}</td>
                      <td>
                        {formatLocation(log.city, log.state, log.country)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserActivityLog

