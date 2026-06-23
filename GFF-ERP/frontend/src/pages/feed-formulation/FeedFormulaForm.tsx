import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  Alert,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { useFormik, FormikProvider, FieldArray, FieldArrayRenderProps } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import apiService from "../../services/api";

interface RawMaterial {
  id: string;
  code: string;
  name: string;
  proteinPercent: number;
  energyKcal: number;
  fiberPercent: number;
  calciumPercent: number;
  phosphorusPercent: number;
  costPerKg: number;
}

interface FormulaIngredient {
  id?: string;
  productId: string;
  productName: string;
  percentage: number;
  minPercentage?: number | null;
  maxPercentage?: number | null;
  actualProtein: number;
  actualEnergy: number;
  actualFiber: number;
  actualCalcium: number;
  actualPhosphorus: number;
  costPerKg: number;
}

interface FeedFormulaPayload {
  code: string;
  name: string;
  description: string;
  feedType: string;
  targetProtein: number;
  targetEnergy: number;
  targetFiber: number;
  targetCalcium: number;
  targetPhosphorus: number;
  ingredients: FormulaIngredient[];
  isActive: boolean;
}

interface FeedFormula extends FeedFormulaPayload {
  id: string;
  totalCost: number;
  actualProtein: number;
  actualEnergy: number;
  actualFiber: number;
  actualCalcium: number;
  actualPhosphorus: number;
  totalPercentage: number;
  createdAt: string;
  updatedAt: string;
}

const FEED_TYPE_OPTIONS = [
  { value: "BROILER_STARTER", label: "Broiler Starter" },
  { value: "BROILER_GROWER", label: "Broiler Grower" },
  { value: "BROILER_FINISHER", label: "Broiler Finisher" },
  { value: "LAYER", label: "Layer" },
  { value: "BREEDER", label: "Breeder" },
  { value: "PREMIX", label: "Premix" },
  { value: "OTHER", label: "Other" },
];

const fetchRawMaterials = async (): Promise<RawMaterial[]> => {
  const response = await apiService.get<RawMaterial[]>("/inventory/products/raw-materials");
  return response.data;
};

const fetchFormula = async (id: string): Promise<FeedFormula> => {
  const response = await apiService.get<FeedFormula>(`/feed-formulation/formulas/${id}`);
  return response.data;
};

const createFormula = async (data: FeedFormulaPayload): Promise<FeedFormula> => {
  const response = await apiService.post<FeedFormula>("/feed-formulation/formulas", data);
  return response.data;
};

const updateFormula = async ({ id, data }: { id: string; data: FeedFormulaPayload }): Promise<FeedFormula> => {
  const response = await apiService.put<FeedFormula>(`/feed-formulation/formulas/${id}`, data);
  return response.data;
};

const getNutrientStatus = (actual: number, target: number): "success" | "warning" | "error" => {
  if (target <= 0) return "success";
  const ratio = actual / target;
  if (ratio >= 0.97 && ratio <= 1.03) return "success";
  if (ratio >= 0.9 && ratio <= 1.1) return "warning";
  return "error";
};

const getStatusColor = (status: "success" | "warning" | "error", theme: any) => {
  switch (status) {
    case "success":
      return theme.palette.success.main;
    case "warning":
      return theme.palette.warning.main;
    case "error":
      return theme.palette.error.main;
  }
};

const getStatusIcon = (status: "success" | "warning" | "error") => {
  switch (status) {
    case "success":
      return <CheckCircleIcon color="success" fontSize="small" />;
    case "warning":
      return <WarningIcon color="warning" fontSize="small" />;
    case "error":
      return <ErrorIcon color="error" fontSize="small" />;
  }
};

