import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, CircularProgress, Stack, TextField } from "@mui/material";
import BrokerPageHeader from "../components/BrokerPageHeader";
import RecommendationHistory, { type ApiHistoryRecord } from "../../pages/common/RecommendationHistory";
import { getBrokerCalls, onboardingError } from "../services/brokerOnboarding.service";

const BrokerResearchCalls = () => {
  const [calls, setCalls] = useState<ApiHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setCalls(await getBrokerCalls()); }
    catch (err) { setError(onboardingError(err)); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    void load();
    const refresh = () => { void load(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [load]);
  return <Box>
    <BrokerPageHeader title="Research Calls" subtitle="Published calls from the Research Analysts associated with your brokerage." readOnly />
    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
      <TextField size="small" fullWidth label="Search calls, symbols or Research Analysts" value={search} onChange={e => setSearch(e.target.value)} />
      <Button onClick={() => void load()} disabled={loading}>Refresh</Button>
    </Stack>
    {error ? <Alert severity="error" action={<Button onClick={() => void load()}>Retry</Button>}>{error}</Alert>
      : loading ? <Box sx={{ textAlign: "center", p: 5 }}><CircularProgress aria-label="Loading research calls" /></Box>
        : <>
          {calls.length === 0 && <Alert severity="info" sx={{ mb: 2 }}>No published calls yet. Add an existing RA or complete RA onboarding to see their published calls here.</Alert>}
          <RecommendationHistory records={calls} showMedia enableExport searchQuery={search} exportFileBaseName="broker-research-calls" />
        </>}
  </Box>;
};
export default BrokerResearchCalls;
