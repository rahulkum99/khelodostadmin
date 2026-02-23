import React from 'react'
import Navbar from '../component/Navbar'
import MasterListTable from '../component/MasterListTable'

function DownloadMasterlistScreen() {
  return (
    <div>
      <Navbar />
      <MasterListTable title="Master Downline List" />
    </div>
  )
}

export default DownloadMasterlistScreen