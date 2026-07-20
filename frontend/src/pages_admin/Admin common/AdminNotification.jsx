import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  IconButton,
  Stack,
  Avatar,
  InputAdornment
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  VerifiedUser as ApprovalIcon,
  DeleteOutline as DeleteIcon,
  Search as SearchIcon,
  NotificationsNone as BellIcon
} from '@mui/icons-material';

const AdminNotification = () => {
    
  // Filtered dataset containing ONLY Dashboard and Admin Approval updates
  const [notifications, setNotifications] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to format fallback dates and handle "Today" logic
  const formatDate = (dateString) => {
    if (!dateString) return 'Older Updates';
    
    // If backend explicitly says "Today", keep it as "Today"
    if (dateString === 'Today') return 'Today';

    const d = new Date(dateString);
    if (isNaN(d.getTime())) {
      // If it's a pre-formatted string like "20 Jul 2026", check if it matches today
      const todayFormatted = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      return dateString === todayFormatted ? 'Today' : dateString;
    }
    
    // Check if the parsed date object is today
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }

    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Resolves design accents for allowed views
  const getSourceIconConfigs = (source) => {
    switch (source) {
      case 'Dashboard':
        return { icon: <DashboardIcon sx={{ color: '#4d64f3' }} />, bgColor: '#eef2ff' };
      case 'Admin Approval':
        return { icon: <ApprovalIcon sx={{ color: '#10b981' }} />, bgColor: '#ecfdf5' };
      default:
        return { icon: <BellIcon sx={{ color: '#94a3b8' }} />, bgColor: '#f3f4f6' };
    }
  };

  const handleMarkAllCompleted = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

const handleDeleteNotification = async (id) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/admin/notifications/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const data = await res.json();

    if (data.success) {
      setNotifications(prev =>
        prev.filter(n => n.id !== id)
      );
    }
  } catch (err) {
    console.error(err);
  }
};

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamically extract unique group headers present in the list
  const groups = Array.from(new Set(filteredNotifications.map(n => n.dateGroup)));

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/notifications`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json();

      if (data.success) {
        // Uniformly normalize all date groups so matching dates aggregate under "Today"
        const processedNotifications = data.notifications.map(n => {
          const rawGroup = n.dateGroup === 'Older' ? (n.createdAt || n.date) : n.dateGroup;
          return {
            ...n,
            dateGroup: formatDate(rawGroup)
          };
        });

        setNotifications(processedNotifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: '1250px', margin: '0 auto' }}>
        
        {/* Search Header Wrapper Controls */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search notifications by title, description, or module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8' }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              bgcolor: '#ffffff',
              '& .MuiOutlinedInput-root': {
                height: '45px',
                '& fieldset': { borderColor: '#e2e8f0' },
                '&:hover fieldset': { borderColor: '#cbd5e1' },
              }
            }}
          />
        </Box>

        {/* Action Description Strip Panel Header */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          gap: 2,
          mb: 4 
        }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
              Notifications
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              You have {notifications.filter(n => !n.isRead).length} unread updates requiring attention
            </Typography>
          </Box>
          <Button 
            variant="text" 
            onClick={handleMarkAllCompleted}
            sx={{ 
              bgcolor: '#f1f5f9', 
              color: '#4f46e5', 
              textTransform: 'none', 
              fontWeight: 600,
              px: 2,
              width: { xs: '100%', sm: 'auto' },
              '&:hover': { bgcolor: '#e2e8f0' }
            }}
          >
            Mark all as completed
          </Button>
        </Box>

        {/* Group Timeline Blocks Map */}
        {groups.map(group => {
          const groupItems = filteredNotifications.filter(n => n.dateGroup === group);
          if (groupItems.length === 0) return null;

          return (
            <Box key={group} sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#64748b', mb: 1.5 }}>
                {group}
              </Typography>
              <Stack spacing={1.5}>
                {groupItems.map((notif) => {
                  const config = getSourceIconConfigs(notif.source);
                  return (
                    <Card key={notif.id} elevation={0} sx={{
                      p: 2.5,
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'flex-start', sm: 'flex-start' },
                      gap: 2.5,
                      border: '1px solid #e5e7eb',
                      borderLeft: !notif.isRead ? '4px solid #10b981' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      bgcolor: '#ffffff',
                      position: 'relative'
                    }}>
                      <Avatar sx={{ bgcolor: config.bgColor, width: 42, height: 42, borderRadius: 2 }}>
                        {config.icon}
                      </Avatar>

                      <Box sx={{ flexGrow: 1, width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {notif.source}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', pr: { xs: 4, sm: 0 } }}>
                            {notif.time}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          {notif.title}
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.5 }}>
                          {notif.description}
                        </Typography>
                      </Box>

                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteNotification(notif.id)}
                        sx={{ 
                          color: '#94a3b8', 
                          alignSelf: { xs: 'flex-end', sm: 'center' }, 
                          position: { xs: 'absolute', sm: 'static' },
                          top: { xs: 16, sm: 'auto' },
                          right: { xs: 16, sm: 'auto' },
                          '&:hover': { color: '#ef4444' } 
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Card>
                  );
                })}
              </Stack>
            </Box>
          );
        })}

        {filteredNotifications.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <BellIcon sx={{ fontSize: 48, color: '#9ca3af', mb: 1.5 }} />
            <Typography variant="body1" sx={{ color: '#64748b' }}>No notifications found.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default AdminNotification;