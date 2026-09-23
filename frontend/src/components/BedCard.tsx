import React from 'react';
import { Box, Card, Typography, Tooltip, IconButton, Button, Avatar } from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Bed } from '../types';

interface BedCardProps {
  bed: Bed;
  variant?: 'row' | 'card';
  onAllocate?: (bed: Bed) => void;
  onViewStudent?: (studentId: string) => void;
  onTransfer?: (bed: Bed) => void;
  onStatusChange?: (bed: Bed) => void;
}

export const BedCard: React.FC<BedCardProps> = ({
  bed,
  variant = 'row',
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
  let borderColor = 'rgba(226, 232, 240, 0.85)';
  let accentColor = '#64748b';
  let bgColor = '#ffffff';
  let iconColor = '#64748b';
  let statusBadgeBg = '#f1f5f9';
  let statusBadgeText = '#475569';
  let statusBadgeBorder = 'rgba(203, 213, 225, 0.8)';
  let dotColor = '#94a3b8';
  let pulseClass = '';

  if (isAvailable) {
    borderColor = 'rgba(16, 185, 129, 0.35)';
    accentColor = '#10b981';
    bgColor = '#ffffff';
    iconColor = '#10b981';
    statusBadgeBg = '#ecfdf5';
    statusBadgeText = '#065f46';
    statusBadgeBorder = '#a7f3d0';
    dotColor = '#10b981';
    pulseClass = 'status-dot-pulse-success';
  } else if (isOccupied) {
    borderColor = 'rgba(239, 68, 68, 0.35)';
    accentColor = '#ef4444';
    bgColor = '#ffffff';
    iconColor = '#ef4444';
    statusBadgeBg = '#fef2f2';
    statusBadgeText = '#991b1b';
    statusBadgeBorder = '#fecaca';
    dotColor = '#ef4444';
    pulseClass = 'status-dot-pulse-error';
  } else if (isReserved) {
    borderColor = 'rgba(245, 158, 11, 0.35)';
    accentColor = '#f59e0b';
    bgColor = '#ffffff';
    iconColor = '#f59e0b';
    statusBadgeBg = '#fffbeb';
    statusBadgeText = '#92400e';
    statusBadgeBorder = '#fde68a';
    dotColor = '#f59e0b';
    pulseClass = 'status-dot-pulse-warning';
  } else if (isMaintenance) {
    borderColor = 'rgba(148, 163, 184, 0.4)';
    accentColor = '#64748b';
    bgColor = '#f8fafc';
    iconColor = '#64748b';
    statusBadgeBg = '#f1f5f9';
    statusBadgeText = '#475569';
    statusBadgeBorder = '#cbd5e1';
    dotColor = '#94a3b8';
  }

  // Render Horizontal Row Format (Default & Recommended)
  if (variant === 'row') {
    return (
      <Box
        className={`bed-row-item ${bed.status.toLowerCase()}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: '10px 14px',
          borderRadius: 2.5,
          border: `1.5px solid ${borderColor}`,
          borderLeft: `4px solid ${accentColor}`,
          bgcolor: bgColor,
          gap: 1.5,
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateX(3px)',
            boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
            borderColor: accentColor,
          },
        }}
      >
        {/* Left: Bed Badge & Identification */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: { xs: 110, sm: 130 } }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              bgcolor: `${iconColor}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: iconColor,
              flexShrink: 0,
            }}
          >
            <HotelIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              Bed {bed.bedNumber}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
              {bed.bedId}
            </Typography>
          </Box>
        </Box>

        {/* Status Pill (Always full width, never truncated) */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              py: 0.35,
              borderRadius: 9999,
              fontSize: '0.72rem',
              fontWeight: 700,
              backgroundColor: statusBadgeBg,
              color: statusBadgeText,
              border: `1px solid ${statusBadgeBorder}`,
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            <Box className={pulseClass} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: dotColor }} />
            {bed.status}
          </Box>
        </Box>

        {/* Center: Occupant Details or Clean Vacant State */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', minWidth: { xs: '100%', sm: 140 }, mt: { xs: 0.5, sm: 0 } }}>
          {isOccupied && bed.studentName ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
              <Avatar
                sx={{
                  width: 26,
                  height: 26,
                  fontSize: '0.75rem',
                  bgcolor: '#fee2e2',
                  color: '#b91c1c',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {bed.studentName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ overflow: 'hidden' }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: '#1e293b',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    maxWidth: { xs: 200, sm: 180, md: 220 },
                  }}
                  title={bed.studentName}
                >
                  {bed.studentName}
                </Typography>
                {bed.allocationDate && (
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.7rem', display: 'block' }}>
                    Since {bed.allocationDate}
                  </Typography>
                )}
              </Box>
            </Box>
          ) : isAvailable ? (
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: '#10b981' }} />
              Vacant & Clean
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
              {bed.notes || 'Reserved / Maintenance'}
            </Typography>
          )}
        </Box>

        {/* Right: Quick Action Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0, ml: 'auto' }}>
          {isAvailable && onAllocate && (
            <Button
              size="small"
              variant="contained"
              startIcon={<PersonAddAlt1Icon sx={{ fontSize: 15 }} />}
              onClick={() => onAllocate(bed)}
              sx={{
                bgcolor: '#10b981',
                '&:hover': { bgcolor: '#059669' },
                fontSize: '0.75rem',
                fontWeight: 700,
                py: 0.4,
                px: 1.25,
                borderRadius: 2,
                boxShadow: 'none',
              }}
            >
              Allocate
            </Button>
          )}

          {isOccupied && onViewStudent && bed.studentId && (
            <Tooltip title="View Resident Profile">
              <IconButton
                size="small"
                onClick={() => onViewStudent(bed.studentId!)}
                sx={{
                  color: '#2563eb',
                  p: 0.6,
                  bgcolor: '#eff6ff',
                  '&:hover': { bgcolor: '#dbeafe' },
                  borderRadius: 2,
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
                  p: 0.6,
                  bgcolor: '#fffbeb',
                  '&:hover': { bgcolor: '#fef3c7' },
                  borderRadius: 2,
                }}
              >
                <SwapHorizIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Tooltip>
          )}

          {onStatusChange && (
            <Tooltip title="Bed Maintenance / Status">
              <IconButton
                size="small"
                onClick={() => onStatusChange(bed)}
                sx={{
                  color: '#64748b',
                  p: 0.6,
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  '&:hover': { bgcolor: '#f1f5f9' },
                  borderRadius: 2,
                }}
              >
                <BuildIcon sx={{ fontSize: 14 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    );
  }

  // Render Card Grid Format (Refined to prevent text truncation)
  return (
    <Card
      sx={{
        p: 2,
        border: `1.5px solid ${borderColor}`,
        borderTop: `4px solid ${accentColor}`,
        backgroundColor: bgColor,
        borderRadius: 3,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: 136,
        minWidth: 160,
        boxShadow: isOccupied
          ? '0 2px 8px rgba(239, 68, 68, 0.08)'
          : isAvailable
          ? '0 2px 8px rgba(16, 185, 129, 0.08)'
          : '0 2px 8px rgba(0, 0, 0, 0.04)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 20px rgba(15, 23, 42, 0.1)',
        },
      }}
    >
      {/* Top Header: Bed Number & Status Pill */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
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
              flexShrink: 0,
            }}
          >
            <HotelIcon sx={{ color: iconColor, fontSize: 16 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>
              Bed {bed.bedNumber}
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
              {bed.bedId}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1,
            py: 0.3,
            borderRadius: 9999,
            fontSize: '0.68rem',
            fontWeight: 700,
            backgroundColor: statusBadgeBg,
            color: statusBadgeText,
            border: `1px solid ${statusBadgeBorder}`,
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Box className={pulseClass} sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: dotColor }} />
          {bed.status}
        </Box>
      </Box>

      {/* Center Details: Occupant or Availability */}
      <Box sx={{ my: 1 }}>
        {isOccupied && bed.studentName ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <PersonIcon sx={{ fontSize: 16, color: '#ef4444', flexShrink: 0 }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              title={bed.studentName}
            >
              {bed.studentName}
            </Typography>
          </Box>
        ) : isAvailable ? (
          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CheckCircleIcon sx={{ fontSize: 14, color: '#10b981' }} />
            Vacant & Clean
          </Typography>
        ) : (
          <Typography variant="caption" sx={{ color: '#64748b', fontStyle: 'italic' }}>
            {bed.notes || 'Bed reserved'}
          </Typography>
        )}
      </Box>

      {/* Action Footer */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 0.5,
          pt: 1,
          borderTop: '1px solid rgba(226, 232, 240, 0.7)',
        }}
      >
        {isAvailable && onAllocate && (
          <Tooltip title="Allocate Bed">
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
          <Tooltip title="View Profile">
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
          <Tooltip title="Maintenance / Status">
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
