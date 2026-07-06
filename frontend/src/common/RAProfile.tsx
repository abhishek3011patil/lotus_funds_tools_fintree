import { Box, Button, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const RAProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL}/api/registration/profile`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        setProfile(data.data);
      })
      .catch(console.error);
  }, []);

  if (!profile) {
    return <Typography p={3}>Loading...</Typography>;
  }

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight={700} mb={3}>
        My Profile
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography>
          <strong>Name:</strong>{" "}
          {profile.first_name} {profile.surname}
        </Typography>

        <Typography>
          <strong>Email:</strong> {profile.email}
        </Typography>

        <Typography>
          <strong>Mobile:</strong> {profile.mobile}
        </Typography>

        <Typography>
          <strong>SEBI Registration:</strong>{" "}
          {profile.sebi_reg_no}
        </Typography>

        <Typography>
          <strong>City:</strong> {profile.city}
        </Typography>

        <Typography>
          <strong>State:</strong> {profile.state}
        </Typography>
      </Paper>

      <Button
        variant="contained"
        onClick={() => navigate("/ra/profile/edit")}
      >
        Request Profile Edit
      </Button>
    </Box>
  );
};

export default RAProfile;