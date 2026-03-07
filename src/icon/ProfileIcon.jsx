import React from 'react'

/**
 * Profile icon (user/person silhouette).
 * Accepts size (number, applied to width/height) and className.
 */
function ProfileIcon({ size = 16, className, ...props }) {
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
          d="M25.36,21.222c-0.678-0.975-1.612-1.868-2.842-2.634c-2.586-1.699-5.682-2.551-9.37-2.508c-3.646-0.043-6.783,0.809-9.412,2.508c-1.4,0.894-2.46,1.955-3.095,3.104v3.91H25.36V21.222z"
        />
        <path
          fill="#3c3c3ce3"
          d="M17.176,11.024c1.23-1.233,1.822-2.678,1.822-4.421c0-1.699-0.592-3.188-1.822-4.377c-1.187-1.232-2.671-1.827-4.367-1.827c-1.738,0-3.18,0.595-4.409,1.827C7.213,3.416,6.576,4.904,6.576,6.603c0,1.743,0.637,3.188,1.824,4.421c1.229,1.188,2.671,1.827,4.409,1.827C14.505,12.851,15.99,12.212,17.176,11.024z"
        />
      </g>
    </svg>
  )
}

export default ProfileIcon
