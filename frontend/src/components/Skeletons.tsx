import React from 'react';
import { Box, Card, CardContent, Grid, Skeleton, TableCell, TableRow } from '@mui/material';

export const MetricSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <Grid container spacing={2.5}>
      {Array.from(new Array(count)).map((_, idx) => (
        <Grid item xs={12} sm={6} md={3} key={idx}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Skeleton variant="text" width="60%" height={24} />
              <Skeleton variant="circular" width={40} height={40} />
            </Box>
            <Skeleton variant="text" width="40%" height={40} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" height={18} />
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <>
      {Array.from(new Array(rows)).map((_, rIdx) => (
        <TableRow key={rIdx}>
          {Array.from(new Array(cols)).map((_, cIdx) => (
            <TableCell key={cIdx}>
              <Skeleton variant="text" width={cIdx === 0 ? '70%' : '50%'} height={24} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};

export const BedGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <Grid container spacing={2.5}>
      {Array.from(new Array(count)).map((_, idx) => (
        <Grid item xs={12} md={6} lg={4} key={idx}>
          <Card sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Skeleton variant="text" width="40%" height={32} />
              <Skeleton variant="rounded" width={80} height={26} />
            </Box>
            <Skeleton variant="text" width="60%" height={20} sx={{ mb: 2 }} />
            <Grid container spacing={1.5}>
              {[1, 2, 3, 4].map((b) => (
                <Grid item xs={6} key={b}>
                  <Skeleton variant="rounded" height={100} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
