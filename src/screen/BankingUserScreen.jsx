import React from 'react'
import Navbar from '../component/Navbar'
import BankingTable from '../component/BankingTable'
import { useGetBankingUsersQuery } from '../redux/api/authApi'

function BankingUserScreen() {
  const { data: response, isLoading, error } = useGetBankingUsersQuery()

  return (
    <div>
      <Navbar />
      <BankingTable
        title="User Banking"
        data={response?.data}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

export default BankingUserScreen