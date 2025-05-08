'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// Full case type list with consistent naming
const caseTypes = [
  "Magistrate Court Commercial Suits",
  "Magistrate Court County Government Criminal Matters",
  "Sexual Offence- Children",
  "Magistrate Court Succession Miscellaneous",
  "Magistrate Court Civil Miscellaneous",
  "Magistrate Court Divorce Case",
  "Election Petition",
  "Sexual Offences",
  "Magistrate Court Criminal Case",
  "Magistrate Court Traffic Case",
  "Magistrate Court Succession Matter",
  "Magistrate Court Environment and Land Case",
  "Magistrate Court Criminal Miscellaneous",
  "Magistrate Court Inquest",
  "Environment and Land Misc.",
  "High Court Judicial Review",
  "High Court Civil Appellate Division",
  "High Court Anti Corruption and Economic Crimes",
  "High Court Family",
  "High Court Commercial and tax",
  "High Court Constitution and Human Rights",
  "High Court Civil",
  "Court Annexed Mediation",
  "High Court Criminal"
];

export default function NewClientPage() {
  const [name, setName] = useState('')
  const [dateOpened, setDateOpened] = useState('')
  const [status, setStatus] = useState('Open')
  const [type, setType] = useState('Magistrate Court Commercial Suits') // Default to full name
  const [customType, setCustomType] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Convert dateOpened to ISO string
    const formattedDateOpened = new Date(dateOpened).toISOString()

    const newClient = { name, dateOpened: formattedDateOpened, status, type: type === 'Others' ? customType : type }

    try {
      const res = await fetch('/backend/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })

      if (res.ok) {
        toast.success('Client added successfully!')
        // Dispatch custom event for client table to update
        window.dispatchEvent(new Event('client-added'))
        router.push('/')
      } else {
        const data = await res.json()
        toast.error(data?.error || 'Failed to add client')
      }
    } catch (error) {
      console.error('Error adding client:', error)
      toast.error('Failed to add client')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center">
          <Link href="/" className="flex items-center text-slate-600 hover:text-slate-900 transition mr-4">
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Clients</span>
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Add New Client</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} id="new-client-form">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">Client Name</Label>
                    <Input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full"
                      placeholder="Enter client name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateOpened" className="text-sm font-medium">Date Opened</Label>
                    <Input
                      type="date"
                      id="dateOpened"
                      value={dateOpened}
                      onChange={(e) => setDateOpened(e.target.value)}
                      className="w-full"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                          <SelectItem value="Pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-sm font-medium">Case Type</Label>
                      <Select value={type} onValueChange={setType}>
                        <SelectTrigger id="type" className="w-full">
                          <SelectValue placeholder="Select case type" />
                        </SelectTrigger>
                        <SelectContent>
                          {caseTypes.map((caseType) => (
                            <SelectItem key={caseType} value={caseType}>
                              {caseType}
                            </SelectItem>
                          ))}
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {type === 'Others' && (
                    <div className="space-y-2">
                      <Label htmlFor="customType" className="text-sm font-medium">Custom Case Type</Label>
                      <Input
                        type="text"
                        id="customType"
                        value={customType}
                        onChange={(e) => setCustomType(e.target.value)}
                        className="w-full"
                        placeholder="Enter custom case type"
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-4 bg-slate-50 px-6 py-4 rounded-b-lg border-t">
            <Link href="/">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button 
              type="submit" 
              form="new-client-form" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save size={18} className="mr-2" />
                  Save Client
                </span>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}