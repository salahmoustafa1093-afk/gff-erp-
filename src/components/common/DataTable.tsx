import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import {
  DataGrid,
  type GridColDef,
  type GridRowParams,
  type GridPaginationModel,
  type GridSortModel,
  type GridFilterModel,
  type GridColumnVisibilityModel,
  type GridRowSelectionModel,
  type GridSlotsComponentsProps,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  useGridApiRef,
} from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';

export interface DataTableProps<T extends Record<string, unknown>> {
  rows: T[];
  columns: GridColDef[];
  totalCount: number;
  pageSize?: number;
  page?: number;
  loading?: boolean;
  error?: string | null;
  title?: string;
  subtitle?: string;
  hideActionsColumn?: boolean;
  hideToolbar?: boolean;
  density?: 'compact' | 'standard' | 'comfortable';
  sortModel?: GridSortModel;
  filterModel?: GridFilterModel;
  columnVisibilityModel?: GridColumnVisibilityModel;
  rowSelectionModel?: GridRowSelectionModel;
  disableColumnFilter?: boolean;
  disableColumnMenu?: boolean;
  disableDensitySelector?: boolean;
  disableColumnSelector?: boolean;
  hideFooterPagination?: boolean;
  checkboxSelection?: boolean;
  disableRowSelectionOnClick?: boolean;
  getRowId?: (row: T) => string;
  onPageChange?: (model: GridPaginationModel) => void;
  onSortModelChange?: (model: GridSortModel) => void;
  onFilterModelChange?: (model: GridFilterModel) => void;
  onRowSelectionModelChange?: (model: GridRowSelectionModel) => void;
  onRowClick?: (params: GridRowParams<T>) => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
  onRefresh?: () => void;
  onExport?: () => void;
  actionButtons?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  emptyActionLabel?: string;
  emptyAction?: () => void;
  sx?: React.ComponentProps<typeof Box>['sx'];
}

interface CustomToolbarProps extends NonNullable<GridSlotsComponentsProps['toolbar']> {
  onRefresh?: () => void;
  onExport?: () => void;
}

