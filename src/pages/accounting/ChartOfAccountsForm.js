import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Button, Card, CardContent, Grid, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel, Alert, CircularProgress, Autocomplete, TextField as MuiTextField, } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../../services/accountingService';
const subTypeMap = {
    ASSET: [
        { value: 'CURRENT_ASSET', label: 'Current Asset' },
        { value: 'FIXED_ASSET', label: 'Fixed Asset' },
        { value: 'INTANGIBLE_ASSET', label: 'Intangible Asset' },
    ],
    LIABILITY: [
        { value: 'CURRENT_LIABILITY', label: 'Current Liability' },
        { value: 'LONG_TERM_LIABILITY', label: 'Long-term Liability' },
    ],
    EQUITY: [
        { value: 'OWNER_EQUITY', label: 'Owner Equity' },
        { value: 'RETAINED_EARNINGS', label: 'Retained Earnings' },
    ],
    REVENUE: [
        { value: 'OPERATING_REVENUE', label: 'Operating Revenue' },
        { value: 'NON_OPERATING_REVENUE', label: 'Non-operating Revenue' },
    ],
    EXPENSE: [
        { value: 'OPERATING_EXPENSE', label: 'Operating Expense' },
        { value: 'COGS', label: 'Cost of Goods Sold' },
        { value: 'NON_OPERATING_EXPENSE', label: 'Non-operating Expense' },
    ],
};
const accountTypeOptions = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
const normalBalanceMap = {
    ASSET: 'DEBIT',
    LIABILITY: 'CREDIT',
    EQUITY: 'CREDIT',
    REVENUE: 'CREDIT',
    EXPENSE: 'DEBIT',
};
const accountSchema = Yup.object().shape({
    code: Yup.string().required('Code is required').max(20),
    name: Yup.string().required('Name is required').max(100),
    type: Yup.string().oneOf(accountTypeOptions).required('Type is required'),
    subType: Yup.string().required('Sub-type is required'),
    parentId: Yup.string().nullable(),
    normalBalance: Yup.string().oneOf(['DEBIT', 'CREDIT']).required(),
    openingBalance: Yup.number().min(0).default(0),
    isActive: Yup.boolean().default(true),
    isSystem: Yup.boolean().default(false),
});
const ChartOfAccountsForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEdit = Boolean(id && id !== 'new');
    const { data: account, isLoading: loadingAccount } = useQuery({
        queryKey: ['chart-of-account', id],
        queryFn: () => accountingService.getAccountById(id),
        enabled: isEdit,
    });
    const { data: accountsData } = useQuery({
        queryKey: ['chart-of-accounts-all'],
        queryFn: () => accountingService.getAccounts({ includeInactive: true }),
    });
    const createMutation = useMutation({
        mutationFn: accountingService.createAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
            navigate('/accounting/chart-of-accounts');
        },
    });
    const updateMutation = useMutation({
        mutationFn: (data) => accountingService.updateAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
            navigate('/accounting/chart-of-accounts');
        },
    });
    const allAccounts = accountsData?.data ?? [];
    const parentOptions = allAccounts.filter((a) => (!account || a.id !== account.id) && a.type === (account?.type ?? ''));
    const initialValues = {
        code: account?.code ?? '',
        name: account?.name ?? '',
        type: (account?.type ?? 'ASSET'),
        subType: (account?.subType ?? 'CURRENT_ASSET'),
        parentId: account?.parentId ?? '',
        normalBalance: (account?.normalBalance ?? 'DEBIT'),
        openingBalance: account?.openingBalance ?? 0,
        isActive: account?.isActive ?? true,
        isSystem: account?.isSystem ?? false,
    };
    if (isEdit && loadingAccount) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { p: 3, maxWidth: 900, mx: "auto", children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 3, gap: 2, children: [_jsx(Button, { startIcon: _jsx(ArrowBack, {}), onClick: () => navigate('/accounting/chart-of-accounts'), variant: "outlined", size: "small", children: "Back" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: isEdit ? 'Edit Account' : 'Create Account' })] }), _jsx(Card, { children: _jsxs(CardContent, { children: [(createMutation.isError || updateMutation.isError) && (_jsxs(Alert, { severity: "error", sx: { mb: 3 }, children: ["Failed to ", isEdit ? 'update' : 'create', " account"] })), _jsx(Formik, { initialValues: initialValues, validationSchema: accountSchema, enableReinitialize: true, onSubmit: (values) => {
                                const payload = {
                                    ...values,
                                    parentId: values.parentId || undefined,
                                };
                                if (isEdit) {
                                    updateMutation.mutate(payload);
                                }
                                else {
                                    createMutation.mutate(payload);
                                }
                            }, children: ({ values, setFieldValue, isSubmitting }) => {
                                const availableSubTypes = subTypeMap[values.type] ?? [];
                                const autoNormal = normalBalanceMap[values.type];
                                return (_jsxs(Form, { children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "code", label: "Account Code", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "name", label: "Account Name", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Account Type" }), _jsx(Select, { value: values.type, label: "Account Type", onChange: (e) => {
                                                                    const newType = e.target.value;
                                                                    setFieldValue('type', newType);
                                                                    setFieldValue('subType', subTypeMap[newType][0].value);
                                                                    setFieldValue('normalBalance', normalBalanceMap[newType]);
                                                                    setFieldValue('parentId', '');
                                                                }, children: accountTypeOptions.map((t) => (_jsx(MenuItem, { value: t, children: t }, t))) })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Sub-type" }), _jsx(Select, { value: values.subType, label: "Sub-type", onChange: (e) => setFieldValue('subType', e.target.value), children: availableSubTypes.map((st) => (_jsx(MenuItem, { value: st.value, children: st.label }, st.value))) })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Autocomplete, { options: parentOptions, getOptionLabel: (option) => `${option.code} - ${option.name}`, value: parentOptions.find((p) => p.id === values.parentId) ?? null, onChange: (_, val) => setFieldValue('parentId', val?.id ?? ''), renderInput: (params) => (_jsx(MuiTextField, { ...params, label: "Parent Account", size: "small", fullWidth: true })), isOptionEqualToValue: (a, b) => a.id === b.id }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsxs(FormControl, { fullWidth: true, children: [_jsx(InputLabel, { children: "Normal Balance" }), _jsxs(Select, { value: values.normalBalance, label: "Normal Balance", onChange: (e) => setFieldValue('normalBalance', e.target.value), children: [_jsx(MenuItem, { value: "DEBIT", children: "DEBIT" }), _jsx(MenuItem, { value: "CREDIT", children: "CREDIT" })] })] }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "openingBalance", label: "Opening Balance", type: "number", fullWidth: true }) }), _jsxs(Grid, { size: { xs: 12, sm: 6 }, display: "flex", alignItems: "center", gap: 2, children: [_jsx(FormControlLabel, { control: _jsx(Switch, { checked: values.isActive, onChange: (e) => setFieldValue('isActive', e.target.checked) }), label: "Active" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: values.isSystem, onChange: (e) => setFieldValue('isSystem', e.target.checked) }), label: "System Account" })] }), values.isSystem && (_jsx(Grid, { size: { xs: 12 }, children: _jsx(Alert, { severity: "warning", children: "System accounts cannot be deleted and are used for automated journal entries." }) }))] }), _jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 2, mt: 3, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/accounting/chart-of-accounts'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(Save, {}), disabled: isSubmitting || createMutation.isPending || updateMutation.isPending, children: createMutation.isPending || updateMutation.isPending ? (_jsx(CircularProgress, { size: 20 })) : ('Save') })] })] }));
                            } })] }) })] }));
};
export default ChartOfAccountsForm;
