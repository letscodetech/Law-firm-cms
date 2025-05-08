import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { toast } from "sonner";

// Define types
type CaseDetails = {
  caseNumber: string;
  trackingNumber: string;
  caseSummary: string;
  filingDate: string;
  station: string;
};

type ClientCaseDetailsProps = {
  clientId: number;
  clientName: string;
  onClose: () => void;
};

const ClientCaseDetails = ({
  clientId,
  clientName,
  onClose,
}: ClientCaseDetailsProps) => {
  const [caseDetails, setCaseDetails] = useState<CaseDetails>({
    caseNumber: "",
    trackingNumber: "",
    caseSummary: "",
    filingDate: new Date().toISOString().split("T")[0],
    station: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasExistingRecord, setHasExistingRecord] = useState(false);

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setLoading(true);
        // Try to fetch existing case details
        const res = await fetch(
          `/backend/api/clients/${clientId}/case-details`
        );

        if (res.ok) {
          const data = await res.json();
          setCaseDetails(data);
          setHasExistingRecord(true);
        }
      } catch (error) {
        console.error("Failed to fetch case details:", error);
        // If no case details exist yet, that's fine - we'll create them on save
      } finally {
        setLoading(false);
      }
    };

    fetchCaseDetails();
  }, [clientId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setCaseDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Choose method based on whether record exists
      const method = hasExistingRecord ? "PATCH" : "POST";
      
      const res = await fetch(`/backend/api/clients/${clientId}/case-details`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseDetails),
      });

      if (res.ok) {
        toast.success("Case details saved successfully");
        onClose();
      } else {
        throw new Error("Failed to save case details");
      }
    } catch (error) {
      console.error("Error saving case details:", error);
      toast.error("Failed to save case details");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-blue-50 border-t border-b border-blue-100 px-6 py-6 animate-fadeIn">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-blue-800">Case Details</h2>
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Close
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Client name display */}
            <div className="mb-6 pb-3 border-b border-blue-100">
              <p className="text-sm text-blue-600">Client</p>
              <p className="text-lg font-medium">{clientName}</p>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* Case Number */}
              <div>
                <label
                  htmlFor="caseNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Case Number
                </label>
                <input
                  type="text"
                  id="caseNumber"
                  name="caseNumber"
                  value={caseDetails.caseNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter case number"
                />
              </div>

              {/* Tracking Number */}
              <div>
                <label
                  htmlFor="trackingNumber"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Tracking Number
                </label>
                <input
                  type="text"
                  id="trackingNumber"
                  name="trackingNumber"
                  value={caseDetails.trackingNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter tracking number"
                />
              </div>

              {/* Filing Date */}
              <div>
                <label
                  htmlFor="filingDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Filing Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="filingDate"
                    name="filingDate"
                    value={caseDetails.filingDate || ""} // Make sure it's an empty string if no value is set
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Station */}
              <div>
                <label
                  htmlFor="station"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Station
                </label>
                <input
                  type="text"
                  id="station"
                  name="station"
                  value={caseDetails.station}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter station"
                />
              </div>

              {/* Case Summary - full width */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <label
                  htmlFor="caseSummary"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Case Summary
                </label>
                <textarea
                  id="caseSummary"
                  name="caseSummary"
                  value={caseDetails.caseSummary}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Enter detailed case summary..."
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Details"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientCaseDetails;