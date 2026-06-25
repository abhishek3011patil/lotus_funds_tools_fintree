import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
} from "@mui/material";

interface DisclaimerItem {
  id: string;
  version_number: number;
  disclaimer_text: string;
  created_at: string;
}

interface RAInfo {
  name: string;
  username: string;
  email: string;
}

const DisclaimerHistory = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  const [history, setHistory] = useState<DisclaimerItem[]>([]);
  const [ra, setRa] = useState<RAInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch(
       `${import.meta.env.VITE_API_URL}/admin/history/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch disclaimer history");
      }

      setHistory(data.history || []);
      setRa(data.ra || null);
    } catch (error) {
      console.error(error);
      alert("Failed to load disclaimer history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [userId]);

  return (
    <Box sx={{ p: 3 }}>
      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Disclaimer History
        </Typography>

        {ra && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            RA: {ra.name} | Username: {ra.username} | Email: {ra.email}
          </Typography>
        )}

        {loading ? (
          <Typography>Loading...</Typography>
        ) : history.length === 0 ? (
          <Typography>No disclaimer history found.</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Version</TableCell>
                  <TableCell>Disclaimer</TableCell>
                  <TableCell>Created At</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Chip
                        label={`V${item.version_number}`}
                        size="small"
                        color="primary"
                      />
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "pre-line", maxWidth: 700 }}>
                      {item.disclaimer_text}
                    </TableCell>

                    <TableCell>
                      {new Date(item.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default DisclaimerHistory;