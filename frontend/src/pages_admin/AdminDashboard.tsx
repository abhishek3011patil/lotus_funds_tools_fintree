import { useEffect, useState, useRef } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import { ToggleButton, ToggleButtonGroup, Tabs, Tab, Stack } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import TelegramSearch from "./Admin common/TelegramSearch";
import * as XLSX from "xlsx";
import AuthenticatedAvatar from "../components/common/AuthenticatedAvatar";

type AdminRow = {
  id: string;
  userId?: string;
  raId?: string;
  name: string;
  phone: string;
  profile?: string;
  pan?: string;
  address?: string;
  sebi?: string;
  sebi_receipt?: string;
  nism?: string;
  cheque?: string;
  created_at: string;
  telegram?: string;
  telegram_id?: string;
  status: string;
  raStatus?: string;
  rejectionReason?: string;
  suspendReason?: string;
  "age/time": string;
  pending_requests: number;
  suspended_at?: string;
  passwordSetupPending?: boolean;
  passwordResetAvailable?: boolean;
};

type ClientRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
  suspendedAt?: string;
  suspendedReason?: string;
  profileImage?: string;
};

type BrokerRow = {
  id: string;
  profileImage?: string;
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  sebiRegistrationNo: string;
  status: string;
  applicationStatus: string;
  subscriptionStatus: string;
  subscriptionPlanName: string;
  createdAt: string;
};

type Participant = {
  id: string;
  telegram_user_id: number | string;
  telegram_client_name: string;
  phone_number?: string;
  entity_type?: "USER" | "GROUP" | "CHANNEL";
  participant_name?: string;
};

