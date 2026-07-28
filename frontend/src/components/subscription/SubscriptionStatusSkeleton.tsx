import { Grid, Skeleton, Stack } from "@mui/material";

const SubscriptionStatusSkeleton = () => (
  <Stack spacing={2} aria-label="Loading subscription status">
    <Skeleton variant="text" width={220} height={32} />
    <Grid container spacing={2}>
      {Array.from({ length: 6 }, (_, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6 }}>
          <Skeleton variant="rounded" height={58} />
        </Grid>
      ))}
    </Grid>
  </Stack>
);

export default SubscriptionStatusSkeleton;
