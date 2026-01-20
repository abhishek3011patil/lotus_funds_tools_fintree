import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import RecommendIcon from "@mui/icons-material/Recommend";
const Sidebar = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 220,
        [`& .MuiDrawer-paper`]: { width: 220 ,
           backgroundColor: "#1e293b",
           color: "white"
        },
        
      }}
    >
      <List>
        <ListItemButton  
        
        component={Link} to="/"

        sx={{
         color: "inherit",
         
          }} 
  
        >
          <Typography sx={{ fontWeight: 600, fontSize: 20 }}>
         Fintree
         </Typography>
        </ListItemButton>
       </List>

      <List>
         <ListItemButton component={Link} to="/">
          <ListItemText primary="Dashboard" />
        </ListItemButton>
        <ListItemButton component={Link} to="/recommendations">
 
  <ListItemText primary="Recommendations" />
</ListItemButton>
        <ListItemButton component={Link} to="/">
          <ListItemText primary="Performance" />
        </ListItemButton>
       
        
      </List>
    </Drawer>
  );
};

export default Sidebar;
