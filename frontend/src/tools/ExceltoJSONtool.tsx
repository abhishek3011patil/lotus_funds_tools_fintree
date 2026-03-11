import React, { useState, useMemo, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import {
  Box, Button, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Checkbox, FormControlLabel,
  FormGroup, Popover, Stack, IconButton, Tooltip, TextField
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DownloadIcon from '@mui/icons-material/Download';

export const ExceltoJSONTool: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [headerMap, setHeaderMap] = useState<Record<string, string>>({});
  const [isEditingHeaders, setIsEditingHeaders] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      if (json.length > 0) {
        const originalHeaders = Object.keys(json[0]);
        setData(json);
        setVisibleColumns(originalHeaders);
        const initialMap = originalHeaders.reduce((acc, curr) => ({ ...acc, [curr]: curr }), {});
        setHeaderMap(initialMap);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadJson = () => {
    // We map the data to use your CUSTOM headers instead of the original ones
    const mappedData = data.map(row => {
      const newRow: any = {};
      visibleColumns.forEach(col => {
        const customName = headerMap[col] || col;
        newRow[customName] = row[col];
      });
      return newRow;
    });

    const fileName = "converted_data.json";
    const jsonStr = JSON.stringify(mappedData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const allOriginalHeaders = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

  return (
    <Box sx={{ p: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Excel to JSON Tool</Typography>
          
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" component="label" startIcon={<FileUploadOutlinedIcon />}>
              Upload
              <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
            </Button>

            {data.length > 0 && (
              <>
                <Button 
                  variant="contained" 
                  color="success" 
                  startIcon={<DownloadIcon />}
                  onClick={handleDownloadJson}
                >
                  Download JSON
                </Button>
                <Tooltip title="Rename Headers">
                  <IconButton onClick={() => setIsEditingHeaders(!isEditingHeaders)}>
                    <EditIcon color={isEditingHeaders ? "primary" : "inherit"} />
                  </IconButton>
                </Tooltip>
                <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                  <FilterListIcon />
                </IconButton>
              </>
            )}
          </Stack>
        </Stack>

        <Popover
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Box sx={{ p: 2 }}>
            <FormGroup>
              {allOriginalHeaders.map((header) => (
                <FormControlLabel
                  key={header}
                  control={
                    <Checkbox
                      size="small"
                      checked={visibleColumns.includes(header)}
                      onChange={() => setVisibleColumns(prev => 
                        prev.includes(header) ? prev.filter(c => c !== header) : [...prev, header]
                      )}
                    />
                  }
                  label={headerMap[header]}
                />
              ))}
            </FormGroup>
          </Box>
        </Popover>
      </Paper>

      {data.length > 0 && (
        <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {visibleColumns.map((header) => (
                  <TableCell key={header} sx={{ fontWeight: 'bold', bgcolor: '#f5f5f5' }}>
                    {isEditingHeaders ? (
                      <TextField
                        variant="standard"
                        value={headerMap[header]}
                        onChange={(e) => setHeaderMap(prev => ({ ...prev, [header]: e.target.value }))}
                      />
                    ) : (
                      headerMap[header]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i}>
                  {visibleColumns.map((header) => (
                    <TableCell key={header}>{row[header]?.toString() || ""}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
