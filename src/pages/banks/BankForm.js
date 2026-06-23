import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Typography, Button, Card, CardContent, Grid, Switch, FormControlLabel, CircularProgress, Alert, } from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import { TextField } from 'formik-mui';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bankService } from '../../services/bankService';
const bankSchema = Yup.object().shape({
    code: Yup.string().required('Code is required').max(20, 'Max 20 characters'),
    name: Yup.string().required('Name is required').max(100, 'Max 100 characters'),
    accountNumber: Yup.string().required('Account number is required'),
    iban: Yup.string().max(34, 'Max 34 characters'),
    swiftCode: Yup.string().max(11, 'Max 11 characters'),
    branchName: Yup.string().required('Branch name is required'),
    openingBalance: Yup.number().min(0, 'Cannot be negative').required('Opening balance is required'),
    currency: Yup.string().default('EGP'),
    status: Yup.string().oneOf(['ACTIVE', 'INACTIVE', 'CLOSED']).default('ACTIVE'),
});
const BankForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const isEdit = Boolean(id && id !== 'new');
    const { data: account, isLoading: loadingAccount } = useQuery({
        queryKey: ['bank-account', id],
        queryFn: () => bankService.getAccountById(id),
        enabled: isEdit,
    });
    const createMutation = useMutation({
        mutationFn: bankService.createAccount,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
            navigate('/banks');
        },
    });
    const updateMutation = useMutation({
        mutationFn: (data) => bankService.updateAccount(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
            navigate('/banks');
        },
    });
    const initialValues = {
        code: '',
        name: '',
        accountNumber: '',
        iban: '',
        swiftCode: '',
        branchName: '',
        openingBalance: 0,
        currency: 'EGP',
        status: 'ACTIVE',
    };
    if (isEdit && loadingAccount) {
        return (_jsx(Box, { display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { p: 3, maxWidth: 800, mx: "auto", children: [_jsxs(Box, { display: "flex", alignItems: "center", mb: 3, gap: 2, children: [_jsx(Button, { startIcon: _jsx(ArrowBack, {}), onClick: () => navigate('/banks'), variant: "outlined", size: "small", children: "Back" }), _jsx(Typography, { variant: "h4", fontWeight: "bold", children: isEdit ? 'Edit Bank Account' : 'Create Bank Account' })] }), _jsx(Card, { children: _jsxs(CardContent, { children: [(createMutation.isError || updateMutation.isError) && (_jsxs(Alert, { severity: "error", sx: { mb: 3 }, children: ["Failed to ", isEdit ? 'update' : 'create', " bank account"] })), _jsx(Formik, { initialValues: account ?? initialValues, validationSchema: bankSchema, enableReinitialize: true, onSubmit: (values) => {
                                if (isEdit) {
                                    updateMutation.mutate(values);
                                }
                                else {
                                    createMutation.mutate(values);
                                }
                            }, children: ({ values, setFieldValue, isSubmitting }) => (_jsxs(Form, { children: [_jsxs(Grid, { container: true, spacing: 2, children: [_jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "code", label: "Code", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "name", label: "Bank Name", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "accountNumber", label: "Account Number", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "branchName", label: "Branch Name", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "iban", label: "IBAN", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "swiftCode", label: "SWIFT Code", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "openingBalance", label: "Opening Balance", type: "number", fullWidth: true, required: true }) }), _jsx(Grid, { size: { xs: 12, sm: 6 }, children: _jsx(Field, { component: TextField, name: "currency", label: "Currency", fullWidth: true }) }), _jsx(Grid, { size: { xs: 12 }, children: _jsx(FormControlLabel, { control: _jsx(Switch, { checked: values.status === 'ACTIVE', onChange: (e) => setFieldValue('status', e.target.checked ? 'ACTIVE' : 'INACTIVE') }), label: "Active" }) })] }), _jsxs(Box, { display: "flex", justifyContent: "flex-end", gap: 2, mt: 3, children: [_jsx(Button, { variant: "outlined", onClick: () => navigate('/banks'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "contained", startIcon: _jsx(Save, {}), disabled: isSubmitting || createMutation.isPending || updateMutation.isPending, children: createMutation.isPending || updateMutation.isPending ? (_jsx(CircularProgress, { size: 20 })) : ('Save') })] })] })) })] }) })] }));
};
export default BankForm;
