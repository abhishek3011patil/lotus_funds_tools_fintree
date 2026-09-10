import { Box, Paper, Skeleton, Stack } from "@mui/material";

const cardSx = {
  bgcolor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "16px",
  boxShadow: "0 6px 20px rgba(15, 23, 42, 0.05)",
};

const LoadingRegion = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <Box role="status" aria-busy="true" aria-label={label}>
    {children}
  </Box>
);

const HeadingSkeleton = () => (
  <Box sx={{ mb: 3 }}>
    <Skeleton variant="text" width="min(280px, 65%)" height={46} />
    <Skeleton variant="text" width="min(480px, 88%)" height={25} />
  </Box>
);

const StatSkeleton = () => (
  <Box sx={{ ...cardSx, minHeight: 132, p: 2.25, display: "flex", justifyContent: "space-between" }}>
    <Box sx={{ flex: 1 }}>
      <Skeleton variant="text" width="58%" />
      <Skeleton variant="text" width={54} height={42} />
      <Skeleton variant="text" width="70%" />
    </Box>
    <Skeleton variant="rounded" width={42} height={42} sx={{ borderRadius: "12px" }} />
  </Box>
);

const RecommendationCardSkeleton = () => (
  <Box sx={{ ...cardSx, minHeight: 260, p: 2.25 }}>
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Box sx={{ width: "65%" }}>
        <Skeleton variant="text" width="75%" height={29} />
        <Skeleton variant="text" width="90%" />
      </Box>
      <Skeleton variant="rounded" width={64} height={24} />
    </Stack>
    <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
      <Skeleton variant="rounded" width={62} height={24} />
      <Skeleton variant="rounded" width={76} height={24} />
    </Stack>
    <Skeleton variant="rounded" height={76} sx={{ mt: 2, borderRadius: "12px" }} />
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 2 }}>
      <Skeleton variant="text" width={90} />
      <Skeleton variant="rounded" width={104} height={34} />
    </Stack>
  </Box>
);

const AnalystCardSkeleton = () => (
  <Box sx={{ ...cardSx, minHeight: 292, p: { xs: 2.25, sm: 2.5 } }}>
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
      <Skeleton variant="circular" width={62} height={62} sx={{ flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="75%" height={28} />
        <Skeleton variant="text" width="90%" />
      </Box>
      <Skeleton variant="rounded" width={100} height={42} sx={{ borderRadius: "11px" }} />
    </Stack>
    <Skeleton variant="text" width="96%" sx={{ mt: 2 }} />
    <Skeleton variant="text" width="78%" />
    <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }}>
      <Skeleton variant="rounded" width={92} height={24} />
      <Skeleton variant="rounded" width={68} height={24} />
    </Stack>
    <Box sx={{ mt: 2, pt: 2, borderTop: "1px solid #EEF2F7", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}>
      {[0, 1, 2].map((item) => (
        <Box key={item}>
          <Skeleton variant="text" width={45} height={30} />
          <Skeleton variant="text" width="75%" />
        </Box>
      ))}
    </Box>
  </Box>
);

export const ClientDashboardSkeleton = () => (
  <LoadingRegion label="Loading dashboard">
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <HeadingSkeleton />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" }, gap: 2, mb: 2.5 }}>
        {Array.from({ length: 4 }, (_, index) => <StatSkeleton key={index} />)}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 2.2fr) minmax(280px, .8fr)" }, gap: 2.5, mb: 2.5 }}>
        <Box sx={{ ...cardSx, minHeight: 410, p: 2.5 }}>
          <Skeleton variant="text" width={180} height={32} />
          <Skeleton variant="text" width="55%" />
          <Stack spacing={1.5} sx={{ mt: 2.5 }}>
            {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} variant="rounded" height={64} />)}
          </Stack>
        </Box>
        <Stack spacing={2.5}>
          {[190, 195].map((height) => (
            <Box key={height} sx={{ ...cardSx, minHeight: height, p: 2.25 }}>
              <Skeleton variant="text" width="65%" height={30} />
              <Skeleton variant="rounded" height={92} sx={{ mt: 1.5 }} />
            </Box>
          ))}
        </Stack>
      </Box>
      <Box sx={{ ...cardSx, p: 2.5 }}>
        <Skeleton variant="text" width={190} height={32} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2, mt: 1.5 }}>
          {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} variant="rounded" height={122} />)}
        </Box>
      </Box>
    </Box>
  </LoadingRegion>
);

