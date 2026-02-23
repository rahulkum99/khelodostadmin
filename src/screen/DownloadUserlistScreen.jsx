import React from 'react'
import Navbar from '../component/Navbar'
import UserListTable from '../component/UserListTable'

function DownloadUserlistScreen() {
  return (
    <div>
      <Navbar />
      <UserListTable title="User Downline List" />
    </div>
  )
}

export default DownloadUserlistScreen