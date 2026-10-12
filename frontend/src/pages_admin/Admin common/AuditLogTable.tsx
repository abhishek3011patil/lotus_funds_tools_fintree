import React from 'react';
import {
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
} from '@mui/material';

interface AuditLog {
  log_id: string;
  created_at: string;

  admin_name: string;
  admin_role: string;

  action: string;
  module: string;

  target_entity: string;
  target_type: string;

  description: string;

  status: string;

  reason?: string;

  ip_address: string;

  device?: string;

  old_value?: unknown;

  new_value?: unknown;
}

interface AuditLogTableProps {
  logs: AuditLog[];
  totalEntries: number;
  showingEntries: number;
}

const AuditLogTable: React.FC<AuditLogTableProps> = ({ logs, totalEntries, showingEntries }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return { backgroundColor: '#10B981', color: 'white' };
      case 'FAILED':
        return { backgroundColor: '#EF4444', color: 'white' };
      default:
        return { backgroundColor: '#6B7280', color: 'white' };
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'APPROVE':
        return { backgroundColor: '#10B981', color: 'white' };
      case 'REJECT':
        return { backgroundColor: '#EF4444', color: 'white' };
      case 'VERIFY':
        return { backgroundColor: '#3B82F6', color: 'white' };
      case 'SUSPEND':
        return { backgroundColor: '#F59E0B', color: 'white' };
      case 'ACTIVATE':
      case 'PASSWORD_LINK_RESENT':
      case 'SUBSCRIPTION_NOTIFICATION_PASS_RUN':
        return { backgroundColor: '#2563EB', color: 'white' };
      case 'EXPORT_AUDIT_LOGS':
      case 'VIEW_DISCLAIMER_HISTORY':
        return { backgroundColor: '#7C3AED', color: 'white' };
      default:
        return { backgroundColor: '#6B7280', color: 'white' };
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'RA':
        return { backgroundColor: '#8B5CF6', color: 'white' };
      case 'BROKER':
        return { backgroundColor: '#06B6D4', color: 'white' };
      case 'PAYMENT':
        return { backgroundColor: '#F59E0B', color: 'white' };
      case 'SUBSCRIPTION':
        return { backgroundColor: '#10B981', color: 'white' };
      case 'AUDIT':
      case 'AUTH':
      case 'USER_MANAGEMENT':
        return { backgroundColor: '#475569', color: 'white' };
      case 'TELEGRAM':
      case 'TELEGRAM_CLIENT':
        return { backgroundColor: '#0284C7', color: 'white' };
      case 'WHATSAPP':
        return { backgroundColor: '#16A34A', color: 'white' };
      default:
        return { backgroundColor: '#6B7280', color: 'white' };
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {showingEntries} of {totalEntries} entries
      </Typography>
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          overflowX: 'auto', 
          boxShadow: 'none', 
          border: '1px solid #E9E9EE', 
          borderRadius: 2,
          '&::-webkit-scrollbar': {
            height: '8px',
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
        }}
      >
        <Table sx={{ minWidth: 1800 }} aria-label="audit log table">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Log ID</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Timestamp</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Admin Name</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Admin Role</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Action</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Module</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Target Entity</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Target Type</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Old Value</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>New Value</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Created At</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>IP Address</TableCell>
              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 0.5 }}>Device</TableCell>
              {/*
<TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap', py: 1.5 }}>
  Actions
</TableCell>
*/}
            </TableRow>
          </TableHead>

<TableBody>
  {logs.length === 0 ? (
    <TableRow>
      <TableCell colSpan={17} align="center">
        No audit logs found
      </TableCell>
    </TableRow>
  ) : (
    logs.map((log, index) => (
      <TableRow
  key={log.log_id || index}
  sx={{
    '&:hover': { backgroundColor: '#F9FAFB' },
    height: '52px',
  }}
>
        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            {log.log_id ? `${log.log_id.slice(0, 8)}...` : 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Typography variant="body2">
            {log.created_at
              ? new Date(log.created_at).toLocaleString()
              : 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Typography variant="body2" fontWeight={500}>
            {log.admin_name || 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 1 }}>
          <Chip
            label={log.admin_role || 'N/A'}
            size="small"
            sx={{
              backgroundColor:
                log.admin_role === 'SUPER_ADMIN'
                  ? '#8B5CF6'
                  : '#06B6D4',
              color: 'white',
              fontSize: '11px',
              fontWeight: 600,
            }}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Chip
            label={log.action || 'N/A'}
            size="small"
            sx={getActionColor(log.action || '')}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Chip
            label={log.module || 'N/A'}
            size="small"
            sx={getModuleColor(log.module || '')}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Typography variant="body2">
            {log.target_entity || 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Chip
            label={log.target_type || 'N/A'}
            size="small"
            sx={{
              backgroundColor: '#F3F4F6',
              color: '#374151',
              fontSize: '11px',
              fontWeight: 500,
            }}
          />
        </TableCell>

        <TableCell sx={{ maxWidth: 200, py: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {log.description || 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ maxWidth: 150, py: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontSize: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: log.reason ? 'text.primary' : 'text.secondary',
            }}
          >
            {log.reason || 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ maxWidth: 300, py: 1 }}>
          {log.old_value ? (
            <Box
              sx={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: 1,
                p: 1,
                maxHeight: 100,
                overflow: 'auto',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {typeof log.old_value === 'string'
                  ? log.old_value
                  : JSON.stringify(log.old_value, null, 2)}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontSize: '12px' }}
            >
              N/A
            </Typography>
          )}
        </TableCell>

        <TableCell sx={{ maxWidth: 300, py: 0.5 }}>
          {log.new_value ? (
            <Box
              sx={{
                backgroundColor: '#F0FDF4',
                border: '1px solid #D1FAE5',
                borderRadius: 1,
                p: 1,
                maxHeight: 100,
                overflow: 'auto',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {typeof log.new_value === 'string'
                  ? log.new_value
                  : JSON.stringify(log.new_value, null, 2)}
              </Typography>
            </Box>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontSize: '12px' }}
            >
              N/A
            </Typography>
          )}
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: '12px' }}>
            {log.created_at
              ? new Date(log.created_at).toLocaleString()
              : 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Chip
            label={log.status || 'N/A'}
            size="small"
            sx={getStatusColor(log.status || '')}
          />
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py: 0.5 }}>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', fontSize: '12px' }}
          >
            {log.ip_address || 'N/A'}
          </Typography>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap', py : 0.5 }}>
          <Typography variant="body2" sx={{ fontSize: '12px' }}>
            {log.device || 'N/A'}
          </Typography>
        </TableCell>

{/*
<TableCell sx={{ whiteSpace: 'nowrap', py: 1 }}>
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Tooltip title="View Details">
      <IconButton size="small" sx={{ padding: 0.5 }}>
        <Visibility fontSize="small" />
      </IconButton>
    </Tooltip>

    {log.reason && (
      <Tooltip title={log.reason}>
        <IconButton size="small" sx={{ padding: 0.5 }}>
          <Info fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
  </Box>
</TableCell>
*/}
      </TableRow>
    ))
  )}
</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default AuditLogTable;
