import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Divider,
} from '@mui/material';
import {
  ArrowBack,
  CheckCircle,
  Reply,
  Print,
  Link as LinkIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { accountingService } from '../../services/accountingService';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '../../utils/formatters';
import type { JournalEntry } from '../../types';

const JournalEntryDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reverseReason, setReverseReason] = useState('');

  const { data: entry, isLoading, error } = useQuery<JournalEntry>({
    queryKey: ['journal-entry', id],
    queryFn: () => accountingService.getJournalEntryById(id!),
    enabled: !!id,
  });

  const postMutation = useMutation({
    mutationFn: () => accountingService.postJournalEntry(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
    },
  });

  const reverseMutation = useMutation({
    mutationFn: () => accountingService.reverseJournalEntry(id!, reverseReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entry'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setReverseDialogOpen(false);
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (error || !entry) {
    return (
      <Box p={3}>
        <Alert severity="error">Failed to load journal entry</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/accounting/journal-entries')} variant="outlined" size="small">
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold">
            Journal Entry {entry.entryNumber}
          </Typography>
          <Chip
            label={entry.status}
            color={getStatusColor(entry.status)}
            size="small"
          />
        </Box>
        <Box display="flex" gap={1}>
          {entry.status === 'DRAFT' && (
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => postMutation.mutate()}
              disabled={postMutation.isPending}
            >
              {postMutation.isPending ? 'Posting...' : 'Post Entry'}
            </Button>
          )}
          {entry.status === 'POSTED' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<Reply />}
              onClick={() => setReverseDialogOpen(true)}
            >
              Reverse
            </Button>
          )}
          <Button variant="outlined" startIcon={<Print />} onClick={() => window.print()}>
            Print
          </Button>
        </Box>
      </Box>

      {postMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to post journal entry</Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Date</Typography>
              <Typography variant="body1">{formatDate(entry.date)}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Reference</Typography>
              <Typography variant="body1">{entry.reference ?? '-'}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Branch</Typography>
              <Typography variant="body1">{entry.branchName}</Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="subtitle2" color="text.secondary">Created By</Typography>
              <Typography variant="body1">{entry.createdBy}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography variant="body1">{entry.description}</Typography>
            </Grid>
            {entry.sourceDocumentType && (
              <Grid size={{ xs: 12 }}>
                <Chip
                  icon={<LinkIcon />}
                  label={`Source: ${entry.sourceDocumentType} #${entry.sourceDocumentId}`}
                  color="info"
                  size="small"
                />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Entry Lines</Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>#</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Cost Center</TableCell>
                  <TableCell align="right">Debit</TableCell>
                  <TableCell align="right">Credit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entry.lines.map((line, idx) => (
                  <TableRow key={line.id}>
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {line.accountCode} - {line.accountName}
                      </Typography>
                    </TableCell>
                    <TableCell>{line.description ?? '-'}</TableCell>
                    <TableCell>{line.costCenterName ?? '-'}</TableCell>
                    <TableCell align="right">
                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                    </TableCell>
                    <TableCell align="right">
                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                  <TableCell colSpan={4} align="right">
                    <Typography fontWeight="bold">TOTALS</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="success.main">
                      {formatCurrency(entry.totalDebits)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color="error.main">
                      {formatCurrency(entry.totalCredits)}
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" alignItems="center" justifyContent="center" gap={1} mt={2}>
            {entry.isBalanced ? (
              <>
                <CheckCircle color="success" />
                <Typography color="success.main" fontWeight="bold">
                  Entry is balanced - Debits equal Credits
                </Typography>
              </>
            ) : (
              <Alert severity="error" sx={{ py: 0 }}>
                Entry is NOT balanced - Difference: {formatCurrency(Math.abs(entry.totalDebits - entry.totalCredits))}
              </Alert>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Created: {formatDateTime(entry.createdAt)}
              </Typography>
            </Grid>
            {entry.postedAt && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Posted: {formatDateTime(entry.postedAt)}
                </Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Dialog open={reverseDialogOpen} onClose={() => setReverseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reverse Journal Entry</DialogTitle>
        <DialogContent>
          {reverseMutation.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>Failed to reverse entry</Alert>
          )}
          <Typography variant="body2" color="text.secondary" gutterBottom>
            This will create a reversing entry for #{entry.entryNumber}. Please provide a reason.
          </Typography>
          <TextField
            label="Reason for reversal"
            fullWidth
            multiline
            rows={3}
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverseDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={() => reverseMutation.mutate()}
            disabled={reverseMutation.isPending || !reverseReason.trim()}
          >
            {reverseMutation.isPending ? 'Reversing...' : 'Reverse Entry'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JournalEntryDetail;
