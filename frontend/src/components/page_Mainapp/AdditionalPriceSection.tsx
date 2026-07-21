import {
  Box,
  Button,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  memo,
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

export type AdditionalPriceField =
  | "entryLow"
  | "entryUpper"
  | "target2"
  | "target3"
  | "stopLoss2"
  | "stopLoss3";

export type AdditionalToggleField =
  | "rangeEnabled"
  | "secondaryTargetEnabled"
  | "stopLoss2Enabled";

type AdditionalPriceValues = Record<
  AdditionalPriceField,
  string
>;

type ToggleValues = Record<
  AdditionalToggleField,
  boolean
>;

type AdditionalPriceSectionProps = {
  values: AdditionalPriceValues;
  toggles: ToggleValues;
  wasValidated: boolean;

  onToggle: (
    field: AdditionalToggleField
  ) => void;

  onCommit: (
    field: AdditionalPriceField,
    value: string
  ) => void;

  getError: (
    field: AdditionalPriceField,
    values: AdditionalPriceValues
  ) => string | null;
};

const AdditionalPriceSection = memo(
  ({
    values,
    toggles,
    wasValidated,
    onToggle,
    onCommit,
    getError,
  }: AdditionalPriceSectionProps) => {
    const [localValues, setLocalValues] =
      useState<AdditionalPriceValues>(values);

    useEffect(() => {
      setLocalValues(values);
    }, [
      values.entryLow,
      values.entryUpper,
      values.target2,
      values.target3,
      values.stopLoss2,
      values.stopLoss3,
    ]);

    const handleChange = useCallback(
      (
        field: AdditionalPriceField,
        event: ChangeEvent<HTMLInputElement>
      ) => {
        const value = event.target.value;

        if (value.includes("-")) return;

        setLocalValues((previous) => ({
          ...previous,
          [field]: value,
        }));
        onCommit(field, value);
      },
      [onCommit]
    );

    const sections: Array<{
      label: string;
      toggleField: AdditionalToggleField;
      firstField: AdditionalPriceField;
      secondField: AdditionalPriceField;
      firstPlaceholder: string;
      secondPlaceholder: string;
    }> = [
      {
        label: "Range",
        toggleField: "rangeEnabled",
        firstField: "entryLow",
        secondField: "entryUpper",
        firstPlaceholder: "Lower Entry",
        secondPlaceholder: "Upper Entry",
      },
      {
        label: "Secondary Target",
        toggleField: "secondaryTargetEnabled",
        firstField: "target2",
        secondField: "target3",
        firstPlaceholder: "T2",
        secondPlaceholder: "T3",
      },
      {
        label: "Stop Loss 2",
        toggleField: "stopLoss2Enabled",
        firstField: "stopLoss2",
        secondField: "stopLoss3",
        firstPlaceholder: "SL2",
        secondPlaceholder: "SL3",
      },
    ];

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: {
            xs: "column",
            md: "row",
          },
          justifyContent: "space-between",
          mb: 1,
          gap: {
            xs: 2,
            md: 1.5,
          },
        }}
      >
        {sections.map((section) => {
          const isActive =
            toggles[section.toggleField];

          const fields = [
            {
              field: section.firstField,
              placeholder:
                section.firstPlaceholder,
            },
            {
              field: section.secondField,
              placeholder:
                section.secondPlaceholder,
            },
          ];

          return (
            <Box
              key={section.toggleField}
              sx={{
                textAlign: "center",
                flex: 1,
                border:
                  "1px solid rgba(0,0,0,0.08)",
                borderRadius: 2,
                p: 1.5,
                backgroundColor: isActive
                  ? "rgba(25, 118, 210, 0.02)"
                  : "transparent",
                transition: "all 0.2s ease",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: isActive
                      ? "primary.main"
                      : "text.secondary",
                  }}
                >
                  {section.label}
                </Typography>

                <Switch
                  size="small"
                  checked={isActive}
                  onChange={() =>
                    onToggle(
                      section.toggleField
                    )
                  }
                />
              </Box>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isActive ? (
                  fields.map(
                    ({
                      field,
                      placeholder,
                    }) => {
                      const errorMessage =
                        getError(
                          field,
                          localValues
                        );

                      return (
                        <TextField
                          key={field}
                          type="number"
                          value={
                            localValues[field]
                          }
                          onChange={(event) =>
                            handleChange(
                              field,
                              event
                            )
                          }
                       
                          placeholder={
                            placeholder
                          }
                          size="small"
                          variant="outlined"
                          error={
                            wasValidated &&
                            Boolean(
                              errorMessage
                            )
                          }
                          sx={{
                            width: "100%",

                            "& .MuiInputBase-input":
                              {
                                py: 1,
                                fontSize:
                                  "0.7rem",
                                textAlign:
                                  "center",
                              },
                          }}
                          InputProps={{
                            endAdornment:
                              wasValidated &&
                              errorMessage ? (
                                <InputAdornment position="end">
                                  <Tooltip
                                    title={
                                      errorMessage
                                    }
                                    arrow
                                    placement="top"
                                  >
                                    <ErrorOutlineIcon
                                      color="error"
                                      sx={{
                                        fontSize:
                                          "1rem",
                                      }}
                                    />
                                  </Tooltip>
                                </InputAdornment>
                              ) : null,
                          }}
                        />
                      );
                    }
                  )
                ) : (
                  <>
                    <DisabledField />
                    <DisabledField />
                  </>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  }
);

const DisabledField = () => (
  <Button
    disabled
    fullWidth
    size="small"
    variant="outlined"
    sx={{
      py: 0.5,
      fontSize: "0.65rem",
      height: 32,
      backgroundColor: "#f9fafb",
      borderColor: "#f3f4f6",
      color: "#9ca3af !important",
      textTransform: "none",
      borderStyle: "dashed",
    }}
  >
    Disabled
  </Button>
);

export default AdditionalPriceSection;