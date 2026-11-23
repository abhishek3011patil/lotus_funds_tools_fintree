
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
    IconButton,
  Tooltip,
} from "@mui/material";

import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import InputAdornment from "@mui/material/InputAdornment";
import * as XLSX from "xlsx";
import FilterListIcon from "@mui/icons-material/FilterList";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";

interface ResearchCall {
  id: string;
  ra_name: string;
  display_name: string;
  symbol: string;
  action: string;
  call_type: string;
  status: string;
  version_type: string;
  version_number: number;
  created_at: string;
  is_latest: boolean;

  [key: string]: any;
}

// Supports VITE_API_URL with or without /api
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const API_URL = `${
  API_BASE_URL.endsWith("/api") ? API_BASE_URL : `${API_BASE_URL}/api`
}/admin/calls-log`;

const AdminCallsLog: React.FC = () => {
  const [calls, setCalls] = useState<ResearchCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [raFilter, setRaFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [versionFilter, setVersionFilter] = useState("ALL");
  const [page, setPage] = useState(1);

    // View Details Dialog State
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<ResearchCall | null>(null);

  const handleViewDetails = (call: ResearchCall) => {
    setSelectedCall(call);
    setDetailsDialogOpen(true);
  };

    // Convert field names into readable labels
  const formatFieldLabel = (field: string) => {
    return field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Display values properly in the details dialog
 // Display values properly in the details dialog

// Open attachment with authentication
const handleOpenAttachment = async (fileUrl: string) => {
  const popup = window.open("", "_blank");

  if (!popup) {
    alert("Please allow pop-ups to open attachments.");
    return;
  }

  try {
    const token = localStorage.getItem("token");

    if (!token) {
      popup.close();
      alert("Authentication token not found. Please log in again.");
      return;
    }

    const response = await fetch(fileUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Attachment API error:", response.status, errorText);
      throw new Error(`Attachment request failed: ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    popup.location.href = blobUrl;

    popup.onbeforeunload = () => URL.revokeObjectURL(blobUrl);
  } catch (error) {
    popup.close();
    console.error("Attachment opening failed:", error);
    alert("Unable to open attachment. Check the console for details.");
  }
};

const renderDetailValue = (
  value: any,
  fieldName: string
): React.ReactNode => {

    // Hide File URL
  if (fieldName.toLowerCase() === "file_url") {
    return null;
  }

  if (value === null || value === undefined || value === "") {
    return "N/A";
  }

  // Parse JSON strings
  if (
    typeof value === "string" &&
    (value.trim().startsWith("{") || value.trim().startsWith("["))
  ) {
    try {
      value = JSON.parse(value);
    } catch {
      // Keep original value
    }
  }

  const getValue = (obj: any, ...keys: string[]) => {
    for (const key of keys) {
      if (obj?.[key] !== undefined && obj?.[key] !== null) {
        return obj[key];
      }
    }
    return undefined;
  };

  const getItems = (data: any, keys: string[]) => {
    if (Array.isArray(data)) return data;

    for (const key of keys) {
      if (Array.isArray(data?.[key])) {
        return data[key];
      }
    }

    return data && typeof data === "object" ? [data] : [];
  };

  const formatLabel = (field: string) =>
    field
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const cardStyle = {
    p: 1.5,
    border: "1px solid #E5E7EB",
    borderRadius: 2,
    backgroundColor: "#FAFAFC",
  };

  const labelStyle = {
    fontSize: "11px",
    color: "#777",
    fontWeight: 600,
    mb: 0.3,
  };

  const valueStyle = {
    fontSize: "13px",
    color: "#222",
    fontWeight: 500,
    wordBreak: "break-word" as const,
  };

  const formatFileSize = (bytes: any) => {
    const size = Number(bytes);

    if (isNaN(size)) return "N/A";
    if (size < 1024) return `${size} Bytes`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;

    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 1. ATTACHMENTS
  if (fieldName === "attachments") {
    const files = getItems(value, ["attachments", "files"]);

    if (!files.length) return "No attachments available";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {files.map((file: any, index: number) => {
          const fileName = getValue(
            file,
            "name",
            "fileName",
            "filename",
            "Name"
          );

          const fileUrl = getValue(
            file,
            "url",
            "path",
            "file_url",
            "Url"
          );

          const fileSize = getValue(file, "size", "fileSize", "Size");

          const mimeType = getValue(
            file,
            "mimeType",
            "mime_type",
            "MimeType"
          );

          // Use backend URL for uploaded files
          const backendBase =
            import.meta.env.VITE_API_URL || window.location.origin;

          let attachmentUrl = "";

          if (typeof fileUrl === "string" && fileUrl.trim()) {
            try {
              attachmentUrl = new URL(fileUrl, backendBase).toString();
            } catch {
              attachmentUrl = "";
            }
          }

          return (
            <Box key={file.id || index} sx={cardStyle}>
              <Typography sx={{ ...valueStyle, mb: 1 }}>
                {fileName || "Unnamed Attachment"}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 3,
                }}
              >
                <Box>
                  <Typography sx={labelStyle}>File Type</Typography>
                  <Typography sx={valueStyle}>
                    {mimeType || "N/A"}
                  </Typography>
                </Box>

                <Box>
                  <Typography sx={labelStyle}>File Size</Typography>
                  <Typography sx={valueStyle}>
                    {fileSize !== undefined
                      ? formatFileSize(fileSize)
                      : "N/A"}
                  </Typography>
                </Box>
              </Box>

             {attachmentUrl && (
  <Box sx={{ mt: 1.5 }}>
    <Button
      size="small"
      onClick={() => handleOpenAttachment(attachmentUrl)}
      sx={{
        px: 0,
        color: "#315BFF",
        fontWeight: 600,
        textTransform: "none",
      }}
    >
      View Attachment ↗
    </Button>
  </Box>
)}
            </Box>
          );
        })}
      </Box>
    );
  }

  // 2. AUDIENCE GROUPS SNAPSHOT
  if (fieldName === "audience_groups_snapshot") {
    const groups = getItems(value, ["groups", "audienceGroups"]);

    if (!groups.length) return "No audience groups available";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {groups.map((group: any, index: number) => (
          <Box key={group.id || index} sx={cardStyle}>
            <Typography sx={{ ...valueStyle, mb: 1 }}>
              {getValue(group, "name", "Name") || "Unnamed Group"}
            </Typography>

            <Typography sx={labelStyle}>Group ID</Typography>
            <Typography sx={{ ...valueStyle, mb: 1 }}>
              {getValue(group, "id", "Id") || "N/A"}
            </Typography>

            <Typography sx={labelStyle}>Custom Disclaimer</Typography>
            <Typography sx={valueStyle}>
              {getValue(
                group,
                "customDisclaimer",
                "CustomDisclaimer"
              ) || "N/A"}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }

  // 3. AUDIENCE RECIPIENT SNAPSHOT
  if (fieldName === "audience_recipient_snapshot") {
    const recipients = getItems(value, [
      "recipients",
      "audienceRecipients",
    ]);

    if (!recipients.length) return "No audience recipients available";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {recipients.map((recipient: any, index: number) => (
          <Box
            key={recipient.id || index}
            sx={{
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ flex: 1, minWidth: 150 }}>
              <Typography sx={valueStyle}>
                {getValue(recipient, "name", "Name") ||
                  "Unnamed Recipient"}
              </Typography>

              <Typography sx={{ fontSize: "11px", color: "#888" }}>
                ID: {getValue(recipient, "id", "Id") || "N/A"}
              </Typography>
            </Box>

            <Box
              sx={{
                px: 1.2,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: "#EEF2FF",
              }}
            >
              <Typography
                sx={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#315BFF",
                }}
              >
                {getValue(recipient, "type", "Type") || "N/A"}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // 5. BOOLEAN VALUES
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // 6. DATE VALUES
  if (
    fieldName.endsWith("_at") &&
    typeof value === "string"
  ) {
    const date = new Date(value);

    if (!isNaN(date.getTime())) {
      return date.toLocaleString();
    }
  }

  // 7. ARRAYS
  if (Array.isArray(value)) {
    if (!value.length) return "No data available";

    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {value.map((item, index) => (
          <Box key={index} sx={cardStyle}>
            {typeof item === "object" && item !== null ? (
              Object.entries(item)
  .filter(([key]) => key.toLowerCase() !== "file_url")
  .map(([key, val]) => (
                <Box key={key} sx={{ mb: 1 }}>
                  <Typography sx={labelStyle}>
                    {formatLabel(key)}
                  </Typography>
                  <Typography component="div" sx={valueStyle}>
                    {renderDetailValue(val, key)}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography sx={valueStyle}>{String(item)}</Typography>
            )}
          </Box>
        ))}
      </Box>
    );
  }

  // 8. NESTED OBJECTS
  if (typeof value === "object") {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {Object.entries(value)
  .filter(([key]) => key.toLowerCase() !== "file_url")
  .map(([key, val]) => (
          <Box key={key}>
            <Typography sx={labelStyle}>
              {formatLabel(key)}
            </Typography>

            <Typography component="div" sx={valueStyle}>
              {renderDetailValue(val, key)}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
    // Handle individual file URL fields
  if (fieldName === "file_url") {
    const fileUrl = String(value);

    const fileName = fileUrl.split(/[\\/]/).pop() || "Attachment";

    const backendUrl = API_BASE_URL.replace(/\/api\/?$/, "");

    const attachmentUrl = fileUrl.startsWith("http")
      ? fileUrl
      : `${backendUrl}/uploads/${fileName}`;

    return (
      <Box>
        <Typography variant="body2" fontWeight={600}>
          {decodeURIComponent(fileName)}
        </Typography>

        <Button
          size="small"
          onClick={() => handleOpenAttachment(attachmentUrl)}
          sx={{ mt: 0.5, px: 0 }}
        >
          View Attachment ↗
        </Button>
      </Box>
    );
  }

  // 9. URL VALUES
  if (
    typeof value === "string" &&
    (value.startsWith("http://") ||
      value.startsWith("https://"))
  ) {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: "#315BFF",
          textDecoration: "none",
          wordBreak: "break-all",
        }}
      >
        View File ↗
      </a>
    );
  }

  return String(value);
};



  // Filter Dialog State
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const rowsPerPage = 10;

  // Fetch research calls from backend
  const fetchCalls = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to fetch research calls");
      }

      setCalls(result.calls || []);
      setPage(1);
    } catch (error) {
      console.error("Error fetching research calls:", error);
      setError("Unable to load research calls. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  // Filter research calls

// Filter and search research calls across all fields
const filteredCalls = calls.filter((call) => {
  const searchText = search.toLowerCase().trim();

  // Search through all fields, including nested objects and arrays
  const matchesSearch =
    !searchText ||
    Object.values(call).some((value) => {
      const searchableValue =
        typeof value === "string"
          ? value
          : JSON.stringify(value ?? "");

      return searchableValue.toLowerCase().includes(searchText);
    });

  const matchesRA =
    raFilter === "ALL" || call.ra_name === raFilter;

  const matchesStatus =
    statusFilter === "ALL" ||
    call.status?.toUpperCase() === statusFilter;

  const matchesVersion =
    versionFilter === "ALL" ||
    call.version_type?.toUpperCase() === versionFilter;

  return (
    matchesSearch &&
    matchesRA &&
    matchesStatus &&
    matchesVersion
  );
});


  const totalPages = Math.ceil(filteredCalls.length / rowsPerPage);

  const paginatedCalls = filteredCalls.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Export current page to Excel

// Export all filtered research call details to Excel
const exportCurrentPage = () => {
  if (filteredCalls.length === 0) {
    alert("No research calls available to export.");
    return;
  }

  // Convert nested objects into separate Excel columns.
  // Arrays are stored as JSON so no information is lost.
  const flattenObject = (
    obj: any,
    prefix = "",
    result: Record<string, any> = {}
  ): Record<string, any> => {
    Object.entries(obj || {}).forEach(([key, value]) => {
      // Keep Message Template Snapshot excluded, as requested
     if (
  ["message_template_snapshot", "file_url"].includes(
    key.toLowerCase()
  )
) {
  return;
}

      const columnName = prefix
        ? `${prefix} - ${formatFieldLabel(key)}`
        : formatFieldLabel(key);

      // Parse JSON strings where possible
      if (typeof value === "string") {
        const trimmed = value.trim();

        if (
          trimmed.startsWith("{") ||
          trimmed.startsWith("[")
        ) {
          try {
            value = JSON.parse(value);
          } catch {
            // Keep original string
          }
        }
      }

      if (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        flattenObject(value, columnName, result);
      } else if (Array.isArray(value)) {
        result[columnName] = JSON.stringify(value);
      } else if (value instanceof Date) {
        result[columnName] = value.toLocaleString();
      } else if (typeof value === "boolean") {
        result[columnName] = value ? "Yes" : "No";
      } else {
        result[columnName] = value ?? "N/A";
      }
    });

    return result;
  };

  const excelData = filteredCalls.map((call, index) => ({
    "SR. NO.": index + 1,
    ...flattenObject(call),
  }));

  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Automatically adjust column widths
  const headers = Object.keys(excelData[0]);

  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.min(
      Math.max(
        header.length + 5,
        ...excelData.map((row: any) =>
          String(row[header] ?? "").length + 2
        )
      ),
      40
    ),
  }));

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Research Calls"
  );

  const date = new Date().toISOString().split("T")[0];

  XLSX.writeFile(
    workbook,
    `Research_Calls_All_Details_${date}.xlsx`
  );
};


  // Neutral status colors
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PUBLISHED":
        return {
          backgroundColor: "#F1F5F9",
          color: "#334155",
        };
      case "DRAFT":
        return {
          backgroundColor: "#F8F8F8",
          color: "#666666",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#6B7280",
        };
    }
  };

  // Neutral version colors
  const getVersionColor = (version: string) => {
    switch (version?.toUpperCase()) {
      case "ERRATA":
        return {
          backgroundColor: "#F5F5F5",
          color: "#525252",
        };
      case "ORIGINAL":
        return {
          backgroundColor: "#F1F5F9",
          color: "#475569",
        };
      default:
        return {
          backgroundColor: "#F3F4F6",
          color: "#6B7280",
        };
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setRaFilter("ALL");
    setStatusFilter("ALL");
    setVersionFilter("ALL");
    setPage(1);
  };

  const analystNames = [
    ...new Set(calls.map((call) => call.ra_name).filter(Boolean)),
  ].sort();

  return (
    <Box sx={{ mt: 1, width: "100%", minWidth: 0 }}>
      {/* Page Heading */}
      <Typography variant="h5" fontWeight={600}>
        Calls Log
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        View all research calls created by Research Analysts.
      </Typography>



{/* Search Section */}
<Paper
  elevation={0}
  sx={{
    mt: 3,
    mb: 3,
    p: { xs: 1.5, sm: 2 },
    border: "1px solid #E9E9EE",
    borderRadius: "12px",
    backgroundColor: "#FFFFFF",
  }}
>
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      flexWrap: "wrap",
    }}
  >
    <TextField
      size="small"
      fullWidth
      placeholder="Search RA, company or symbol..."
      value={search}
      onChange={(e) => {
        setSearch(e.target.value);
        setPage(1);
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: "#64748B", fontSize: 20 }} />
          </InputAdornment>
        ),
      }}
      sx={{
        flex: 1,
        minWidth: 200,
        "& .MuiOutlinedInput-root": {
          height: 46,
          borderRadius: "10px",
          backgroundColor: "#FFFFFF",
          fontSize: "14px",
          "& fieldset": { borderColor: "#CBD5E1" },
          "&:hover fieldset": { borderColor: "#94A3B8" },
          "&.Mui-focused fieldset": {
            borderColor: "#315BFF",
            borderWidth: "1px",
          },
        },
        "& input::placeholder": {
          color: "#94A3B8",
          opacity: 1,
        },
      }}
    />

   
<Button
  variant="outlined"
  startIcon={<FilterListIcon />}
  onClick={() => setFilterDialogOpen(true)}
  sx={{
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "20px",
    px: 3,
    height: 42,
    borderColor: "#94A3FF",
    color: "#3157FF",
    "&:hover": {
      borderColor: "#3157FF",
      backgroundColor: "#F8FAFF",
    },
  }}
>
  Filter
</Button>

<Button
  variant="outlined"
  startIcon={<FileDownloadIcon />}
  onClick={exportCurrentPage}
  sx={{
    textTransform: "none",
    fontWeight: 600,
    borderRadius: "10px",
    px: 2.5,
    height: 42,
    borderColor: "#3157FF",
    color: "#3157FF",
    "&:hover": {
      borderColor: "#3157FF",
      backgroundColor: "#F8FAFF",
    },
  }}
>
  Export
</Button>

  </Box>
</Paper>



      {/* Calls Table */}
      <Box sx={{ mt: 3, width: "100%", minWidth: 0 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
          gap={1.5}
          mb={2}
        >
          <Box>
            <Typography fontWeight={600}>
              Research Calls
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Showing {paginatedCalls.length} of {filteredCalls.length} entries
            </Typography>
             </Box> 
          </Box>
       
<TableContainer
  component={Paper}
  elevation={0}
  sx={{
    overflowX: "auto",
    border: "1px solid #E5E7EB",
    borderRadius: 2.5,
    width: "100%",
    backgroundColor: "#FFFFFF",

    "&::-webkit-scrollbar": {
      height: 7,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#D1D5DB",
      borderRadius: 10,
    },
  }}
>
  <Table sx={{ minWidth: 1300 }} size="medium">

    {/* Table Header */}
    <TableHead>
      <TableRow
        sx={{
          backgroundColor: "#F8FAFC",
          "& th": {
            color: "#64748B",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.45px",
            whiteSpace: "nowrap",
            py: 2,
            px: 2,
            borderBottom: "1px solid #E2E8F0",
          },
        }}
      >
        {[
          "SR. NO.",
          "RA NAME",
          "COMPANY / STOCK",
          "SYMBOL",
          "ACTION",
          "CALL TYPE",
          "STATUS",
          "VERSION TYPE",
          "VERSION NO.",
          "CREATED AT",
          "LATEST VERSION",
          "VIEW",
        ].map((heading) => (
          <TableCell key={heading}>{heading}</TableCell>
        ))}
      </TableRow>
    </TableHead>

    {/* Table Body */}
    <TableBody>
      {loading ? (
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              Loading research calls...
            </Typography>
          </TableCell>
        </TableRow>
      ) : error ? (
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>

            <Button size="small" onClick={fetchCalls} sx={{ mt: 1 }}>
              Retry
            </Button>
          </TableCell>
        </TableRow>
      ) : paginatedCalls.length === 0 ? (
        <TableRow>
          <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
            <Typography variant="body2" color="text.secondary">
              No research calls found
            </Typography>
          </TableCell>
        </TableRow>
      ) : (
        paginatedCalls.map((call, index) => (
          <TableRow
            key={call.id}
            hover
            sx={{
              height: 62,
              transition: "background-color 0.2s ease",

              "& td": {
                px: 2,
                py: 1.5,
                borderBottom: "1px solid #F1F5F9",
                color: "#334155",
                fontSize: "13px",
              },

              "&:hover": {
                backgroundColor: "#F8FAFF !important",
              },

              "&:last-child td": {
                borderBottom: 0,
              },
            }}
          >
            <TableCell>
              <Typography
                sx={{
                  color: "#94A3B8",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {(page - 1) * rowsPerPage + index + 1}
              </Typography>
            </TableCell>

            <TableCell sx={{ whiteSpace: "nowrap" }}>
              <Typography fontSize="13px" fontWeight={600} color="#334155">
                {call.ra_name || "N/A"}
              </Typography>
            </TableCell>

            <TableCell sx={{ whiteSpace: "nowrap" }}>
              <Typography fontSize="13px" fontWeight={600} color="#1E293B">
                {call.display_name || "N/A"}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography
                sx={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#64748B",
                }}
              >
                {call.symbol || "N/A"}
              </Typography>
            </TableCell>

            <TableCell>
              {call.action || "N/A"}
            </TableCell>

            <TableCell>
              {call.call_type || "N/A"}
            </TableCell>

            <TableCell>
              <Chip
                label={call.status || "N/A"}
                size="small"
                sx={{
                  ...getStatusColor(call.status),
                  height: 25,
                  borderRadius: 1.5,
                  fontSize: "11px",
                  fontWeight: 700,
                  "& .MuiChip-label": {
                    px: 1.2,
                  },
                }}
              />
            </TableCell>

            <TableCell>
              <Chip
                label={call.version_type || "N/A"}
                size="small"
                sx={{
                  ...getVersionColor(call.version_type),
                  height: 25,
                  borderRadius: 1.5,
                  fontSize: "11px",
                  fontWeight: 600,
                  "& .MuiChip-label": {
                    px: 1.2,
                  },
                }}
              />
            </TableCell>

            <TableCell>
              <Typography fontSize="13px" fontWeight={600}>
                {call.version_number ?? "N/A"}
              </Typography>
            </TableCell>

            <TableCell sx={{ whiteSpace: "nowrap" }}>
              <Typography fontSize="12px" color="#64748B">
                {call.created_at &&
                !isNaN(new Date(call.created_at).getTime())
                  ? new Date(call.created_at).toLocaleString()
                  : "N/A"}
              </Typography>
            </TableCell>

            <TableCell>
              <Chip
                label={call.is_latest ? "Yes" : "No"}
                size="small"
                variant="outlined"
                sx={{
                  height: 24,
                  borderRadius: 1.5,
                  fontSize: "11px",
                  fontWeight: 600,
                  backgroundColor: call.is_latest ? "#F0FDF4" : "#F8FAFC",
                  color: call.is_latest ? "#15803D" : "#94A3B8",
                  borderColor: call.is_latest ? "#BBF7D0" : "#E2E8F0",
                }}
              />
            </TableCell>

            <TableCell>
              <Tooltip title="View Complete Details" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleViewDetails(call)}
                  sx={{
                    width: 32,
                    height: 32,
                    border: "1px solid #DBEAFE",
                    borderRadius: 1.5,
                    color: "#315BFF",
                    backgroundColor: "#F5F7FF",

                    "&:hover": {
                      backgroundColor: "#E8EEFF",
                      borderColor: "#A5B4FC",
                    },
                  }}
                >
                  <VisibilityIcon sx={{ fontSize: 17 }} />
                </IconButton>
              </Tooltip>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  </Table>
</TableContainer>


        {/* Filter Dialog */}
        <Dialog
          open={filterDialogOpen}
          onClose={() => setFilterDialogOpen(false)}
          fullWidth
          maxWidth="sm"
        >
          
<DialogTitle
  sx={{
    fontWeight: 600,
    borderBottom: "1px solid #E9E9EE",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }}
>
  Filters

  <IconButton
    onClick={() => setFilterDialogOpen(false)}
    size="small"
    sx={{
      color: "#64748B",
      "&:hover": {
        backgroundColor: "#F1F5F9",
        color: "#3157FF",
      },
    }}
  >
    <CloseIcon fontSize="small" />
  </IconButton>
</DialogTitle>


          <DialogContent dividers>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr 1fr",
                },
                gap: 2,
                pt: 1,
              }}
            >
              {/* Search */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search RA, company or symbol"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ gridColumn: { sm: "span 2" } }}
              />

              {/* Research Analyst Filter */}
              <TextField
                select
                fullWidth
                size="small"
                label="Research Analyst"
                value={raFilter}
                onChange={(e) => {
                  setRaFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">All Analysts</MenuItem>

                {analystNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>

              {/* Status Filter */}
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="DRAFT">Draft</MenuItem>
                <MenuItem value="PUBLISHED">Published</MenuItem>
              </TextField>

              {/* Version Filter */}
              <TextField
                select
                fullWidth
                size="small"
                label="Version Type"
                value={versionFilter}
                onChange={(e) => {
                  setVersionFilter(e.target.value);
                  setPage(1);
                }}
                sx={{ gridColumn: { sm: "span 2" } }}
              >
                <MenuItem value="ALL">All Versions</MenuItem>
                <MenuItem value="ORIGINAL">Original</MenuItem>
                <MenuItem value="ERRATA">Errata</MenuItem>
              </TextField>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              color="inherit"
              onClick={clearFilters}
            >
              Clear
            </Button>

            <Button
              variant="outlined"
              onClick={() => setFilterDialogOpen(false)}
            >
              Apply
            </Button>
          </DialogActions>
        </Dialog>
                {/* Complete Research Call Details Dialog */}
        <Dialog
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              borderBottom: "1px solid #E9E9EE",
            }}
          >
            Research Call Details

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Complete information submitted by the Research Analyst.
            </Typography>
          </DialogTitle>

          <DialogContent dividers>
            {selectedCall && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  gap: 2,
                  py: 1,
                }}
              >
               
{Object.entries(selectedCall)
.filter(
  ([key]) =>
    ![
      "attachments",
      "audience_mode",
      "audience_groups_snapshot",
      "audience_recipient_snapshot",
      "risk_reward_ratio",
      "lot_size",
      "message_template_snapshot",
      "file_url",
    ].includes(key)
)
  .concat(
    [
      "attachments",
      "audience_mode",
      "audience_groups_snapshot",
      "audience_recipient_snapshot",
      "risk_reward_ratio",
      "lot_size",
    ]
      .filter((key) =>
        Object.prototype.hasOwnProperty.call(selectedCall, key)
      )
      .map((key) => [key, selectedCall[key]] as [string, any])
  )
  .map(([key, value]) => (
    <Box
      key={key}
      sx={{
        p: 1.5,
        border: "1px solid #E9E9EE",
        borderRadius: 1.5,
        minWidth: 0,
        gridColumn: {
          xs: "span 1",
          sm:
            typeof value === "object" && value !== null
              ? "span 2"
              : "span 1",
        },
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={600}
        sx={{
          display: "block",
          mb: 0.7,
          textTransform: "uppercase",
        }}
      >
        {formatFieldLabel(key)}
      </Typography>

      <Box
        sx={{
          color: "#334155",
          fontWeight: 500,
          wordBreak: "break-word",
        }}
      >
        {renderDetailValue(value, key)}
      </Box>
    </Box>
  ))}

              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDetailsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Pagination */}
        {filteredCalls.length > 0 && (
          <Box
            display="flex"
            justifyContent={{ xs: "center", sm: "flex-end" }}
            mt={2}
            sx={{
              overflowX: "auto",
              py: 0.5,
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="medium"
              siblingCount={0}
              boundaryCount={1}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminCallsLog;
