"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import ClientCaseDetails from "./ClientDetails";
import React from "react";

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

// Mapping of case type codes to full names
const caseTypeCodeMapping = {
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

type Client = {
  id: number;
  name: string;
  dateOpened: string;
  status: string;
  type: string;
};

const ClientTable = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<keyof Client>("dateOpened");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [customTypes, setCustomTypes] = useState<string[]>([]);

  // Selected client for case details
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await fetch("/backend/api/clients");
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      // Convert any case type codes to full names
      const processedData = data.map((client: Client) => {
        // If the type is a code, convert it to full name
        if (caseTypeCodeMapping[client.type]) {
          return {
            ...client,
            type: caseTypeCodeMapping[client.type]
          };
        }
        return client;
      });

      // Extract any custom types not in our predefined list
      const extractedCustomTypes = processedData
        .map((client: Client) => client.type)
        .filter((type: string) => !typeOptions.includes(type) && type !== "Others");
      
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

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`backend/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setClients((prev) =>
          prev.map((client) =>
            client.id === id ? { ...client, status: newStatus } : client
          )
        );
        toast.success("Client status updated");
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating client status:", error);
      toast.error("Failed to update status");
    }
  };

  const handleTypeChange = async (id: number, newType: string) => {
    try {
      const res = await fetch(`/backend/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      });

      if (res.ok) {
        setClients((prev) =>
          prev.map((client) =>
            client.id === id ? { ...client, type: newType } : client
          )
        );
        toast.success("Client type updated");
      } else {
        toast.error("Failed to update type");
      }
    } catch (error) {
      console.error("Error updating client type:", error);
      toast.error("Failed to update type");
    }
  };

  const toggleClientExpansion = (clientId: number) => {
    setExpandedClientId((prev) => (prev === clientId ? null : clientId));
  };

  const handleCloseDetails = () => {
    setExpandedClientId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-100 text-blue-800";
      case "Closed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100";
    }
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

  const sortedClients = [...clients].sort((a, b) => {
    if (a[sortField] < b[sortField]) return sortDirection === "asc" ? -1 : 1;
    if (a[sortField] > b[sortField]) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Combine typeOptions with any custom types found in the data
  const allTypeOptions = [...typeOptions, ...customTypes];

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No clients yet
        </h3>
        <p className="text-gray-500">Add your first client to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Name
                  {sortField === "name" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("dateOpened")}
              >
                <div className="flex items-center">
                  Date Opened
                  {sortField === "dateOpened" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Status
                  {sortField === "status" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center">
                  Case Type
                  {sortField === "type" && (
                    <span className="ml-1">
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedClients.map((client) => (
              <React.Fragment key={client.id}>
                <tr
                  className={`hover:bg-gray-50 cursor-pointer ${
                    expandedClientId === client.id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => toggleClientExpansion(client.id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">
                      {client.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(client.dateOpened)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={client.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(client.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-sm rounded-full px-3 py-1 font-medium ${getStatusColor(
                        client.status
                      )} outline-none focus:ring-2 focus:ring-blue-300 transition-all`}
                    >
                      {statusOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={client.type}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleTypeChange(client.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm rounded-md px-3 py-1 bg-gray-100 text-gray-800 outline-none focus:ring-2 focus:ring-blue-300 transition-all"
                    >
                      {allTypeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
                {expandedClientId === client.id && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <ClientCaseDetails
                        clientId={client.id}
                        clientName={client.name}
                        onClose={handleCloseDetails}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;