function CustomToolbar({ onRefresh, onExport, ...props }: CustomToolbarProps) {
  return (
    <GridToolbarContainer {...props} sx={{ p: 1.5, gap: 1 }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      {onRefresh && (
        <Tooltip title="Refresh">
          <Button
            startIcon={<RefreshIcon />}
            size="small"
            onClick={onRefresh}
            color="inherit"
          >
            Refresh
          </Button>
        </Tooltip>
      )}
      {onExport && (
        <Tooltip title="Export to CSV">
          <Button
            startIcon={<FileDownloadIcon />}
            size="small"
            onClick={onExport}
            color="inherit"
          >
            Export
          </Button>
        </Tooltip>
      )}
    </GridToolbarContainer>
  );
}

export default function DataTable<T extends Record<string, unknown>>({
  rows,
  columns,
  totalCount,
  pageSize = 25,
  page = 0,
  loading = false,
  error = null,
  title,
  subtitle,
  hideActionsColumn = false,
  hideToolbar = false,
  density = 'standard',
  sortModel: controlledSortModel,
  filterModel: controlledFilterModel,
  columnVisibilityModel,
  rowSelectionModel,
  disableColumnFilter = false,
  disableColumnMenu = false,
  disableDensitySelector = false,
  disableColumnSelector = false,
  hideFooterPagination = false,
  checkboxSelection = false,
  disableRowSelectionOnClick = false,
  getRowId,
  onPageChange,
  onSortModelChange,
  onFilterModelChange,
  onRowSelectionModelChange,
  onRowClick,
  onView,
  onEdit,
  onDelete,
  onRefresh,
  onExport,
  actionButtons,
  emptyMessage = 'No data available',
  emptyActionLabel,
  emptyAction,
  sx,
}: DataTableProps<T>) {
  const apiRef = useGridApiRef();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page,
    pageSize,
  });
  const [sortModel, setSortModel] = useState<GridSortModel>(controlledSortModel || []);
  const [filterModel, setFilterModel] = useState<GridFilterModel>(
    controlledFilterModel || { items: [] }
  );

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel) => {
      setPaginationModel(model);
      onPageChange?.(model);
    },
    [onPageChange]
  );

  const handleSortModelChange = useCallback(
    (model: GridSortModel) => {
      setSortModel(model);
      onSortModelChange?.(model);
    },
    [onSortModelChange]
  );

  const handleFilterModelChange = useCallback(
    (model: GridFilterModel) => {
      setFilterModel(model);
      onFilterModelChange?.(model);
    },
    [onFilterModelChange]
  );

  const actionColumn: GridColDef = {
    field: 'actions',
    headerName: 'Actions',
    width: hideActionsColumn ? 0 : actionButtons ? 160 : 140,
    sortable: false,
    filterable: false,
    hideable: false,
    disableColumnMenu: true,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <Stack direction="row" spacing={0.5} justifyContent="center">
        {actionButtons ? (
          actionButtons(params.row as T)
        ) : (
          <>
            {onView && (
              <Tooltip title="View">
                <IconButton
                  size="small"
                  color="info"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView(params.row as T);
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(params.row as T);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(params.row as T);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </>
        )}
      </Stack>
    ),
  };

  const allColumns = hideActionsColumn ? columns : [...columns, actionColumn];

  if (error) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="error" gutterBottom>
          Error loading data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {error}
        </Typography>
        {onRefresh && (
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh}>
            Retry
          </Button>
        )}
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {(title || subtitle) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      )}

      <Paper sx={{ overflow: 'hidden' }}>
        <DataGrid
          apiRef={apiRef}
          rows={rows}
          columns={allColumns}
          getRowId={getRowId}
          loading={loading}
          density={density}
          rowCount={totalCount}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          pageSizeOptions={[10, 25, 50, 100]}
          paginationMode="server"
          sortingMode="server"
          filterMode="server"
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          filterModel={filterModel}
          onFilterModelChange={handleFilterModelChange}
          rowSelectionModel={rowSelectionModel}
          onRowSelectionModelChange={onRowSelectionModelChange}
          onRowClick={onRowClick}
          columnVisibilityModel={columnVisibilityModel}
          disableColumnFilter={disableColumnFilter}
          disableColumnMenu={disableColumnMenu}
          disableDensitySelector={disableDensitySelector}
          disableColumnSelector={disableColumnSelector}
          hideFooterPagination={hideFooterPagination}
          checkboxSelection={checkboxSelection}
          disableRowSelectionOnClick={disableRowSelectionOnClick}
          disableVirtualization={rows.length < 100}
          slots={{
            toolbar: hideToolbar ? undefined : CustomToolbar,
          }}
          slotProps={{
            toolbar: { onRefresh, onExport } as CustomToolbarProps,
            loadingOverlay: {
              variant: 'skeleton',
              noRowsVariant: 'skeleton',
            },
            pagination: {
              showFirstButton: true,
              showLastButton: true,
            },
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'action.hover',
              borderBottom: '2px solid',
              borderBottomColor: 'divider',
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 600,
            },
            '& .MuiDataGrid-row:nth-of-type(even)': {
              backgroundColor: 'action.hover',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: 'action.focus',
            },
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-footerContainer': {
              borderTop: '1px solid',
              borderTopColor: 'divider',
            },
          }}
          localeText={{
            noRowsLabel: (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {emptyMessage}
                </Typography>
                {emptyAction && emptyActionLabel && (
                  <Button variant="outlined" size="small" onClick={emptyAction}>
                    {emptyActionLabel}
                  </Button>
                )}
              </Box>
            ) as unknown as string,
          }}
          initialState={{
            pagination: {
              paginationModel: { page, pageSize },
            },
          }}
        />
      </Paper>
    </Box>
  );
}
