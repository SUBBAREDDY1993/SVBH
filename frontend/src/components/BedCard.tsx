import React from 'react';
import { Box, Card, Typography, Tooltip, IconButton } from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BuildIcon from '@mui/icons-material/Build';
import { Bed } from '../types';

interface BedCardProps {
  bed: Bed;
  onAllocate?: (bed: Bed) => void;
  onViewStudent?: (studentId: string) => void;
  onTransfer?: (bed: Bed) => void;
  onStatusChange?: (bed: Bed) => void;
}

export const BedCard: React.FC<BedCardProps> = ({
  bed,
  onAllocate,
  onViewStudent,
  onTransfer,
  onStatusChange,
}) => {
  const isAvailable = bed.status === 'AVAILABLE';
  const isOccupied = bed.status === 'OCCUPIED';
  const isReserved = bed.status === 'RESERVED';
  const isMaintenance = bed.status === 'MAINTENANCE';

  // Card theme styling according to status
  let borderColor = 'rgba(226, 232, 240, 0.9)';
  let bgColor = '#ffffff';
  let iconColor = '#64748b';
  let statusBadgeBg = '#f1f5f9';
  let statusBadgeText = '#475569';
  let dotColor = '#94a3b8';
  let pulseClass = '';

  if (isAvailable) {
    borderColor = 'rgba(16, 185, 129, 0.4)';
    bgColor = '#ffffff';
    iconColor = '#10b981';
    statusBadgeBg = '#ecfdf5';
    statusBadgeText = '#065f46';
    dotColor = '#10b981';
    pulseClass = 'status-dot-pulse-success';
  } else if (isOccupied) {
    borderColor = 'rgba(239, 68, 68, 0.35)';
    bgColor = '#ffffff';
    iconColor = '#ef4444';
    statusBadgeBg = '#fef2f2';
    statusBadgeText = '#991b1b';
    dotColor = '#ef4444';
  } else if (isReserved) {
    borderColor = 'rgba(245, 158, 11, 0.4)';
    bgColor = '#ffffff';
    iconColor = '#f59e0b';
    statusBadgeBg = '#fffbeb';
    statusBadgeText = '#92400e';
    dotColor = '#f59e0b';
    pulseClass = 'status-dot-pulse-warning';
  } else if (isMaintenance) {
    borderColor = 'rgba(148, 163, 184, 0.4)';
    bgColor = '#f8fafc';
    iconColor = '#64748b';
    statusBadgeBg = '#f1f5f9';
    statusBadgeText = '#475569';
    dotColor = '#94a3b8';
  }

  return (
    <Card
      sx={{
        p: 1.75,
        border: `1.5px solid ${borderColor}`,
        backgroundColor: bgColor,
        borderRadius: 3,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 124,
        position: 'relative',
        boxShadow: isOccupied
          ? '0 2px 6px rgba(239, 68, 68, 0.06)'
          : isAvailable
          ? '0 2px 6px rgba(16, 185, 129, 0.06)'
          : '0 2px 6px rgba(0, 0, 0, 0.03)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isOccupied
            ? '0 8px 18px rgba(239, 68, 68, 0.12)'
            : isAvailable
            ? '0 8px 18px rgba(16, 185, 129, 0.12)'
            : '0 8px 18px rgba(0, 0, 0, 0.08)',
        },
      }}
    >
      {/* Top Header: Bed Number & Status Pill */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            sx={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              bgcolor: `${iconColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HotelIcon sx={{ color: iconColor, fontSize: 16 }} />
          </Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
            Bed {bed.bedNumber}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.25,
            borderRadius: 9999,
            fontSize: '0.68rem',
            fontWeight: 700,
            backgroundColor: statusBadgeBg,
            color: statusBadgeText,
          }}
        >
          <Box
            className={pulseClass}
            sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: dotColor }}
          />
          {bed.status}
        </Box>
      </Box>

      {/* Center Details: Occupant or Availability */}
      <Box sx={{ my: 1 }}>
        {isOccupied && bed.studentName ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PersonIcon sx={{ fontSize: 16, color: '#ef4444' }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 135,
              }}
              title={bed.studentName}
            >
              {bed.studentName}
            </Typography>
          </Box>
        ) : isAvailable ? (
          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <span style={{ fontSize: '0.9rem' }}>●</span> Vacant & Clean
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
            {bed.notes || 'Bed reserved/maintenance'}
          </Typography>
        )}
      </Box>

      {/* Action Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.5,
          pt: 0.75,
          borderTop: '1px solid rgba(226, 232, 240, 0.6)',
        }}
      >
        {isAvailable && onAllocate && (
          <Tooltip title="Allocate to Student">
            <IconButton
              size="small"
              onClick={() => onAllocate(bed)}
              sx={{
                color: '#059669',
                p: 0.5,
                bgcolor: '#ecfdf5',
                '&:hover': { bgcolor: '#d1fae5' },
              }}
            >
              <PersonAddAlt1Icon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {isOccupied && onViewStudent && bed.studentId && (
          <Tooltip title="View Student Profile">
            <IconButton
              size="small"
              onClick={() => onViewStudent(bed.studentId!)}
              sx={{
                color: '#2563eb',
                p: 0.5,
                bgcolor: '#eff6ff',
                '&:hover': { bgcolor: '#dbeafe' },
              }}
            >
              <PersonIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {isOccupied && onTransfer && (
          <Tooltip title="Transfer Bed">
            <IconButton
              size="small"
              onClick={() => onTransfer(bed)}
              sx={{
                color: '#d97706',
                p: 0.5,
                bgcolor: '#fffbeb',
                '&:hover': { bgcolor: '#fef3c7' },
              }}
            >
              <SwapHorizIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {onStatusChange && (
          <Tooltip title="Change Bed Status">
            <IconButton
              size="small"
              onClick={() => onStatusChange(bed)}
              sx={{
                color: '#64748b',
                p: 0.5,
                bgcolor: '#f8fafc',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <BuildIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Card>
  );
};
