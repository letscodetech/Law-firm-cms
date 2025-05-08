"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, BarChart3, Save, Edit, X } from "lucide-react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { toast } from "sonner";

// Define our types
interface Client {
  id: string;
  name: string;
}

interface BillingData {
  clientName: string;
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
}

export default function ClientBillingPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasSavedData, setHasSavedData] = useState<boolean>(false);

  // Calculate remaining amount
  const amountRemaining = Math.max(0, totalAmount - amountPaid);

  // Fetch clients on page load
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/backend/api/clients");
        if (res.ok) {
          const data: Client[] = await res.json();
          setClients(data);
        } else {
          console.error("Failed to fetch clients");
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    fetchClients();
  }, []);

  // Fetch billing data when a client is selected
  useEffect(() => {
    if (!selectedClient) {
      resetForm();
      setHasSavedData(false);
      return;
    }

    const fetchBillingData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/backend/api/clients/${selectedClient}/billing`
        );
        if (res.ok) {
          const data: BillingData = await res.json();
          setClientName(data.clientName);
          setTotalAmount(data.totalAmount);
          setAmountPaid(data.amountPaid);
          setHasSavedData(true);
        } else {
          // If no billing data exists yet
          const clientData = clients.find((c) => c.id === selectedClient);
          if (clientData) {
            setClientName(clientData.name);
            setTotalAmount(0);
            setAmountPaid(0);
            setHasSavedData(false);
            // Open modal automatically for new clients
            setIsModalOpen(true);
          }
        }
      } catch (error) {
        console.error("Error fetching billing data:", error);
        // Reset form with just the client name
        const clientData = clients.find((c) => c.id === selectedClient);
        if (clientData) {
          setClientName(clientData.name);
          setTotalAmount(0);
          setAmountPaid(0);
          setHasSavedData(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [selectedClient, clients]);

  // Reset form fields
  const resetForm = () => {
    setClientName("");
    setTotalAmount(0);
    setAmountPaid(0);
  };

  // Handle form submission to save billing data
  const handleSave = async () => {
    if (!selectedClient) return;

    setIsSaving(true);

    const billingData: BillingData = {
      clientName,
      totalAmount,
      amountPaid,
      amountRemaining,
    };

    try {
      // Check if billing data already exists for this client
      const checkRes = await fetch(
        `/backend/api/clients/${selectedClient}/billing`
      );
      const method = checkRes.ok ? "PATCH" : "POST";

      const saveRes = await fetch(
        `/backend/api/clients/${selectedClient}/billing`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(billingData),
        }
      );

      if (saveRes.ok) {
        toast.success("Billing information saved successfully!");
        setHasSavedData(true);
        setIsModalOpen(false);
      } else {
        toast.error("Failed to save billing information");
      }
    } catch (error) {
      console.error("Error saving billing data:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle amount input change with validation
  const handleAmountChange = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    value: string
  ) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setter(numValue);
    } else if (value === "") {
      setter(0);
    }
  };

  // Prepare chart data
  interface ChartDataItem {
    name: string;
    value: number;
  }

  const chartData: ChartDataItem[] = [
    { name: "Amount Paid", value: amountPaid },
    { name: "Amount Remaining", value: amountRemaining },
  ];

  const COLORS = ["#4ade80", "#ef4444"]; // Green for paid, Red for remaining

  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center">
          <Link
            href="/"
            className="flex items-center text-slate-600 hover:text-slate-900 transition mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            <span>Back to Home</span>
          </Link>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center">
              <BarChart3 className="mr-2" />
              Client Billing Management
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 pb-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="client" className="text-sm font-medium">
                  Select Client
                </Label>
                <Select
                  value={selectedClient}
                  onValueChange={setSelectedClient}
                >
                  <SelectTrigger id="client" className="w-full">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-600 rounded-full border-t-transparent"></div>
                </div>
              )}

              {!isLoading && selectedClient && hasSavedData && (
                <div className="bg-white p-6 rounded-lg shadow-md relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSelectedClient("")}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-gray-100"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </Button>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-semibold">{clientName}</h3>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Total Amount</p>
                          <p className="text-lg font-bold">
                            {formatCurrency(totalAmount)}
                          </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">Amount Paid</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(amountPaid)}
                          </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-500">
                            Amount Remaining
                          </p>
                          <p className="text-lg font-bold text-red-500">
                            {formatCurrency(amountRemaining)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setIsModalOpen(true)}
                      className="flex items-center"
                    >
                      <Edit size={16} className="mr-2" />
                      Edit Billing
                    </Button>
                  </div>

                  <div className="w-full h-72">
                    {totalAmount > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name}: ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => formatCurrency(Number(value))}
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-400">
                        <p>No billing data available</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!selectedClient && !isLoading && (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Select a client to manage billing information.
                  </p>
                </div>
              )}

              {!isLoading &&
                selectedClient &&
                !hasSavedData &&
                !isModalOpen && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      No billing information exists for this client.
                    </p>
                    <Button
                      onClick={() => setIsModalOpen(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      Add Billing Information
                    </Button>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Billing Information</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <h3 className="text-lg font-semibold mb-4">{clientName}</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totalAmount" className="text-sm font-medium">
                  Total Amount
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={totalAmount || ""}
                  onChange={(e) =>
                    handleAmountChange(setTotalAmount, e.target.value)
                  }
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountPaid" className="text-sm font-medium">
                  Amount Paid
                </Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min="0"
                  max={totalAmount}
                  step="0.01"
                  value={amountPaid || ""}
                  onChange={(e) =>
                    handleAmountChange(setAmountPaid, e.target.value)
                  }
                  className="w-full"
                />
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-500">Amount Remaining</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(amountRemaining)}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end space-x-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                <span className="flex items-center">
                  <Save size={18} className="mr-2" />
                  Save Billing
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}