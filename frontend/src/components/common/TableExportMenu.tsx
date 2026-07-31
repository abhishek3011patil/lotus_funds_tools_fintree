import { useState, type MouseEvent } from "react";
import {
  Button,
  CircularProgress,
  Menu,
  MenuItem,
} from "@mui/material";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import {
  createDatedExportFileName,
  exportTableToCsv,
  exportTableToExcel,
  printTable,
  type TableExportColumn,
} from "../../utils/tableExport.utils";

interface TableExportMenuProps<Row> {
  rows: Row[];
  columns: TableExportColumn<Row>[];
  fileBaseName: string;
  printTitle: string;
  loading?: boolean;
}

export default function TableExportMenu<Row>({
  rows,
  columns,
  fileBaseName,
  printTitle,
  loading = false,
}: TableExportMenuProps<Row>) {
  const [anchorElement, setAnchorElement] =
    useState<HTMLElement | null>(null);
  const [exporting, setExporting] = useState(false);

  const closeMenu = () => setAnchorElement(null);

  const runExport = (action: () => void) => {
    setExporting(true);

    try {
      action();
    } catch (error) {
      console.error("TABLE EXPORT ERROR:", error);
    } finally {
      setExporting(false);
      closeMenu();
    }
  };

  const disabled =
    loading || exporting || rows.length === 0;

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        disabled={disabled}
        startIcon={
          exporting
            ? <CircularProgress size={16} />
            : <FileDownloadOutlinedIcon />
        }
        onClick={(event: MouseEvent<HTMLButtonElement>) =>
          setAnchorElement(event.currentTarget)
        }
        sx={{
          textTransform: "none",
          whiteSpace: "nowrap",
          mx: 1,
        }}
      >
        Export current page
      </Button>

      <Menu
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() =>
            runExport(() =>
              exportTableToCsv(
                rows,
                columns,
                createDatedExportFileName(
                  fileBaseName,
                  "csv"
                )
              )
            )
          }
        >
          CSV — current page
        </MenuItem>
        <MenuItem
          onClick={() =>
            runExport(() =>
              exportTableToExcel(
                rows,
                columns,
                createDatedExportFileName(
                  fileBaseName,
                  "xlsx"
                )
              )
            )
          }
        >
          Excel (.xlsx) — current page
        </MenuItem>
        <MenuItem
          onClick={() =>
            runExport(() =>
              printTable(rows, columns, printTitle)
            )
          }
        >
          Print — current page
        </MenuItem>
      </Menu>
    </>
  );
}
