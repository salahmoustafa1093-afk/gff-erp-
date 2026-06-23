import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Collapse from '@mui/material/Collapse';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
export default function SearchFilter({ onSearch, onFilterChange, onExport, onClearFilters, filters, initialSearch = '', initialFilters = {}, searchPlaceholder = 'Search...', showExport = true, showFilters = true, searchDebounceMs = 300, loading = false, }) {
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [activeFilters, setActiveFilters] = useState(initialFilters);
    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const debounceTimerRef = useRef();
    const debouncedSearch = useCallback((query) => {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            onSearch(query);
        }, searchDebounceMs);
    }, [onSearch, searchDebounceMs]);
    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchQuery(value);
        debouncedSearch(value);
    };
    const handleClearSearch = () => {
        setSearchQuery('');
        onSearch('');
    };
    const handleFilterValueChange = (field, value) => {
        const newFilters = {
            ...activeFilters,
            [field]: value,
        };
        // Remove empty/null values
        if (value === '' || value === null || value === undefined) {
            delete newFilters[field];
        }
        setActiveFilters(newFilters);
        onFilterChange(newFilters);
    };
    const handleClearAllFilters = () => {
        setActiveFilters({});
        setSearchQuery('');
        onSearch('');
        onFilterChange({});
        onClearFilters?.();
    };
    const handleRemoveFilter = (field) => {
        const newFilters = { ...activeFilters };
        delete newFilters[field];
        setActiveFilters(newFilters);
        onFilterChange(newFilters);
    };
    const activeFilterCount = Object.keys(activeFilters).length;
    const hasActiveFilters = activeFilterCount > 0 || searchQuery;
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);
    return (_jsxs(Paper, { elevation: 0, sx: { p: 2, mb: 2 }, variant: "outlined", children: [_jsxs(Box, { sx: { display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }, children: [_jsx(TextField, { placeholder: searchPlaceholder, value: searchQuery, onChange: handleSearchChange, disabled: loading, size: "small", sx: { flex: '1 1 280px', minWidth: 200 }, InputProps: {
                            startAdornment: (_jsx(InputAdornment, { position: "start", children: _jsx(SearchIcon, { color: "action", fontSize: "small" }) })),
                            endAdornment: searchQuery ? (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { size: "small", onClick: handleClearSearch, edge: "end", children: _jsx(ClearIcon, { fontSize: "small" }) }) })) : null,
                        } }), showFilters && filters.length > 0 && (_jsxs(Button, { variant: showFilterPanel ? 'contained' : 'outlined', startIcon: _jsx(FilterListIcon, {}), onClick: () => setShowFilterPanel(!showFilterPanel), size: "small", color: activeFilterCount > 0 ? 'primary' : 'inherit', children: ["Filters", activeFilterCount > 0 && (_jsx(Chip, { label: activeFilterCount, size: "small", color: "primary", sx: { ml: 1, height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.6875rem' } } }))] })), showExport && onExport && (_jsx(Tooltip, { title: "Export to CSV", children: _jsx(Button, { variant: "outlined", startIcon: _jsx(FileDownloadIcon, {}), onClick: onExport, size: "small", children: "Export" }) })), hasActiveFilters && (_jsx(Button, { variant: "text", color: "error", startIcon: _jsx(ClearIcon, {}), onClick: handleClearAllFilters, size: "small", children: "Clear All" }))] }), showFilters && filters.length > 0 && (_jsx(Collapse, { in: showFilterPanel, timeout: "auto", unmountOnExit: true, children: _jsx(Box, { sx: {
                        mt: 2,
                        pt: 2,
                        borderTop: '1px solid',
                        borderColor: 'divider',
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            lg: 'repeat(4, 1fr)',
                        },
                        gap: 2,
                    }, children: filters.map((filter) => (_jsx(FormControl, { size: "small", fullWidth: true, children: filter.type === 'select' ? (_jsxs(_Fragment, { children: [_jsx(InputLabel, { children: filter.label }), _jsxs(Select, { value: activeFilters[filter.field] || '', onChange: (e) => handleFilterValueChange(filter.field, e.target.value), label: filter.label, children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "All" }) }), filter.options?.map((opt) => (_jsx(MenuItem, { value: String(opt.value), children: opt.label }, String(opt.value))))] })] })) : filter.type === 'text' ? (_jsx(TextField, { label: filter.label, placeholder: filter.placeholder, value: activeFilters[filter.field] || '', onChange: (e) => handleFilterValueChange(filter.field, e.target.value), size: "small" })) : filter.type === 'boolean' ? (_jsxs(_Fragment, { children: [_jsx(InputLabel, { children: filter.label }), _jsxs(Select, { value: activeFilters[filter.field] || '', onChange: (e) => handleFilterValueChange(filter.field, e.target.value), label: filter.label, children: [_jsx(MenuItem, { value: "", children: _jsx("em", { children: "All" }) }), _jsx(MenuItem, { value: "true", children: "Yes" }), _jsx(MenuItem, { value: "false", children: "No" })] })] })) : null }, filter.field))) }) })), hasActiveFilters && (_jsxs(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", sx: { mt: 1.5 }, children: [searchQuery && (_jsx(Chip, { label: `Search: "${searchQuery}"`, size: "small", onDelete: handleClearSearch, color: "primary", variant: "outlined" })), Object.entries(activeFilters).map(([field, value]) => {
                        const filterDef = filters.find((f) => f.field === field);
                        if (!value || !filterDef)
                            return null;
                        const displayValue = filterDef.type === 'select'
                            ? filterDef.options?.find((o) => String(o.value) === String(value))?.label || value
                            : filterDef.type === 'boolean'
                                ? value === 'true'
                                    ? 'Yes'
                                    : 'No'
                                : String(value);
                        return (_jsx(Chip, { label: `${filterDef.label}: ${displayValue}`, size: "small", onDelete: () => handleRemoveFilter(field), variant: "outlined" }, field));
                    })] }))] }));
}
