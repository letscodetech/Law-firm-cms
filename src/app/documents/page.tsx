import React from "react";
import DocumentManager from "../frontend/components/DocumentManager";

const DocumentsPage = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Document Management</h1>
      <DocumentManager />
    </div>
  );
};

export default DocumentsPage;