'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ClientTable from './frontend/components/ClientTable'
import { Button } from '@/components/ui/button'
import { Toaster, toast } from 'sonner'
import StatsCards from './frontend/components/StatsCards '

type Particle = {
  id: number;
  left: number;
  top: number;
  animationDelay: number;
  animationDuration: number;
};

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const handleClientUpdate = () => {
      toast.success('Client added successfully!')
    }

    // Generate particles only on client side after hydration
    const generatedParticles: Particle[] = [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 3 + Math.random() * 4
    }))
    
    setParticles(generatedParticles)
    
    window.addEventListener('client-updated', handleClientUpdate)
    setIsLoaded(true)

    return () => {
      window.removeEventListener('client-updated', handleClientUpdate)
    }
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"
          style={{
            left: `${mousePosition.x / 10}px`,
            top: `${mousePosition.y / 10}px`,
            transition: 'all 0.3s ease-out'
          }}
        />
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '6s' }} />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 bg-teal-500/15 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '8s' }} />
      </div>

      {/* Floating particles - only render after hydration */}
      {isLoaded && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.animationDelay}s`,
                animationDuration: `${particle.animationDuration}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative inline-block">
            <h1 className="text-7xl font-black mb-4 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent animate-pulse">
              Client Management
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400/20 to-green-400/20 blur-lg rounded-lg" />
          </div>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
            Streamline your client relationships with our cutting-edge management platform
          </p>
          
          {/* Animated CTA Button */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-green-600 rounded-lg blur opacity-75 group-hover:opacity-100 transition duration-200" />
            <Link href="/frontend/clients/new">
              <Button 
                size="lg" 
                className="relative bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold px-8 py-4 text-lg rounded-lg transform hover:scale-105 transition-all duration-200 shadow-2xl"
              >
                <span className="flex items-center gap-2">
                  ✨ Add New Client
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Enhanced Stats Cards */}
        <div className={`mb-12 transition-all duration-1000 delay-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-2xl blur-xl" />
            <div className="relative bg-slate-800/60 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
              <StatsCards />
            </div>
          </div>
        </div>

        {/* Enhanced Client Table Section */}
        <div className={`transition-all duration-1000 delay-500 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
              Recent Clients
            </h2>
          </div>
          
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
              {/* Pass limit prop to ClientTable to show only 2 clients */}
              <ClientTable limit={2} />
              
              {/* See More Clients Button */}
              <div className="mt-6 text-center">
                <div className="relative inline-block group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-slate-500 to-slate-600 rounded-lg blur opacity-50 group-hover:opacity-75 transition duration-200" />
                  <Link href="/clients">
                    <Button 
                      variant="outline"
                      className="relative bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:text-white font-semibold px-6 py-3 rounded-lg transform hover:scale-105 transition-all duration-200"
                    >
                      <span className="flex items-center gap-2">
                        View All Clients
                        <svg 
                          className="w-4 h-4 transition-transform group-hover:translate-x-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      
      </div>

      {/* Enhanced Toaster */}
      <Toaster 
        position="top-right" 
        richColors 
        toastOptions={{
          style: {
            background: 'rgba(30, 41, 59, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            color: 'white'
          }
        }}
      />

      {/* Custom CSS for additional animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.6); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}