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
import FolderIcon from '@mui/icons-material/Folder';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SettingsIcon from '@mui/icons-material/Settings';
import { getLoginRoute } from '../../utils/authRedirect';

const drawerWidth = 240;

// Sidebar navigation structure mapped to Broker files visible in image_c53918.png
const brokerSidebarItems = [
  { name: 'Dashboard', path: '/broker/dashboard', icon: DashboardIcon },
  { name: 'Recommendations', path: '/broker/recommendations', icon: FolderIcon },
  { name: 'Performance', path: '/broker/performance', icon: ShowChartIcon },
  { name: 'Settings', path: '/broker/settings', icon: SettingsIcon },
];

export const BrokerLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  // Detect desktop view vs mobile/tablet view
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const username = localStorage.getItem('username') || 'Broker';
  const initial = username.charAt(0).toUpperCase();

  // Dynamic live time state for top-right header
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Derive current page title dynamically from active path
  const activeItem = brokerSidebarItems.find((item) => item.path === location.pathname);
  const pageTitle = activeItem ? activeItem.name : 'Dashboard';

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    const role = localStorage.getItem('role');
    localStorage.clear();
    navigate(getLoginRoute(role, ['BROKER']), { replace: true });
  };

  // Reusable Sidebar Content
 // Reusable Sidebar Content
const drawerContent = (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%', // Fills full sidebar height
      p: 2,
      backgroundColor: '#5271FF',
      color: '#FFFFFF',
      boxSizing: 'border-box',
    }}
  >
    {/* TOP SECTION: Logo + Nav Items */}
    <Box sx={{ flexGrow: 1 }}> {/* <--- flexGrow: 1 pushes the profile box to the bottom */}
      {/* Brand Header */}
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
        {brokerSidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <ListItem key={item.name} disablePadding sx={{ mb: 0.8 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={() => {
                  if (!isDesktop) setMobileOpen(false);
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

    {/* BOTTOM SECTION: User Profile & Logout */}
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
      {/* Mobile / Tablet Drawer Overlay */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
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

      {/* Desktop Permanent Drawer */}
{/* Desktop Permanent Drawer */}
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
        height: '100vh', // <--- Ensures full viewport height
      },
    }}
  >
    {drawerContent}
  </Drawer>
)}

      {/* Main Content Area */}
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
            disableGutters
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              px: { xs: 1.5, sm: 3 },
              width: '100%',
            }}
          >
            {/* Left: Hamburger + Dynamic Page Title */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
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

            {/* Right: Live Clock */}
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                fontSize: { xs: '0.68rem', sm: '0.75rem' },
                whiteSpace: 'nowrap',
                textAlign: 'right',
              }}
            >
              {currentTime.toLocaleDateString()}{' '}
              {currentTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Dynamic Page Views Rendered Here */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1.5, sm: 2.5, md: 3 },
            overflowY: 'auto',
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default BrokerLayout;
