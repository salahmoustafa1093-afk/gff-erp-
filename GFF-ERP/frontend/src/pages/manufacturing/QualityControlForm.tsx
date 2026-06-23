import React, { useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Grid,
  Chip,
  Typography,
} from "@mui/material";
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Science as ScienceIcon,
} from "@mui/icons-material";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "../../services/api";

interface QualityControlFormProps {
  orderId: string;
  open: boolean;
  onClose: () => void;
}

interface QCFormValues {
  testType: string;
  testValue: number;
  acceptableMin: number;
  acceptableMax: number;
  notes: string;
  testedBy: string;
  testedDate: string;
}

const TEST_TYPE_OPTIONS = [
  { value: "PROTEIN", label: "Protein" },
  { value: "MOISTURE", label: "Moisture" },
  { value: "ASH", label: "Ash" },
  { value: "FIBER", label: "Fiber" },
  { value: "FAT", label: "Fat" },
  { value: "AFLATOXIN", label: "Aflatoxin" },
  { value: "OTHER", label: "Other" },
];

const TEST_TYPE_RANGES: Record<string, { min: number; max: number }> = {
  PROTEIN: { min: 18, max: 24 },
  MOISTURE: { min: 0, max: 12 },
  ASH: { min: 0, max: 8 },
  FIBER: { min: 0, max: 6 },
  FAT: { min: 1, max: 8 },
  AFLATOXIN: { min: 0, max: 0.02 },
  OTHER: { min: 0, max: 100 },
};

const addQualityTest = async ({ orderId, data }: { orderId: string; data: QCFormValues }) => {
  const response = await apiService.post(`/manufacturing/orders/${orderId}/quality-tests`, data);
  return response.data;
};

const QualityControlForm: React.FC<QualityControlFormProps> = ({ orderId, open, onClose }) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: addQualityTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["manufacturing-order", orderId] });
      onClose();
    },
  });

  const validationSchema = Yup.object({
    testType: Yup.string().required("Test type is required"),
    testValue: Yup.number().required("Test value is required"),
    acceptableMin: Yup.number().required("Minimum value is required"),
    acceptableMax: Yup.number()
      .required("Maximum value is required")
      .min(Yup.ref("acceptableMin"), "Max must be >= min"),
    testedBy: Yup.string().required("Tester name is required").max(100, "Max 100 characters"),
    testedDate: Yup.string().required("Test date is required"),
    notes: Yup.string().max(500, "Max 500 characters"),
  });

  const formik = useFormik<QCFormValues>({
    initialValues: {
      testType: "PROTEIN",
      testValue: 0,
      acceptableMin: 18,
      acceptableMax: 24,
      notes: "",
      testedBy: "",
      testedDate: new Date().toISOString().split("T")[0],
    },
    validationSchema,
    onSubmit: (values) => {
      mutation.mutate({ orderId, data: values });
    },
  });

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;

  // Auto-populate acceptable ranges when test type changes
  useEffect(() => {
    const range = TEST_TYPE_RANGES[values.testType];
    if (range) {
      setFieldValue("acceptableMin", range.min);
      setFieldValue("acceptableMax", range.max);
    }
  }, [values.testType, setFieldValue]);

  const result = values.testValue >= values.acceptableMin && values.testValue <= values.acceptableMax ? "PASS" : "FAIL";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ScienceIcon color="primary" />
          Add Quality Control Test
        </Box>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={touched.testType && Boolean(errors.testType)}>
                <InputLabel>Test Type *</InputLabel>
                <Select
                  name="testType"
                  value={values.testType}
                  label="Test Type *"
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {TEST_TYPE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Test Value *"
                name="testValue"
                type="number"
                inputProps={{ step: 0.01 }}
                value={values.testValue}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.testValue && Boolean(errors.testValue)}
                helperText={touched.testValue && errors.testValue}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Acceptable Min *"
                name="acceptableMin"
                type="number"
                inputProps={{ step: 0.01 }}
                value={values.acceptableMin}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.acceptableMin && Boolean(errors.acceptableMin)}
                helperText={touched.acceptableMin && errors.acceptableMin}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Acceptable Max *"
                name="acceptableMax"
                type="number"
                inputProps={{ step: 0.01 }}
                value={values.acceptableMax}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.acceptableMax && Boolean(errors.acceptableMax)}
                helperText={touched.acceptableMax && errors.acceptableMax}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Typography variant="body2">Result:</Typography>
                <Chip
                  label={result}
                  color={result === "PASS" ? "success" : "error"}
                  size="small"
                  sx={{ fontWeight: "bold" }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tested By *"
                name="testedBy"
                value={values.testedBy}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.testedBy && Boolean(errors.testedBy)}
                helperText={touched.testedBy && errors.testedBy}
                placeholder="Enter name..."
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Test Date *"
                name="testedDate"
                type="date"
                value={values.testedDate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.testedDate && Boolean(errors.testedDate)}
                helperText={touched.testedDate && errors.testedDate}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                name="notes"
                value={values.notes}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.notes && Boolean(errors.notes)}
                helperText={touched.notes && errors.notes}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} startIcon={<CloseIcon />}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving..." : "Save Test"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QualityControlForm;