const FeedFormulaForm: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id && id !== "new");

  const [percentageError, setPercentageError] = useState<string>("");

  const { data: rawMaterials, isLoading: materialsLoading } = useQuery<RawMaterial[]>({
    queryKey: ["raw-materials"],
    queryFn: fetchRawMaterials,
    staleTime: 300000,
  });

  const { data: existingFormula, isLoading: formulaLoading } = useQuery<FeedFormula>({
    queryKey: ["feed-formula", id],
    queryFn: () => fetchFormula(id!),
    enabled: isEditing,
  });

  const materialMap = useMemo(() => {
    const map: Record<string, RawMaterial> = {};
    if (rawMaterials) {
      rawMaterials.forEach((m) => {
        map[m.id] = m;
      });
    }
    return map;
  }, [rawMaterials]);

  const createMutation = useMutation({
    mutationFn: createFormula,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
      navigate("/feed-formulation/formulas");
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateFormula,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed-formulas"] });
      navigate("/feed-formulation/formulas");
    },
  });

  const validationSchema = Yup.object({
    code: Yup.string().required("Code is required").max(20, "Max 20 characters"),
    name: Yup.string().required("Name is required").max(100, "Max 100 characters"),
    description: Yup.string().max(500, "Max 500 characters"),
    feedType: Yup.string().required("Feed type is required"),
    targetProtein: Yup.number().required().min(0).max(100),
    targetEnergy: Yup.number().required().min(0).max(5000),
    targetFiber: Yup.number().required().min(0).max(100),
    targetCalcium: Yup.number().required().min(0).max(100),
    targetPhosphorus: Yup.number().required().min(0).max(100),
    ingredients: Yup.array()
      .of(
        Yup.object({
          productId: Yup.string().required("Select a product"),
          percentage: Yup.number().required("Percentage required").min(0).max(100),
          minPercentage: Yup.number().min(0).max(100).nullable(),
          maxPercentage: Yup.number().min(0).max(100).nullable(),
        })
      )
      .min(2, "At least 2 ingredients required"),
  });

  const formik = useFormik<FeedFormulaPayload>({
    initialValues: {
      code: "",
      name: "",
      description: "",
      feedType: "BROILER_STARTER",
      targetProtein: 20,
      targetEnergy: 3200,
      targetFiber: 4,
      targetCalcium: 1,
      targetPhosphorus: 0.5,
      ingredients: [
        {
          productId: "",
          productName: "",
          percentage: 0,
          minPercentage: null,
          maxPercentage: null,
          actualProtein: 0,
          actualEnergy: 0,
          actualFiber: 0,
          actualCalcium: 0,
          actualPhosphorus: 0,
          costPerKg: 0,
        },
        {
          productId: "",
          productName: "",
          percentage: 0,
          minPercentage: null,
          maxPercentage: null,
          actualProtein: 0,
          actualEnergy: 0,
          actualFiber: 0,
          actualCalcium: 0,
          actualPhosphorus: 0,
          costPerKg: 0,
        },
      ],
      isActive: true,
    },
    validationSchema,
    validate: (values) => {
      const totalPercent = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        setPercentageError(`Total percentage must equal 100% (currently ${totalPercent.toFixed(2)}%)`);
        return { ingredients: "Total percentage must equal 100%" };
      }
      setPercentageError("");
      return {};
    },
    onSubmit: (values) => {
      const totalPercent = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);
      if (Math.abs(totalPercent - 100) > 0.01) {
        setPercentageError(`Total percentage must equal 100% (currently ${totalPercent.toFixed(2)}%)`);
        return;
      }

      if (isEditing && id) {
        updateMutation.mutate({ id, data: values });
      } else {
        createMutation.mutate(values);
      }
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (existingFormula) {
      formik.setValues({
        code: existingFormula.code,
        name: existingFormula.name,
        description: existingFormula.description || "",
        feedType: existingFormula.feedType,
        targetProtein: existingFormula.targetProtein,
        targetEnergy: existingFormula.targetEnergy,
        targetFiber: existingFormula.targetFiber,
        targetCalcium: existingFormula.targetCalcium,
        targetPhosphorus: existingFormula.targetPhosphorus,
        ingredients: existingFormula.ingredients.map((ing) => ({
          ...ing,
          minPercentage: ing.minPercentage ?? null,
          maxPercentage: ing.maxPercentage ?? null,
        })),
        isActive: existingFormula.isActive,
      });
    }
  }, [existingFormula]);

  const { values, handleChange, handleBlur, setFieldValue, touched, errors, handleSubmit } = formik;

  // Nutritional calculations
  const analysis = useMemo(() => {
    const totalPercent = values.ingredients.reduce((sum, ing) => sum + (Number(ing.percentage) || 0), 0);
    const totalCost = values.ingredients.reduce(
      (sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.costPerKg) || 0),
      0
    );
    const actualProtein = values.ingredients.reduce(
      (sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualProtein) || 0),
      0
    );
    const actualEnergy = values.ingredients.reduce(
      (sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualEnergy) || 0),
      0
    );
    const actualFiber = values.ingredients.reduce(
      (sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualFiber) || 0),
      0
    );
    const actualCalcium = values.ingredients.reduce(
      (sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualCalcium) || 0),
      0
    );
    const actualPhosphorus = values.ingredients.reduce(
      (sum, ing) => sum + (Number(ing.percentage) / 100) * (Number(ing.actualPhosphorus) || 0),
      0
    );

    return {
      totalPercent,
      totalCost,
      actualProtein,
      actualEnergy,
      actualFiber,
      actualCalcium,
      actualPhosphorus,
      proteinStatus: getNutrientStatus(actualProtein, values.targetProtein),
      energyStatus: getNutrientStatus(actualEnergy, values.targetEnergy),
      fiberStatus: getNutrientStatus(actualFiber, values.targetFiber),
      calciumStatus: getNutrientStatus(actualCalcium, values.targetCalcium),
      phosphorusStatus: getNutrientStatus(actualPhosphorus, values.targetPhosphorus),
    };
  }, [values]);

  const handleIngredientSelect = useCallback(
    (index: number, materialId: string) => {
      const material = materialMap[materialId];
      if (material) {
        setFieldValue(`ingredients.${index}.productId`, material.id);
        setFieldValue(`ingredients.${index}.productName`, material.name);
        setFieldValue(`ingredients.${index}.actualProtein`, material.proteinPercent || 0);
        setFieldValue(`ingredients.${index}.actualEnergy`, material.energyKcal || 0);
        setFieldValue(`ingredients.${index}.actualFiber`, material.fiberPercent || 0);
        setFieldValue(`ingredients.${index}.actualCalcium`, material.calciumPercent || 0);
        setFieldValue(`ingredients.${index}.actualPhosphorus`, material.phosphorusPercent || 0);
        setFieldValue(`ingredients.${index}.costPerKg`, material.costPerKg || 0);
      }
    },
    [materialMap, setFieldValue]
  );

  const addIngredient = useCallback(
    (arrayHelpers: FieldArrayRenderProps) => {
      arrayHelpers.push({
        productId: "",
        productName: "",
        percentage: 0,
        minPercentage: null,
        maxPercentage: null,
        actualProtein: 0,
        actualEnergy: 0,
        actualFiber: 0,
        actualCalcium: 0,
        actualPhosphorus: 0,
        costPerKg: 0,
      });
    },
    []
  );

  const isLoading = formulaLoading || materialsLoading;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading formula data...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <FormikProvider value={formik}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <IconButton onClick={() => navigate("/feed-formulation/formulas")}>
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h4" fontWeight="bold" color="primary">
                {isEditing ? "Edit Feed Formula" : "New Feed Formula"}
              </Typography>
            </Box>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={isSubmitting || Boolean(percentageError)}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update Formula" : "Save Formula"}
            </Button>
          </Box>

          {mutationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Failed to save formula. Please try again.
            </Alert>
          )}

          {percentageError && (
            <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 2 }}>
              {percentageError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Left Column: Form */}
            <Grid item xs={12} lg={8}>
              {/* Basic Info */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Basic Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Formula Code"
                        name="code"
                        value={values.code}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.code && Boolean(errors.code)}
                        helperText={touched.code && errors.code}
                        placeholder="e.g., BR-STR-001"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Formula Name"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.name && Boolean(errors.name)}
                        helperText={touched.name && errors.name}
                        placeholder="e.g., Broiler Starter Formula A"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Feed Type"
                        name="feedType"
                        value={values.feedType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.feedType && Boolean(errors.feedType)}
                        helperText={touched.feedType && errors.feedType}
                      >
                        {FEED_TYPE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Status"
                        name="isActive"
                        value={values.isActive ? "true" : "false"}
                        onChange={(e) => setFieldValue("isActive", e.target.value === "true")}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Description"
                        name="description"
                        value={values.description}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.description && Boolean(errors.description)}
                        helperText={touched.description && errors.description}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Nutritional Targets */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Nutritional Targets
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={4}>
                      <TextField
                        fullWidth
                        label="Target Protein %"
                        name="targetProtein"
                        type="number"
                        inputProps={{ step: 0.1 }}
                        value={values.targetProtein}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.targetProtein && Boolean(errors.targetProtein)}
                        helperText={touched.targetProtein && errors.targetProtein}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <TextField
                        fullWidth
                        label="Target Energy (ME kcal/kg)"
                        name="targetEnergy"
                        type="number"
                        inputProps={{ step: 10 }}
                        value={values.targetEnergy}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.targetEnergy && Boolean(errors.targetEnergy)}
                        helperText={touched.targetEnergy && errors.targetEnergy}
                      />
                    </Grid>
                    <Grid item xs={6} sm={4}>
                      <TextField
                        fullWidth
                        label="Target Fiber %"
                        name="targetFiber"
                        type="number"
                        inputProps={{ step: 0.1 }}
                        value={values.targetFiber}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.targetFiber && Boolean(errors.targetFiber)}
                        helperText={touched.targetFiber && errors.targetFiber}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <TextField
                        fullWidth
                        label="Target Calcium %"
                        name="targetCalcium"
                        type="number"
                        inputProps={{ step: 0.01 }}
                        value={values.targetCalcium}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.targetCalcium && Boolean(errors.targetCalcium)}
                        helperText={touched.targetCalcium && errors.targetCalcium}
                      />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <TextField
                        fullWidth
                        label="Target Phosphorus %"
                        name="targetPhosphorus"
                        type="number"
                        inputProps={{ step: 0.01 }}
                        value={values.targetPhosphorus}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.targetPhosphorus && Boolean(errors.targetPhosphorus)}
                        helperText={touched.targetPhosphorus && errors.targetPhosphorus}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Ingredients Section */}
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      Ingredients ({values.ingredients.length})
                    </Typography>
                    <Chip
                      label={`Total: ${analysis.totalPercent.toFixed(2)}%`}
                      color={Math.abs(analysis.totalPercent - 100) < 0.01 ? "success" : "warning"}
                      size="small"
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>

                  <FieldArray name="ingredients">
                    {(arrayHelpers: FieldArrayRenderProps) => (
                      <>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                                <TableCell>Ingredient</TableCell>
                                <TableCell align="right">%</TableCell>
                                <TableCell align="right">Min %</TableCell>
                                <TableCell align="right">Max %</TableCell>
                                <TableCell align="right">Protein %</TableCell>
                                <TableCell align="right">Energy</TableCell>
                                <TableCell align="right">Cost/KG</TableCell>
                                <TableCell align="center">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {values.ingredients.map((ingredient, index) => (
                                <TableRow key={index} hover>
                                  <TableCell sx={{ minWidth: 180 }}>
                                    <Autocomplete
                                      size="small"
                                      options={rawMaterials || []}
                                      getOptionLabel={(opt: RawMaterial | string) =>
                                        typeof opt === "string" ? opt : `${opt.code} - ${opt.name}`
                                      }
                                      value={
                                        rawMaterials?.find((m) => m.id === ingredient.productId) || null
                                      }
                                      onChange={(_event, newValue) => {
                                        if (newValue && typeof newValue !== "string") {
                                          handleIngredientSelect(index, newValue.id);
                                        }
                                      }}
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          placeholder="Select ingredient"
                                          error={
                                            touched.ingredients &&
                                            errors.ingredients &&
                                            Array.isArray(errors.ingredients) &&
                                            Boolean(errors.ingredients[index]?.productId)
                                          }
                                          size="small"
                                        />
                                      )}
                                      isOptionEqualToValue={(option, value) => option.id === value.id}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ minWidth: 80 }}>
                                    <TextField
                                      size="small"
                                      type="number"
                                      inputProps={{ step: 0.1, min: 0, max: 100 }}
                                      name={`ingredients.${index}.percentage`}
                                      value={ingredient.percentage}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      sx={{ width: 80 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ minWidth: 70 }}>
                                    <TextField
                                      size="small"
                                      type="number"
                                      inputProps={{ step: 0.1, min: 0 }}
                                      name={`ingredients.${index}.minPercentage`}
                                      value={ingredient.minPercentage ?? ""}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      placeholder="Min"
                                      sx={{ width: 65 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ minWidth: 70 }}>
                                    <TextField
                                      size="small"
                                      type="number"
                                      inputProps={{ step: 0.1, min: 0 }}
                                      name={`ingredients.${index}.maxPercentage`}
                                      value={ingredient.maxPercentage ?? ""}
                                      onChange={handleChange}
                                      onBlur={handleBlur}
                                      placeholder="Max"
                                      sx={{ width: 65 }}
                                    />
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: "text.secondary" }}>
                                    {ingredient.actualProtein?.toFixed(1) || "—"}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: "text.secondary" }}>
                                    {ingredient.actualEnergy?.toFixed(0) || "—"}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: "text.secondary" }}>
                                    ${ingredient.costPerKg?.toFixed(3) || "—"}
                                  </TableCell>
                                  <TableCell align="center">
                                    <Tooltip title="Remove ingredient">
                                      <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => arrayHelpers.remove(index)}
                                        disabled={values.ingredients.length <= 2}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        <Button
                          startIcon={<AddIcon />}
                          onClick={() => addIngredient(arrayHelpers)}
                          sx={{ mt: 2 }}
                          size="small"
                        >
                          Add Ingredient
                        </Button>
                      </>
                    )}
                  </FieldArray>
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column: Analysis Panel */}
            <Grid item xs={12} lg={4}>
              <Card sx={{ position: "sticky", top: 16 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Nutritional Analysis
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {/* Total Percentage */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={500}>
                        Total Percentage
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                          color:
                            Math.abs(analysis.totalPercent - 100) < 0.01
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        {analysis.totalPercent.toFixed(2)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(analysis.totalPercent, 100)}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          backgroundColor:
                            Math.abs(analysis.totalPercent - 100) < 0.01
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        },
                      }}
                    />
                    {Math.abs(analysis.totalPercent - 100) >= 0.01 && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                        Must equal exactly 100%
                      </Typography>
                    )}
                  </Box>

                  {/* Total Cost */}
                  <Box sx={{ mb: 3, p: 1.5, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total Cost per KG
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary">
                      ${analysis.totalCost.toFixed(3)}
                    </Typography>
                  </Box>

                  {/* Nutrient Analysis */}
                  {[
                    { label: "Protein", actual: analysis.actualProtein, target: values.targetProtein, status: analysis.proteinStatus, unit: "%" },
                    { label: "Energy (ME)", actual: analysis.actualEnergy, target: values.targetEnergy, status: analysis.energyStatus, unit: "kcal" },
                    { label: "Fiber", actual: analysis.actualFiber, target: values.targetFiber, status: analysis.fiberStatus, unit: "%" },
                    { label: "Calcium", actual: analysis.actualCalcium, target: values.targetCalcium, status: analysis.calciumStatus, unit: "%" },
                    { label: "Phosphorus", actual: analysis.actualPhosphorus, target: values.targetPhosphorus, status: analysis.phosphorusStatus, unit: "%" },
                  ].map((nutrient) => {
                    const progress = nutrient.target > 0 ? (nutrient.actual / nutrient.target) * 100 : 0;
                    return (
                      <Box key={nutrient.label} sx={{ mb: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            {getStatusIcon(nutrient.status)}
                            <Typography variant="body2" fontWeight={500}>
                              {nutrient.label}
                            </Typography>
                          </Box>
                          <Typography variant="caption" fontWeight={600}>
                            {nutrient.actual.toFixed(nutrient.label === "Energy (ME)" ? 0 : nutrient.label === "Calcium" || nutrient.label === "Phosphorus" ? 2 : 1)}
                            {nutrient.unit} / {nutrient.target}
                            {nutrient.unit}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.palette.grey[200],
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: getStatusColor(nutrient.status, theme),
                            },
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                          {progress.toFixed(1)}% of target
                        </Typography>
                      </Box>
                    );
                  })}

                  <Divider sx={{ my: 2 }} />

                  {/* Ingredient Cost Breakdown */}
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Cost Contribution
                  </Typography>
                  {values.ingredients
                    .filter((ing) => ing.percentage > 0 && ing.productName)
                    .map((ing, idx) => {
                      const contribution = ((ing.percentage / 100) * ing.costPerKg).toFixed(3);
                      return (
                        <Box key={idx} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                          <Typography variant="caption" noWrap sx={{ maxWidth: 150 }}>
                            {ing.productName}
                          </Typography>
                          <Typography variant="caption" fontWeight={500}>
                            ${contribution}
                          </Typography>
                        </Box>
                      );
                    })}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </form>
      </FormikProvider>
    </Box>
  );
};

export default FeedFormulaForm;
