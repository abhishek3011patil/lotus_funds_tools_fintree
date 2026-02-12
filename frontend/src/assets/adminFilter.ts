import React from "react";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

export type AdminFilterValue = "All" | "Pending" | "Approved" | "Rejected";

type AdminFilterProps = {
  value: AdminFilterValue;
  onChange: (value: AdminFilterValue) => void;
};

const AdminFilter = ({ value, onChange }: AdminFilterProps) => {
  return React.createElement(
    ToggleButtonGroup,
    {
      size: "small",
      exclusive: true,
      value,
      onChange: (_: unknown, nextValue: AdminFilterValue | null) =>
        nextValue && onChange(nextValue),
    },
    React.createElement(ToggleButton, { value: "All" }, "All"),
    React.createElement(ToggleButton, { value: "Pending" }, "Pending"),
    React.createElement(ToggleButton, { value: "Approved" }, "Approved"),
    React.createElement(ToggleButton, { value: "Rejected" }, "Rejected")
  );
};

export default AdminFilter;


