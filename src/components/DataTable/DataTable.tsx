import { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridRowsProp, GridPaginationModel, GridRowSelectionModel, GridRowId } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { COLORS } from "../../constants";

// Helper to convert GridRowId[] to GridRowSelectionModel (MUI v8 format)
const toSelectionModel = (ids: GridRowId[]): GridRowSelectionModel => ({
  type: "include" as const,
  ids: new Set(ids),
});

// Helper to convert GridRowSelectionModel to GridRowId[]
const fromSelectionModel = (model: GridRowSelectionModel): GridRowId[] => {
  return Array.from(model.ids || []);
};

interface DataTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  loading?: boolean;
  pageSize?: number;
  pageSizeOptions?: number[];
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  autoHeight?: boolean;
  hideFooter?: boolean;
  onRowClick?: (params: unknown) => void;
  paginationModel?: GridPaginationModel;
  onPaginationModelChange?: (model: GridPaginationModel) => void;
  rowCount?: number;
  paginationMode?: "client" | "server";
  sortingMode?: "client" | "server";
  className?: string;
  height?: number | string; // Fixed height for table with scroll
  rowSelectionModel?: GridRowId[];
  onRowSelectionModelChange?: (newSelection: GridRowId[]) => void;
}

// Custom DataGrid styles - applied via sx prop since MuiDataGrid theme types
// are not included in base MUI theme without module augmentation
const dataGridStyles = {
  border: "none",
  backgroundColor: COLORS.surface,
  borderRadius: "12px",
  fontFamily: "'Inter', sans-serif",
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: COLORS.background,
    borderBottom: `1px solid ${COLORS.border}`,
    borderRadius: 0,
  },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 600,
    fontSize: "12px",
    textTransform: "uppercase",
    color: COLORS.textMuted,
    letterSpacing: "0.5px",
  },
  "& .MuiDataGrid-cell": {
    borderBottom: `1px solid ${COLORS.border}`,
    color: COLORS.textDark,
    fontSize: "14px",
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: COLORS.surfaceHover,
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.background,
  },
  "& .MuiTablePagination-root": {
    color: COLORS.textDark,
  },
  "& .MuiCheckbox-root": {
    color: COLORS.textMuted,
  },
  "& .MuiCheckbox-root.Mui-checked": {
    color: COLORS.accent,
  },
  "& .MuiDataGrid-columnSeparator": {
    display: "none",
  },
  "& .MuiDataGrid-sortIcon": {
    color: COLORS.textMuted,
  },
  "& .MuiDataGrid-columnHeader:focus": {
    outline: "none",
  },
  "& .MuiDataGrid-columnHeader:focus-within": {
    outline: "none",
  },
  "& .MuiDataGrid-cell:focus": {
    outline: "none",
  },
  "& .MuiDataGrid-cell:focus-within": {
    outline: "none",
  },
  "& .MuiDataGrid-menuIcon": {
    display: "none",
  },
  "& .MuiDataGrid-virtualScroller": {
    minHeight: "200px",
  },
};

// Custom MUI theme for palette and typography
const customTheme = createTheme({
  palette: {
    primary: {
      main: COLORS.accent,
    },
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
  },
});

const DataTable = ({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  checkboxSelection = false,
  disableRowSelectionOnClick = true,
  autoHeight = true,
  hideFooter = false,
  onRowClick,
  paginationModel: externalPaginationModel,
  onPaginationModelChange: externalOnPaginationModelChange,
  rowCount,
  paginationMode = "client",
  sortingMode = "client",
  className = "",
  height,
  rowSelectionModel,
  onRowSelectionModelChange,
}: DataTableProps) => {
  // Internal pagination state for uncontrolled mode
  const [internalPaginationModel, setInternalPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize,
  });

  // Use external or internal pagination model
  const paginationModel = externalPaginationModel || internalPaginationModel;
  
  const handlePaginationModelChange = (model: GridPaginationModel) => {
    if (externalOnPaginationModelChange) {
      externalOnPaginationModelChange(model);
    } else {
      setInternalPaginationModel(model);
    }
  };

  // If height is provided, disable autoHeight
  const useAutoHeight = height ? false : autoHeight;

  return (
    <ThemeProvider theme={customTheme}>
      <div
        className={`rounded-xl overflow-hidden ${className}`}
        style={{
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
          height: height || "auto",
        }}
      >
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pageSizeOptions={pageSizeOptions}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          autoHeight={useAutoHeight}
          hideFooter={hideFooter}
          onRowClick={onRowClick}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          rowCount={rowCount}
          paginationMode={paginationMode}
          sortingMode={sortingMode}
          rowSelectionModel={rowSelectionModel ? toSelectionModel(rowSelectionModel) : undefined}
          onRowSelectionModelChange={onRowSelectionModelChange ? (model: GridRowSelectionModel) => {
            onRowSelectionModelChange(fromSelectionModel(model));
          } : undefined}
          localeText={{
            noRowsLabel: "No Record Found",
          }}
          sx={{
            ...dataGridStyles,
            height: height ? "100%" : "auto",
            "& .MuiDataGrid-virtualScroller": {
              minHeight: rows.length === 0 ? "200px" : "auto",
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
};

export default DataTable;
export type { GridRowId, GridColDef } from "@mui/x-data-grid";

