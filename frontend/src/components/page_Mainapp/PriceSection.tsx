import {
  Box,
  InputAdornment,
  TextField,
  Tooltip,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  memo,
  useCallback,
  type ChangeEvent,
} from "react";

export type MainPriceField =
  | "entry"
  | "target"
  | "stopLoss";

type MainPriceValues = Record<MainPriceField, string>;

type PriceSectionProps = {
  values: MainPriceValues;
  wasValidated: boolean;
  onChange: (
    field: MainPriceField,
    value: string
  ) => void;
  getError: (
    field: MainPriceField,
    values: MainPriceValues
  ) => string | null;
};

const PRICE_FIELDS: Array<{
  field: MainPriceField;
  label: string;
}> = [
  { field: "entry", label: "Entry" },
  { field: "target", label: "Target" },
  { field: "stopLoss", label: "Stop Loss" },
];

const PriceSection = memo(
  ({
    values,
    wasValidated,
    onChange,
    getError,
  }: PriceSectionProps) => {
 const handleChange = useCallback(
  (
    field: MainPriceField,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = event.target.value;

    if (value.includes("-")) return;

    onChange(field, value);
  },
  [onChange]
);

    return (
      <Box
        id="prices-row"
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 1,
          mb: 1,
        }}
      >
        {PRICE_FIELDS.map(({ field, label }) => {
          const errorMessage = getError(
            field,
            values
          );

          return (
            <TextField
              key={field}
              required
              label={label}
              size="small"
              type="number"
              value={values[field]}
              onChange={(event) =>
  handleChange(field, event)
}
              error={
                wasValidated &&
                Boolean(errorMessage)
              }
              sx={{
                flex: 1,
                backgroundColor: "transparent",

                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#b6c3b6",
                },

                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#9fb19f",
                },

                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#6fa66f",
                },
              }}
              InputProps={{
                endAdornment:
                  wasValidated && errorMessage ? (
                    <InputAdornment position="end">
                      <Tooltip
                        title={errorMessage}
                        arrow
                        placement="top"
                      >
                        <ErrorOutlineIcon
                          color="error"
                          sx={{
                            cursor: "pointer",
                            fontSize: "1.1rem",
                          }}
                        />
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
              }}
            />
          );
        })}
      </Box>
    );
  }
);

export default PriceSection;
