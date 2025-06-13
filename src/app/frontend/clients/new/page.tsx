'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Sparkles, User, Briefcase, Plus, X } from 'lucide-react'
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
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [matters, setMatters] = useState([{
    id: Date.now(),
    title: '',
    dateOpened: '',
    status: 'Open',
    type: 'Magistrate Court Commercial Suits',
    customType: '',
    description: ''
  }])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const router = useRouter()

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  useEffect(() => {const handleMouseMove = (e: MouseEvent) => {
    setMousePosition({ x: e.clientX, y: e.clientY });
  };
  
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const addMatter = () => {
    setMatters([...matters, {
      id: Date.now(),
      title: '',
      dateOpened: '',
      status: 'Open',
      type: 'Magistrate Court Commercial Suits',
      customType: '',
      description: ''
    }])
  }

  const removeMatter = (id: number) => {
    if (matters.length > 1) {
      setMatters(matters.filter(matter => matter.id !== id))
    }
  }

  const updateMatter = (id: number, field: string, value: string) => {
    setMatters(matters.map(matter => 
      matter.id === id ? { ...matter, [field]: value } : matter
    ))
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validate that all matters have required fields
    const validMatters = matters.filter(matter => 
      matter.title.trim() && matter.dateOpened
    )

    if (validMatters.length === 0) {
      toast.error('Please add at least one matter with title and date')
      setIsSubmitting(false)
      return
    }

    // Process matters data
    const processedMatters = validMatters.map(matter => ({
      title: matter.title,
      dateOpened: new Date(matter.dateOpened).toISOString(),
      status: matter.status,
      type: matter.type === 'Others' ? matter.customType : matter.type,
      description: matter.description
    }))

    const newClient = { 
      name, 
      email,
      phone,
      address,
      matters: processedMatters
    }

    try {
      const res = await fetch('/backend/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      })

      if (res.ok) {
        toast.success('Client and matters added successfully!')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
          style={{
            left: `${mousePosition.x / 15}px`,
            top: `${mousePosition.y / 15}px`,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-teal-500/15 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 p-6 max-w-6xl mx-auto">
        {/* Back Button with Style */}
        <div className={`mb-8 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
          <Link href="/" className="group relative inline-flex items-center">
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300" />
            <div className="relative flex items-center text-slate-300 hover:text-white transition-colors duration-200 bg-slate-800/60 backdrop-blur-lg rounded-lg px-4 py-3 border border-slate-700/50">
              <ArrowLeft size={20} className="mr-2" />
              <span className="font-medium">Back to Dashboard</span>
            </div>
          </Link>
        </div>

        {/* Hero Section */}
        <div className={`text-center mb-12 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative inline-block">
            <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-pulse">
              Add New Client
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 to-green-400/20 blur-lg rounded-lg" />
          </div>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Create a new client profile with multiple matters using our advanced form system
          </p>
        </div>

        {/* Main Form Card */}
        <div className={`transition-all duration-1000 delay-400 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-3xl blur-lg opacity-0 group-hover:opacity-100 transition duration-500" />
            <Card className="relative bg-slate-800/90 backdrop-blur-xl border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-600 to-green-600 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-green-400/20 animate-pulse" />
                <div className="relative flex items-center">
                  <Sparkles className="mr-3 animate-spin" style={{ animationDuration: '3s' }} />
                  <CardTitle className="text-3xl font-bold">Client & Matter Information</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="pt-8 pb-8">
                <div className="space-y-8">
                  {/* Client Information Section */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="relative bg-slate-700/50 backdrop-blur-lg rounded-xl p-6 border border-slate-600/50">
                      <div className="flex items-center mb-6">
                        <User className="mr-3 text-blue-400" size={24} />
                        <h3 className="text-xl font-semibold text-slate-200">Client Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="name" className="text-sm font-medium text-slate-300 mb-2 block">Full Name *</Label>
                          <Input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter client's full name"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-slate-300 mb-2 block">Email</Label>
                          <Input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="client@example.com"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium text-slate-300 mb-2 block">Phone</Label>
                          <Input
                            type="tel"
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="+254 XXX XXX XXX"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="address" className="text-sm font-medium text-slate-300 mb-2 block">Address</Label>
                          <Input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 py-3 px-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Client's address"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Matters Section */}
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-green-500/20 to-green-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300" />
                    <div className="relative bg-slate-700/50 backdrop-blur-lg rounded-xl p-6 border border-slate-600/50">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                          <Briefcase className="mr-3 text-purple-400" size={24} />
                          <h3 className="text-xl font-semibold text-slate-200">Client Matters</h3>
                        </div>
                        <Button
                          type="button"
                          onClick={addMatter}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Add Matter
                        </Button>
                      </div>

                      <div className="space-y-6">
                        {matters.map((matter, index) => (
                          <div key={matter.id} className="bg-slate-600/30 rounded-lg p-6 border border-slate-500/30">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-medium text-slate-200">Matter {index + 1}</h4>
                              {matters.length > 1 && (
                                <Button
                                  type="button"
                                  onClick={() => removeMatter(matter.id)}
                                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-all duration-200"
                                >
                                  <X size={16} />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-slate-300 mb-2 block">Matter Title *</Label>
                                <Input
                                  type="text"
                                  value={matter.title}
                                  onChange={(e) => updateMatter(matter.id, 'title', e.target.value)}
                                  className="w-full bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 py-2 px-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                  placeholder="Enter matter title"
                                />
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-slate-300 mb-2 block">Date Opened *</Label>
                                <Input
                                  type="date"
                                  value={matter.dateOpened}
                                  onChange={(e) => updateMatter(matter.id, 'dateOpened', e.target.value)}
                                  className="w-full bg-slate-600/50 border-slate-500/50 text-white py-2 px-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                />
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-slate-300 mb-2 block">Status</Label>
                                <Select value={matter.status} onValueChange={(value) => updateMatter(matter.id, 'status', value)}>
                                  <SelectTrigger className="w-full bg-slate-600/50 border-slate-500/50 text-white py-2 px-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-600">
                                    <SelectItem value="Open" className="text-white hover:bg-slate-700">Open</SelectItem>
                                    <SelectItem value="Closed" className="text-white hover:bg-slate-700">Closed</SelectItem>
                                    <SelectItem value="Pending" className="text-white hover:bg-slate-700">Pending</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label className="text-sm font-medium text-slate-300 mb-2 block">Case Type</Label>
                                <Select value={matter.type} onValueChange={(value) => updateMatter(matter.id, 'type', value)}>
                                  <SelectTrigger className="w-full bg-slate-600/50 border-slate-500/50 text-white py-2 px-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-600 max-h-60">
                                    {caseTypes.map((caseType) => (
                                      <SelectItem key={caseType} value={caseType} className="text-white hover:bg-slate-700">
                                        {caseType}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="Others" className="text-white hover:bg-slate-700 font-semibold border-t border-slate-600 mt-2">
                                      Custom Type
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {matter.type === 'Others' && (
                                <div className="md:col-span-2">
                                  <Label className="text-sm font-medium text-slate-300 mb-2 block">Custom Case Type</Label>
                                  <Input
                                    type="text"
                                    value={matter.customType}
                                    onChange={(e) => updateMatter(matter.id, 'customType', e.target.value)}
                                    className="w-full bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 py-2 px-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                                    placeholder="Enter custom case type"
                                  />
                                </div>
                              )}

                              <div className="md:col-span-2">
                                <Label className="text-sm font-medium text-slate-300 mb-2 block">Description</Label>
                                <textarea
                                  value={matter.description}
                                  onChange={(e) => updateMatter(matter.id, 'description', e.target.value)}
                                  className="w-full bg-slate-600/50 border-slate-500/50 text-white placeholder-slate-400 py-2 px-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 min-h-[80px] resize-none"
                                  placeholder="Matter description (optional)"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="bg-slate-900/60 backdrop-blur-lg px-8 py-6 border-t border-slate-700/50">
                <div className="flex justify-end space-x-4 w-full">
                  <Link href="/">
                    <Button 
                      variant="outline" 
                      type="button" 
                      className="bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white px-6 py-3 text-lg rounded-xl transition-all duration-200"
                    >
                      Cancel
                    </Button>
                  </Link>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-200" />
                    <Button 
                      type="submit" 
                      onClick={handleSubmit}
                      className="relative bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold px-8 py-3 text-lg rounded-xl transform hover:scale-105 transition-all duration-200 shadow-2xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Creating Magic...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Save size={20} className="mr-3" />
                          Save Client & Matters
                          <div className="w-2 h-2 bg-white rounded-full animate-ping ml-3" />
                        </span>
                      )}
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="fixed bottom-8 right-8 flex flex-col gap-4 pointer-events-none">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500/30 to-green-600/30 rounded-full backdrop-blur-lg animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="w-8 h-8 bg-gradient-to-r from-teal-500/20 to-cyan-600/20 rounded-full backdrop-blur-lg animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }} />
        </div>

        {/* Success indicator */}
        <div className="fixed top-8 right-8 pointer-events-none">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full backdrop-blur-lg flex items-center justify-center animate-pulse">
            <Sparkles className="text-emerald-400" size={24} />
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes slide-in-from-top {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .slide-in-from-top {
          animation-name: slide-in-from-top;
        }
      `}</style>
    </div>
  )
}