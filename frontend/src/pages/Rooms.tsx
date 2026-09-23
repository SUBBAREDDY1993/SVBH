import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import { roomService } from '../services/roomService';
import { bedService } from '../services/bedService';
import { Bed, BedStatus, Room, RoomStatus, RoomType } from '../types';
import { BedCard } from '../components/BedCard';
import { StatusChip } from '../components/StatusChip';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { BedGridSkeleton } from '../components/Skeletons';

export const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number>(0); // 0 = All Floors
  const [isLoading, setIsLoading] = useState(true);

  // Add / Edit Room Modal
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState(1);
  const [totalBeds, setTotalBeds] = useState(4);
  const [roomType, setRoomType] = useState<RoomType>('NON_AC');
  const [defaultRent, setDefaultRent] = useState(5000);
  const [notes, setNotes] = useState('');
  const [isSavingRoom, setIsSavingRoom] = useState(false);

  // Bed Status Change Modal
  const [bedModalOpen, setBedModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
  const [newBedStatus, setNewBedStatus] = useState<BedStatus>('AVAILABLE');
  const [bedNotes, setBedNotes] = useState('');

  // Delete Room Confirmation
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const { isAdmin } = useAuth();

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const data = await roomService.getAllRooms(true);
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const handleOpenAddRoom = () => {
    setEditingRoom(null);
    setRoomNumber('');
    setFloor(1);
    setTotalBeds(4);
    setRoomType('NON_AC');
    setDefaultRent(5000);
    setNotes('');
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (room: Room) => {
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setFloor(room.floor);
    setTotalBeds(room.totalBeds);
    setRoomType(room.roomType);
    setDefaultRent(room.defaultRent || 5000);
    setNotes(room.notes || '');
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async () => {
    if (!roomNumber.trim()) {
      showError('Please enter a room number');
      return;
    }

    try {
      setIsSavingRoom(true);
      if (editingRoom) {
        await roomService.updateRoom(editingRoom.id, {
          roomNumber,
          floor,
          totalBeds: editingRoom.totalBeds,
          roomType,
          defaultRent,
          notes,
        });
        showSuccess(`Room ${roomNumber} updated successfully`);
      } else {
        await roomService.createRoom({
          roomNumber,
          floor,
          totalBeds,
          roomType,
          defaultRent,
          notes,
        });
        showSuccess(`Room ${roomNumber} created with ${totalBeds} beds`);
      }
      setRoomModalOpen(false);
      loadRooms();
    } catch (err: any) {
      const errData = err.response?.data;
      let errorMsg = errData?.message || 'Failed to save room';
      if (errData?.data && typeof errData.data === 'object') {
        const details = Object.values(errData.data).join(', ');
        if (details) errorMsg = `${errorMsg}: ${details}`;
      }
      showError(errorMsg);
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!roomToDelete) return;
    try {
      await roomService.deleteRoom(roomToDelete.id);
      showSuccess(`Room ${roomToDelete.roomNumber} deleted successfully`);
      setDeleteConfirmOpen(false);
      loadRooms();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleAddBed = async (roomNum: string) => {
    try {
      await bedService.addBedToRoom(roomNum);
      showSuccess(`Added an additional bed to Room ${roomNum}`);
      loadRooms();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to add bed');
    }
  };

  const handleOpenBedStatus = (bed: Bed) => {
    setSelectedBed(bed);
    setNewBedStatus(bed.status);
    setBedNotes(bed.notes || '');
    setBedModalOpen(true);
  };

  const handleSaveBedStatus = async () => {
    if (!selectedBed) return;
    try {
      await bedService.updateBedStatus(selectedBed.bedId, newBedStatus, bedNotes);
      showSuccess(`Bed ${selectedBed.bedId} status updated to ${newBedStatus}`);
      setBedModalOpen(false);
      loadRooms();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to update bed status');
    }
  };

  const [roomViewMode, setRoomViewMode] = useState<'cards' | 'table'>('cards');
  const [bedViewMode, setBedViewMode] = useState<'row' | 'card'>('row');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const floorNumbers = Array.from(new Set(rooms.map((r) => r.floor))).sort((a, b) => a - b);
  const floorsToDisplay = floorNumbers.length > 0 ? floorNumbers : [1, 2, 3, 4, 5, 6];

  const getFloorBedCount = (floorNum: number) => {
    return rooms
      .filter((r) => r.floor === floorNum)
      .reduce((sum, r) => sum + (r.totalBeds || 0), 0);
  };

  // Metrics
  const totalRoomsCount = rooms.length;
  const totalBedsCount = rooms.reduce((sum, r) => sum + (r.totalBeds || 0), 0);
  const occupiedBedsCount = rooms.reduce((sum, r) => sum + (r.occupiedBeds || 0), 0);
  const availableBedsCount = rooms.reduce((sum, r) => sum + (r.availableBeds || 0), 0);
  const overallOccupancy = totalBedsCount > 0 ? Math.round((occupiedBedsCount / totalBedsCount) * 100) : 0;

  const filteredRooms = rooms.filter((r) => {
    const matchesFloor = selectedFloor === 0 || r.floor === selectedFloor;
    const matchesSearch = !searchQuery || r.roomNumber.toLowerCase().includes(searchQuery.toLowerCase()) || r.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'ALL' || r.roomType === selectedType;
    return matchesFloor && matchesSearch && matchesType;
  });

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Room & Bed Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Interactive bed matrix, occupancy tracking, and capacity allocation across 6 floors
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {/* View mode toggle */}
          <ToggleButtonGroup
            size="small"
            value={roomViewMode}
            exclusive
            onChange={(_e, val) => val && setRoomViewMode(val)}
            sx={{ bgcolor: '#ffffff' }}
          >
            <ToggleButton value="cards" sx={{ px: 1.5, py: 0.5 }}>
              <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Cards
            </ToggleButton>
            <ToggleButton value="table" sx={{ px: 1.5, py: 0.5 }}>
              <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Table
            </ToggleButton>
          </ToggleButtonGroup>

          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddRoom}
              sx={{ bgcolor: '#2563eb', fontWeight: 700 }}
            >
              Add New Room
            </Button>
          )}
        </Box>
      </Box>

      {/* Overview Stat Cards Bar */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #1e3a8a', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>TOTAL ROOMS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>{totalRoomsCount}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Across 6 floors</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #3b82f6', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>TOTAL BEDS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1d4ed8', mt: 0.5 }}>{totalBedsCount}</Typography>
            <Typography variant="caption" sx={{ color: '#64748b' }}>Configured capacity</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #10b981', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#047857', fontWeight: 700 }}>AVAILABLE BEDS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>{availableBedsCount}</Typography>
            <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>Ready to allocate</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #ef4444', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700 }}>OCCUPIED BEDS</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#dc2626', mt: 0.5 }}>{occupiedBedsCount}</Typography>
            <Typography variant="caption" sx={{ color: '#dc2626' }}>Active residents</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={8} md={2.4}>
          <Paper sx={{ p: 2, borderRadius: 2.5, borderLeft: '4px solid #8b5cf6', bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ color: '#6d28d9', fontWeight: 700 }}>OCCUPANCY RATE</Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#7c3aed', mt: 0.5 }}>{overallOccupancy}%</Typography>
            <LinearProgress
              variant="determinate"
              value={overallOccupancy}
              sx={{ height: 6, borderRadius: 3, mt: 0.75, bgcolor: '#ede9fe', '& .MuiLinearProgress-bar': { bgcolor: '#7c3aed' } }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Filter and Search Bar */}
      <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <TextField
                size="small"
                fullWidth
                placeholder="Search room (e.g. 101, 201)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4} md={3}>
              <TextField
                select
                size="small"
                fullWidth
                label="Room Type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <MenuItem value="ALL">All Room Types</MenuItem>
                <MenuItem value="NON_AC">Standard Non-AC</MenuItem>
                <MenuItem value="AC">Air Conditioned (AC)</MenuItem>
                <MenuItem value="ATTACHED_BATHROOM">Attached Bathroom</MenuItem>
                <MenuItem value="STANDARD">Standard</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={4} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', md: 'flex-end' }, gap: 1 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                  Bed Layout View:
                </Typography>
                <ToggleButtonGroup
                  size="small"
                  value={bedViewMode}
                  exclusive
                  onChange={(_e, val) => val && setBedViewMode(val)}
                  sx={{ bgcolor: '#f8fafc' }}
                >
                  <ToggleButton value="row" sx={{ px: 1.25, py: 0.3, fontSize: '0.75rem', fontWeight: 700 }}>
                    <ViewHeadlineIcon fontSize="small" sx={{ mr: 0.5 }} /> Row Format
                  </ToggleButton>
                  <ToggleButton value="card" sx={{ px: 1.25, py: 0.3, fontSize: '0.75rem', fontWeight: 700 }}>
                    <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Grid Format
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Floor Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedFloor}
          onChange={(_e, v) => setSelectedFloor(v)}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`All Floors (${rooms.length} Rooms)`} value={0} sx={{ fontWeight: 700 }} />
          {floorsToDisplay.map((f) => {
            const count = getFloorBedCount(f);
            const rCount = rooms.filter((r) => r.floor === f).length;
            return (
              <Tab
                key={f}
                label={`Floor ${f} • ${rCount} Rooms (${count} Beds)`}
                value={f}
                sx={{ fontWeight: 600 }}
              />
            );
          })}
        </Tabs>
      </Box>

      {/* Loading state */}
      {isLoading ? (
        <BedGridSkeleton count={6} />
      ) : filteredRooms.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <MeetingRoomIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
          <Typography variant="h6" sx={{ color: '#334155', fontWeight: 700 }}>No rooms match your filter criteria</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Try selecting a different floor, clearing search text, or click "Add New Room" to create one.
          </Typography>
        </Box>
      ) : roomViewMode === 'table' ? (
        /* Compact Rooms Table Mode */
        <Paper sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Room</TableCell>
                  <TableCell>Floor</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Rent / Month</TableCell>
                  <TableCell>Occupancy Status</TableCell>
                  <TableCell>Beds List</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRooms.map((room) => {
                  const percent = room.totalBeds > 0 ? Math.round((room.occupiedBeds / room.totalBeds) * 100) : 0;
                  return (
                    <TableRow key={room.id} hover>
                      <TableCell sx={{ fontWeight: 800, color: '#1e3a8a', fontSize: '1rem' }}>
                        Room {room.roomNumber}
                      </TableCell>
                      <TableCell>Floor {room.floor}</TableCell>
                      <TableCell>
                        <Chip label={room.roomType?.replace('_', ' ')} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        ₹{room.defaultRent?.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell sx={{ minWidth: 160 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <StatusChip status={room.status} />
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {room.occupiedBeds}/{room.totalBeds} ({percent}%)
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: '#e2e8f0',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: percent >= 100 ? '#dc2626' : percent > 0 ? '#f59e0b' : '#10b981',
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                          {room.beds?.map((b) => (
                            <Chip
                              key={b.id}
                              size="small"
                              label={`Bed ${b.bedNumber}: ${b.status}`}
                              color={b.status === 'AVAILABLE' ? 'success' : b.status === 'OCCUPIED' ? 'error' : 'warning'}
                              variant={b.status === 'AVAILABLE' ? 'outlined' : 'filled'}
                              sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                          {isAdmin && (
                            <>
                              <Tooltip title="Add Bed">
                                <IconButton size="small" onClick={() => handleAddBed(room.roomNumber)} sx={{ color: '#2563eb' }}>
                                  <AddIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Room">
                                <IconButton size="small" onClick={() => handleOpenEditRoom(room)} sx={{ color: '#64748b' }}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Room">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setRoomToDelete(room);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  sx={{ color: '#ef4444' }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ) : (
        /* Room Cards Grid */
        <Grid container spacing={3}>
          {filteredRooms.map((room) => {
            const occupancyRatio = room.totalBeds > 0 ? (room.occupiedBeds / room.totalBeds) * 100 : 0;
            return (
              <Grid item xs={12} lg={6} key={room.id}>
                <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    {/* Room Meta Bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                            color: '#ffffff',
                            px: 1.75,
                            py: 0.6,
                            borderRadius: 2,
                            fontWeight: 800,
                            fontSize: '1.05rem',
                            letterSpacing: '0.02em',
                            boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                          }}
                        >
                          Room {room.roomNumber}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
                            Floor {room.floor} • {room.roomType?.replace('_', ' ')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                            ₹{room.defaultRent?.toLocaleString('en-IN')} / month
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusChip status={room.status} />
                        {isAdmin && (
                          <>
                            <Tooltip title="Edit Room Details">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditRoom(room)}
                                sx={{ p: 0.6, color: '#64748b', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Room">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setRoomToDelete(room);
                                  setDeleteConfirmOpen(true);
                                }}
                                sx={{ p: 0.6, color: '#ef4444', bgcolor: '#fef2f2', border: '1px solid #fecaca' }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </Box>

                    {/* Bed Summary Stats & Progress Bar */}
                    <Box sx={{ mb: 2.5, bgcolor: '#f8fafc', p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569' }}>
                          Occupancy: <strong>{room.occupiedBeds}</strong> of <strong>{room.totalBeds}</strong> Beds ({Math.round(occupancyRatio)}%)
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                          <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>
                            ● {room.availableBeds} Free
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                            ● {room.occupiedBeds} Taken
                          </Typography>
                        </Box>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={occupancyRatio}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: occupancyRatio >= 100 ? '#ef4444' : occupancyRatio > 0 ? '#f59e0b' : '#10b981',
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>

                    {/* Visual Bed Availability Section */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.25 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Bed Availability ({room.beds?.length || 0} Beds):
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                        {bedViewMode === 'row' ? 'Horizontal Row Format' : 'Grid Cards Format'}
                      </Typography>
                    </Box>

                    {/* Beds Rendered in Row Format (or Grid) */}
                    {bedViewMode === 'row' ? (
                      <Stack spacing={1}>
                        {room.beds?.map((bed) => (
                          <BedCard
                            key={bed.id}
                            bed={bed}
                            variant="row"
                            onAllocate={(b) => navigate(`/students/new?room=${room.roomNumber}&bed=${b.bedId}`)}
                            onViewStudent={(studId) => navigate(`/students/${studId}`)}
                            onTransfer={() => navigate(`/allocations`)}
                            onStatusChange={isAdmin ? handleOpenBedStatus : undefined}
                          />
                        ))}
                      </Stack>
                    ) : (
                      <Grid container spacing={1.5}>
                        {room.beds?.map((bed) => (
                          <Grid item xs={12} sm={6} key={bed.id}>
                            <BedCard
                              bed={bed}
                              variant="card"
                              onAllocate={(b) => navigate(`/students/new?room=${room.roomNumber}&bed=${b.bedId}`)}
                              onViewStudent={(studId) => navigate(`/students/${studId}`)}
                              onTransfer={() => navigate(`/allocations`)}
                              onStatusChange={isAdmin ? handleOpenBedStatus : undefined}
                            />
                          </Grid>
                        ))}
                      </Grid>
                    )}

                    {/* Add Bed to Room button (Admin only) */}
                    {isAdmin && (
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          variant="text"
                          startIcon={<AddIcon fontSize="small" />}
                          onClick={() => handleAddBed(room.roomNumber)}
                          sx={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 700 }}
                        >
                          Add Extra Bed to Room {room.roomNumber}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit Room Modal */}
      <Dialog open={roomModalOpen} onClose={() => setRoomModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingRoom ? `Edit Room ${editingRoom.roomNumber}` : 'Add New Room'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Room Number"
            size="small"
            fullWidth
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            disabled={!!editingRoom}
            placeholder="e.g. 101, 204"
          />

          <TextField
            label="Floor"
            type="number"
            size="small"
            fullWidth
            value={floor}
            onChange={(e) => setFloor(Number(e.target.value))}
            inputProps={{ min: 1, max: 10 }}
          />

          {!editingRoom && (
            <TextField
              label="Number of Beds"
              type="number"
              size="small"
              fullWidth
              value={totalBeds}
              onChange={(e) => setTotalBeds(Number(e.target.value))}
              inputProps={{ min: 1, max: 10 }}
              helperText="Beds will be automatically created (e.g. Bed 1..N)"
            />
          )}

          <TextField
            select
            label="Room Type"
            size="small"
            fullWidth
            value={roomType}
            onChange={(e) => setRoomType(e.target.value as RoomType)}
          >
            <MenuItem value="NON_AC">Standard Non-AC</MenuItem>
            <MenuItem value="AC">Air Conditioned (AC)</MenuItem>
            <MenuItem value="ATTACHED_BATHROOM">Attached Bathroom</MenuItem>
            <MenuItem value="STANDARD">Standard</MenuItem>
          </TextField>

          <TextField
            label="Default Monthly Rent (₹)"
            type="number"
            size="small"
            fullWidth
            value={defaultRent}
            onChange={(e) => setDefaultRent(Number(e.target.value))}
          />

          <TextField
            label="Notes"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any special remarks or amenities"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRoomModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveRoom} disabled={isSavingRoom}>
            {editingRoom ? 'Update Room' : 'Create Room'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bed Status Change Modal */}
      <Dialog open={bedModalOpen} onClose={() => setBedModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Manage Bed {selectedBed?.bedId}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Room {selectedBed?.roomNumber}, Bed #{selectedBed?.bedNumber}
          </Typography>

          <TextField
            select
            label="Bed Status"
            size="small"
            fullWidth
            value={newBedStatus}
            onChange={(e) => setNewBedStatus(e.target.value as BedStatus)}
            disabled={selectedBed?.status === 'OCCUPIED'}
            helperText={selectedBed?.status === 'OCCUPIED' ? 'Vacate student first to change status' : ''}
          >
            <MenuItem value="AVAILABLE">AVAILABLE (Vacant)</MenuItem>
            <MenuItem value="RESERVED">RESERVED (Hold for upcoming student)</MenuItem>
            <MenuItem value="MAINTENANCE">MAINTENANCE (Repair/Cleaning)</MenuItem>
          </TextField>

          <TextField
            label="Status Notes"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={bedNotes}
            onChange={(e) => setBedNotes(e.target.value)}
            placeholder="e.g. Painting work, reserved for Sai"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBedModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveBedStatus}
            disabled={selectedBed?.status === 'OCCUPIED'}
          >
            Save Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteConfirmOpen}
        title="Delete Room"
        message={`Are you sure you want to delete Room ${roomToDelete?.roomNumber}? This will also delete all its beds.`}
        confirmText="Delete"
        confirmColor="error"
        onConfirm={handleDeleteRoom}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
