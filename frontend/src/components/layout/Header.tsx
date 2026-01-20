import { AppBar, Toolbar, Typography } from "@mui/material";

const Header = () => {
  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography variant="h6">
          Fintree Admin
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
