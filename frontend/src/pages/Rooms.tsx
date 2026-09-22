import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Divider,
  Grid,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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
          floor,
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
      showError(err.response?.data?.message || 'Failed to save room');
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

  const filteredRooms = selectedFloor === 0
    ? rooms
    : rooms.filter((r) => r.floor === selectedFloor);

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Room & Bed Management
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Interactive bed matrix, occupancy tracking, and capacity allocation
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenAddRoom}
            sx={{ bgcolor: '#2563eb' }}
          >
            Add New Room
          </Button>
        )}
      </Box>

      {/* Floor Filter Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedFloor}
          onChange={(_e, v) => setSelectedFloor(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="All Floors" value={0} sx={{ fontWeight: 600 }} />
          <Tab label="Floor 1" value={1} sx={{ fontWeight: 600 }} />
          <Tab label="Floor 2" value={2} sx={{ fontWeight: 600 }} />
          <Tab label="Floor 3" value={3} sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Loading state */}
      {isLoading ? (
        <BedGridSkeleton count={6} />
      ) : filteredRooms.length === 0 ? (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 3, border: '1px solid #e2e8f0' }}>
          <MeetingRoomIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
          <Typography variant="h6" sx={{ color: '#334155' }}>No rooms found on this floor</Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            Click "Add New Room" to set up rooms and beds.
          </Typography>
        </Box>
      ) : (
        /* Room Cards Grid */
        <Grid container spacing={3}>
          {filteredRooms.map((room) => (
            <Grid item xs={12} lg={6} key={room.id}>
              <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
                <CardContent sx={{ p: 2.5 }}>
                  {/* Room Meta Bar */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box
                        sx={{
                          bgcolor: '#1e3a8a',
                          color: '#ffffff',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontWeight: 800,
                          fontSize: '1rem',
                        }}
                      >
                        Room {room.roomNumber}
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                          Floor {room.floor} • {room.roomType?.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Rent: ₹{room.defaultRent?.toLocaleString('en-IN')}/month
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StatusChip status={room.status} />
                      {isAdmin && (
                        <>
                          <Button
                            size="small"
                            onClick={() => handleOpenEditRoom(room)}
                            sx={{ minWidth: 32, p: 0.5, color: '#64748b' }}
                          >
                            <EditIcon fontSize="small" />
                          </Button>
                          <Button
                            size="small"
                            onClick={() => {
                              setRoomToDelete(room);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={{ minWidth: 32, p: 0.5, color: '#ef4444' }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </Button>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Bed Summary Stats */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2, bgcolor: '#f8fafc', p: 1.2, borderRadius: 1.5 }}>
                    <Typography variant="caption" sx={{ color: '#64748b' }}>
                      Total Beds: <strong>{room.totalBeds}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#dc2626' }}>
                      Occupied: <strong>{room.occupiedBeds}</strong>
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669' }}>
                      Available: <strong>{room.availableBeds}</strong>
                    </Typography>
                  </Box>

                  {/* Visual Bed Availability Matrix */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', mb: 1, display: 'block' }}>
                    BED AVAILABILITY:
                  </Typography>

                  <Grid container spacing={1.5}>
                    {room.beds?.map((bed) => (
                      <Grid item xs={6} sm={4} key={bed.id}>
                        <BedCard
                          bed={bed}
                          onAllocate={(b) => navigate(`/students/new?room=${room.roomNumber}&bed=${b.bedId}`)}
                          onViewStudent={(studId) => navigate(`/students/${studId}`)}
                          onTransfer={() => navigate(`/allocations`)}
                          onStatusChange={isAdmin ? handleOpenBedStatus : undefined}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {/* Add Bed to Room button (Admin only) */}
                  {isAdmin && (
                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => handleAddBed(room.roomNumber)}
                        sx={{ fontSize: '0.8rem', color: '#2563eb' }}
                      >
                        + Add Extra Bed to Room {room.roomNumber}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
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