export const ClientRouteSkeleton = () => (
  <LoadingRegion label="Loading client page">
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <HeadingSkeleton />
      <Box sx={{ ...cardSx, p: 2, mb: 3 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "2fr 1fr 1fr" }, gap: 1.5 }}>
          <Skeleton variant="rounded" height={40} />
          <Skeleton variant="rounded" height={40} />
          <Skeleton variant="rounded" height={40} />
        </Box>
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
        {Array.from({ length: 6 }, (_, index) => <RecommendationCardSkeleton key={index} />)}
      </Box>
    </Box>
  </LoadingRegion>
);

export const ClientRecommendationsSkeleton = () => (
  <LoadingRegion label="Loading recommendations">
    <Stack spacing={4.5}>
      {[0, 1].map((section) => (
        <Box key={section} sx={section ? { bgcolor: "#F5F7FF", border: "1px solid #E0E7FF", borderRadius: "20px", p: { xs: 2, sm: 3 } } : undefined}>
          <Skeleton variant="text" width={210} height={34} />
          <Skeleton variant="text" width="min(520px, 80%)" sx={{ mb: 2 }} />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2 }}>
            {Array.from({ length: 3 }, (_, index) => <RecommendationCardSkeleton key={index} />)}
          </Box>
        </Box>
      ))}
    </Stack>
  </LoadingRegion>
);

export const ClientAnalystsSkeleton = () => (
  <LoadingRegion label="Loading research analysts">
    <Skeleton variant="text" width={150} sx={{ mb: 1.75 }} />
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))", xl: "repeat(3, minmax(0, 1fr))" }, gap: 2.25 }}>
      {Array.from({ length: 6 }, (_, index) => <AnalystCardSkeleton key={index} />)}
    </Box>
  </LoadingRegion>
);

export const ClientNotificationsSkeleton = () => (
  <LoadingRegion label="Loading notifications">
    <Stack spacing={2}>
      {Array.from({ length: 5 }, (_, index) => (
        <Box key={index} sx={{ ...cardSx, p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Skeleton variant="rounded" width={150} height={24} />
            <Skeleton variant="text" width={55} />
          </Stack>
          <Skeleton variant="text" width="42%" height={27} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="92%" />
          <Skeleton variant="text" width="70%" />
        </Box>
      ))}
    </Stack>
  </LoadingRegion>
);

export const ClientProfileSkeleton = () => (
  <LoadingRegion label="Loading profile">
    <Stack spacing={2.5}>
      <Paper variant="outlined" sx={{ borderRadius: 3, borderColor: "#E5EAF2", p: { xs: 2.25, sm: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} alignItems={{ sm: "center" }}>
          <Skeleton variant="circular" width={72} height={72} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="min(260px, 65%)" height={36} />
            <Skeleton variant="text" width="min(340px, 82%)" />
          </Box>
        </Stack>
        <Box sx={{ my: 2.5, borderTop: "1px solid #E5EAF2" }} />
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          {Array.from({ length: 2 }, (_, index) => <Skeleton key={index} variant="rounded" height={48} />)}
        </Box>
      </Paper>
      <Skeleton variant="text" width={190} height={32} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" }, gap: 1.5 }}>
        {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} variant="rounded" height={54} />)}
      </Box>
    </Stack>
  </LoadingRegion>
);
