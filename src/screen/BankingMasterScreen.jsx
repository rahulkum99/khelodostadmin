import React from 'react'
import Navbar from '../component/Navbar'
import BankingTable from '../component/BankingTable'

function BankingMasterScreen() {
  return (
    <div>
      <Navbar />
      <BankingTable title="Master Banking" />
    </div>
  )
}

export default BankingMasterScreen