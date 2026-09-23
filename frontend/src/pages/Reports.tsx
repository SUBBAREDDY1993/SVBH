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
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12} sm={3}>
              <Card className="pro-card" sx={{ borderTop: '4px solid #1e3a8a' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#1e3a8a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>TOTAL CAPACITY</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#0f172a' }}>{occupancy.totalBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Total beds installed</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card className="pro-card" sx={{ borderTop: '4px solid #ef4444' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>OCCUPIED BEDS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#dc2626' }}>{occupancy.occupiedBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>{occupancy.occupancyPercentage}% Occupied</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card className="pro-card" sx={{ borderTop: '4px solid #10b981' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>AVAILABLE BEDS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#047857' }}>{occupancy.availableBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700 }}>Ready for admission</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Card className="pro-card" sx={{ borderTop: '4px solid #f59e0b' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" sx={{ color: '#d97706', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>RESERVED BEDS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#b45309' }}>{occupancy.reservedBeds}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>Advance bookings</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Floor-by-Floor Breakdown Cards */}
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>Floor-by-Floor Occupancy Breakdown</Typography>
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {occupancy.floorBreakdown.map((fb) => (
              <Grid item xs={12} sm={6} md={4} key={fb.floor}>
                <Card className="pro-card">
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Floor {fb.floor}</Typography>
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
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 2 }}>Detailed Room Occupancy</Typography>
          <Paper className="pro-card" sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Room No</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Floor</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Total Beds</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Occupied</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Available</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Default Rent</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {occupancy.roomBreakdown.map((r) => (
                    <TableRow key={r.id} hover sx={{ '&:hover': { bgcolor: '#fcfdfd' } }}>
                      <TableCell sx={{ fontWeight: 800, color: '#1e3a8a' }}>Room {r.roomNumber}</TableCell>
                      <TableCell>Floor {r.floor}</TableCell>
                      <TableCell>{r.roomType?.replace(/_/g, ' ')}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{r.totalBeds}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#dc2626' }}>{r.occupiedBeds}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#059669' }}>{r.availableBeds}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>₹{r.defaultRent?.toLocaleString('en-IN')}</TableCell>
                      <TableCell align="right">
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 4,
                            backgroundColor: r.status === 'AVAILABLE' ? '#dcfce7' : r.status === 'FULLY_OCCUPIED' ? '#fee2e2' : '#fef3c7',
                            color: r.status === 'AVAILABLE' ? '#15803d' : r.status === 'FULLY_OCCUPIED' ? '#b91c1c' : '#b45309',
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
          <Card className="pro-card" sx={{ mb: 3, borderTop: '4px solid #10b981' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>ANNUAL TOTAL REVENUE</Typography>
              <Typography variant="h3" sx={{ fontWeight: 800, my: 1, color: '#047857' }}>
                ₹{revenue.totalRevenueYear?.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Calculated across all confirmed payment receipts in the database
              </Typography>
            </CardContent>
          </Card>

          <Paper className="pro-card" sx={{ overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Year</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Confirmed Transactions</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569' }}>Monthly Collection (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {revenue.monthlyRevenues.map((m) => (
                    <TableRow key={m.month} hover sx={{ '&:hover': { bgcolor: '#fcfdfd' } }}>
                      <TableCell sx={{ fontWeight: 800, color: '#1e3a8a' }}>{m.month}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{m.year}</TableCell>
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
            <Card className="pro-card" sx={{ borderTop: '4px solid #10b981' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>TOTAL COLLECTION</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#047857' }}>
                  ₹{collection.totalCollection?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="pro-card" sx={{ borderTop: '4px solid #2563eb' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>COLLECTION TODAY</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#2563eb' }}>
                  ₹{collection.collectionToday?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="pro-card" sx={{ borderTop: '4px solid #1e3a8a' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#1e3a8a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>THIS MONTH</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#0f172a' }}>
                  ₹{collection.collectionThisMonth?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card className="pro-card" sx={{ borderTop: '4px solid #ef4444' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>TOTAL OVERDUE</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, mt: 1, color: '#dc2626' }}>
                  ₹{collection.totalOverdue?.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Collection by Method */}
          <Grid item xs={12} md={6}>
            <Paper className="pro-card" sx={{ p: 3, overflow: 'hidden' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: '#0f172a' }}>Collection by Payment Method</Typography>
              <Table size="small">
                <TableBody>
                  {Object.entries(collection.collectionByMethod || {}).map(([method, amt]) => (
                    <TableRow key={method}>
                      <TableCell sx={{ fontWeight: 600 }}>{method}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: '#047857' }}>
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
