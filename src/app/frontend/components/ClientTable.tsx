"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ClientCaseDetails from "./ClientDetails";
import React from "react";
import DocumentManager from "./DocumentManager";
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const statusOptions = ["Open", "Closed", "Pending"];
const typeOptions = [
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
  "High Court Criminal",
  "Others"
];

// Define a type for case type codes
type CaseTypeCode = 
  | "MCCOMMSU" 
  | "MCCGCR" 
  | "MCCHSO" 
  | "MCSUCCMISC" 
  | "MCCCMISC" 
  | "MCDC" 
  | "MCEP" 
  | "MCSO" 
  | "MCCR" 
  | "MCTR" 
  | "MCSUCC" 
  | "MCELC" 
  | "MCCRMISC" 
  | "MCINQ" 
  | "MCELCMISC";

// Mapping of case type codes to full names
const caseTypeCodeMapping: Record<CaseTypeCode, string> = {
  "MCCOMMSU": "Magistrate Court Commercial Suits",
  "MCCGCR": "Magistrate Court County Government Criminal Matters",
  "MCCHSO": "Sexual Offence- Children",
  "MCSUCCMISC": "Magistrate Court Succession Miscellaneous",
  "MCCCMISC": "Magistrate Court Civil Miscellaneous",
  "MCDC": "Magistrate Court Divorce Case",
  "MCEP": "Election Petition",
  "MCSO": "Sexual Offences",
  "MCCR": "Magistrate Court Criminal Case",
  "MCTR": "Magistrate Court Traffic Case",
  "MCSUCC": "Magistrate Court Succession Matter",
  "MCELC": "Magistrate Court Environment and Land Case",
  "MCCRMISC": "Magistrate Court Criminal Miscellaneous",
  "MCINQ": "Magistrate Court Inquest",
  "MCELCMISC": "Environment and Land Misc."
};

// Type guard function to check if a string is a valid case type code
function isCaseTypeCode(code: string): code is CaseTypeCode {
  return Object.keys(caseTypeCodeMapping).includes(code as CaseTypeCode);
}

type Matter = {
  id: number;
  title: string;
  dateOpened: string;
  status: string;
  type: string;
  description?: string;
};

type Client = {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  dateOpened: string; 
  status: string;  
  type: string; 
  matters?: Matter[];
};

