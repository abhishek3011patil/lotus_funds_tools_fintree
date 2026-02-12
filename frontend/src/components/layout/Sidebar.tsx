// import {
//   Avatar,
//   Box,
//   Drawer,
//   List,
//   ListItemButton,
//   ListItemText,
//   Typography,
//   Divider,
//   Stack,
//   IconButton,
//   useMediaQuery,
//   useTheme,
// } from "@mui/material";
// import DashboardIcon from '@mui/icons-material/Dashboard';
// import CheckBoxIcon from '@mui/icons-material/CheckBox';
// import FolderIcon from '@mui/icons-material/Folder';
// import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
// import CloseIcon from "@mui/icons-material/Close";
// import { Link, useLocation } from "react-router-dom";

// interface SidebarProps {
//   open?: boolean;
//   onClose?: () => void;
// }

// const drawerWidth = 220;
// const HEADER_HEIGHT = 64;

// const Sidebar = ({ open = false, onClose }: SidebarProps) => {
//   const theme = useTheme();
//   const isDesktop = useMediaQuery(theme.breakpoints.up("sm"));
//   const location = useLocation();

//   const isActive = (path: string) => location.pathname === path;

//   const getNavItemStyles = (active: boolean) => ({
//     borderRadius: 999,
//     mx: 1.5,
//     mb: 0.5,
//     px: 2,
//     color: active ? "#020617" : "#e5e7eb",
//     backgroundColor: active ? "#D8D4F4" : "transparent",
//     "&:hover": {
//       backgroundColor: "#D8D4F4",
//       color: "#020617",
//     },
//   });

//   const content = (
//     <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
//       {/* Mobile header row: Fintree + Close */}
//       <Box
//         sx={{
//           display: { xs: "flex", sm: "none" },
//           alignItems: "center",
//           justifyContent: "space-between",
//           px: 2,
//           pt: 2,
//           pb: 1,
//           minHeight: 56,
//         }}
//       >
//         <Typography 
//           sx={{ 
//             fontWeight: 600, 
//             fontSize: 18, 
//             color: "white",
//             display: "block",
//           }}
//         >
//           Fintree
//         </Typography>
//         <IconButton
//           onClick={onClose}
//           sx={{
//             color: "white",
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           }}
//           size="small"
//         >
//           <CloseIcon sx={{ fontSize: 24 }} />
//         </IconButton>
//       </Box>

//       {/* Desktop Fintree header aligned with header bar */}
//       <List
//         sx={{
//           display: { xs: "none", sm: "block" },
//           mt: 0,
//           mb: 0,
//           p: 0, // remove default List padding so divider aligns pixel-perfect with header bottom
//         }}
//       >
//         <ListItemButton
//           component={Link}
//           to="/"
//           sx={{
//             color: "inherit",
//             height: HEADER_HEIGHT,
//             minHeight: HEADER_HEIGHT,
//             py: 0,
//             px: 2,
//             "&:hover": { backgroundColor: "transparent" },
//           }}
//           disableRipple
//           onClick={onClose}
//         >
//           <Typography sx={{ fontWeight: 600, fontSize: 18, lineHeight: 1 }}>
//             Fintree
//           </Typography>
//         </ListItemButton>
//       </List>

//       <Box>
//         <Divider 
//           sx={{ 
//             borderColor: "rgba(255,255,255,0.2)", 
//             mx: 1.5,
//             mt: { xs: 1, sm: 0 },
//             display: { xs: "block", sm: "block" },
//           }} 
//         />

//         <List sx={{ mt: 2 }}>
//           <ListItemButton
//             component={Link}
//             to="/"
//             sx={getNavItemStyles(isActive("/"))}
//             onClick={onClose}
//           >
//             <DashboardIcon sx={{ mr: 1.5 }} />
//             <ListItemText primary="Dashboard" />
//           </ListItemButton>
//           <ListItemButton
//             component={Link}
//             to="/recommendations"
//             sx={getNavItemStyles(isActive("/recommendations"))}
//             onClick={onClose}
//           >
//             <CheckBoxIcon sx={{ mr: 1.5 }} />
//             <ListItemText primary="Recommendations" />
//           </ListItemButton>
//           <ListItemButton
//             component={Link}
//             to="/performance"
//             sx={getNavItemStyles(isActive("/performance"))}
//             onClick={onClose}
//           >
//             <FolderIcon sx={{ mr: 1.5 }} />
//             <ListItemText primary="Performance" />
//           </ListItemButton>
//           <ListItemButton
//             sx={{
//               mx: 1.5,
//               mt: 0.5,
//               px: 2,
//               color: "#e5e7eb",
//               "&:hover": {
//                 backgroundColor: "rgba(15,23,42,0.15)",
//               },
//             }}
//           >
//             <MoreHorizIcon sx={{ mr: 1.5 }} />
//             <ListItemText primary="Extra option" />
//           </ListItemButton>
//         </List>
//       </Box>

//       <Box sx={{ mt: "auto", pb: 2 }}>
//         <Divider sx={{ borderColor: "rgba(255,255,255,0.2)", mx: 1.5 }} />
//         <Box sx={{ px: 2, pt: 1.5 }}>
//           <Stack direction="row" alignItems="center" spacing={1.5}>
//             <Avatar
//               sx={{
//                 width: 40,
//                 height: 40,
//                 bgcolor: "#D8D4F4",
//                 color: "#020617",
//                 fontSize: 18,
//               }}
//             >
//               P
//             </Avatar>
//             <Box>
//               <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
//                 Pradyut Patnaik
//               </Typography>
//               <Typography
//                 sx={{
//                   fontSize: 12,
//                   opacity: 0.8,
//                   cursor: "pointer",
//                   "&:hover": { textDecoration: "underline" },
//                 }}
//               >
//                 Log out
//               </Typography>
//             </Box>
//           </Stack>
//         </Box>
//       </Box>
//     </Box>
//   );

//   return (
//     <>
//       {/* Mobile temporary drawer */}
//       <Drawer
//         variant="temporary"
//         open={!isDesktop && open}
//         onClose={onClose}
//         ModalProps={{ keepMounted: true }}
//         sx={{
//           display: { xs: "block", sm: "none" },
//           zIndex: (theme) => theme.zIndex.drawer + 2, // Ensure drawer is above header
//           [`& .MuiDrawer-paper`]: {
//             width: drawerWidth,
//             backgroundColor: "#4F6CF8",
//             color: "white",
//             borderRight: "none",
//             // Drawer slides from top of screen, covering the header
//             top: 0,
//             height: "100vh",
//           },
//         }}
//       >
//         {content}
//       </Drawer>

//       {/* Desktop permanent drawer */}
//       <Drawer
//         variant="permanent"
//         sx={{
//           display: { xs: "none", sm: "block" },
//           width: drawerWidth,
//           [`& .MuiDrawer-paper`]: {
//             width: drawerWidth,
//             backgroundColor: "#4F6CF8",
//             color: "white",
//             borderRight: "none",
//             top: 0,
//             height: "100vh",
//           },
//         }}
//         open
//       >
//         {content}
//       </Drawer>
//     </>
//   );
// };

// export default Sidebar;

import SidebarCommon from "../page_Mainapp/Sidebar";
import type { SidebarProps as CommonSidebarProps } from "../page_Mainapp/Sidebar";

type SidebarProps = CommonSidebarProps;

const Sidebar = (props: SidebarProps) => {
  return <SidebarCommon {...props} />;
};

export default Sidebar;
