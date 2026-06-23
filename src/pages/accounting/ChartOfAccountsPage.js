import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Box, Typography, Button, Card, CardContent, Chip, TextField, FormControl, InputLabel, Select, MenuItem, IconButton, Tooltip, Alert, Dialog, } from '@mui/material';
import { Add, Edit, Delete, ExpandLess, ExpandMore, UnfoldLess, UnfoldMore, AccountTree, } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, getAccountTypeColor } from '../../utils/formatters';
const accountTypeOptions = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const buildTree = (accounts) => {
    const map = new Map();
    const roots = [];
    accounts.forEach((a) => {
        map.set(a.id, { ...a, children: [] });
    });
    accounts.forEach((a) => {
        const node = map.get(a.id);
        if (a.parentId && map.has(a.parentId)) {
            const parent = map.get(a.parentId);
            parent?.children?.push(node);
        }
        else {
            roots.push(node);
        }
    });
    return roots;
};
const AccountTreeItem = ({ account, onEdit, onDelete, queryClient }) => {
    const hasChildren = account.children && account.children.length > 0;
    const typeColor = getAccountTypeColor(account.type);
    return (_jsx(TreeItem, { itemId: account.id, label: _jsxs(Box, { display: "flex", alignItems: "center", py: 0.5, gap: 1, children: [_jsx(Box, { sx: {
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: typeColor,
                        flexShrink: 0,
                    } }), _jsx(Typography, { variant: "body2", fontWeight: hasChildren ? 'bold' : 'regular', sx: { minWidth: 80 }, children: account.code }), _jsx(Typography, { variant: "body2", flex: 1, children: account.name }), _jsx(Chip, { label: account.type, size: "small", sx: {
                        backgroundColor: `${typeColor}20`,
                        color: typeColor,
                        fontSize: '0.7rem',
                        height: 20,
                        mr: 1,
                    } }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { minWidth: 70, textAlign: 'right' }, children: formatCurrency(account.currentBalance) }), _jsxs(Box, { display: "flex", ml: 1, children: [_jsx(Tooltip, { title: "Edit", children: _jsx(IconButton, { size: "small", onClick: (e) => { e.stopPropagation(); onEdit(account.id); }, children: _jsx(Edit, { fontSize: "small" }) }) }), !account.isSystem && (_jsx(Tooltip, { title: "Delete", children: _jsx(IconButton, { size: "small", color: "error", onClick: (e) => { e.stopPropagation(); onDelete(account.id); }, children: _jsx(Delete, { fontSize: "small" }) }) }))] })] }), children: hasChildren &&
            account.children.map((child) => (_jsx(AccountTreeItem, { account: child, onEdit: onEdit, onDelete: onDelete, queryClient: queryClient }, child.id))) }));
};
const ChartOfAccountsPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [expanded, setExpanded] = useState([]);
    const [deleteId, setDeleteId] = useState(null);
    const { data: accounts, isLoading, error } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: () => accountingService.getAccounts({ includeInactive: false }),
    });
    const deleteMutation = useMutation({
        mutationFn: (id) => accountingService.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
            setDeleteId(null);
        },
    });
    const allAccounts = accounts?.data ?? [];
    const filteredAccounts = useMemo(() => {
        let filtered = allAccounts;
        if (typeFilter) {
            filtered = filtered.filter((a) => a.type === typeFilter);
        }
        if (search) {
            const q = search.toLowerCase();
            const matchedIds = new Set();
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
    return (_jsxs(Box, { p: 3, children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: [_jsxs(Typography, { variant: "h4", fontWeight: "bold", children: [_jsx(AccountTree, { sx: { mr: 1, verticalAlign: 'middle' } }), "Chart of Accounts"] }), _jsx(Button, { variant: "contained", startIcon: _jsx(Add, {}), onClick: () => navigate('/accounting/chart-of-accounts/new'), children: "Add Account" })] }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to load chart of accounts" })), _jsx(Card, { sx: { mb: 2 }, children: _jsx(CardContent, { children: _jsxs(Box, { display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", children: [_jsx(TextField, { placeholder: "Search by code or name", value: search, onChange: (e) => setSearch(e.target.value), size: "small", sx: { minWidth: 250 } }), _jsxs(FormControl, { size: "small", sx: { minWidth: 150 }, children: [_jsx(InputLabel, { children: "Account Type" }), _jsxs(Select, { value: typeFilter, label: "Account Type", onChange: (e) => setTypeFilter(e.target.value), children: [_jsx(MenuItem, { value: "", children: "All Types" }), accountTypeOptions.map((t) => (_jsx(MenuItem, { value: t, children: t }, t)))] })] }), _jsx(Box, { flex: 1 }), _jsx(Button, { size: "small", startIcon: _jsx(UnfoldMore, {}), onClick: handleExpandAll, children: "Expand All" }), _jsx(Button, { size: "small", startIcon: _jsx(UnfoldLess, {}), onClick: handleCollapseAll, children: "Collapse All" })] }) }) }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Box, { display: "flex", gap: 1, mb: 2, flexWrap: "wrap", children: accountTypeOptions.map((t) => (_jsx(Chip, { label: t, size: "small", sx: {
                                    backgroundColor: `${getAccountTypeColor(t)}20`,
                                    color: getAccountTypeColor(t),
                                    fontWeight: 'bold',
                                } }, t))) }), isLoading ? (_jsx(Typography, { color: "text.secondary", children: "Loading accounts..." })) : treeData.length === 0 ? (_jsx(Typography, { color: "text.secondary", children: "No accounts found" })) : (_jsx(SimpleTreeView, { expandedItems: expanded, onExpandedItemsChange: (_, items) => setExpanded(items), defaultCollapseIcon: _jsx(ExpandLess, {}), defaultExpandIcon: _jsx(ExpandMore, {}), children: treeData.map((account) => (_jsx(AccountTreeItem, { account: account, onEdit: (id) => navigate(`/accounting/chart-of-accounts/${id}/edit`), onDelete: (id) => setDeleteId(id), queryClient: queryClient }, account.id))) }))] }) }), _jsxs(Dialog, { open: !!deleteId, onClose: () => setDeleteId(null), maxWidth: "xs", fullWidth: true, children: [_jsx(DialogTitle, { children: "Confirm Delete" }), _jsxs(CardContent, { children: [_jsx(Typography, { children: "Are you sure you want to delete this account? This action cannot be undone." }), deleteMutation.isError && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: "Cannot delete account. It may have transactions or child accounts." }))] }), _jsxs(CardContent, { sx: { display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 0 }, children: [_jsx(Button, { onClick: () => setDeleteId(null), children: "Cancel" }), _jsx(Button, { variant: "contained", color: "error", onClick: () => deleteId && deleteMutation.mutate(deleteId), disabled: deleteMutation.isPending, children: deleteMutation.isPending ? 'Deleting...' : 'Delete' })] })] })] }));
};
export default ChartOfAccountsPage;
