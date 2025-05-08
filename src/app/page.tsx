'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import ClientTable from './frontend/components/ClientTable'
import { Button } from '@/components/ui/button'
import { Toaster, toast } from 'sonner'
import StatsCards from './frontend/components/StatsCards '
export default function Home() {
  useEffect(() => {
    const handleClientUpdate = () => {
      toast.success('Client added successfully!')
    }

    window.addEventListener('client-updated', handleClientUpdate)

    return () => {
      window.removeEventListener('client-updated', handleClientUpdate)
    }
  }, [])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-6">Client Management</h1>
      <Link href="/frontend/clients/new">
  <Button size="lg">Add New Client</Button>
</Link>

      <StatsCards />

      <h2 className="text-2xl font-bold mt-8 mb-4">Clients</h2>
      <ClientTable />

      {/* Sonner Toaster for notifications */}
      <Toaster position="top-right" richColors />
    </div>
  )
}
