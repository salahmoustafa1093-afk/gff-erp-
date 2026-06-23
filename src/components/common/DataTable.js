import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import { DataGrid, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarDensitySelector, useGridApiRef, } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
function CustomToolbar({ onRefresh, onExport, ...props }) {
    return (_jsxs(GridToolbarContainer, { ...props, sx: { p: 1.5, gap: 1 }, children: [_jsx(GridToolbarColumnsButton, {}), _jsx(GridToolbarFilterButton, {}), _jsx(GridToolbarDensitySelector, {}), onRefresh && (_jsx(Tooltip, { title: "Refresh", children: _jsx(Button, { startIcon: _jsx(RefreshIcon, {}), size: "small", onClick: onRefresh, color: "inherit", children: "Refresh" }) })), onExport && (_jsx(Tooltip, { title: "Export to CSV", children: _jsx(Button, { startIcon: _jsx(FileDownloadIcon, {}), size: "small", onClick: onExport, color: "inherit", children: "Export" }) }))] }));
}
export default function DataTable({ rows, columns, totalCount, pageSize = 25, page = 0, loading = false, error = null, title, subtitle, hideActionsColumn = false, hideToolbar = false, density = 'standard', sortModel: controlledSortModel, filterModel: controlledFilterModel, columnVisibilityModel, rowSelectionModel, disableColumnFilter = false, disableColumnMenu = false, disableDensitySelector = false, disableColumnSelector = false, hideFooterPagination = false, checkboxSelection = false, disableRowSelectionOnClick = false, getRowId, onPageChange, onSortModelChange, onFilterModelChange, onRowSelectionModelChange, onRowClick, onView, onEdit, onDelete, onRefresh, onExport, actionButtons, emptyMessage = 'No data available', emptyActionLabel, emptyAction, sx, }) {
    const apiRef = useGridApiRef();
    const [paginationModel, setPaginationModel] = useState({
        page,
        pageSize,
    });
    const [sortModel, setSortModel] = useState(controlledSortModel || []);
    const [filterModel, setFilterModel] = useState(controlledFilterModel || { items: [] });
    const handlePaginationModelChange = useCallback((model) => {
        setPaginationModel(model);
        onPageChange?.(model);
    }, [onPageChange]);
    const handleSortModelChange = useCallback((model) => {
        setSortModel(model);
        onSortModelChange?.(model);
    }, [onSortModelChange]);
    const handleFilterModelChange = useCallback((model) => {
        setFilterModel(model);
        onFilterModelChange?.(model);
    }, [onFilterModelChange]);
    const actionColumn = {
        field: 'actions',
        headerName: 'Actions',
        width: hideActionsColumn ? 0 : actionButtons ? 160 : 140,
        sortable: false,
        filterable: false,
        hideable: false,
        disableColumnMenu: true,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (_jsx(Stack, { direction: "row", spacing: 0.5, justifyContent: "center", children: actionButtons ? (actionButtons(params.row)) : (_jsxs(_Fragment, { children: [onView && (_jsx(Tooltip, { title: "View", children: _jsx(IconButton, { size: "small", color: "info", onClick: (e) => {
                                e.stopPropagation();
                                onView(params.row);
                            }, children: _jsx(VisibilityIcon, { fontSize: "small" }) }) })), onEdit && (_jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", color: "primary", onClick: (e) => {
                                e.stopPropagation();
                                onEdit(params.row);
                            }, children: _jsx(EditIcon, { fontSize: "small" }) }) })), onDelete && (_jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: (e) => {
                                e.stopPropagation();
                                onDelete(params.row);
                            }, children: _jsx(DeleteIcon, { fontSize: "small" }) }) }))] })) })),
    };
    const allColumns = hideActionsColumn ? columns : [...columns, actionColumn];
    if (error) {
        return (_jsxs(Paper, { sx: { p: 4, textAlign: 'center' }, children: [_jsx(Typography, { color: "error", gutterBottom: true, children: "Error loading data" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: error }), onRefresh && (_jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: onRefresh, children: "Retry" }))] }));
    }
    return (_jsxs(Box, { sx: { width: '100%', ...sx }, children: [(title || subtitle) && (_jsxs(Box, { sx: { mb: 2 }, children: [title && (_jsx(Typography, { variant: "h6", fontWeight: 600, children: title })), subtitle && (_jsx(Typography, { variant: "body2", color: "text.secondary", children: subtitle }))] })), _jsx(Paper, { sx: { overflow: 'hidden' }, children: _jsx(DataGrid, { apiRef: apiRef, rows: rows, columns: allColumns, getRowId: getRowId, loading: loading, density: density, rowCount: totalCount, paginationModel: paginationModel, onPaginationModelChange: handlePaginationModelChange, pageSizeOptions: [10, 25, 50, 100], paginationMode: "server", sortingMode: "server", filterMode: "server", sortModel: sortModel, onSortModelChange: handleSortModelChange, filterModel: filterModel, onFilterModelChange: handleFilterModelChange, rowSelectionModel: rowSelectionModel, onRowSelectionModelChange: onRowSelectionModelChange, onRowClick: onRowClick, columnVisibilityModel: columnVisibilityModel, disableColumnFilter: disableColumnFilter, disableColumnMenu: disableColumnMenu, disableDensitySelector: disableDensitySelector, disableColumnSelector: disableColumnSelector, hideFooterPagination: hideFooterPagination, checkboxSelection: checkboxSelection, disableRowSelectionOnClick: disableRowSelectionOnClick, disableVirtualization: rows.length < 100, slots: {
                        toolbar: hideToolbar ? undefined : CustomToolbar,
                    }, slotProps: {
                        toolbar: { onRefresh, onExport },
                        loadingOverlay: {
                            variant: 'skeleton',
                            noRowsVariant: 'skeleton',
                        },
                        pagination: {
                            showFirstButton: true,
                            showLastButton: true,
                        },
                    }, sx: {
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
                    }, localeText: {
                        noRowsLabel: (_jsxs(Box, { sx: { textAlign: 'center', py: 4 }, children: [_jsx(Typography, { variant: "body1", color: "text.secondary", gutterBottom: true, children: emptyMessage }), emptyAction && emptyActionLabel && (_jsx(Button, { variant: "outlined", size: "small", onClick: emptyAction, children: emptyActionLabel }))] })),
                    }, initialState: {
                        pagination: {
                            paginationModel: { page, pageSize },
                        },
                    } }) })] }));
}
