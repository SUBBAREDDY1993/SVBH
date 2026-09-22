import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Paper,
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
import { studentService } from '../services/studentService';
import { roomService } from '../services/roomService';
import { allocationService } from '../services/allocationService';
import { AllocationHistory, Bed, Room, Student } from '../types';
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

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
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
          sx={{ bgcolor: '#2563eb' }}
        >
          Transfer Resident Bed
        </Button>
      </Box>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ACTIVE RESIDENTS</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#1e3a8a' }}>
                {activeStudents.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Assigned to beds</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>FREE BEDS READY</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#10b981' }}>
                {rooms.reduce((acc, r) => acc + (r.availableBeds || 0), 0)}
              </Typography>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>Available for transfer</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL ALLOCATION EVENTS</Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#475569' }}>
                {histories.length}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b' }}>Historical records kept</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Allocation History Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e2e8f0' }}>
          <HistoryIcon sx={{ color: '#1e3a8a' }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Allocation & Transfer Audit History
          </Typography>
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress />
          </Box>
        ) : histories.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: '#64748b' }}>No allocation history found</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Student Name</TableCell>
                  <TableCell>From Bed</TableCell>
                  <TableCell>To Bed</TableCell>
                  <TableCell>Date & Time</TableCell>
                  <TableCell>Handled By</TableCell>
                  <TableCell>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {histories.map((h) => (
                  <TableRow key={h.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.2,
                          borderRadius: 1,
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor:
                            h.type === 'INITIAL'
                              ? '#dcfce7'
                              : h.type === 'TRANSFER'
                              ? '#fef3c7'
                              : '#fee2e2',
                          color:
                            h.type === 'INITIAL'
                              ? '#166534'
                              : h.type === 'TRANSFER'
                              ? '#92400e'
                              : '#991b1b',
                        }}
                      >
                        {h.type}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>{h.studentId}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{h.studentName}</TableCell>
                    <TableCell>{h.fromRoom ? `Room ${h.fromRoom} (${h.fromBedId})` : '-'}</TableCell>
                    <TableCell>{h.toRoom ? `Room ${h.toRoom} (${h.toBedId})` : '-'}</TableCell>
                    <TableCell>{h.allocationDate ? new Date(h.allocationDate).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>{h.allocatedBy || 'ADMIN'}</TableCell>
                    <TableCell>{h.remarks || 'Standard allocation'}</TableCell>
                  </TableRow>
                ))}
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
