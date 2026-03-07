import React from 'react'

/**
 * Profit/Loss icon (up/down arrows).
 * Accepts size (number, applied to width/height) and className.
 */
function ProfitLossIcon({ size = 16, className, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 26 26"
      className={className}
      fill="#3c3c3ce3"
      {...props}
    >
      <g>
        <path
          fill="#3c3c3ce3"
          d="M25.958,16.59h-4.393V3.555h-3.287V16.59h-4.391l5.971,5.855L25.958,16.59z"
        />
        <path
          fill="#3c3c3ce3"
          d="M12.08,9.442l-5.97-5.855L0.042,9.442h4.357v13.004h3.324V9.442H12.08z"
        />
      </g>
    </svg>
  )
}

export default ProfitLossIcon