const ClientTable = ({ limit }: { limit?: number }) => {
  const pathname = usePathname();

  const isClientPage = pathname === '/client' || pathname === '/clients';

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Client>("dateOpened");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [customTypes, setCustomTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Selected client for case details
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  // Track which specific matters have their details expanded
  const [expandedMatterDetails, setExpandedMatterDetails] = useState<Set<string>>(new Set());
  
  // Add to your state management
  const [expandedDocuments, setExpandedDocuments] = useState(new Set<string>());

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/backend/api/clients");
      const text = await res.text();
      
      // Handle empty response
      if (!text) {
        setClients([]);
        return;
      }
      
      // Safely parse JSON
      let parsedData;
      try {
        parsedData = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON response:", parseError);
        toast.error("Invalid response from server");
        setClients([]);
        return;
      }
      
      // Handle different response formats
      let data: Client[];
      
      if (Array.isArray(parsedData)) {
        // Direct array response: [...]
        data = parsedData;
      } else if (parsedData && typeof parsedData === 'object') {
        // Wrapped response: { data: [...] }, { clients: [...] }, etc.
        data = parsedData.data 
            || parsedData.clients 
            || parsedData.results 
            || parsedData.items
            || parsedData.matters
            || [];
        
        if (!Array.isArray(data)) {
          console.error("Expected array but got:", typeof data, data);
          toast.error("Unexpected response format from server");
          setClients([]);
          return;
        }
      } else {
        console.error("Unexpected response type:", typeof parsedData, parsedData);
        toast.error("Unexpected response from server");
        setClients([]);
        return;
      }

      const processedData: Client[] = data.map((client) => {
        if (client.matters && Array.isArray(client.matters)) {
          const processedMatters: Matter[] = client.matters.map((matter) => ({
            ...matter,
            type: isCaseTypeCode(matter.type)
              ? caseTypeCodeMapping[matter.type]
              : matter.type,
          }));
  
          return {
            ...client,
            matters: processedMatters,
            dateOpened: processedMatters[0]?.dateOpened || client.dateOpened,
            status: processedMatters[0]?.status || client.status || "Open",
            type: processedMatters[0]?.type || client.type || "Others",
          };
        } else {
          const processedType = isCaseTypeCode(client.type)
            ? caseTypeCodeMapping[client.type]
            : client.type;
  
          return {
            ...client,
            type: processedType,
            matters: [
              {
                id: 1,
                title: `${client.name} Case`,
                dateOpened: client.dateOpened,
                status: client.status,
                type: processedType,
                description: "",
              },
            ],
          };
        }
      });
  
      // Extract custom types
      const allTypes = processedData.flatMap((client) =>
        client.matters?.map((matter) => matter.type) || [client.type]
      );
      const extractedCustomTypes = allTypes.filter(
        (type) => !typeOptions.includes(type) && type !== "Others"
      );
  
      setCustomTypes(Array.from(new Set(extractedCustomTypes)));
      setClients(processedData);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchClients();

    // Listen for client-added event
    const handleClientAdded = () => {
      fetchClients();
    };

    window.addEventListener("client-added", handleClientAdded);

    return () => {
      window.removeEventListener("client-added", handleClientAdded);
    };
  }, []);

  const handleStatusChange = async (clientId: number, matterId: number, newStatus: string) => {
    try {
      // FIXED: Added missing leading slash
      const res = await fetch(`/backend/api/clients/${clientId}/matters/${matterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setClients((prev) =>
          prev.map((client) => {
            if (client.id === clientId) {
              const updatedMatters = client.matters?.map((matter) =>
                matter.id === matterId ? { ...matter, status: newStatus } : matter
              ) || [];
              
              return {
                ...client,
                matters: updatedMatters,
                status: updatedMatters[0]?.status || client.status
              };
            }
            return client;
          })
        );
        toast.success("Matter status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating matter status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleTypeChange = async (clientId: number, matterId: number, newType: string) => {
    try {
      const res = await fetch(`/backend/api/clients/${clientId}/matters/${matterId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      });

      if (res.ok) {
        setClients((prev) =>
          prev.map((client) => {
            if (client.id === clientId) {
              const updatedMatters = client.matters?.map((matter) =>
                matter.id === matterId ? { ...matter, type: newType } : matter
              ) || [];
              
              return {
                ...client,
                matters: updatedMatters,
                type: updatedMatters[0]?.type || client.type
              };
            }
            return client;
          })
        );
        toast.success("Matter type updated");
      } else {
        toast.error("Failed to update type");
      }
    } catch (error) {
      console.error("Error updating matter type:", error);
      toast.error("Failed to update type");
    }
  };

  const toggleClientExpansion = (clientId: number) => {
    setExpandedClientId((prev) => (prev === clientId ? null : clientId));
  };

  const handleCloseDetails = () => {
    setExpandedClientId(null);
  };

  const toggleMatterDetails = (clientId: number, matterId: number) => {
    const key = `${clientId}-${matterId}`;
    setExpandedMatterDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isMatterDetailsExpanded = (clientId: number, matterId: number) => {
    return expandedMatterDetails.has(`${clientId}-${matterId}`);
  };

  // Toggle function
  const toggleDocuments = (clientId: number, matterId: number) => {
    const key = `${clientId}-${matterId}`;
    setExpandedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  // Check function
  const isDocumentsExpanded = (clientId: number, matterId: number) => {
    return expandedDocuments.has(`${clientId}-${matterId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
      case "Closed":
        return "bg-gray-100 text-gray-700 border border-gray-200";
      case "Pending":
        return "bg-amber-100 text-amber-700 border border-amber-200";
      default:
        return "bg-gray-100 text-gray-600 border border-gray-200";
    }
  };

  const getOverallClientStatus = (client: Client) => {
    if (!client.matters || client.matters.length === 0) return client.status;
    
    const statuses = client.matters.map(matter => matter.status);
    if (statuses.includes("Open")) return "Open";
    if (statuses.includes("Pending")) return "Pending";
    return "Closed";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSort = (field: keyof Client) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  // Sort clients
  const sortedClients = useMemo(() => {
    return [...clients].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0; 
    });
  }, [clients, sortField, sortDirection]);

  // Filter clients based on search term
  const filteredClients = useMemo(() => {
    if (!searchTerm) return sortedClients;
    
    return sortedClients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.matters?.some(matter => 
        matter.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        matter.type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedClients, searchTerm]);

  const displayClients = useMemo(() => {
    return limit ? filteredClients.slice(0, limit) : filteredClients;
  }, [filteredClients, limit]);
  
  // Combine typeOptions with any custom types found in the data
  const allTypeOptions = [...typeOptions, ...customTypes];

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 text-sm">Loading clients...</p>
        </div>
      </div>
    );
  }
  
  if (displayClients.length === 0 && !loading) {
    return (
      <div className="space-y-4">
        {isClientPage && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clients, emails, or matters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  console.log('Search triggered:', searchTerm);
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            {searchTerm ? 'No matching clients found' : 'No clients yet'}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {searchTerm 
              ? `No clients match "${searchTerm}". Try different search terms.`
              : 'Add your first client to get started with managing your cases and tracking their progress.'
            }
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear search
            </button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        {isClientPage && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search clients, emails, or matters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  console.log('Search triggered:', searchTerm);
                }
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
        <h2 className="text-lg font-semibold text-gray-800 mt-5">Client Cases</h2>
        <p className="text-sm text-gray-600 mt-1">
          {limit ? (
            <>
              Showing {displayClients.length} of {clients.length} clients • {clients.reduce((acc, client) => acc + (client.matters?.length || 1), 0)} total matters
            </>
          ) : (
            <>
              {clients.length} total clients • {clients.reduce((acc, client) => acc + (client.matters?.length || 1), 0)} total matters
            </>
          )}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center gap-2">
                  <span>Client Name</span>
                  {sortField === "name" && (
                    <span className="text-blue-500 text-sm">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                onClick={() => handleSort("dateOpened")}
              >
                <div className="flex items-center gap-2">
                  <span>Date Opened</span>
                  {sortField === "dateOpened" && (
                    <span className="text-blue-500 text-sm">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Matters
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Overall Status
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayClients.map((client, index) => (
              <React.Fragment key={client.id}>
                <tr
                  className={`hover:bg-gray-50 transition-colors duration-200 ${
                    expandedClientId === client.id ? "bg-blue-50 border-l-4 border-blue-400" : ""
                  } ${index % 2 === 0 ? "bg-white" : "bg-gray-25"}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {client.name}
                        </div>
                        {client.email && (
                          <div className="text-xs text-gray-500">{client.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-800 font-medium">
                      {formatDate(client.dateOpened)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {client.matters && client.matters.length > 0 ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">
                            {client.matters.length} matter{client.matters.length > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-600">
                            {client.matters.slice(0, 2).map((matter) => (
                              <div key={matter.id} className="truncate max-w-xs">
                                • {matter.title}
                              </div>
                            ))}
                            {client.matters.length > 2 && (
                              <div className="text-gray-500 italic">
                                +{client.matters.length - 2} more...
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-sm text-gray-500">No matters</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-xs rounded-full px-3 py-1.5 font-semibold ${getStatusColor(getOverallClientStatus(client))}`}>
                      {getOverallClientStatus(client)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleClientExpansion(client.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                    >
                      {expandedClientId === client.id ? (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Hide Details
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          View Details
                        </>
                      )}
                    </button>
                  </td>
                </tr>
  
                {/* Expanded Client Details Row */}
                {expandedClientId === client.id && (
                  <tr>
                    <td colSpan={5} className="p-0 bg-blue-50">
                      <div className="border-l-4 border-blue-400">
                        <div className="p-6 space-y-6">
                          {/* Client Information */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              Client Information
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              {client.email && (
                                <div>
                                  <span className="font-medium text-gray-600">Email:</span>
                                  <p className="text-gray-800">{client.email}</p>
                                </div>
                              )}
                              {client.phone && (
                                <div>
                                  <span className="font-medium text-gray-600">Phone:</span>
                                  <p className="text-gray-800">{client.phone}</p>
                                </div>
                              )}
                              {client.address && (
                                <div>
                                  <span className="font-medium text-gray-600">Address:</span>
                                  <p className="text-gray-800">{client.address}</p>
                                </div>
                              )}
                              <div>
                                <span className="font-medium text-gray-600">Client Since:</span>
                                <p className="text-gray-800">{formatDate(client.dateOpened)}</p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Matters List */}
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                              Client Matters ({client.matters?.length || 0})
                            </h4>
                            <div className="space-y-4">
                              {client.matters && client.matters.length > 0 ? (
                                client.matters.map((matter) => (
                                  <div key={matter.id} className="border border-gray-200 rounded-lg bg-gray-50">
                                    <div className="p-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                          <label className="text-xs font-medium text-gray-600">Matter Title</label>
                                          <p className="text-sm font-semibold text-gray-800">{matter.title}</p>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-gray-600">Date Opened</label>
                                          <p className="text-sm text-gray-800">{formatDate(matter.dateOpened)}</p>
                                        </div>
                                        <div>
                                          <label className="text-xs font-medium text-gray-600 mr-5">Status</label>
                                          <select
                                            value={matter.status}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleStatusChange(client.id, matter.id, e.target.value);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className={`text-xs rounded-full px-3 py-1.5 font-semibold ${getStatusColor(
                                              matter.status
                                            )} outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1 transition-all duration-200 cursor-pointer hover:shadow-sm mt-1`}
                                          >
                                            {statusOptions.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <div>
                                          {/* FIXED TYPO: Removed "Your Clients" from class name */}
                                          <label className="text-xs font-medium text-gray-600 mr-5">Case Type</label>
                                          <select
                                            value={matter.type}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleTypeChange(client.id, matter.id, e.target.value);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="text-xs rounded-md px-3 py-2 bg-white border border-gray-200 text-gray-700 outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all duration-200 cursor-pointer hover:bg-gray-50 max-w-xs mt-1 w-full"
                                            title={matter.type}
                                          >
                                            {allTypeOptions.map((option) => (
                                              <option key={option} value={option}>
                                                {option}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                      {matter.description && (
                                        <div className="mt-3">
                                          <label className="text-xs font-medium text-gray-600">Description</label>
                                          <p className="text-sm text-gray-700 mt-1">{matter.description}</p>
                                        </div>
                                      )}
                                      
                                     {/* Case Details Toggle Button */}
                                     <div className="mt-4 pt-3 border-t border-gray-200">
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => toggleMatterDetails(client.id, matter.id)}
                                            className="inline-flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-1"
                                          >
                                            {isMatterDetailsExpanded(client.id, matter.id) ? (
                                              <>
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                                Hide Case Details
                                              </>
                                            ) : (
                                              <>
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                                View Case Details
                                              </>
                                            )}
                                          </button>
                                          
                                          <button
                                            onClick={() => toggleDocuments(client.id, matter.id)}
                                            className="inline-flex items-center px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-1"
                                          >
                                            {isDocumentsExpanded(client.id, matter.id) ? (
                                              <>
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                                Hide Documents
                                              </>
                                            ) : (
                                              <>
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Documents
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Individual Matter Case Details */}
                                    {isMatterDetailsExpanded(client.id, matter.id) && (
                                      <div className="border-t border-gray-200 bg-white p-4">
                                        <ClientCaseDetails
                                          clientId={client.id}
                                          matterId={matter.id}
                                          clientName={client.name}
                                          matterTitle={matter.title}
                                          onClose={() => toggleMatterDetails(client.id, matter.id)}
                                        />
                                      </div>
                                    )}

                                    {/* Documents Manager */}
                                    {isDocumentsExpanded(client.id, matter.id) && (
                                      <div className="border-t border-gray-200 bg-white p-4">
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                                          <h4 className="font-medium text-blue-900 text-sm">
                                            Documents for {client.name} - {matter.title}
                                          </h4>
                                          <p className="text-blue-700 text-xs mt-1">
                                            Client ID: {client.id} | Matter ID: {matter.id}
                                          </p>
                                        </div>
                                        <DocumentManager />
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                  <p className="text-sm font-medium">No matters found</p>
                                  <p className="text-xs text-gray-400 mt-1">Add a matter to get started</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Close Details Button */}
                          <div className="flex justify-end">
                            <button
                              onClick={handleCloseDetails}
                              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Close Details
                            </button>
                          </div>
                        </div>
                        
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Show limit indicator when applicable */}
      {limit && clients.length > limit && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Showing {displayClients.length} of {clients.length} clients
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientTable;