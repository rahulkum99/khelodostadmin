import React, { useRef, useEffect } from 'react'
import { Chart } from 'chart.js/auto'
import Navbar from '../component/Navbar'
import './DashboardScreen.css'

function DashboardScreen() {
  const leftChartRef = useRef(null);
  const rightChartRef = useRef(null);
  const leftChartInstance = useRef(null);
  const rightChartInstance = useRef(null);

  useEffect(() => {
    // Left Pie Chart - User Distribution
    if (leftChartRef.current) {
      const ctx = leftChartRef.current.getContext('2d');
      
      if (leftChartInstance.current) {
        leftChartInstance.current.destroy();
      }

      leftChartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Active Users', 'Inactive Users', 'Pending Users', 'Suspended Users'],
          datasets: [{
            label: 'User Distribution',
            data: [65, 20, 10, 5],
            backgroundColor: [
              '#28a745',
              '#ffc107',
              '#17a2b8',
              '#dc3545'
            ],
            borderColor: [
              '#1e7e34',
              '#e0a800',
              '#138496',
              '#c82333'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'User Distribution',
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: {
                top: 10,
                bottom: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    // Right Pie Chart - Transaction Status
    if (rightChartRef.current) {
      const ctx = rightChartRef.current.getContext('2d');
      
      if (rightChartInstance.current) {
        rightChartInstance.current.destroy();
      }

      rightChartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Completed', 'Pending', 'Failed', 'Cancelled'],
          datasets: [{
            label: 'Transaction Status',
            data: [75, 15, 7, 3],
            backgroundColor: [
              '#14805e',
              '#ffc107',
              '#dc3545',
              '#6c757d'
            ],
            borderColor: [
              '#0f6b4d',
              '#e0a800',
              '#c82333',
              '#5a6268'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                font: {
                  size: 12
                }
              }
            },
            title: {
              display: true,
              text: 'Transaction Status',
              font: {
                size: 16,
                weight: 'bold'
              },
              padding: {
                top: 10,
                bottom: 20
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }

    // Cleanup function
    return () => {
      if (leftChartInstance.current) {
        leftChartInstance.current.destroy();
      }
      if (rightChartInstance.current) {
        rightChartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>
        <div className="charts-container">
          <div className="chart-card">
            <div className="chart-wrapper">
              <canvas ref={leftChartRef}></canvas>
            </div>
          </div>
          <div className="chart-card">
            <div className="chart-wrapper">
              <canvas ref={rightChartRef}></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardScreen
