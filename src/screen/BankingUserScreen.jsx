import React from 'react'
import Navbar from '../component/Navbar'
import BankingTable from '../component/BankingTable'

function BankingUserScreen() {
  return (
    <div>
      <Navbar />
      <BankingTable title="User Banking" />
    </div>
  )
}

export default BankingUserScreen