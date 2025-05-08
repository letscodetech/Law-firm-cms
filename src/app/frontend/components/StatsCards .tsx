'use client';

import { useEffect, useState } from 'react';

const StatsCards = () => {
  const [stats, setStats] = useState({
    openCases: 0,
    closedCases: 0,
    totalClients: 0
  });
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchStats();
    
    // Set up event listener for stats updates
    window.addEventListener('client-updated', fetchStats);
    
    return () => {
      window.removeEventListener('client-updated', fetchStats);
    };
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="border rounded p-6 text-center">
        <h3 className="text-xl font-semibold mb-2">Open Cases</h3>
        {isLoading ? (
          <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        ) : (
          <p className="text-4xl font-bold">{stats.openCases}</p>
        )}
      </div>
      <div className="border rounded p-6 text-center">
        <h3 className="text-xl font-semibold mb-2">Closed Cases</h3>
        {isLoading ? (
          <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        ) : (
          <p className="text-4xl font-bold">{stats.closedCases}</p>
        )}
      </div>
      <div className="border rounded p-6 text-center">
        <h3 className="text-xl font-semibold mb-2">Total Clients</h3>
        {isLoading ? (
          <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        ) : (
          <p className="text-4xl font-bold">{stats.totalClients}</p>
        )}
      </div>
    </div>
  );
};

export default StatsCards;