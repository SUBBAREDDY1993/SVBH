import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { reportService } from '../services/reportService';
import { CollectionReport, OccupancyReport, RevenueReport } from '../types';

export const Reports: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0: Occupancy, 1: Revenue, 2: Collection
  const [occupancy, setOccupancy] = useState<OccupancyReport | null>(null);
  const [revenue, setRevenue] = useState<RevenueReport | null>(null);
  const [collection, setCollection] = useState<CollectionReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const [occ, rev, col] = await Promise.all([
        reportService.getOccupancyReport(),
        reportService.getRevenueReport(),
        reportService.getCollectionReport(),
      ]);
      setOccupancy(occ);
      setRevenue(rev);
      setCollection(col);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }} className="no-print">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Reports & Analytics
          </Typography>
          <Typography variant="body2" sx={{ color: '#64748b', mt: 0.5 }}>
            Operational occupancy, financial collections, and monthly revenue statements
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => reportService.downloadStudentsCsv()}
            sx={{ borderColor: '#cbd5e1', color: '#334155' }}
          >
            Students CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => reportService.downloadPaymentsCsv()}
            sx={{ borderColor: '#cbd5e1', color: '#334155' }}
          >
            Payments CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => window.print()}
            sx={{ bgcolor: '#1e3a8a' }}
          >
            Print Report
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }} className="no-print">
        <Tabs value={tabIndex} onChange={(_e, v) => setTabIndex(v)}>
          <Tab label="Occupancy Report" sx={{ fontWeight: 600 }} />
          <Tab label="Monthly Revenue Report" sx={{ fontWeight: 600 }} />
          <Tab label="Payment & Collection Metrics" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {/* Print Header */}
      <Box sx={{ display: 'none', mb: 3, textAlign: 'center' }} className="print-only">
        <Typography variant="h5" sx={{ fontWeight: 800 }}>Sri Venkateswara Boys Hostel</Typography>
        <Typography variant="body2">Hostel Operations & Management Report</Typography>
      </Box>

      {/* Tab 0: Occupancy Report */}
      {tabIndex === 0 && occupancy && (
        <Box>
          {/* Summary KPIs */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #1e3a8a' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL CAPACITY</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1 }}>{occupancy.totalBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Total beds installed</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #ef4444' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>OCCUPIED BEDS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#dc2626' }}>{occupancy.occupiedBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 600 }}>{occupancy.occupancyPercentage}% Occupied</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #10b981' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>AVAILABLE BEDS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#059669' }}>{occupancy.availableBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>Ready for admission</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card sx={{ bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #f59e0b' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>RESERVED BEDS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#d97706' }}>{occupancy.reservedBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Advance bookings</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Floor-by-Floor Breakdown Cards */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Floor-by-Floor Occupancy Breakdown</Typography>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {occupancy.floorBreakdown.map((fb) => (
              <Grid item xs={12} sm={4} key={fb.floor}>
                <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Floor {fb.floor}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#2563eb' }}>
                        {fb.occupancyPercentage}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={fb.occupancyPercentage}
                      sx={{ height: 8, borderRadius: 4, mb: 2, bgcolor: '#f1f5f9' }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" sx={{ color: '#64748b' }}>Total: <strong>{fb.totalBeds}</strong></Typography>
                      <Typography variant="caption" sx={{ color: '#dc2626' }}>Occupied: <strong>{fb.occupiedBeds}</strong></Typography>
                      <Typography variant="caption" sx={{ color: '#059669' }}>Available: <strong>{fb.availableBeds}</strong></Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Room-by-Room Breakdown Table */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Detailed Room Occupancy</Typography>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Room No</TableCell>
                    <TableCell>Floor</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Total Beds</TableCell>
                    <TableCell>Occupied</TableCell>
                    <TableCell>Available</TableCell>
                    <TableCell>Default Rent</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {occupancy.roomBreakdown.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>Room {r.roomNumber}</TableCell>
                      <TableCell>Floor {r.floor}</TableCell>
                      <TableCell>{r.roomType?.replace('_', ' ')}</TableCell>
                      <TableCell>{r.totalBeds}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#dc2626' }}>{r.occupiedBeds}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#059669' }}>{r.availableBeds}</TableCell>
                      <TableCell>₹{r.defaultRent?.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right">
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: r.status === 'AVAILABLE' ? '#059669' : r.status === 'FULLY_OCCUPIED' ? '#dc2626' : '#d97706',
                          }}
                        >
                          {r.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Tab 1: Monthly Revenue Report */}
      {tabIndex === 1 && revenue && (
        <Box>
          <Card sx={{ mb: 3, bgcolor: '#ffffff', borderRadius: 3, borderLeft: '4px solid #10b981' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>ANNUAL TOTAL REVENUE</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 1, color: '#059669' }}>
                ₹{revenue.totalRevenueYear?.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Calculated across all confirmed payment receipts
              </Typography>
            </CardContent>
          </Card>

          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Month</TableCell>
                    <TableCell>Year</TableCell>
                    <TableCell>Confirmed Transactions</TableCell>
                    <TableCell align="right">Monthly Collection (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenue.monthlyRevenues.map((m) => (
                    <TableRow key={m.month} hover>
                      <TableCell sx={{ fontWeight: 700, color: '#1e3a8a' }}>{m.month}</TableCell>
                      <TableCell>{m.year}</TableCell>
                      <TableCell>{m.transactionCount} transactions</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: m.amount > 0 ? '#10b981' : '#94a3b8' }}>
                        ₹{m.amount?.toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Box>
      )}

      {/* Tab 2: Payment & Collection Metrics */}
      {tabIndex === 2 && collection && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL COLLECTION</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#059669' }}>
                  ₹{collection.totalCollection?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>COLLECTION TODAY</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#2563eb' }}>
                  ₹{collection.collectionToday?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>COLLECTION THIS MONTH</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#1e3a8a' }}>
                  ₹{collection.collectionThisMonth?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#ffffff', borderRadius: 3 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>TOTAL OVERDUE</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#dc2626' }}>
                  ₹{collection.totalOverdue?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Collection by Method */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Collection by Payment Method</Typography>
              <Table size="small">
                <TableBody>
                  {Object.entries(collection.collectionByMethod || {}).map(([method, amt]) => (
                    <TableRow key={method}>
                      <TableCell sx={{ fontWeight: 600 }}>{method}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#059669' }}>
                        ₹{Number(amt).toLocaleString('en-IN')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};
