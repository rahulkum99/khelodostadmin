import React from 'react'

/**
 * Delete icon (trash can).
 * Accepts size (number, applied to width/height) and className.
 */
function DeleteIcon({ size = 16, className, ...props }) {
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
      <g id="Layer_4">
        <g>
          <path
            fill="#3c3c3ce3"
            d="M16.162,0.213H9.838C9.358,0.535,9.005,1.049,8.78,1.821H2.233c-0.191,0-0.32,0.097-0.32,0.29v2.541    c0,0.193,0.129,0.29,0.32,0.322h21.534c0.224-0.032,0.32-0.129,0.32-0.322V2.111c0-0.193-0.097-0.29-0.32-0.29h-6.514    C16.995,1.049,16.643,0.535,16.162,0.213z"
          />
          <path
            fill="#3c3c3ce3"
            d="M19.725,25.788c1.088-0.453,1.698-1.256,1.795-2.415c0-0.031,0-0.062,0-0.097l1.058-16.694H3.454    l1.027,16.694c0,0.035,0,0.065,0.031,0.097c0.096,1.159,0.674,1.962,1.765,2.415H19.725z"
          />
        </g>
      </g>
    </svg>
  )
}

export default DeleteIcon

