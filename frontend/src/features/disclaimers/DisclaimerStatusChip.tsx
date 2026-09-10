import { Chip } from "@mui/material";
import type { DisclaimerStatus } from "./disclaimer.types";
const DisclaimerStatusChip = ({ status }: { status: DisclaimerStatus }) => <Chip size="small" label={status} color={status === "ACTIVE" ? "success" : status === "DRAFT" ? "warning" : "default"} />;
export default DisclaimerStatusChip;
