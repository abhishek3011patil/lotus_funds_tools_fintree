import { memo } from "react";
import { TextField } from "@mui/material";

type RemarksFieldProps = {
  value: string;
  onCommit: (value: string) => void;
};

const RemarksField = memo(
  ({ value, onCommit }: RemarksFieldProps) => {
    return (
      <TextField
        required
        multiline
        rows={2}
        placeholder="Research Analyst's Remarks"
        value={value}
        onChange={(event) => onCommit(event.target.value)}
        sx={{ flexGrow: 1 }}
      />
    );
  }
);

export default RemarksField;
