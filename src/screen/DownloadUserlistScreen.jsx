import React from 'react'
import { useSearchParams } from 'react-router-dom'
import Navbar from '../component/Navbar'
import UserListTable from '../component/UserListTable'

function DownloadUserlistScreen() {
  const [searchParams] = useSearchParams()
  const adminId = searchParams.get('adminId')
  const adminName = searchParams.get('adminName')
  const title = adminName ? `${adminName} User List` : 'User Downline List'

  return (
    <div>
      <Navbar />
      <UserListTable title={title} adminId={adminId} />
    </div>
  )
}

export default DownloadUserlistScreen