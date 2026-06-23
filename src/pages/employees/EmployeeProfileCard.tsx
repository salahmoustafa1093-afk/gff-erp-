import React from 'react';
import {
  Card, CardContent, Box, Avatar, Typography, Chip, Skeleton,
  Divider, Tooltip, IconButton
} from '@mui/material';
import {
  Email, Phone, Business, Edit
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Employee } from '../../types';

const statusColors: Record<string, 'success' | 'error' | 'warning' | 'info' | 'default'> = {
  ACTIVE: 'success',
  INACTIVE: 'default',
  TERMINATED: 'error',
  ON_LEAVE: 'info',
  SUSPENDED: 'warning',
};

interface EmployeeProfileCardProps {
  employeeId?: string;
  employee?: Employee;
  loading?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const EmployeeProfileCard: React.FC<EmployeeProfileCardProps> = ({
  employee,
  loading = false,
  showActions = true,
  compact = false,
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Skeleton variant="circular" width={64} height={64} />
            <Box flex={1}>
              <Skeleton width={150} height={24} />
              <Skeleton width={100} height={18} />
            </Box>
          </Box>
          <Skeleton width="100%" height={20} />
          <Skeleton width="80%" height={20} />
        </CardContent>
      </Card>
    );
  }

  if (!employee) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.secondary" align="center" py={3}>
            No employee selected
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': showActions ? { boxShadow: 4 } : undefined,
      }}
      onClick={() => showActions && navigate(`/employees/${employee.id}`)}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        {/* Header */}
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Avatar
            src={employee.photoUrl}
            alt={`${employee.firstName} ${employee.lastName}`}
            sx={{
              width: compact ? 48 : 64,
              height: compact ? 48 : 64,
              fontSize: compact ? 20 : 28,
              bgcolor: 'primary.main',
            }}
          >
            {employee.firstName?.[0]}{employee.lastName?.[0]}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box minWidth={0}>
                <Typography
                  variant={compact ? 'subtitle1' : 'h6'}
                  fontWeight={700}
                  noWrap
                  title={`${employee.firstName} ${employee.lastName}`}
                >
                  {employee.firstName} {employee.lastName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {employee.jobTitle}
                </Typography>
              </Box>
              {showActions && (
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/employees/edit/${employee.id}`);
                    }}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <Box mt={0.5}>
              <Chip
                label={employee.status}
                color={statusColors[employee.status] || 'default'}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
              />
            </Box>
          </Box>
        </Box>

        {!compact && <Divider sx={{ my: 1.5 }} />}

        {/* Details */}
        <Box display="flex" flexDirection="column" gap={compact ? 0.5 : 1}>
          <Box display="flex" alignItems="center" gap={1}>
            <Business fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {employee.department}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Email fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary" noWrap title={employee.email}>
              {employee.email}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Phone fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
            <Typography variant="body2" color="text.secondary">
              {employee.phone}
            </Typography>
          </Box>
        </Box>

        {!compact && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {employee.employeeNumber}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {employee.branch}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeProfileCard;
