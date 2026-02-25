import React from 'react'
import Navbar from '../component/Navbar'
import BankingTable from '../component/BankingTable'
import { useGetBankingAdminsQuery } from '../redux/api/authApi'

function BankingMasterScreen() {
  const { data, isLoading, error } = useGetBankingAdminsQuery()

  return (
    <div>
      <Navbar />
      <BankingTable
        title="Master Banking"
        data={data}
        isLoading={isLoading}
        error={error}
      />
    </div>
  )
}

export default BankingMasterScreen