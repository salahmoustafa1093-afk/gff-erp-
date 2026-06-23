import React, { useState, useMemo } from "react";
import {
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  LinearProgress,
} from "@mui/material";
import {
  CompareArrows as CompareArrowsIcon,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import apiService from "../../services/api";

interface FeedFormulaRef {
  id: string;
  code: string;
  name: string;
  feedType: string;
}

interface FormulaDetail {
  id: string;
  code: string;
  name: string;
  feedType: string;
  feedTypeLabel: string;
  targetProtein: number;
  targetEnergy: number;
  targetFiber: number;
  targetCalcium: number;
  targetPhosphorus: number;
  actualProtein: number;
  actualEnergy: number;
  actualFiber: number;
  actualCalcium: number;
  actualPhosphorus: number;
  totalCost: number;
  ingredients: FormulaIngredient[];
  isActive: boolean;
}

interface FormulaIngredient {
  productName: string;
  productCode: string;
  percentage: number;
  actualProtein: number;
  actualEnergy: number;
  costPerKg: number;
  contribution: number;
}

const FEED_TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  BROILER_STARTER: { bg: "#e3f2fd", color: "#1565c0" },
  BROILER_GROWER: { bg: "#e8f5e9", color: "#2e7d32" },
  BROILER_FINISHER: { bg: "#fff3e0", color: "#ef6c00" },
  LAYER: { bg: "#fce4ec", color: "#c62828" },
  BREEDER: { bg: "#f3e5f5", color: "#6a1b9a" },
  PREMIX: { bg: "#e0f2f1", color: "#00695c" },
  OTHER: { bg: "#f5f5f5", color: "#616161" },
};

const COST_COLORS = ["#4caf50", "#2196f3", "#ff9800", "#f44336", "#9c27b0", "#00bcd4", "#795548"];

const fetchFormulaList = async (): Promise<FeedFormulaRef[]> => {
  const response = await apiService.get<{ data: FeedFormulaRef[] }>("/feed-formulation/formulas", {
    params: { pageSize: 1000 },
  });
  return response.data.data;
};

const fetchFormulaDetail = async (id: string): Promise<FormulaDetail> => {
  const response = await apiService.get<FormulaDetail>(`/feed-formulation/formulas/${id}/detail`);
  return response.data;
};

