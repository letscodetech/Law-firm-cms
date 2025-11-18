"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FolderPlus,
  Upload,
  File,
  Folder,
  MoreHorizontal,
  Download,
  Trash2,
  Edit,
  Search,
  X,
  Grid,
  List,
  FileText,
  FileImage,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import { FaFilePdf } from "react-icons/fa";
import { toast } from "sonner";
import Image from "next/image";

// Types
type FileItem = {
  id: string;
  name: string;
  type: "file";
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
};

type FolderItem = {
  id: string;
  name: string;
  type: "folder";
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
};

type Item = FileItem | FolderItem;

const DocumentManager = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<
    { id: string | null; name: string }[]
  >([{ id: null, name: "My Documents" }]);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameName, setRenameName] = useState("");
  
  // New state for file preview
  const [previewFile, setPreviewFile] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  useEffect(() => {
    fetchItems(currentFolder);
  }, [currentFolder]);

  const fetchItems = async (folderId: string | null) => {
    try {
      setLoading(true);
      const res = await fetch(
        `/backend/api/documents?folderId=${folderId ?? "root"}`
      );

      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        toast.error("Failed to load documents");
      }
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast.error("Error loading documents");
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: Item) => {
    if (item.type === "folder") {
      // Update breadcrumbs
      const newBreadcrumbs = [...breadcrumbs, { id: item.id, name: item.name }];
      setBreadcrumbs(newBreadcrumbs);
      setCurrentFolder(item.id);
    } else {
      // Handle file preview
      handlePreviewFile(item as FileItem);
    }
  };

  const handlePreviewFile = async (file: FileItem) => {
    try {
      toast.loading(`Opening ${file.name}...`);
      
      const response = await fetch(`/backend/api/documents/files/${file.id}?action=view`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      setPreviewFile({
        url: blobUrl,
        name: file.name,
        type: file.mimeType
      });
      
      toast.dismiss();
    } catch (error) {
      toast.dismiss();
      console.error('Error opening file:', error);
      toast.error('Failed to open file');
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const breadcrumb = breadcrumbs[index];
    setCurrentFolder(breadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContextMenu = (e: React.MouseEvent, item: Item) => {
    e.preventDefault();
    setSelectedItem(item);
    setContextMenuPosition({ x: e.pageX, y: e.pageY });
    setShowContextMenu(true);
  };

  // Memoize handleDocumentClick to fix the useEffect dependency warning
  const handleDocumentClick = useCallback(() => {
    if (showContextMenu) {
      setShowContextMenu(false);
    }
  }, [showContextMenu]);

  useEffect(() => {
    document.addEventListener("click", handleDocumentClick);
    return () => document.removeEventListener("click", handleDocumentClick);
  }, [handleDocumentClick]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("parentId", currentFolder || "root");

      toast.loading(`Uploading ${file.name}...`);

      const res = await fetch("/backend/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.dismiss();
        toast.success(`${file.name} uploaded successfully`);
        fetchItems(currentFolder);
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to upload file");
      console.error("Upload error:", error);
    }

    // Clear the input
    e.target.value = "";
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name cannot be empty");
      return;
    }

    try {
      const res = await fetch("/backend/api/documents/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolder || "root",
        }),
      });

      if (res.ok) {
        toast.success("Folder created successfully");
        fetchItems(currentFolder);
        setNewFolderName("");
        setShowCreateFolderModal(false);
      } else {
        throw new Error("Failed to create folder");
      }
    } catch (error) {
      toast.error("Failed to create folder");
      console.error("Error creating folder:", error);
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    try {
      const endpoint =
        selectedItem.type === "folder"
          ? `/backend/api/documents/folders/${selectedItem.id}`
          : `/backend/api/documents/files/${selectedItem.id}`;

      const res = await fetch(endpoint, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success(`${selectedItem.name} deleted successfully`);
        fetchItems(currentFolder);
      } else {
        throw new Error("Failed to delete item");
      }
    } catch (error) {
      toast.error("Failed to delete item");
      console.error("Error deleting item:", error);
    } finally {
      setShowContextMenu(false);
    }
  };

  const handleView = async (file: FileItem) => {
    try {
      toast.loading(`Opening ${file.name}...`);
      
const response = await fetch(`/backend/api/documents/files/${file.id}?action=view`);      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Open the file in a new tab for viewing
      window.open(blobUrl, '_blank');
      
      // Clean up the blob URL after a short delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.dismiss();
    } catch (error) {
      toast.dismiss();
      console.error('Error opening file:', error);
      toast.error('Failed to open file');
    }
    
    setShowContextMenu(false);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      toast.loading(`Downloading ${file.name}...`);
      
      const response = await fetch(`/backend/api/documents/files/${file.id}?action=download`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the blob URL
      URL.revokeObjectURL(blobUrl);
      
      toast.dismiss();
      toast.success(`${file.name} downloaded successfully`);
    } catch (error) {
      toast.dismiss();
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    }
    
    setShowContextMenu(false);
  };

  const handleRename = () => {
    if (!selectedItem) return;
    setRenameName(selectedItem.name);
    setShowRenameModal(true);
    setShowContextMenu(false);
  };

  const submitRename = async () => {
    if (!selectedItem || !renameName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      const endpoint =
        selectedItem.type === "folder"
          ? `/backend/api/documents/folders/${selectedItem.id}`
          : `/backend/api/documents/files/${selectedItem.id}`;

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName }),
      });

      if (res.ok) {
        toast.success(`Renamed successfully`);
        fetchItems(currentFolder);
        setShowRenameModal(false);
      } else {
        throw new Error("Failed to rename item");
      }
    } catch (error) {
      toast.error("Failed to rename item");
      console.error("Error renaming item:", error);
    }
  };

  // Render file icon based on MIME type
  const renderFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage size={40} className="text-purple-500" />;
    } else if (mimeType.startsWith("application/pdf")) {
      return <FaFilePdf size={40} className="text-red-500" />;
    } else if (
      mimeType.includes("spreadsheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    ) {
      return <FileSpreadsheet size={40} className="text-green-500" />;
    } else if (
      mimeType.includes("document") ||
      mimeType.includes("word") ||
      mimeType.includes("text")
    ) {
      return <FileText size={40} className="text-blue-700" />;
    } else {
      return <File size={40} className="text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Close preview modal and clean up
  const closePreview = () => {
    if (previewFile) {
      URL.revokeObjectURL(previewFile.url);
      setPreviewFile(null);
    }
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col"
      onClick={handleDocumentClick}
    >
      {/* Header with actions */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Documents</h2>

        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-60"
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            onClick={() => setView("list")}
            className={`p-2 rounded-md ${
              view === "list"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <List size={18} />
          </button>
          <button
            onClick={() => setView("grid")}
            className={`p-2 rounded-md ${
              view === "grid"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-500 hover:bg-gray-100"
            }`}
          >
            <Grid size={18} />
          </button>

          <div className="h-5 w-px bg-gray-300 mx-1"></div>

          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md"
          >
            <FolderPlus size={16} className="mr-1" />
            New Folder
          </button>

          <label className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer">
            <Upload size={16} className="mr-1" />
            Upload
            <input type="file" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="px-4 py-2 border-b border-gray-200 flex items-center overflow-x-auto whitespace-nowrap">
        {breadcrumbs.map((crumb, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">/</span>}
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className={`text-sm ${
                index === breadcrumbs.length - 1
                  ? "font-medium text-blue-600"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              {index === 0 ? (
                <div className="flex items-center">
                  <Folder size={16} className="mr-1" />
                  {crumb.name}
                </div>
              ) : (
                crumb.name
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-2">
              {searchTerm ? (
                <Search size={48} className="mx-auto mb-3" />
              ) : (
                <Folder size={48} className="mx-auto mb-3" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-700">
              {searchTerm ? "No results found" : "This folder is empty"}
            </h3>
            <p className="text-gray-500 mt-1">
              {searchTerm
                ? `No documents found matching "${searchTerm}"`
                : "Upload files or create folders to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Display folders first, then files */}
            {view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredItems
                  .sort((a, b) => {
                    // Sort folders first, then sort by name
                    if (a.type !== b.type) {
                      return a.type === "folder" ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                  })
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors relative"
                      onClick={() => handleItemClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                    >
                      <div className="flex flex-col items-center text-center">
                        {item.type === "folder" ? (
                          <Folder size={40} className="text-blue-500 mb-2" />
                        ) : (
                          <div className="mb-2">
                            {renderFileIcon((item as FileItem).mimeType)}
                          </div>
                        )}
                        <div className="w-full mt-1">
                          <p className="font-medium text-gray-800 truncate text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.type === "file"
                              ? formatFileSize((item as FileItem).size)
                              : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="overflow-hidden border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Name
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Type
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Size
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Modified
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredItems
                      .sort((a, b) => {
                        // Sort folders first, then sort by name
                        if (a.type !== b.type) {
                          return a.type === "folder" ? -1 : 1;
                        }
                        return a.name.localeCompare(b.name);
                      })
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onContextMenu={(e) => handleContextMenu(e, item)}
                        >
                          <td
                            className="px-4 py-3 flex items-center"
                            onClick={() => handleItemClick(item)}
                          >
                            {item.type === "folder" ? (
                              <Folder
                                size={20}
                                className="text-blue-500 mr-3"
                              />
                            ) : (
                              <div className="mr-3">
                                {renderFileIcon((item as FileItem).mimeType)}
                              </div>
                            )}
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.type === "folder"
                              ? "Folder"
                              : (item as FileItem).mimeType
                                  .split("/")[1]
                                  .toUpperCase()}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {item.type === "file"
                              ? formatFileSize((item as FileItem).size)
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {formatDate(item.updatedAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            <button
                              className="text-gray-500 hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, item);
                              }}
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Context Menu */}
      {showContextMenu && selectedItem && (
        <div
          className="absolute bg-white shadow-md rounded-md border border-gray-200 z-50 w-48"
          style={{
            top: contextMenuPosition.y,
            left: contextMenuPosition.x,
            transform: `translate(${
              contextMenuPosition.x + 192 > window.innerWidth ? "-100%" : "0"
            }, ${
              contextMenuPosition.y + 160 > window.innerHeight ? "-100%" : "0"
            })`,
          }}
        >
          <ul className="py-1">
            {selectedItem.type === "file" && (
              <>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleView(selectedItem as FileItem)}
                  >
                    <Eye size={16} className="mr-2" />
                    View
                  </button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => handleDownload(selectedItem as FileItem)}
                  >
                    <Download size={16} className="mr-2" />
                    Download
                  </button>
                </li>
              </>
            )}
            <li>
              <button
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                onClick={handleRename}
              >
                <Edit size={16} className="mr-2" />
                Rename
              </button>
            </li>
            <li>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                onClick={handleDelete}
              >
                <Trash2 size={16} className="mr-2" />
                Delete
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Rename {selectedItem.type === "folder" ? "Folder" : "File"}
            </h3>
            <input
              type="text"
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              placeholder="New name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={() => setShowRenameModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={submitRename}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-4/5 flex flex-col">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold truncate">{previewFile.name}</h3>
              <button 
                onClick={closePreview}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2">
              {previewFile.type.startsWith('image/') ? (
                <div className="flex justify-center items-center h-full">
                  <Image 
                    src={previewFile.url} 
                    alt={previewFile.name} 
                    width={0}
                    height={0}
                    sizes="100vw"
                    className="max-w-full max-h-full object-contain"
                    unoptimized
                  />
                </div>
              ) : previewFile.type === 'application/pdf' ? (
                <iframe 
                  src={previewFile.url} 
                  className="w-full h-full"
                  title={previewFile.name}
                />
              ) : previewFile.type.startsWith('text/') ? (
                <pre className="bg-gray-100 p-4 rounded overflow-auto h-full">
                  <code id="text-content"></code>
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <File size={64} className="text-gray-400 mb-4" />
                  <p className="text-gray-500">Preview not available for this file type</p>
                  <button 
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = previewFile.url;
                      a.download = previewFile.name;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Download File
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManager;