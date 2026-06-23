import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Box, Typography, Button, Card, CardContent, Grid, IconButton, Alert, Autocomplete, TextField as MuiTextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, Checkbox, FormControlLabel, } from '@mui/material';
import { Add, Delete, Balance, Save, ArrowBack, CheckCircle } from '@mui/icons-material';
import { Formik, Form, Field, FieldArray, useFormikContext } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../../services/accountingService';
import { settingsService } from '../../services/settingsService';
import { formatCurrency } from '../../utils/formatters';
const entrySchema = Yup.object().shape({
    date: Yup.date().required('Date is required'),
    reference: Yup.string().required('Reference is required'),
    description: Yup.string().required('Description is required'),
    branchId: Yup.string().required('Branch is required'),
    lines: Yup.array()
        .min(2, 'At least 2 lines are required')
        .of(Yup.object().shape({
        accountId: Yup.string().required('Account is required'),
        debit: Yup.string(),
        credit: Yup.string(),
        description: Yup.string(),
    }))
        .test('balanced', 'Total debits must equal total credits', (lines) => {
        if (!lines)
            return false;
        const totalDebits = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
        const totalCredits = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
        return totalDebits === totalCredits && totalDebits > 0;
    })
        .test('no-both-sides', 'A line cannot have both debit and credit', (lines) => {
        if (!lines)
            return true;
        return lines.every((l) => !(Number(l.debit) > 0 && Number(l.credit) > 0));
    }),
});
const LineTotals = () => {
    const { values } = useFormikContext();
    const totalDebits = values.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredits = values.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
    const isBalanced = totalDebits === totalCredits && totalDebits > 0;
    return (_jsxs(Box, { display: "flex", alignItems: "center", gap: 3, mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1, children: [_jsxs(Typography, { children: [_jsx("strong", { children: "Total Debits:" }), ' ', _jsx("span", { style: { color: '#4caf50', fontWeight: 'bold' }, children: formatCurrency(totalDebits) })] }), _jsxs(Typography, { children: [_jsx("strong", { children: "Total Credits:" }), ' ', _jsx("span", { style: { color: '#f44336', fontWeight: 'bold' }, children: formatCurrency(totalCredits) })] }), _jsx(Box, { flex: 1 }), isBalanced ? (_jsxs(Box, { display: "flex", alignItems: "center", gap: 0.5, color: "success.main", children: [_jsx(CheckCircle, { fontSize: "small" }), _jsx(Typography, { fontWeight: "bold", children: "Balanced" })] })) : (_jsx(Typography, { color: "error.main", fontWeight: "bold", children: totalDebits !== totalCredits ? 'Unbalanced' : 'Zero Entry' }))] }));
};
const emptyLine = {
    accountId: '',
    accountCode: '',
    accountName: '',
    debit: '',
    credit: '',
    description: '',
    costCenterId: '',
};
const JournalEntryForm = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id } = useParams();
    const isEdit = Boolean(id && id !== 'new');
    const { data: accountsData } = useQuery({
        queryKey: ['chart-of-accounts'],
        queryFn: () => accountingService.getAccounts(),
    });
    const { data: nextRef } = useQuery({
        queryKey: ['next-journal-reference'],
        queryFn: () => accountingService.getNextReference(),
        enabled: !isEdit,
    });
    const { data: branchesData } = useQuery({
        queryKey: ['branches'],
        queryFn: () => settingsService.getBranches(),
    });
    const { data: costCentersData } = useQuery({
        queryKey: ['cost-centers'],
        queryFn: () => settingsService.getCostCenters(),
    });
    const accounts = accountsData?.data ?? [];
    const branches = branchesData?.data ?? [];
    const costCenters = costCentersData?.data ?? [];
    const createMutation = useMutation({
        mutationFn: (data) => accountingService.createJournalEntry(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
            navigate('/accounting/journal-entries');
        },
    });
    const initialValues = {
        date: new Date(),
        reference: nextRef?.reference ?? '',
        description: '',
        branchId: '',
        postImmediately: false,
        lines: [{ ...emptyLine }, { ...emptyLine }],
    };
    return (_jsx(LocalizationProvider, { dateAdapter: AdapterDateFns, children: _jsxs(Box, { p: 3, maxWidth: 1100, mx: "auto", children: [_jsx(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, children: _jsxs(Box, { display: "flex", alignItems: "center", gap: 2, children: [_jsx(Button, { startIcon: _jsx(ArrowBack, {}), onClick: () => navigate('/accounting/journal-entries'), variant: "outlined", size: "small", children: "Back" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: "Create Journal Entry" })] }) }), createMutation.isError && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: "Failed to create journal entry. Please check all fields and ensure the entry is balanced." })), _jsx(Formik, { initialValues: initialValues, validationSchema: entrySchema, enableReinitialize: true, onSubmit: (values) => {
                        const lines = values.lines
                            .filter((l) => l.accountId && (Number(l.debit) > 0 || Number(l.credit) > 0))
                            .map((l) => ({
                            accountId: l.accountId,
                            debit: Number(l.debit) || 0,
                            credit: Number(l.credit) || 0,
                            description: l.description || undefined,
                            costCenterId: l.costCenterId || undefined,
                        }));
                        createMutation.mutate({
                            date: values.date.toISOString().split('T')[0],
                            reference: values.reference,
                            description: values.description,
                            branchId: values.branchId,
                            postImmediately: values.postImmediately,
                            lines,
                        });
                    }, children: ({ values, setFieldValue, isSubmitting, errors }) => (_jsxs(Form, { children: [_jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Entry Header" }), _jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(DatePicker, { label: "Date", value: values.date, onChange: (val) => setFieldValue('date', val), slotProps: { textField: { fullWidth: true, size: 'small' } } }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(Field, { component: TextField, name: "reference", label: "Reference", fullWidth: true, size: "small" }) }), _jsx(Grid, { size: { xs: 12, sm: 4 }, children: _jsx(FormControl, { fullWidth: true, size: "small", children: _jsxs(MuiTextField, { select: true, label: "Branch", value: values.branchId, onChange: (e) => setFieldValue('branchId', e.target.value), SelectProps: { native: true }, error: Boolean(errors.branchId), helperText: errors.branchId, children: [_jsx("option", { value: "", children: "Select branch" }), branches.map((b) => (_jsx("option", { value: b.id, children: b.name }, b.id)))] }) }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(Field, { component: TextField, name: "description", label: "Description", fullWidth: true, size: "small" }) })] })] }) }), _jsx(Card, { sx: { mb: 2 }, children: _jsxs(CardContent, { children: [_jsxs(Box, { display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, children: [_jsx(Typography, { variant: "h6", children: "Entry Lines" }), _jsx(Button, { size: "small", startIcon: _jsx(Balance, {}), onClick: () => {
                                                        const totalDebits = values.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
                                                        const totalCredits = values.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
                                                        const diff = totalDebits - totalCredits;
                                                        if (diff !== 0) {
                                                            const lastLine = values.lines[values.lines.length - 1];
                                                            if (!lastLine.accountId) {
                                                                setFieldValue(`lines.${values.lines.length - 1}.debit`, diff < 0 ? String(Math.abs(diff)) : '0');
                                                                setFieldValue(`lines.${values.lines.length - 1}.credit`, diff > 0 ? String(Math.abs(diff)) : '0');
                                                            }
                                                            else {
                                                                setFieldValue('lines', [
                                                                    ...values.lines,
                                                                    {
                                                                        ...emptyLine,
                                                                        debit: diff < 0 ? String(Math.abs(diff)) : '0',
                                                                        credit: diff > 0 ? String(Math.abs(diff)) : '0',
                                                                    },
                                                                ]);
                                                            }
                                                        }
                                                    }, variant: "outlined", children: "Auto Balance" })] }), _jsx(FieldArray, { name: "lines", children: ({ push, remove }) => (_jsxs(_Fragment, { children: [_jsx(TableContainer, { component: Paper, variant: "outlined", children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { sx: { backgroundColor: '#f5f5f5' }, children: [_jsx(TableCell, { width: "5%", children: "#" }), _jsx(TableCell, { width: "30%", children: "Account" }), _jsx(TableCell, { width: "12%", children: "Debit" }), _jsx(TableCell, { width: "12%", children: "Credit" }), _jsx(TableCell, { width: "20%", children: "Description" }), _jsx(TableCell, { width: "15%", children: "Cost Center" }), _jsx(TableCell, { width: "6%", children: "Actions" })] }) }), _jsx(TableBody, { children: values.lines.map((line, index) => (_jsxs(TableRow, { children: [_jsx(TableCell, { children: index + 1 }), _jsx(TableCell, { children: _jsx(Autocomplete, { options: accounts, getOptionLabel: (option) => `${option.code} - ${option.name}`, value: accounts.find((a) => a.id === line.accountId) ?? null, onChange: (_, val) => {
                                                                                        setFieldValue(`lines.${index}.accountId`, val?.id ?? '');
                                                                                        setFieldValue(`lines.${index}.accountCode`, val?.code ?? '');
                                                                                        setFieldValue(`lines.${index}.accountName`, val?.name ?? '');
                                                                                    }, renderInput: (params) => (_jsx(MuiTextField, { ...params, placeholder: "Select account", size: "small", error: Boolean(errors.lines?.[index]
                                                                                            ?.accountId) })), size: "small" }) }), _jsx(TableCell, { children: _jsx(MuiTextField, { type: "number", size: "small", value: line.debit, onChange: (e) => {
                                                                                        setFieldValue(`lines.${index}.debit`, e.target.value);
                                                                                        if (Number(e.target.value) > 0) {
                                                                                            setFieldValue(`lines.${index}.credit`, '');
                                                                                        }
                                                                                    }, inputProps: { min: 0, step: 0.01 }, fullWidth: true }) }), _jsx(TableCell, { children: _jsx(MuiTextField, { type: "number", size: "small", value: line.credit, onChange: (e) => {
                                                                                        setFieldValue(`lines.${index}.credit`, e.target.value);
                                                                                        if (Number(e.target.value) > 0) {
                                                                                            setFieldValue(`lines.${index}.debit`, '');
                                                                                        }
                                                                                    }, inputProps: { min: 0, step: 0.01 }, fullWidth: true }) }), _jsx(TableCell, { children: _jsx(MuiTextField, { size: "small", value: line.description, onChange: (e) => setFieldValue(`lines.${index}.description`, e.target.value), placeholder: "Line description", fullWidth: true }) }), _jsx(TableCell, { children: _jsxs(MuiTextField, { select: true, size: "small", value: line.costCenterId, onChange: (e) => setFieldValue(`lines.${index}.costCenterId`, e.target.value), SelectProps: { native: true }, fullWidth: true, children: [_jsx("option", { value: "", children: "None" }), costCenters.map((cc) => (_jsx("option", { value: cc.id, children: cc.name }, cc.id)))] }) }), _jsx(TableCell, { children: values.lines.length > 2 && (_jsx(IconButton, { size: "small", color: "error", onClick: () => remove(index), children: _jsx(Delete, { fontSize: "small" }) })) })] }, index))) })] }) }), _jsx(Button, { startIcon: _jsx(Add, {}), onClick: () => push({ ...emptyLine }), sx: { mt: 1 }, size: "small", children: "Add Line" })] })) }), _jsx(Divider, { sx: { my: 2 } }), _jsx(LineTotals, {}), typeof errors.lines === 'string' && (_jsx(Alert, { severity: "error", sx: { mt: 2 }, children: errors.lines }))] }) }), _jsx(Card, { sx: { mb: 2 }, children: _jsx(CardContent, { children: _jsx(FormControlLabel, { control: _jsx(Checkbox, { checked: values.postImmediately, onChange: (e) => setFieldValue('postImmediately', e.target.checked) }), label: "Post immediately (skip draft status)" }) }) }), _jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 2, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/accounting/journal-entries'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(Save, {}), disabled: createMutation.isPending || isSubmitting, children: createMutation.isPending ? 'Saving...' : 'Save Journal Entry' })] })] })) })] }) }));
};
export default JournalEntryForm;
