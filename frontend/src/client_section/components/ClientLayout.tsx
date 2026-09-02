import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import AutoStoriesRoundedIcon from '@mui/icons-material/AutoStoriesRounded';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import GroupsRoundedIcon from '@mui/icons-material/GroupsRounded';
import { getLoginRoute } from '../../utils/authRedirect';
import api from '../../utils/axio';

const drawerWidth = 240;

const sidebarItems = [
  { name: 'Dashboard', path: '/client/dashboard', icon: DashboardIcon },
  { name: 'Recommendations', path: '/client/recommendations', icon: CheckBoxIcon },
  { name: 'Research Analysts', path: '/client/analysts', icon: GroupsRoundedIcon },
  { name: 'Insights', path: '/client/insights', icon: AutoStoriesRoundedIcon },
  { name: 'Notifications', path: '/client/notifications', icon: NotificationsIcon },
  { name: 'Profile', path: '/client/profile', icon: PersonIcon },
];

export const ClientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Detect desktop view vs mobile/tablet view
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = localStorage.getItem('username') || 'Guest';
  const initial = username.charAt(0).toUpperCase();

  // Dynamic live time state for header top-right
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derive current page title from active path
  const activeItem = sidebarItems.find((item) => item.path === location.pathname);
  const pageTitle = activeItem ? activeItem.name : 'Dashboard';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    const role = localStorage.getItem('role');
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      localStorage.clear();
      navigate(getLoginRoute(role, ['CLIENT']), { replace: true });
    }
  };

  // Reusable Sidebar Content (Drawer inner components)
  const drawerContent = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        p: 2,
        backgroundColor: '#5271FF',
        color: '#FFFFFF',
      }}
    >
      <Box>
        {/* Logo / Brand Header */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: '#FFFFFF',
            mb: 3,
            px: 1,
            mt: 0.5,
            fontSize: '1.25rem',
          }}
        >
          Tarkashh
        </Typography>

        {/* Navigation Links */}
        <List disablePadding>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <ListItem key={item.name} disablePadding sx={{ mb: 0.8 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.path}
                  onClick={() => {
                    if (!isDesktop) setMobileOpen(false); // Close drawer on navigation in mobile
                  }}
                  sx={{
                    borderRadius: '24px',
                    backgroundColor: isActive ? '#D8DEFF' : 'transparent',
                    color: isActive ? '#1E1B4B' : '#FFFFFF',
                    '&:hover': {
                      backgroundColor: isActive
                        ? '#D8DEFF'
                        : 'rgba(255, 255, 255, 0.12)',
                    },
                    px: 2,
                    py: 1,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive ? '#1E1B4B' : '#FFFFFF',
                      minWidth: 36,
                    }}
                  >
                    <Icon sx={{ fontSize: '1.2rem' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.name}
                    primaryTypographyProps={{
                      fontSize: '13.5px',
                      fontWeight: isActive ? 700 : 500,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Bottom User Profile Section */}
      <Box
        sx={{
          pt: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#FFFFFF',
            color: '#5271FF',
            fontWeight: 700,
            width: 36,
            height: 36,
            fontSize: '14px',
          }}
        >
          {initial}
        </Avatar>

        <Box sx={{ overflow: 'hidden' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#FFFFFF',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {username}
          </Typography>
          <Button
            onClick={handleLogout}
            variant="text"
            sx={{
              p: 0,
              minWidth: 0,
              color: '#E0E7FF',
              textTransform: 'none',
              fontSize: '12px',
              '&:hover': {
                color: '#FFFFFF',
                textDecoration: 'underline',
                backgroundColor: 'transparent',
              },
            }}
          >
            Log out
          </Button>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
      {/* Mobile/Tablet Drawer (Temporary overlay) */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop Drawer (Permanent sidebar) */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: 'none',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main Content Outer Area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
       {/* Top Green Header Bar */}
<AppBar
  position="static"
  elevation={0}
  sx={{
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    minHeight: '48px',
    width: '100%',
  }}
>
  <Toolbar
    variant="dense"
    disableGutters // Eliminates extra internal padding that restricts width
    sx={{
      display: 'flex',
      justify: 'space-between',
      alignItems: 'center',
      px: { xs: 1.5, sm: 3 },
      width: '100%',
    }}
  >
    {/* LEFT CORNER: Hamburger Menu + Page Title */}
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1, 
        flexGrow: 1, // <--- THIS pushes the right item to the far corner
      }}
    >
      {!isDesktop && (
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          sx={{ p: 0.5 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 700,
          fontSize: { xs: '0.875rem', sm: '0.95rem' },
        }}
      >
        {pageTitle}
      </Typography>
    </Box>

    {/* RIGHT CORNER: Date & Time */}
    <Typography
      variant="caption"
      sx={{
        fontWeight: 600,
        fontSize: { xs: '0.68rem', sm: '0.75rem' },
        whiteSpace: 'nowrap',
        textAlign: 'right',
      }}
    >
      {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </Typography>
  </Toolbar>
</AppBar>

        {/* Dynamic Page Component Container */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2.5, md: 3 }, // Responsive outer margin/padding
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default ClientLayout;
