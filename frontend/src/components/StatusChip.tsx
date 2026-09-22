import React from 'react';
import { Box, Chip } from '@mui/material';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'small' }) => {
  let label = status;
  let bg = '#f1f5f9';
  let color = '#475569';
  let border = '#cbd5e1';
  let dotColor = '#94a3b8';
  let pulseClass = '';

  switch (status) {
    case 'AVAILABLE':
      label = 'Available';
      bg = '#ecfdf5';
      color = '#065f46';
      border = '#a7f3d0';
      dotColor = '#10b981';
      pulseClass = 'status-dot-pulse-success';
      break;

    case 'OCCUPIED':
      label = 'Occupied';
      bg = '#fef2f2';
      color = '#991b1b';
      border = '#fecaca';
      dotColor = '#ef4444';
      break;

    case 'RESERVED':
      label = 'Reserved';
      bg = '#fffbeb';
      color = '#92400e';
      border = '#fde68a';
      dotColor = '#f59e0b';
      pulseClass = 'status-dot-pulse-warning';
      break;

    case 'MAINTENANCE':
    case 'UNDER_MAINTENANCE':
      label = 'Maintenance';
      bg = '#f8fafc';
      color = '#475569';
      border = '#cbd5e1';
      dotColor = '#94a3b8';
      break;

    // Student statuses
    case 'ACTIVE':
      label = 'Active Resident';
      bg = '#ecfdf5';
      color = '#065f46';
      border = '#a7f3d0';
      dotColor = '#10b981';
      pulseClass = 'status-dot-pulse-success';
      break;

    case 'NOTICE_PERIOD':
      label = 'Notice Period';
      bg = '#fffbeb';
      color = '#b45309';
      border = '#fde68a';
      dotColor = '#f59e0b';
      pulseClass = 'status-dot-pulse-warning';
      break;

    case 'VACATED':
      label = 'Vacated';
      bg = '#f1f5f9';
      color = '#64748b';
      border = '#e2e8f0';
      dotColor = '#94a3b8';
      break;

    // Payment statuses
    case 'PAID':
      label = 'Paid';
      bg = '#ecfdf5';
      color = '#065f46';
      border = '#a7f3d0';
      dotColor = '#10b981';
      break;

    case 'PENDING':
      label = 'Pending';
      bg = '#fffbeb';
      color = '#b45309';
      border = '#fde68a';
      dotColor = '#f59e0b';
      pulseClass = 'status-dot-pulse-warning';
      break;

    case 'OVERDUE':
      label = 'Overdue';
      bg = '#fef2f2';
      color = '#991b1b';
      border = '#fecaca';
      dotColor = '#ef4444';
      pulseClass = 'status-dot-pulse-error';
      break;

    case 'PARTIAL':
      label = 'Partial';
      bg = '#eef2ff';
      color = '#3730a3';
      border = '#c7d2fe';
      dotColor = '#6366f1';
      break;

    default:
      label = status;
      bg = '#f1f5f9';
      color = '#475569';
      border = '#e2e8f0';
      dotColor = '#94a3b8';
  }

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: size === 'small' ? 1.1 : 1.5,
        py: size === 'small' ? 0.35 : 0.5,
        borderRadius: 9999,
        backgroundColor: bg,
        color: color,
        border: `1px solid ${border}`,
        fontSize: size === 'small' ? '0.72rem' : '0.8rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
        lineHeight: 1.2,
      }}
    >
      <Box
        className={pulseClass}
        sx={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: dotColor,
        }}
      />
      <span>{label}</span>
    </Box>
  );
};
