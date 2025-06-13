'use client';

import { useEffect, useState } from 'react';

type StatsKeys = 'openCases' | 'closedCases' | 'totalClients';

const StatsCards = () => {
  const [stats, setStats] = useState({
    openCases: 0,
    closedCases: 0,
    totalClients: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [animatedStats, setAnimatedStats] = useState({
    openCases: 0,
    closedCases: 0,
    totalClients: 0
  });

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/backend/api/stats');
      const data = await response.json();
      setStats({
        openCases: data.openCases,
        closedCases: data.closedCases,
        totalClients: data.totalClients
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Animate numbers counting up
  useEffect(() => {
    if (!isLoading) {
      const animateNumber = (key: StatsKeys, target: number) => {
        const increment = Math.ceil(target / 30);
        let current = 0;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          setAnimatedStats(prev => ({ ...prev, [key]: current }));
        }, 50);
      };

      animateNumber('openCases', stats.openCases);
      animateNumber('closedCases', stats.closedCases);
      animateNumber('totalClients', stats.totalClients);
    }
  }, [stats, isLoading]);

  useEffect(() => {
    fetchStats();
    
    // Set up event listener for stats updates
    window.addEventListener('client-updated', fetchStats);
    
    return () => {
      window.removeEventListener('client-updated', fetchStats);
    };
  }, []);

  const statsConfig = [
    {
      key: 'openCases' as StatsKeys,
      title: 'Open Cases',
      icon: '📋',
      gradient: 'from-emerald-400 to-green-500',
      bgGradient: 'from-emerald-500/20 to-green-500/20',
      glowColor: 'emerald-400',
      description: 'Active matters'
    },
    {
      key: 'closedCases' as StatsKeys,
      title: 'Closed Cases',
      icon: '✅',
      gradient: 'from-teal-400 to-emerald-500',
      bgGradient: 'from-teal-500/20 to-emerald-500/20',
      glowColor: 'teal-400',
      description: 'Completed successfully'
    },
    {
      key: 'totalClients' as StatsKeys,
      title: 'Total Clients',
      icon: '👥',
      gradient: 'from-green-400 to-teal-500',
      bgGradient: 'from-green-500/20 to-teal-500/20',
      glowColor: 'green-400',
      description: 'Relationships built'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statsConfig.map((config, index) => (
        <div
          key={config.key}
          className="group relative overflow-hidden"
          style={{ animationDelay: `${index * 200}ms` }}
        >
          {/* Animated background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
          
          {/* Main card */}
          <div className="relative bg-slate-800/80 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2">
            
            {/* Floating icon */}
            <div className="flex justify-between items-start mb-4">
              <div className="text-4xl animate-bounce" style={{ animationDuration: `${2 + index * 0.5}s` }}>
                {config.icon}
              </div>
              <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse" />
            </div>
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-200 mb-2 group-hover:text-white transition-colors duration-300">
              {config.title}
            </h3>
            
            {/* Number display */}
            <div className="mb-3">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-12 bg-gradient-to-r from-slate-700 to-slate-600 rounded-lg animate-pulse" />
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-3/4" />
                </div>
              ) : (
                <>
                  <p className={`text-5xl font-black bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent leading-tight`}>
                    {animatedStats[config.key].toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                    {config.description}
                  </p>
                </>
              )}
            </div>
            
            {/* Progress bar effect */}
            <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${config.gradient} rounded-full transition-all duration-1000 ease-out`}
                style={{ 
                  width: isLoading ? '0%' : '100%',
                  transitionDelay: `${index * 300}ms`
                }}
              />
            </div>
            
            {/* Hover glow effect */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-br ${config.bgGradient}`} />
            
            {/* Corner accent */}
            <div className="absolute top-2 right-2 w-16 h-16 opacity-10 group-hover:opacity-30 transition-opacity duration-500">
              <div className={`w-full h-full bg-gradient-to-br ${config.gradient} rounded-full blur-xl`} />
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-emerald-400/30 rounded-full animate-ping"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${30 + i * 20}%`,
                  animationDelay: `${i * 1000 + index * 500}ms`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>
        </div>
      ))}
      
      {/* Custom styles for enhanced animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .shadow-3xl {
          box-shadow: 0 35px 60px -12px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default StatsCards;