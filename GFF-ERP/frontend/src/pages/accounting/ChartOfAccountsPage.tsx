import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Alert,
  Dialog,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  ExpandLess,
  ExpandMore,
  UnfoldLess,
  UnfoldMore,
  AccountTree,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, getAccountTypeColor } from '../../utils/formatters';
import type { ChartOfAccount, AccountType } from '../../types';

const accountTypeOptions: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

const buildTree = (accounts: ChartOfAccount[]): ChartOfAccount[] => {
  const map = new Map<string, ChartOfAccount & { children?: ChartOfAccount[] }>();
  const roots: (ChartOfAccount & { children?: ChartOfAccount[] })[] = [];

  accounts.forEach((a) => {
    map.set(a.id, { ...a, children: [] });
  });

  accounts.forEach((a) => {
    const node = map.get(a.id);
    if (a.parentId && map.has(a.parentId)) {
      const parent = map.get(a.parentId);
      parent?.children?.push(node!);
    } else {
      roots.push(node!);
    }
  });

  return roots;
};

const AccountTreeItem: React.FC<{
  account: ChartOfAccount & { children?: ChartOfAccount[] };
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  queryClient: ReturnType<typeof useQueryClient>;
}> = ({ account, onEdit, onDelete, queryClient }) => {
  const hasChildren = account.children && account.children.length > 0;
  const typeColor = getAccountTypeColor(account.type);

  return (
    <TreeItem
      itemId={account.id}
      label={
        <Box display="flex" alignItems="center" py={0.5} gap={1}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: typeColor,
              flexShrink: 0,
            }}
          />
          <Typography variant="body2" fontWeight={hasChildren ? 'bold' : 'regular'} sx={{ minWidth: 80 }}>
            {account.code}
          </Typography>
          <Typography variant="body2" flex={1}>
            {account.name}
          </Typography>
          <Chip
            label={account.type}
            size="small"
            sx={{
              backgroundColor: `${typeColor}20`,
              color: typeColor,
              fontSize: '0.7rem',
              height: 20,
              mr: 1,
            }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 70, textAlign: 'right' }}>
            {formatCurrency(account.currentBalance)}
          </Typography>
          <Box display="flex" ml={1}>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); onEdit(account.id); }}>
                <Edit fontSize="small" />
              </IconButton>
            </Tooltip>
            {!account.isSystem && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => { e.stopPropagation(); onDelete(account.id); }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      }
    >
      {hasChildren &&
        account.children!.map((child) => (
          <AccountTreeItem
            key={child.id}
            account={child}
            onEdit={onEdit}
            onDelete={onDelete}
            queryClient={queryClient}
          />
        ))}
    </TreeItem>
  );
};

const ChartOfAccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: accounts, isLoading, error } = useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: () => accountingService.getAccounts({ includeInactive: false }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountingService.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      setDeleteId(null);
    },
  });

  const allAccounts: ChartOfAccount[] = accounts?.data ?? [];

  const filteredAccounts = useMemo(() => {
    let filtered = allAccounts;
    if (typeFilter) {
      filtered = filtered.filter((a) => a.type === typeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      const matchedIds = new Set<string>();
      filtered.forEach((a) => {
        if (a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)) {
          matchedIds.add(a.id);
          let pid = a.parentId;
          while (pid) {
            matchedIds.add(pid);
            const p = allAccounts.find((x) => x.id === pid);
            pid = p?.parentId;
          }
        }
      });
      filtered = filtered.filter((a) => matchedIds.has(a.id));
    }
    return filtered;
  }, [allAccounts, typeFilter, search]);

  const treeData = useMemo(() => buildTree(filteredAccounts), [filteredAccounts]);

  const handleExpandAll = () => {
    setExpanded(allAccounts.map((a) => a.id));
  };

  const handleCollapseAll = () => {
    setExpanded([]);
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          <AccountTree sx={{ mr: 1, verticalAlign: 'middle' }} />
          Chart of Accounts
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate('/accounting/chart-of-accounts/new')}
        >
          Add Account
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load chart of accounts
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <TextField
              placeholder="Search by code or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={typeFilter}
                label="Account Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                {accountTypeOptions.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box flex={1} />
            <Button
              size="small"
              startIcon={<UnfoldMore />}
              onClick={handleExpandAll}
            >
              Expand All
            </Button>
            <Button
              size="small"
              startIcon={<UnfoldLess />}
              onClick={handleCollapseAll}
            >
              Collapse All
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
            {accountTypeOptions.map((t) => (
              <Chip
                key={t}
                label={t}
                size="small"
                sx={{
                  backgroundColor: `${getAccountTypeColor(t)}20`,
                  color: getAccountTypeColor(t),
                  fontWeight: 'bold',
                }}
              />
            ))}
          </Box>

          {isLoading ? (
            <Typography color="text.secondary">Loading accounts...</Typography>
          ) : treeData.length === 0 ? (
            <Typography color="text.secondary">No accounts found</Typography>
          ) : (
            <SimpleTreeView
              expandedItems={expanded}
              onExpandedItemsChange={(_, items) => setExpanded(items)}
              defaultCollapseIcon={<ExpandLess />}
              defaultExpandIcon={<ExpandMore />}
            >
              {treeData.map((account) => (
                <AccountTreeItem
                  key={account.id}
                  account={account}
                  onEdit={(id) => navigate(`/accounting/chart-of-accounts/${id}/edit`)}
                  onDelete={(id) => setDeleteId(id)}
                  queryClient={queryClient}
                />
              ))}
            </SimpleTreeView>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <CardContent>
          <Typography>Are you sure you want to delete this account? This action cannot be undone.</Typography>
          {deleteMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Cannot delete account. It may have transactions or child accounts.
            </Alert>
          )}
        </CardContent>
        <CardContent sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0 }}>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </CardContent>
      </Dialog>
    </Box>
  );
};

export default ChartOfAccountsPage;
