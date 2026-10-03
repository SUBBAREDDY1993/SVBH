import React, { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import PeopleIcon from '@mui/icons-material/People';
import HotelIcon from '@mui/icons-material/Hotel';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SearchIcon from '@mui/icons-material/Search';
import { studentService } from '../services/studentService';
import { roomService } from '../services/roomService';
import { allocationService } from '../services/allocationService';
import { AllocationHistory, AllocationType, Bed, Room, Student } from '../types';
import { useNotification } from '../context/NotificationContext';

export const Allocations: React.FC = () => {
  const { showSuccess, showError } = useNotification();

  const [activeStudents, setActiveStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [histories, setHistories] = useState<AllocationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Transfer Modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [targetRoom, setTargetRoom] = useState('');
  const [targetBedId, setTargetBedId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  // Filter & Dropdown Type states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'INITIAL':
        return { bg: '#dcfce7', color: '#15803d', border: '#86efac', dot: '#16a34a', label: 'INITIAL' };
      case 'EXISTING':
        return { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd', dot: '#2563eb', label: 'EXISTING' };
      case 'REJOIN':
        return { bg: '#f3e8ff', color: '#7e22ce', border: '#d8b4fe', dot: '#9333ea', label: 'REJOIN' };
      case 'TRANSFER':
        return { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', dot: '#d97706', label: 'TRANSFER' };
      case 'VACATE':
        return { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', dot: '#dc2626', label: 'VACATE' };
      default:
        return { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', dot: '#64748b', label: type || 'UNKNOWN' };
    }
  };

  const handleUpdateType = async (id: string, newType: AllocationType) => {
    try {
      setUpdatingId(id);
      // Optimistic update
      setHistories((prev) =>
        prev.map((item) => (item.id === id ? { ...item, type: newType } : item))
      );
      await allocationService.updateAllocationType(id, newType);
      showSuccess(`Allocation type updated to ${newType}!`);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update allocation type');
      loadData();
    } finally {
      setUpdatingId(null);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentsData, roomsData, historyData] = await Promise.all([
        studentService.getAllStudents('ACTIVE'),
        roomService.getAllRooms(true),
        allocationService.getAllocations(),
      ]);
      setActiveStudents(studentsData);
      setRooms(roomsData);
      setHistories(historyData);
    } catch (err) {
      console.error('Failed to load allocation data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenTransfer = (student?: Student) => {
    if (student) {
      setSelectedStudentId(student.studentId);
    } else {
      setSelectedStudentId('');
    }
    setTargetRoom('');
    setTargetBedId('');
    setTransferReason('');
    setTransferModalOpen(true);
  };

  const handleTargetRoomChange = (roomNum: string) => {
    setTargetRoom(roomNum);
    setTargetBedId('');
    const matched = rooms.find((r) => r.roomNumber === roomNum);
    if (matched && matched.beds) {
      setAvailableBeds(matched.beds.filter((b) => b.status === 'AVAILABLE'));
    } else {
      setAvailableBeds([]);
    }
  };

  const handleExecuteTransfer = async () => {
    if (!selectedStudentId) {
      showError('Please select a student to transfer');
      return;
    }
    if (!targetBedId) {
      showError('Please select a target available bed');
      return;
    }

    try {
      setIsTransferring(true);
      await allocationService.transferBed(selectedStudentId, {
        targetRoomNumber: targetRoom,
        targetBedId,
        reason: transferReason || 'Bed/room transfer requested',
      });
      showSuccess('Bed transfer completed successfully! Old bed released to AVAILABLE.');
      setTransferModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to transfer bed');
    } finally {
      setIsTransferring(false);
    }
  };

  const selectedStudentObj = activeStudents.find((s) => s.studentId === selectedStudentId);

  const filteredHistories = histories.filter((h) => {
    const matchesType = typeFilter === 'ALL' || h.type === typeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (h.studentName && h.studentName.toLowerCase().includes(q)) ||
      (h.studentId && h.studentId.toLowerCase().includes(q)) ||
      (h.toRoom && h.toRoom.toLowerCase().includes(q)) ||
      (h.toBedId && h.toBedId.toLowerCase().includes(q)) ||
      (h.fromRoom && h.fromRoom.toLowerCase().includes(q)) ||
      (h.fromBedId && h.fromBedId.toLowerCase().includes(q)) ||
      (h.remarks && h.remarks.toLowerCase().includes(q));
    return matchesType && matchesSearch;
  });

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
            Bed Allocation & Transfers
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage room changes, bed switching, and complete allocation audit logs
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SwapHorizIcon />}
          onClick={() => handleOpenTransfer()}
          sx={{
            bgcolor: '#2563eb',
            fontWeight: 700,
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          Transfer Resident Bed
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card className="pro-card" sx={{ borderTop: '4px solid #1e3a8a' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#1e3a8a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  ACTIVE RESIDENTS
                </Typography>
                <PeopleIcon sx={{ color: '#2563eb', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#0f172a' }}>
                {activeStudents.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Assigned to beds</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className="pro-card" sx={{ borderTop: '4px solid #10b981' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  FREE BEDS READY
                </Typography>
                <HotelIcon sx={{ color: '#10b981', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#047857' }}>
                {rooms.reduce((acc, r) => acc + (r.availableBeds || 0), 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>Available for assignment</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card className="pro-card" sx={{ borderTop: '4px solid #64748b' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  ALLOCATION EVENTS
                </Typography>
                <EventNoteIcon sx={{ color: '#64748b', fontSize: 24 }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#334155' }}>
                {histories.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Historical records kept</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Allocation History Table */}
      <Paper className="pro-card" sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
            borderBottom: '1px solid #e2e8f0',
            bgcolor: '#f8fafc',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <HistoryIcon sx={{ color: '#1e3a8a' }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Allocation & Transfer Audit History
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>
                Showing {filteredHistories.length} of {histories.length} records • Click Type dropdown to update anytime
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search resident, room, bed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                width: { xs: '100%', sm: 220 },
                bgcolor: '#fff',
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />

            <TextField
              select
              size="small"
              label="Filter by Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              sx={{ minWidth: 150, bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            >
              <MenuItem value="ALL">All Types ({histories.length})</MenuItem>
              <MenuItem value="INITIAL">INITIAL ({histories.filter((h) => h.type === 'INITIAL').length})</MenuItem>
              <MenuItem value="EXISTING">EXISTING ({histories.filter((h) => h.type === 'EXISTING').length})</MenuItem>
              <MenuItem value="REJOIN">REJOIN ({histories.filter((h) => h.type === 'REJOIN').length})</MenuItem>
              <MenuItem value="TRANSFER">TRANSFER ({histories.filter((h) => h.type === 'TRANSFER').length})</MenuItem>
              <MenuItem value="VACATE">VACATE ({histories.filter((h) => h.type === 'VACATE').length})</MenuItem>
            </TextField>
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : histories.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                bgcolor: '#f1f5f9',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <HistoryIcon sx={{ fontSize: 32, color: '#94a3b8' }} />
            </Box>
            <Typography variant="h6" sx={{ color: '#334155', fontWeight: 800 }}>No allocation history yet</Typography>
            <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
              Allocation events, bed assignments, and transfer audits will appear here.
            </Typography>
          </Box>
        ) : filteredHistories.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700 }}>
              No allocation records match your filter
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5, mb: 2 }}>
              Try adjusting your search query or selecting "All Types".
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('ALL');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Resident</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>From Bed</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>To Bed</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Handled By</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistories.map((h) => {
                  const initial = h.studentName ? h.studentName.charAt(0).toUpperCase() : 'S';
                  const style = getTypeStyle(h.type);
                  const isRowUpdating = updatingId === h.id;

                  return (
                    <TableRow key={h.id} hover sx={{ '&:hover': { bgcolor: '#fcfdfd' } }}>
                      <TableCell sx={{ minWidth: 140 }}>
                        <Select
                          value={h.type || 'INITIAL'}
                          onChange={(e) => handleUpdateType(h.id, e.target.value as AllocationType)}
                          disabled={isRowUpdating}
                          size="small"
                          variant="outlined"
                          sx={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            bgcolor: style.bg,
                            color: style.color,
                            borderRadius: '16px',
                            height: 28,
                            minWidth: 110,
                            transition: 'all 0.2s ease',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: style.border,
                              borderWidth: '1.5px',
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: style.color,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: style.color,
                            },
                            '& .MuiSelect-select': {
                              py: '2px !important',
                              px: '10px !important',
                              pr: '24px !important',
                              display: 'flex',
                              alignItems: 'center',
                            },
                            '& .MuiSvgIcon-root': {
                              color: style.color,
                              fontSize: '1rem',
                              right: 4,
                            },
                          }}
                        >
                          <MenuItem value="INITIAL" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#15803d' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#16a34a', mr: 1 }} />
                            INITIAL
                          </MenuItem>
                          <MenuItem value="EXISTING" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#1d4ed8' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#2563eb', mr: 1 }} />
                            EXISTING
                          </MenuItem>
                          <MenuItem value="REJOIN" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#7e22ce' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#9333ea', mr: 1 }} />
                            REJOIN
                          </MenuItem>
                          <MenuItem value="TRANSFER" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#b45309' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#d97706', mr: 1 }} />
                            TRANSFER
                          </MenuItem>
                          <MenuItem value="VACATE" sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#b91c1c' }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#dc2626', mr: 1 }} />
                            VACATE
                          </MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Avatar
                            sx={{
                              width: 30,
                              height: 30,
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              bgcolor: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe',
                            }}
                          >
                            {initial}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                              {h.studentName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {h.studentId}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {h.fromRoom ? (
                          <Chip label={`Room ${h.fromRoom} (${h.fromBedId})`} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {h.toRoom ? (
                          <Chip label={`Room ${h.toRoom} (${h.toBedId})`} size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, fontSize: '0.75rem' }} />
                        ) : (
                          <Typography variant="caption" sx={{ color: '#94a3b8' }}>-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ color: '#475569', fontSize: '0.85rem' }}>
                        {h.allocationDate ? new Date(h.allocationDate).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                        {h.allocatedBy || 'ADMIN'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {h.remarks || 'Standard allocation'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Transfer Modal */}
      <Dialog open={transferModalOpen} onClose={() => setTransferModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Transfer Resident to Another Bed</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            When transferred, the student's current bed will be marked <strong>AVAILABLE</strong> and the target bed will become <strong>OCCUPIED</strong>.
          </Typography>

          <TextField
            select
            label="Select Resident *"
            fullWidth
            size="small"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
          >
            <MenuItem value="">-- Select Active Resident --</MenuItem>
            {activeStudents.map((s) => (
              <MenuItem key={s.id} value={s.studentId}>
                {s.fullName} ({s.studentId} • Room {s.roomNumber}, Bed {s.bedNumber})
              </MenuItem>
            ))}
          </TextField>

          {selectedStudentObj && (
            <Box sx={{ bgcolor: '#f1f5f9', p: 1.5, borderRadius: 1.5 }}>
              <Typography variant="caption" sx={{ color: '#475569' }}>
                CURRENT ALLOCATION:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Room {selectedStudentObj.roomNumber}, Bed #{selectedStudentObj.bedNumber} ({selectedStudentObj.bedId})
              </Typography>
            </Box>
          )}

          <TextField
            select
            label="Target Room *"
            fullWidth
            size="small"
            value={targetRoom}
            onChange={(e) => handleTargetRoomChange(e.target.value)}
          >
            <MenuItem value="">-- Select Target Room --</MenuItem>
            {rooms.map((r) => (
              <MenuItem key={r.id} value={r.roomNumber}>
                Room {r.roomNumber} (Floor {r.floor} • {r.availableBeds} beds available)
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Target Bed *"
            fullWidth
            size="small"
            value={targetBedId}
            onChange={(e) => setTargetBedId(e.target.value)}
            disabled={!targetRoom || availableBeds.length === 0}
            helperText={
              targetRoom && availableBeds.length === 0
                ? 'No free beds in this room'
                : 'Only AVAILABLE beds can be chosen'
            }
          >
            <MenuItem value="">-- Select Free Bed --</MenuItem>
            {availableBeds.map((b) => (
              <MenuItem key={b.id} value={b.bedId}>
                Bed #{b.bedNumber} ({b.bedId})
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Transfer Reason"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            placeholder="e.g. Student requested AC room / floor change"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTransferModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleExecuteTransfer}
            disabled={isTransferring || !selectedStudentId || !targetBedId}
          >
            Confirm Bed Transfer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