const FormulaComparisonPage: React.FC = () => {
  const theme = useTheme();
  const [formulaAId, setFormulaAId] = useState<string>("");
  const [formulaBId, setFormulaBId] = useState<string>("");

  const { data: formulaList, isLoading: listLoading } = useQuery<FeedFormulaRef[]>({
    queryKey: ["formula-list-for-comparison"],
    queryFn: fetchFormulaList,
    staleTime: 300000,
  });

  const { data: formulaA, isLoading: aLoading } = useQuery<FormulaDetail>({
    queryKey: ["formula-detail", formulaAId],
    queryFn: () => fetchFormulaDetail(formulaAId),
    enabled: Boolean(formulaAId),
  });

  const { data: formulaB, isLoading: bLoading } = useQuery<FormulaDetail>({
    queryKey: ["formula-detail", formulaBId],
    queryFn: () => fetchFormulaDetail(formulaBId),
    enabled: Boolean(formulaBId),
  });

  const isReady = formulaA && formulaB;
  const isLoading = listLoading || aLoading || bLoading;

  const comparisonRows = useMemo(() => {
    if (!isReady) return [];
    return [
      {
        nutrient: "Protein %",
        formulaA: formulaA.actualProtein,
        formulaB: formulaB.actualProtein,
        targetA: formulaA.targetProtein,
        targetB: formulaB.targetProtein,
        unit: "%",
      },
      {
        nutrient: "Energy (ME kcal/kg)",
        formulaA: formulaA.actualEnergy,
        formulaB: formulaB.actualEnergy,
        targetA: formulaA.targetEnergy,
        targetB: formulaB.targetEnergy,
        unit: "kcal",
      },
      {
        nutrient: "Fiber %",
        formulaA: formulaA.actualFiber,
        formulaB: formulaB.actualFiber,
        targetA: formulaA.targetFiber,
        targetB: formulaB.targetFiber,
        unit: "%",
      },
      {
        nutrient: "Calcium %",
        formulaA: formulaA.actualCalcium,
        formulaB: formulaB.actualCalcium,
        targetA: formulaA.targetCalcium,
        targetB: formulaB.targetCalcium,
        unit: "%",
      },
      {
        nutrient: "Phosphorus %",
        formulaA: formulaA.actualPhosphorus,
        formulaB: formulaB.actualPhosphorus,
        targetA: formulaA.targetPhosphorus,
        targetB: formulaB.targetPhosphorus,
        unit: "%",
      },
      {
        nutrient: "Total Cost/KG",
        formulaA: formulaA.totalCost,
        formulaB: formulaB.totalCost,
        targetA: 0,
        targetB: 0,
        unit: "$/kg",
      },
    ];
  }, [formulaA, formulaB, isReady]);

  const barChartData = useMemo(() => {
    if (!isReady) return [];
    return [
      { nutrient: "Protein", [formulaA.code]: formulaA.actualProtein, [formulaB.code]: formulaB.actualProtein },
      { nutrient: "Fiber", [formulaA.code]: formulaA.actualFiber, [formulaB.code]: formulaB.actualFiber },
      { nutrient: "Calcium x10", [formulaA.code]: formulaA.actualCalcium * 10, [formulaB.code]: formulaB.actualCalcium * 10 },
      { nutrient: "Phos x10", [formulaA.code]: formulaA.actualPhosphorus * 10, [formulaB.code]: formulaB.actualPhosphorus * 10 },
    ];
  }, [formulaA, formulaB, isReady]);

  const ingredientComparison = useMemo(() => {
    if (!isReady) return [];
    const allIngredients = new Map<string, { name: string; aPercent: number; bPercent: number; aContribution: number; bContribution: number }>();

    formulaA.ingredients.forEach((ing) => {
      allIngredients.set(ing.productName, {
        name: ing.productName,
        aPercent: ing.percentage,
        bPercent: 0,
        aContribution: ing.contribution,
        bContribution: 0,
      });
    });

    formulaB.ingredients.forEach((ing) => {
      const existing = allIngredients.get(ing.productName);
      if (existing) {
        existing.bPercent = ing.percentage;
        existing.bContribution = ing.contribution;
      } else {
        allIngredients.set(ing.productName, {
          name: ing.productName,
          aPercent: 0,
          bPercent: ing.percentage,
          aContribution: 0,
          bContribution: ing.contribution,
        });
      }
    });

    return Array.from(allIngredients.values()).sort((a, b) => (b.aPercent + b.bPercent) - (a.aPercent + a.bPercent));
  }, [formulaA, formulaB, isReady]);

  const formulaOptions = formulaList || [];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" fontWeight="bold" color="primary" sx={{ mb: 3 }}>
        Formula Comparison
      </Typography>

      {/* Formula Selectors */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={5}>
            <Autocomplete
              options={formulaOptions}
              getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
              value={formulaOptions.find((f) => f.id === formulaAId) || null}
              onChange={(_e, val) => setFormulaAId(val?.id || "")}
              loading={listLoading}
              renderInput={(params) => (
                <TextField {...params} label="Select Formula A" variant="outlined" fullWidth />
              )}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
          </Grid>
          <Grid item xs={12} md={2} sx={{ textAlign: "center" }}>
            <CompareArrowsIcon sx={{ fontSize: 36, color: theme.palette.primary.main }} />
          </Grid>
          <Grid item xs={12} md={5}>
            <Autocomplete
              options={formulaOptions.filter((f) => f.id !== formulaAId)}
              getOptionLabel={(opt) => `${opt.code} - ${opt.name}`}
              value={formulaOptions.find((f) => f.id === formulaBId) || null}
              onChange={(_e, val) => setFormulaBId(val?.id || "")}
              loading={listLoading}
              renderInput={(params) => (
                <TextField {...params} label="Select Formula B" variant="outlined" fullWidth />
              )}
              isOptionEqualToValue={(a, b) => a.id === b.id}
            />
          </Grid>
        </Grid>
      </Paper>

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      {isReady && (
        <>
          {/* Formula Header Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Chip label="Formula A" color="primary" size="small" />
                    {formulaA && (
                      <Chip
                        label={formulaA.feedTypeLabel}
                        size="small"
                        sx={{
                          backgroundColor: (FEED_TYPE_COLORS[formulaA.feedType] || FEED_TYPE_COLORS.OTHER).bg,
                          color: (FEED_TYPE_COLORS[formulaA.feedType] || FEED_TYPE_COLORS.OTHER).color,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    {formulaA.code}
                  </Typography>
                  <Typography variant="body1">{formulaA.name}</Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mt: 1 }}>
                    ${formulaA.totalCost.toFixed(3)} / KG
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <Chip label="Formula B" color="secondary" size="small" />
                    {formulaB && (
                      <Chip
                        label={formulaB.feedTypeLabel}
                        size="small"
                        sx={{
                          backgroundColor: (FEED_TYPE_COLORS[formulaB.feedType] || FEED_TYPE_COLORS.OTHER).bg,
                          color: (FEED_TYPE_COLORS[formulaB.feedType] || FEED_TYPE_COLORS.OTHER).color,
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h5" fontWeight="bold">
                    {formulaB.code}
                  </Typography>
                  <Typography variant="body1">{formulaB.name}</Typography>
                  <Typography variant="h6" fontWeight="bold" color="secondary" sx={{ mt: 1 }}>
                    ${formulaB.totalCost.toFixed(3)} / KG
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Nutritional Comparison Table */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Nutritional Comparison
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell>Nutrient</TableCell>
                      <TableCell align="right">
                        <Chip label={formulaA.code} color="primary" size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={formulaB.code} color="secondary" size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">Difference (B - A)</TableCell>
                      <TableCell align="center">Winner</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonRows.map((row) => {
                      const diff = row.formulaB - row.formulaA;
                      const isCost = row.nutrient === "Total Cost/KG";
                      const aWins = isCost ? row.formulaA < row.formulaB : row.formulaA > row.formulaB;
                      const bWins = isCost ? row.formulaB < row.formulaA : row.formulaB > row.formulaA;
                      return (
                        <TableRow key={row.nutrient} hover>
                          <TableCell fontWeight={500}>{row.nutrient}</TableCell>
                          <TableCell align="right" fontWeight="bold">
                            {row.nutrient === "Total Cost/KG"
                              ? `$${row.formulaA.toFixed(3)}`
                              : row.formulaA.toFixed(row.nutrient === "Energy (ME kcal/kg)" ? 0 : row.nutrient.includes("Calcium") || row.nutrient.includes("Phosphorus") ? 2 : 1)}
                          </TableCell>
                          <TableCell align="right" fontWeight="bold">
                            {row.nutrient === "Total Cost/KG"
                              ? `$${row.formulaB.toFixed(3)}`
                              : row.formulaB.toFixed(row.nutrient === "Energy (ME kcal/kg)" ? 0 : row.nutrient.includes("Calcium") || row.nutrient.includes("Phosphorus") ? 2 : 1)}
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={{
                              color: diff > 0 ? theme.palette.success.main : diff < 0 ? theme.palette.error.main : theme.palette.text.secondary,
                              fontWeight: 600,
                            }}
                          >
                            {diff > 0 ? "+" : ""}
                            {diff.toFixed(row.nutrient === "Energy (ME kcal/kg)" ? 0 : row.nutrient === "Total Cost/KG" ? 3 : 2)}
                            {row.unit !== "$/kg" ? ` ${row.unit}` : ""}
                          </TableCell>
                          <TableCell align="center">
                            {aWins ? (
                              <Chip label="A" color="primary" size="small" />
                            ) : bWins ? (
                              <Chip label="B" color="secondary" size="small" />
                            ) : (
                              <Chip label="Tie" size="small" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom align="center">
                    Nutrient Comparison Chart
                  </Typography>
                  <Box sx={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="nutrient" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <RechartsTooltip />
                        <Legend />
                        <Bar dataKey={formulaA.code} fill="#2196f3" radius={[4, 4, 0, 0]} />
                        <Bar dataKey={formulaB.code} fill="#ff9800" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: 400 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom align="center">
                    Cost Comparison
                  </Typography>
                  <Box sx={{ height: 320, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <Grid container spacing={3} sx={{ width: "100%", px: 2 }}>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 3, textAlign: "center", bgcolor: theme.palette.primary.light + "20" }}>
                          <Typography variant="body2" color="text.secondary">{formulaA.code}</Typography>
                          <Typography variant="h4" fontWeight="bold" color="primary">
                            ${formulaA.totalCost.toFixed(3)}
                          </Typography>
                          <Typography variant="caption">per KG</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper sx={{ p: 3, textAlign: "center", bgcolor: theme.palette.secondary.light + "20" }}>
                          <Typography variant="body2" color="text.secondary">{formulaB.code}</Typography>
                          <Typography variant="h4" fontWeight="bold" color="secondary">
                            ${formulaB.totalCost.toFixed(3)}
                          </Typography>
                          <Typography variant="caption">per KG</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 3, textAlign: "center" }}>
                      <Typography variant="body1">
                        Cost Difference: {" "}
                        <Typography
                          component="span"
                          fontWeight="bold"
                          sx={{
                            color: formulaB.totalCost <= formulaA.totalCost ? theme.palette.success.main : theme.palette.error.main,
                          }}
                        >
                          ${(formulaB.totalCost - formulaA.totalCost).toFixed(3)}
                        </Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        {formulaB.totalCost < formulaA.totalCost
                          ? `${formulaB.code} is cheaper by ${((1 - formulaB.totalCost / formulaA.totalCost) * 100).toFixed(1)}%`
                          : formulaB.totalCost > formulaA.totalCost
                            ? `${formulaA.code} is cheaper by ${((1 - formulaA.totalCost / formulaB.totalCost) * 100).toFixed(1)}%`
                            : "Same cost"}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Ingredient Comparison */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Ingredient Comparison
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: theme.palette.grey[100] }}>
                      <TableCell>Ingredient</TableCell>
                      <TableCell align="right">
                        <Chip label={`${formulaA.code} %`} color="primary" size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${formulaB.code} %`} color="secondary" size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">Difference</TableCell>
                      <TableCell align="right">
                        <Chip label={`${formulaA.code} Cost`} color="primary" size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right">
                        <Chip label={`${formulaB.code} Cost`} color="secondary" size="small" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ingredientComparison.map((ing, idx) => (
                      <TableRow key={ing.name} hover>
                        <TableCell fontWeight={500}>{ing.name}</TableCell>
                        <TableCell align="right">{ing.aPercent.toFixed(1)}%</TableCell>
                        <TableCell align="right">{ing.bPercent.toFixed(1)}%</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: ing.bPercent - ing.aPercent > 0 ? theme.palette.success.main : ing.bPercent - ing.aPercent < 0 ? theme.palette.error.main : "inherit",
                            fontWeight: 600,
                          }}
                        >
                          {(ing.bPercent - ing.aPercent) > 0 ? "+" : ""}
                          {(ing.bPercent - ing.aPercent).toFixed(1)}%
                        </TableCell>
                        <TableCell align="right">${ing.aContribution.toFixed(4)}</TableCell>
                        <TableCell align="right">${ing.bContribution.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </TableContainer>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
};

export default FormulaComparisonPage;
