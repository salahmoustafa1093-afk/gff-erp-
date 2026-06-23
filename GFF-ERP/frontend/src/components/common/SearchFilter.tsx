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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

export interface FilterOption {
  field: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'dateRange' | 'number' | 'boolean';
  options?: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: Record<string, unknown>) => void;
  onExport?: () => void;
  onClearFilters?: () => void;
  filters: FilterOption[];
  initialSearch?: string;
  initialFilters?: Record<string, unknown>;
  searchPlaceholder?: string;
  showExport?: boolean;
  showFilters?: boolean;
  searchDebounceMs?: number;
  loading?: boolean;
}

export default function SearchFilter({
  onSearch,
  onFilterChange,
  onExport,
  onClearFilters,
  filters,
  initialSearch = '',
  initialFilters = {},
  searchPlaceholder = 'Search...',
  showExport = true,
  showFilters = true,
  searchDebounceMs = 300,
  loading = false,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>(initialFilters);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        onSearch(query);
      }, searchDebounceMs);
    },
    [onSearch, searchDebounceMs]
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleFilterValueChange = (field: string, value: unknown) => {
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

  const handleRemoveFilter = (field: string) => {
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

  return (
    <Paper elevation={0} sx={{ p: 2, mb: 2 }} variant="outlined">
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search Input */}
        <TextField
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={handleSearchChange}
          disabled={loading}
          size="small"
          sx={{ flex: '1 1 280px', minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={handleClearSearch} edge="end">
                  <ClearIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* Filter Toggle */}
        {showFilters && filters.length > 0 && (
          <Button
            variant={showFilterPanel ? 'contained' : 'outlined'}
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            size="small"
            color={activeFilterCount > 0 ? 'primary' : 'inherit'}
          >
            Filters
            {activeFilterCount > 0 && (
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 1, height: 20, '& .MuiChip-label': { px: 0.75, fontSize: '0.6875rem' } }}
              />
            )}
          </Button>
        )}

        {/* Export Button */}
        {showExport && onExport && (
          <Tooltip title="Export to CSV">
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={onExport}
              size="small"
            >
              Export
            </Button>
          </Tooltip>
        )}

        {/* Clear All */}
        {hasActiveFilters && (
          <Button
            variant="text"
            color="error"
            startIcon={<ClearIcon />}
            onClick={handleClearAllFilters}
            size="small"
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Filter Panel */}
      {showFilters && filters.length > 0 && (
        <Collapse in={showFilterPanel} timeout="auto" unmountOnExit>
          <Box
            sx={{
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
            }}
          >
            {filters.map((filter) => (
              <FormControl key={filter.field} size="small" fullWidth>
                {filter.type === 'select' ? (
                  <>
                    <InputLabel>{filter.label}</InputLabel>
                    <Select
                      value={(activeFilters[filter.field] as string) || ''}
                      onChange={(e) => handleFilterValueChange(filter.field, e.target.value)}
                      label={filter.label}
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      {filter.options?.map((opt) => (
                        <MenuItem key={String(opt.value)} value={String(opt.value)}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                ) : filter.type === 'text' ? (
                  <TextField
                    label={filter.label}
                    placeholder={filter.placeholder}
                    value={(activeFilters[filter.field] as string) || ''}
                    onChange={(e) => handleFilterValueChange(filter.field, e.target.value)}
                    size="small"
                  />
                ) : filter.type === 'boolean' ? (
                  <>
                    <InputLabel>{filter.label}</InputLabel>
                    <Select
                      value={(activeFilters[filter.field] as string) || ''}
                      onChange={(e) => handleFilterValueChange(filter.field, e.target.value)}
                      label={filter.label}
                    >
                      <MenuItem value="">
                        <em>All</em>
                      </MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                      <MenuItem value="false">No</MenuItem>
                    </Select>
                  </>
                ) : null}
              </FormControl>
            ))}
          </Box>
        </Collapse>
      )}

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
          {searchQuery && (
            <Chip
              label={`Search: "${searchQuery}"`}
              size="small"
              onDelete={handleClearSearch}
              color="primary"
              variant="outlined"
            />
          )}
          {Object.entries(activeFilters).map(([field, value]) => {
            const filterDef = filters.find((f) => f.field === field);
            if (!value || !filterDef) return null;
            const displayValue =
              filterDef.type === 'select'
                ? filterDef.options?.find((o) => String(o.value) === String(value))?.label || value
                : filterDef.type === 'boolean'
                  ? value === 'true'
                    ? 'Yes'
                    : 'No'
                  : String(value);
            return (
              <Chip
                key={field}
                label={`${filterDef.label}: ${displayValue}`}
                size="small"
                onDelete={() => handleRemoveFilter(field)}
                variant="outlined"
              />
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}