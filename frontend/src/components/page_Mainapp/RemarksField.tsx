import { memo, useEffect, useState } from "react";
import { TextField } from "@mui/material";

type RemarksFieldProps = {
  value: string;
  onCommit: (value: string) => void;
};

const RemarksField = memo(
  ({ value, onCommit }: RemarksFieldProps) => {
    const [localValue, setLocalValue] =
      useState(value);

    useEffect(() => {
      setLocalValue(value);
    }, [value]);

    return (
      <TextField
        required
        multiline
        rows={2}
        placeholder="Research Analyst's Remarks"
        value={localValue}
        onChange={(event) =>
          setLocalValue(event.target.value)
        }
        onBlur={() => {
  if (localValue === value) {
    return;
  }

  onCommit(localValue);
}}
        sx={{ flexGrow: 1 }}
      />
    );
  }
);

export default RemarksField;