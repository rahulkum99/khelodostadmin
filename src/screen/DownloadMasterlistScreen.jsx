import React from 'react'
import Navbar from '../component/Navbar'
import UserListTable from '../component/UserListTable'

function DownloadMasterlistScreen() {
  return (
    <div>
      <Navbar />
      <UserListTable title="Master Downline List" />
    </div>
  )
}

export default DownloadMasterlistScreen