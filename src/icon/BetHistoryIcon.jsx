import React from 'react'

/**
 * Bet history icon (menu lines with target/circle).
 * Accepts size (number, applied to width/height) and className.
 */
function BetHistoryIcon({ size = 16, className, ...props }) {
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
        <path fill="#3c3c3ce3" d="M9.793,15.429v-2.862H0.234v2.862H9.793z" />
        <path fill="#3c3c3ce3" d="M0.234,6.137V9.03h25.501V6.137H0.234z" />
        <path fill="#3c3c3ce3" d="M25.736,0.574H0.234v2.893h25.501V0.574z" />
        <g>
          <path
            fill="#3c3c3ce3"
            d="M11.076,18.062c0,2.028,0.738,3.766,2.15,5.179c1.412,1.449,3.174,2.155,5.197,2.186c2.054-0.03,3.751-0.736,5.194-2.186c1.443-1.413,2.149-3.15,2.149-5.179c0-2.054-0.706-3.792-2.149-5.236c-1.443-1.416-3.141-2.123-5.194-2.123c-2.022,0-3.785,0.708-5.197,2.123C11.814,14.27,11.076,16.008,11.076,18.062z"
          />
          <polyline
            fill="none"
            stroke="#3c3c3ce3"
            strokeWidth="1.2846"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeMiterlimit="10"
            points="21.339,20.09 18.453,19.221 18.453,14.463"
          />
        </g>
      </g>
    </svg>
  )
}

export default BetHistoryIcon