const ITEMS_PER_PAGE = 10;
const AdminDashboard = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"ra" | "broker" | "client">("ra");
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [filterTab, setFilterTab] = useState<"all" | "approved" | "requests" | "suspended">("all");
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [clientFilter, setClientFilter] = useState<"all" | "active" | "suspended">("all");
  const [clientPage, setClientPage] = useState(1);
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null);
  const [clientSuspendReason, setClientSuspendReason] = useState("");
  const [suspendingClient, setSuspendingClient] = useState(false);
  const [activatingClient, setActivatingClient] = useState(false);
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);
  const [brokerPage, setBrokerPage] = useState(1);
  const [selectedRA, setSelectedRA] = useState<AdminRow | null>(null);
  const [resendingPasswordLink, setResendingPasswordLink] = useState(false);
  const [panelMode, setPanelMode] = useState<"ra" | "participant" | "whatsapp">("ra");
  const [suspendReason, setSuspendReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmType, setConfirmType] = useState<"RA" | "BROKER" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [whatsappName, setWhatsappName] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [whatsappParticipantsList, setWhatsappParticipantsList] = useState<Participant[]>([]);
  const [whatsappParticipant, setWhatsappParticipant] = useState<Participant | null>(null);
  const [participantsList, setParticipantsList] = useState<Participant[]>([]);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participantLoading, setParticipantLoading] = useState(false);
  const [participantSearchQuery, setParticipantSearchQuery] = useState("");
  const [brokerFilter, setBrokerFilter] = useState<"all" | "approved" | "pending" | "suspended">("all");

  const [editingCell, setEditingCell] = useState<{
    id: string;
    field: string;
    value: string;
  } | null>(null);

  const navigate = useNavigate();

  /* ================= LOAD DATA ================= */
  const loadRegistrations = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/registration/all-registrations-active-users`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) return;
      const data = await response.json();
      if (!Array.isArray(data)) return;

      const formatted: AdminRow[] = data.map((item: any) => ({
        id: item.ra_id || item.broker_id,
        userId: item.user_id,
        name: `${item.first_name || ""} ${item.surname || ""}`.trim() || item.name || "N/A",
        phone: item.mobile || "",
        created_at: item.created_at || "",
        profile: item.profile_image,
        pan: item.pan_card,
        address: item.address_proof_document,
        sebi: item.sebi_certificate,
        sebi_receipt: item.sebi_receipt,
        nism: item.nism_certificate,
        cheque: item.cancelled_cheque,
        telegram_id: item.telegram_user_id ? String(item.telegram_user_id) : "",
        status: item.user_status,
        passwordSetupPending: Boolean(item.password_setup_pending),
        passwordResetAvailable: Boolean(item.password_reset_available),
        raStatus: item.ra_status,
        rejectionReason: item.rejection_reason || "",
        suspendReason: item.suspended_reason || "",
        suspended_at: item.suspended_at || "",
        pending_requests: Number(item.pending_requests ?? 0),
        "age/time": "Just now",
      }));

      const sortedFormatted = formatted.sort(
        (a, b) => Number(b.pending_requests || 0) - Number(a.pending_requests || 0)
      );

      setRows(sortedFormatted);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    }
  };

const handleActivate = async (userId: string) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/admin/activate/ra/${userId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      alert(result.message || "Failed to activate RA");
      return;
    }

    // Immediately update the currently open side panel
    // so it does not keep showing the old suspended/inactive status.
    setSelectedRA((prev) =>
      prev
        ? {
            ...prev,
            status: "active",
            raStatus: "active",
            suspendReason: "",
            suspended_at: "",
          }
        : prev
    );

    // Refresh the dashboard table with the latest data
    await loadRegistrations();

    alert("RA activated successfully");
  } catch (error) {
    alert("Failed to activate RA");
  }
};

  const loadClients = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/client/register/admin/clients`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load clients");

      setClients(
        (Array.isArray(data.clients) ? data.clients : []).map((client: any) => ({
          id: String(client.id),
          name: client.name || `${client.first_name || ""} ${client.last_name || ""}`.trim() || "N/A",
          email: client.email || "",
          phone: client.phone_number || "",
          status: client.status || "inactive",
          createdAt: client.created_at || "",
          suspendedAt: client.suspended_at || "",
          suspendedReason: client.suspended_reason || "",
          profileImage: client.profile_image || "",
        }))
      );
    } catch (error) {
      console.error("Failed to load clients:", error);
    }
  };

  const loadBrokers = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/broker/all-brokers`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load brokers");

      setBrokers(
        data.map((broker: any) => ({
          id: String(broker.id),
          profileImage: broker.profile_image || "",
          legalName: broker.legal_name || "N/A",
          tradeName: broker.trade_name || "",
          email: broker.email || "",
          phone: broker.mobile || "",
          sebiRegistrationNo: broker.sebi_registration_no || "",
          status: broker.status || "pending",
          applicationStatus: broker.application_status || "",
          subscriptionStatus: broker.subscription_status || "",
          subscriptionPlanName: broker.subscription_plan_name || "",
          createdAt: broker.created_at || "",
        }))
      );
    } catch (error) {
      console.error("Failed to load brokers:", error);
    }
  };

  useEffect(() => {
    loadRegistrations();
    loadClients();
    loadBrokers();
  }, []);

  useEffect(() => {
    setPage(1);
    setClientPage(1);
    setBrokerPage(1);
  }, [searchQuery, filterTab, clientFilter, activeTab]);

  /* ================= STATUS STYLING ================= */
  const statusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "approved" || s === "active") return "success";
    if (s === "rejected") return "error";
    if (s === "pending") return "warning";
    if (s === "suspended") return "secondary";
    return "default";
  };

  /* ================= RA FILTERING ================= */
  const filteredRows = rows.filter((row) => {
    const query = searchQuery.toLowerCase().trim();

    const isSuspended =
      (row.status || "").toLowerCase() === "suspended" ||
      (row.raStatus || "").toLowerCase() === "suspended";

    if (filterTab === "suspended") {
      if (!isSuspended) return false;
    } else {
      if (isSuspended) return false;

      if (
        filterTab === "requests" &&
        Number(row.pending_requests) <= 0
      ) {
        return false;
      }
    }

    return (
      row.name.toLowerCase().includes(query) ||
      row.phone.includes(query) ||
      (row.telegram?.toLowerCase().includes(query) ?? false)
    );
  });

  const pageCount = Math.ceil(filteredRows.length / ITEMS_PER_PAGE);
  const paginatedRows = filteredRows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /* ================= CLIENT FILTERING ================= */
  const filteredClients = clients.filter((client) => {
    const status = client.status.toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    if (clientFilter !== "all" && status !== clientFilter) return false;

    return (
      client.name.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.includes(query)
    );
  });

  const clientPageCount = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const paginatedClients = filteredClients.slice((clientPage - 1) * ITEMS_PER_PAGE, clientPage * ITEMS_PER_PAGE);

  /* ================= BROKER FILTERING ================= */
 const filteredBrokers = brokers.filter((broker) => {
  const query = searchQuery.toLowerCase().trim();
  const status = broker.status.toLowerCase();

  if (brokerFilter !== "all" && status !== brokerFilter) {
    return false;
  }

  return (
    broker.legalName.toLowerCase().includes(query) ||
    broker.tradeName.toLowerCase().includes(query) ||
    broker.email.toLowerCase().includes(query) ||
    broker.phone.includes(query) ||
    broker.sebiRegistrationNo.toLowerCase().includes(query)
  );
});

  const brokerPageCount = Math.ceil(filteredBrokers.length / ITEMS_PER_PAGE);
  const paginatedBrokers = filteredBrokers.slice((brokerPage - 1) * ITEMS_PER_PAGE, brokerPage * ITEMS_PER_PAGE);

  /* ================= FILE VIEW ================= */
  const openFile = async (file?: string) => {
    if (!file || file.trim() === "") {
      alert("File not uploaded");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return alert("Please login to view this file.");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/uploads/${encodeURIComponent(file)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return alert("You are not authorized to view this file.");
      const blob = await response.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (error) {
      alert("Unable to open file.");
    }
  };

  const closePanel = () => {
    setSelectedRA(null);
    setPanelMode("ra");
    setParticipant(null);
  };

  const fetchParticipants = async (raId: string) => {
    if (!raId) return;
    try {
      setParticipantLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/telegram/ra/${raId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setParticipantsList(res.ok ? result.data || [] : []);
    } catch {
      setParticipantsList([]);
    } finally {
      setParticipantLoading(false);
    }
  };

  const handleViewParticipant = (row: AdminRow) => {
    setPanelMode("participant");
    setSelectedRA(row);
    setParticipant(null);
    fetchParticipants(row.userId || row.id);
  };

  const handleViewWhatsAppParticipant = (row: AdminRow) => {
    setPanelMode("whatsapp");
    setSelectedRA(row);
    setParticipant(null);
    fetchWhatsAppParticipants(row.userId || row.id);
  };

  const fetchWhatsAppParticipants = async (raId: string) => {
    try {
      setParticipantLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/ra/${raId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await res.json();
      setWhatsappParticipantsList(result.data || []);
    } catch {
      setWhatsappParticipantsList([]);
    } finally {
      setParticipantLoading(false);
    }
  };

  const handleUpdateParticipant = async () => {
    if (!participant?.id) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/telegram/participant/${encodeURIComponent(participant.id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        telegram_client_name: participant.telegram_client_name,
        phone_number: participant.phone_number,
      }),
    });
    const data = await res.json();
    if (!res.ok) return alert(data?.message || "Update failed");
    alert("Updated successfully");
    setParticipantsList((prev) => prev.map((p) => (p.id === participant.id ? data.data : p)));
  };

  const handleDeleteParticipant = async () => {
    if (!participant?.id || !window.confirm("Are you sure?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/telegram/participant/${encodeURIComponent(participant.id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return alert("Delete failed");
    alert("Deleted successfully");
    setParticipant(null);
    if (selectedRA) fetchParticipants(selectedRA.userId || selectedRA.id);
  };

  const handleInlineUpdate = async (p: Participant, field: keyof Participant) => {
    const newValue = editingCell?.value.trim();
    if (newValue === undefined || newValue === (p[field] || "")) {
      setEditingCell(null);
      return;
    }

    const token = localStorage.getItem("token");
    try {
      if (panelMode === "participant") {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/telegram/participant/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ [field]: newValue }),
        });
        if (!res.ok) return alert("Update failed");
        setParticipantsList((prev) => prev.map((item) => (item.id === p.id ? { ...item, [field]: newValue } : item)));
      } else if (panelMode === "whatsapp") {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/participants/${p.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            participantName: field === "participant_name" ? newValue : p.participant_name,
            phoneNumber: field === "phone_number" ? newValue : p.phone_number,
            raId: selectedRA?.userId || selectedRA?.id,
          }),
        });
        const data = await res.json();
        if (!res.ok) return alert("Update failed");
        setWhatsappParticipantsList((prev) => prev.map((item) => (item.id === p.id ? data.data : item)));
        setWhatsappParticipant(data.data);
      }
      setEditingCell(null);
    } catch {
      alert("Update failed");
    }
  };

  const handleAddWhatsAppParticipant = async () => {
    if (!whatsappName.trim() || !whatsappPhone.trim()) return alert("Enter Name and Phone Number");
    try {
      const token = localStorage.getItem("token");
      const raId = selectedRA?.userId || selectedRA?.id;
      const formattedPhone = whatsappPhone.startsWith("+91") ? whatsappPhone : `+91${whatsappPhone}`;

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          raId,
          participantName: whatsappName,
          phoneNumber: formattedPhone,
          consentConfirmed: true,
          consentSource: "RA_DECLARATION",
        }),
      });
      if (!res.ok) throw new Error("Failed to add participant");
      alert("Participant added successfully!");
      setWhatsappName("");
      setWhatsappPhone("");
      if (raId) fetchWhatsAppParticipants(raId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExcelUploadClick = () => fileInputRef.current?.click();

const handleDownloadWhatsAppTemplate = () => {
  const data = [
    {
      Name: "John Doe",
      "Phone Number": "9876543210",
    },
    {
      Name: "Jane Doe",
      "Phone Number": "9123456789",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "WhatsApp Participants"
  );

  XLSX.writeFile(
    workbook,
    "whatsapp_participants_template.xlsx"
  );
};

  const handleExcelFileChange = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  const raId = selectedRA?.userId || selectedRA?.id;

  if (!file || !raId) {
    alert("Please select an RA first.");
    return;
  }

  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  const isExcel =
    allowedTypes.includes(file.type) ||
    file.name.toLowerCase().endsWith(".xlsx") ||
    file.name.toLowerCase().endsWith(".xls");

  if (!isExcel) {
    alert("Please upload only .xlsx or .xls files.");
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("raId", raId);

  try {
    const token = localStorage.getItem("token");

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/whatsapp/upload-excel/${raId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        data?.message ||
        data?.error ||
        `Excel upload failed (${res.status})`
      );
    }

    alert(data?.message || "Excel processed successfully!");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    await fetchWhatsAppParticipants(raId);
  } catch (err: any) {
    console.error("WhatsApp Excel upload error:", err);
    alert(err.message || "Failed to process Excel file.");
  }
};

  const renderEditableCell = (p: Participant, field: keyof Participant, value: any) => {
    const isEditing = editingCell !== null && editingCell.id === String(p.id) && editingCell.field === field;

    if (isEditing) {
      return (
        <TextField
          size="small"
          value={editingCell.value}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const val = e.target.value;
            setEditingCell((prev) => (prev ? { ...prev, value: val } : prev));
            if (panelMode === "participant" && participant) {
              setParticipant({ ...participant, [field]: val });
            }
          }}
          onBlur={() => handleInlineUpdate(p, field)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleInlineUpdate(p, field);
            if (e.key === "Escape") setEditingCell(null);
          }}
        />
      );
    }

    return (
      <span
        style={{ display: "block", minHeight: "20px", cursor: "pointer" }}
        onClick={(e) => {
          e.stopPropagation();
          if (panelMode === "participant") setParticipant(p);
          if (panelMode === "whatsapp") setWhatsappParticipant(p);
          setEditingCell({ id: String(p.id), field, value: value || "" });
        }}
      >
        {value || "N/A"}
      </span>
    );
  };

  const handleApprove = async (id: string, type: "RA" | "BROKER") => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/approve-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: id, type }),
    });
    const data = await res.json();
    alert(data.message || "Operation completed");
  };

const handleSuspend = async (userId: string) => {
  try {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/admin/suspend-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, suspendReason }),
      }
    );

    if (!response.ok) {
      return alert("Failed to suspend user");
    }

    // Update the currently selected user immediately
    setSelectedRA((prev) =>
      prev
        ? {
            ...prev,
            status: "suspended",
            raStatus: "suspended",
            suspendReason: suspendReason || "",
          }
        : prev
    );

    // Refresh the table data
    await loadRegistrations();

    alert("User suspended successfully");
  } catch {
    alert("Failed to suspend user");
  }
};

  const handleResendPasswordLink = async (userId: string) => {
    if (resendingPasswordLink) return;
    setResendingPasswordLink(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/resend-password-link`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      alert(data.message || "Password link sent successfully.");
    } catch (error) {
      alert("Failed to send password setup link");
    } finally {
      setResendingPasswordLink(false);
    }
  };

  const handleSuspendClient = async () => {
    if (!selectedClient || suspendingClient || !clientSuspendReason.trim()) {
      return alert("Please enter suspend reason");
    }
    if (!window.confirm(`Suspend ${selectedClient.name}?`)) return;

    setSuspendingClient(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/suspend-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: selectedClient.id,
          suspendReason: clientSuspendReason.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert(result.message || "Client suspended");
      setSelectedClient(null);
      setClientSuspendReason("");
      await loadClients();
    } catch (err: any) {
      alert(err.message || "Failed to suspend client");
    } finally {
      setSuspendingClient(false);
    }
  };

  const handleActivateClient = async () => {
    if (!selectedClient || activatingClient) return;
    if (!window.confirm(`Activate ${selectedClient.name}?`)) return;

    setActivatingClient(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/client/register/admin/clients/${encodeURIComponent(selectedClient.id)}/activate`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert(result.message || "Client activated successfully");
      setSelectedClient(null);
      await loadClients();
    } catch (err: any) {
      alert(err.message || "Failed to activate client");
    } finally {
      setActivatingClient(false);
    }
  };

  const handleUpdateWhatsAppParticipant = async () => {
    if (!whatsappParticipant?.id) return alert("Select participant");
    const phone = whatsappPhone.replace(/\D/g, "");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/whatsapp/participants/${whatsappParticipant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          participantName: whatsappName.trim(),
          phoneNumber: phone,
          raId: selectedRA?.userId || selectedRA?.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      alert("Updated successfully");
      setWhatsappParticipantsList((prev) =>
        prev.map((item) => (item.id === whatsappParticipant.id ? data.data : item))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteWhatsAppParticipant = async () => {
    if (!whatsappParticipant?.id || !window.confirm("Delete this WhatsApp participant?")) return;
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/whatsapp/participants/${encodeURIComponent(whatsappParticipant.id)}?raId=${selectedRA?.userId || selectedRA?.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) throw new Error("Delete failed");
      alert("Deleted successfully");
      setWhatsappParticipantsList((prev) => prev.filter((p) => p.id !== whatsappParticipant.id));
      setWhatsappParticipant(null);
      setWhatsappName("");
      setWhatsappPhone("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, sm: 3 }, maxWidth: 1400, margin: "0 auto", gap: 2.5, display: "flex", flexDirection: "column" }}>
      {/* HEADER TABS & SEARCH CONTROLS */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems="center" spacing={2}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              width: { xs: "100%", md: "auto" },
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.95rem" },
            }}
          >
            <Tab label="Research Analysts" value="ra" />
            <Tab label="Brokers" value="broker" />
            <Tab label="Clients" value="client" />
          </Tabs>

          <TextField
            placeholder="Search by name, mobile, email..."
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ minWidth: { xs: "100%", md: 320 }, width: { xs: "100%", md: "auto" } }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      </Paper>

      {/* VIEW PANEL 1: RESEARCH ANALYSTS */}
      {activeTab === "ra" && (
        <Stack spacing={2}>
          <Box sx={{ overflowX: "auto", maxWidth: "100%", pb: 0.5 }}>
            <ToggleButtonGroup
              value={filterTab}
              exclusive
              onChange={(_, newTab) => newTab && setFilterTab(newTab)}
              size="small"
              sx={{ alignSelf: "flex-start", flexWrap: { xs: "wrap", sm: "nowrap" } }}
            >
              <ToggleButton value="all" sx={{ px: 2.5, whiteSpace: "nowrap" }}>ALL</ToggleButton>
              <ToggleButton value="approved" sx={{ px: 2.5, whiteSpace: "nowrap" }}>APPROVED</ToggleButton>
              <ToggleButton value="requests" sx={{ px: 2.5, whiteSpace: "nowrap" }}>REQUESTS</ToggleButton>
              <ToggleButton value="suspended" sx={{ px: 2.5, whiteSpace: "nowrap" }}>SUSPENDED USERS</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 3, maxHeight: "calc(100vh - 280px)", overflowX: "auto" }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ "& th": { backgroundColor: "#f8fafc", fontWeight: 600, color: "#475569" } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>{filterTab === "suspended" ? "Suspended At" : "Registered At"}</TableCell>
                  {filterTab === "suspended" ? (
                    <TableCell>Suspend Reason</TableCell>
                  ) : (
                    <TableCell>Requests</TableCell>
                  )}
                  <TableCell align="center">Telegram</TableCell>
                  <TableCell align="center">WhatsApp</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedRows.map((row) => (
                  <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={filterTab === "suspended" ? "Suspended" : row.raStatus || "N/A"}
                        color={statusColor(filterTab === "suspended" ? "suspended" : row.raStatus || "") as any}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      {filterTab === "suspended"
                        ? row.suspended_at
                          ? new Date(row.suspended_at).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"
                        : row.created_at
                        ? new Date(row.created_at).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </TableCell>

                    {filterTab === "suspended" ? (
                      <TableCell>{row.suspendReason || "-"}</TableCell>
                    ) : (
                      <TableCell>
                        {Number(row.pending_requests) > 0 ? (
                          <Button
                            size="small"
                            color="warning"
                            variant="contained"
                            disableElevation
                            onClick={() => navigate(`/admin/ra-profile-update-requests?userId=${row.userId}`)}
                            sx={{ borderRadius: "12px", textTransform: "none", fontWeight: 600 }}
                          >
                            {row.pending_requests}
                          </Button>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}

                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        onClick={() => handleViewParticipant(row)}
                        sx={{
                          backgroundColor: "#24A1DE",
                          color: "#fff",
                          textTransform: "none",
                          borderRadius: "8px",
                          "&:hover": { backgroundColor: "#1d8bcb" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        View Participants
                      </Button>
                    </TableCell>

                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="contained"
                        disableElevation
                        onClick={() => handleViewWhatsAppParticipant(row)}
                        sx={{
                          backgroundColor: "#25D366",
                          color: "#fff",
                          textTransform: "none",
                          borderRadius: "8px",
                          "&:hover": { backgroundColor: "#128C7E" },
                          whiteSpace: "nowrap",
                        }}
                      >
                        View Participants
                      </Button>
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setPanelMode("ra");
                          setSelectedRA(row);
                        }}
                      >
                        Options
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No matching Research Analysts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {pageCount > 1 && (
            <Pagination
              sx={{ alignSelf: "center" }}
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
              renderItem={(item) => <PaginationItem slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }} {...item} />}
            />
          )}
        </Stack>
      )}

{/* VIEW PANEL 2: BROKERS */}
      {activeTab === "broker" && (
        <Stack spacing={2}>
          {/* --- ADD TOGGLE BUTTON GROUP HERE --- */}
          <Box sx={{ overflowX: "auto", maxWidth: "100%", pb: 0.5 }}>
            <ToggleButtonGroup
              value={brokerFilter}
              exclusive
              onChange={(_, val) => val && setBrokerFilter(val)}
              size="small"
              sx={{ alignSelf: "flex-start", flexWrap: { xs: "wrap", sm: "nowrap" } }}
            >
              <ToggleButton value="all" sx={{ px: 2.5, whiteSpace: "nowrap" }}>ALL</ToggleButton>
              <ToggleButton value="approved" sx={{ px: 2.5, whiteSpace: "nowrap" }}>APPROVED</ToggleButton>
              <ToggleButton value="pending" sx={{ px: 2.5, whiteSpace: "nowrap" }}>PENDING</ToggleButton>
              <ToggleButton value="suspended" sx={{ px: 2.5, whiteSpace: "nowrap" }}>SUSPENDED</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 3, maxHeight: "calc(100vh - 280px)", overflowX: "auto" }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 750 }}>
              <TableHead>
                <TableRow sx={{ "& th": { backgroundColor: "#f8fafc", fontWeight: 600, color: "#475569" } }}>
                  <TableCell>Legal / Trade Name</TableCell>
                  <TableCell>Contact Info</TableCell>
                  <TableCell>SEBI Registration</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Subscription Plan</TableCell>
                  <TableCell>Registered At</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedBrokers.map((broker) => (
                  <TableRow key={broker.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <AuthenticatedAvatar filename={broker.profileImage} alt={`${broker.legalName} profile picture`} sx={{ width: 38, height: 38, bgcolor: "#5271FF", fontSize: 15, fontWeight: 700 }}>
                          {broker.legalName.slice(0, 1).toUpperCase()}
                        </AuthenticatedAvatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{broker.legalName}</Typography>
                          <Typography variant="caption" color="text.secondary">{broker.tradeName || "No trade name"}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{broker.email || "-"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {broker.phone || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>{broker.sebiRegistrationNo || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={broker.status}
                        color={statusColor(broker.status) as any}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{broker.subscriptionPlanName || "No plan"}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {broker.subscriptionStatus || "Not created"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {broker.createdAt
                        ? new Date(broker.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => navigate(`/admin/edit/BROKER/${broker.id}`)}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredBrokers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      No matching brokers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {brokerPageCount > 1 && (
            <Pagination
              sx={{ alignSelf: "center" }}
              count={brokerPageCount}
              page={brokerPage}
              onChange={(_, value) => setBrokerPage(value)}
              renderItem={(item) => <PaginationItem slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }} {...item} />}
            />
          )}
        </Stack>
      )}

      {/* VIEW PANEL 3: CLIENTS */}
      {activeTab === "client" && (
        <Stack spacing={2}>
          <Box sx={{ overflowX: "auto", maxWidth: "100%", pb: 0.5 }}>
            <ToggleButtonGroup
              value={clientFilter}
              exclusive
              onChange={(_, value) => value && setClientFilter(value)}
              size="small"
              sx={{ alignSelf: "flex-start", flexWrap: { xs: "wrap", sm: "nowrap" } }}
            >
              <ToggleButton value="all" sx={{ px: 2.5, whiteSpace: "nowrap" }}>All Clients</ToggleButton>
              <ToggleButton value="active" sx={{ px: 2.5, whiteSpace: "nowrap" }}>Active</ToggleButton>
              <ToggleButton value="suspended" sx={{ px: 2.5, whiteSpace: "nowrap" }}>Suspended</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{ border: "1px solid #e2e8f0", borderRadius: 3, maxHeight: "calc(100vh - 280px)", overflowX: "auto" }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ "& th": { backgroundColor: "#f8fafc", fontWeight: 600, color: "#475569" } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Registered At</TableCell>
                  <TableCell align="right">Options</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow key={client.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <AuthenticatedAvatar filename={client.profileImage} alt={`${client.name} profile picture`} sx={{ width: 38, height: 38, bgcolor: "#5271FF", fontSize: 15, fontWeight: 700 }}>
                          {client.name.slice(0, 1).toUpperCase()}
                        </AuthenticatedAvatar>
                        <Typography variant="body2" fontWeight={600}>{client.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{client.email || "-"}</TableCell>
                    <TableCell>{client.phone || "-"}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={client.status}
                        color={statusColor(client.status) as any}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>
                      {client.createdAt
                        ? new Date(client.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => {
                          setClientSuspendReason("");
                          setSelectedClient(client);
                        }}
                      >
                        Options
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredClients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                      No matching clients found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {clientPageCount > 1 && (
            <Pagination
              sx={{ alignSelf: "center" }}
              count={clientPageCount}
              page={clientPage}
              onChange={(_, value) => setClientPage(value)}
              renderItem={(item) => <PaginationItem slots={{ previous: ArrowBackIcon, next: ArrowForwardIcon }} {...item} />}
            />
          )}
        </Stack>
      )}

      {/* SIDE DRAWER PANEL */}
      {selectedRA && (
        <Paper
          elevation={8}
          sx={{
            position: "fixed",
            zIndex: 1200,
            right: { xs: 0, sm: 20 },
            top: { xs: "auto", sm: 80 },
            bottom: { xs: 0, sm: "auto" },
            left: { xs: 0, sm: "auto" },
            width: { xs: "100%", sm: 580 },
            height: "fit-content",
            p: { xs: 2, sm: 3 },
            borderRadius: { xs: "16px 16px 0 0", sm: 3 },
            maxHeight: { xs: "85vh", sm: "calc(100vh - 100px)" },
            overflowY: "auto",
            border: "1px solid #e2e8f0",
          }}
        >
          <Button size="small" onClick={closePanel} sx={{ position: "absolute", right: 12, top: 12, minWidth: "auto", px: 1 }}>
            ✕
          </Button>

          {panelMode === "ra" ? (
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>RA Verification & Control</Typography>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>{selectedRA.name}</Typography>
                <Typography color="text.secondary" variant="body2">{selectedRA.phone}</Typography>
                <Typography color="text.secondary" variant="body2">Telegram: {selectedRA.telegram || "N/A"}</Typography>
              </Box>

              <Stack spacing={1}>
                <Button 
                  variant="text" 
                  fullWidth 
                  onClick={() => navigate(`/admin/edit/RA/${selectedRA.id}`)}
                >
                  View Profile Details
                </Button>

                <Button
                  variant="text"
                  fullWidth
                  onClick={() => selectedRA?.userId && navigate(`/admin/disclaimer-history/${selectedRA.userId}`)}
                >
                  View Disclaimer History
                </Button>

                {(selectedRA.passwordSetupPending || selectedRA.passwordResetAvailable) && (
                  <Button
                    variant="text"
                    fullWidth
                    disabled={resendingPasswordLink}
                    onClick={() => selectedRA?.userId && handleResendPasswordLink(selectedRA.userId)}
                  >
                    {resendingPasswordLink
                      ? "Sending..."
                      : selectedRA.passwordSetupPending
                      ? "Resend Password Setup Link"
                      : "Send Password Reset Link"}
                  </Button>
                )}
              </Stack>

              <Box sx={{ pt: 2, borderTop: "1px solid #e2e8f0" }}>
                {selectedRA.status?.toLowerCase() === "active" ? (
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder="Enter reason for suspension..."
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                    />
                    <Button
                      variant="contained"
                      color="error"
                      fullWidth
                      onClick={() => {
                        if (!suspendReason.trim()) return alert("Please enter suspend reason");
                        handleSuspend(selectedRA.userId || "");
                      }}
                    >
                      Suspend User
                    </Button>
                  </Stack>
                ) : (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => handleActivate(selectedRA.userId || "")}
                  >
                    Activate Account
                  </Button>
                )}
              </Box>
            </Stack>
          ) : panelMode === "participant" ? (
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Telegram Participants</Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Search Phone, Username, Group..."
                value={participantSearchQuery}
                onChange={(e) => setParticipantSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              {participantLoading ? (
                <Typography color="text.secondary">Loading participants...</Typography>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", maxHeight: 300, overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                        <TableCell>Type</TableCell>
                        <TableCell>Phone</TableCell>
                        <TableCell>Username</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {participantsList
                        .filter((p) => {
                          const q = participantSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            String(p.phone_number || "").toLowerCase().includes(q) ||
                            String(p.telegram_client_name || "").toLowerCase().includes(q)
                          );
                        })
                        .map((p) => (
                          <TableRow
                            key={p.id}
                            selected={participant?.id === p.id}
                            onClick={() => setParticipant(p)}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell>{p.entity_type || "USER"}</TableCell>
                            <TableCell>{renderEditableCell(p, "phone_number", p.phone_number)}</TableCell>
                            <TableCell>{renderEditableCell(p, "telegram_client_name", p.telegram_client_name)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ mt: 3 }}>
                <Typography fontWeight={600} sx={{ mb: 1 }}>Add Telegram Participant</Typography>
                {selectedRA?.userId && (
                  <TelegramSearch
                    raId={selectedRA.userId}
                    onSaved={async () => {
                      await fetchParticipants(selectedRA.userId!);
                    }}
                  />
                )}
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
                <Button variant="contained" fullWidth disabled={!participant} onClick={handleUpdateParticipant}>
                  Update
                </Button>
                <Button variant="contained" color="error" fullWidth disabled={!participant} onClick={handleDeleteParticipant}>
                  Delete
                </Button>
              </Stack>
            </Box>
          ) : (
            <Box>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                WhatsApp Participants
              </Typography>

              <TextField
                fullWidth
                size="small"
                placeholder="Search Name or Phone..."
                value={participantSearchQuery}
                onChange={(e) => setParticipantSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
              />

              {participantLoading ? (
                <Typography color="text.secondary">Loading participants...</Typography>
              ) : (
                <TableContainer 
                  component={Paper} 
                  elevation={0} 
                  sx={{ border: "1px solid #e2e8f0", maxHeight: 300, mb: 3, overflowX: "auto" }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                        <TableCell>Name</TableCell>
                        <TableCell>Phone</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {whatsappParticipantsList
                        .filter((p) => {
                          const q = participantSearchQuery.trim().toLowerCase();
                          if (!q) return true;
                          return (
                            String(p.phone_number || "").toLowerCase().includes(q) ||
                            String(p.participant_name || "").toLowerCase().includes(q)
                          );
                        })
                        .map((p) => (
                          <TableRow
                            key={p.id}
                            selected={whatsappParticipant?.id === p.id}
                            onClick={() => {
                              setWhatsappParticipant(p);
                              setWhatsappName(p.participant_name || "");
                              setWhatsappPhone((p.phone_number || "").replace("+91", ""));
                            }}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell>{renderEditableCell(p, "participant_name", p.participant_name)}</TableCell>
                            <TableCell>{renderEditableCell(p, "phone_number", p.phone_number)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box sx={{ mb: 3 }}>
                <Typography fontWeight={600} sx={{ mb: 1.5 }}>
                  Add WhatsApp Participant
                </Typography>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  accept=".xlsx, .xls"
                  onChange={handleExcelFileChange}
                />
                
                <Paper elevation={0} sx={{ p: 2, border: "1px solid #e2e8f0", borderRadius: 2 }}>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Name"
                      value={whatsappName}
                      onChange={(e) => setWhatsappName(e.target.value)}
                    />
                    <TextField
                      fullWidth
                      size="small"
                      label="Phone Number"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">+91</InputAdornment>,
                      }}
                    />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={handleAddWhatsAppParticipant}
                        startIcon={<SendIcon />}
                        fullWidth
                      >
                        Save
                      </Button>
                      <Button variant="outlined" size="small" onClick={handleExcelUploadClick} fullWidth>
                        Upload Excel
                      </Button>
<Button
  variant="outlined"
  size="small"
  startIcon={<FileDownloadIcon />}
  onClick={handleDownloadWhatsAppTemplate}
  fullWidth
>
  Template
</Button>
                    </Stack>
                  </Stack>
                </Paper>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={!whatsappParticipant}
                  onClick={handleUpdateWhatsAppParticipant}
                >
                  Update
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  disabled={!whatsappParticipant}
                  onClick={handleDeleteWhatsAppParticipant}
                >
                  Delete
                </Button>
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      {/* CLIENT DIALOG */}
      <Dialog open={Boolean(selectedClient)} onClose={() => setSelectedClient(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Client Profile & Management</DialogTitle>
        <DialogContent dividers>
          {selectedClient && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AuthenticatedAvatar filename={selectedClient.profileImage} alt={`${selectedClient.name} profile picture`} sx={{ width: 64, height: 64, bgcolor: "#5271FF", fontSize: 24, fontWeight: 700 }}>
                  {selectedClient.name.slice(0, 1).toUpperCase()}
                </AuthenticatedAvatar>
                <Box><Typography fontWeight={700}>{selectedClient.name}</Typography><Typography variant="body2" color="text.secondary">Client profile picture</Typography></Box>
              </Stack>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "100px 1fr", sm: "140px 1fr" }, gap: 1 }}>
                <Typography color="text.secondary">Name:</Typography>
                <Typography fontWeight={500}>{selectedClient.name}</Typography>
                <Typography color="text.secondary">Email:</Typography>
                <Typography sx={{ wordBreak: "break-word" }}>{selectedClient.email || "-"}</Typography>
                <Typography color="text.secondary">Mobile:</Typography>
                <Typography>{selectedClient.phone || "-"}</Typography>
                <Typography color="text.secondary">Status:</Typography>
                <Typography sx={{ textTransform: "capitalize" }}>{selectedClient.status}</Typography>
              </Box>

              <Button
                variant="outlined"
                disabled={resendingPasswordLink || selectedClient.status.toLowerCase() === "suspended"}
                onClick={() => handleResendPasswordLink(selectedClient.id)}
              >
                {resendingPasswordLink ? "Sending..." : "Resend Reset Link"}
              </Button>

              {selectedClient.status.toLowerCase() === "suspended" ? (
                <Button variant="contained" color="success" disabled={activatingClient} onClick={handleActivateClient}>
                  {activatingClient ? "Activating..." : "Activate Client"}
                </Button>
              ) : (
                <Stack spacing={1}>
                  <TextField
                    size="small"
                    label="Suspend Reason"
                    value={clientSuspendReason}
                    onChange={(e) => setClientSuspendReason(e.target.value)}
                    multiline
                  />
                  <Button variant="contained" color="error" disabled={suspendingClient} onClick={handleSuspendClient}>
                    {suspendingClient ? "Suspending..." : "Suspend Client"}
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedClient(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;
