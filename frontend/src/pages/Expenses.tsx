import React, { useEffect, useState } from 'react';
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
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TodayIcon from '@mui/icons-material/Today';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import BoltIcon from '@mui/icons-material/Bolt';
import BuildIcon from '@mui/icons-material/Build';
import PeopleIcon from '@mui/icons-material/People';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { expenseService } from '../services/expenseService';
import { reportService } from '../services/reportService';
import { Expense, ExpenseCategory, ExpenseSummary, PaymentMethod, ProfitLossReport } from '../types';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { ConfirmationDialog } from '../components/ConfirmationDialog';

const categoryConfig: Record<
  ExpenseCategory,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  FOOD_MESS: { label: 'Food & Mess', color: '#16a34a', bg: '#dcfce7', icon: <FastfoodIcon fontSize="small" /> },
  UTILITIES: { label: 'Utilities & Bills', color: '#2563eb', bg: '#dbeafe', icon: <BoltIcon fontSize="small" /> },
  MAINTENANCE: { label: 'Maintenance', color: '#d97706', bg: '#fef3c7', icon: <BuildIcon fontSize="small" /> },
  SALARIES: { label: 'Staff Salaries', color: '#9333ea', bg: '#f3e8ff', icon: <PeopleIcon fontSize="small" /> },
  SUPPLIES: { label: 'Cleaning & Supplies', color: '#0d9488', bg: '#ccfbf1', icon: <CleaningServicesIcon fontSize="small" /> },
  MISCELLANEOUS: { label: 'Miscellaneous', color: '#475569', bg: '#f1f5f9', icon: <MoreHorizIcon fontSize="small" /> },
};

export const Expenses: React.FC = () => {
  const { showSuccess, showError } = useNotification();
  const { isAdmin } = useAuth();

  const [tabIndex, setTabIndex] = useState(0); // 0: Ledger, 1: Profit & Loss, 2: Category Breakdown
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLossReport | null>(null);
  const [totalMonthCollection, setTotalMonthCollection] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Add/Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('FOOD_MESS');
  const [amount, setAmount] = useState<number>(0);
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [vendor, setVendor] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [expList, expSummary, plReport, colReport] = await Promise.all([
        expenseService.getExpenses(),
        expenseService.getExpenseSummary(),
        expenseService.getProfitLossReport(new Date().getFullYear()),
        reportService.getCollectionReport(),
      ]);
      setExpenses(expList);
      setSummary(expSummary);
      setProfitLoss(plReport);
      setTotalMonthCollection(colReport.collectionThisMonth || 0);
    } catch (err) {
      console.error('Failed to load expenses data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingExpense(null);
    setTitle('');
    setCategory('FOOD_MESS');
    setAmount(0);
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('CASH');
    setVendor('');
    setBillNumber('');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setCategory(exp.category);
    setAmount(exp.amount);
    setExpenseDate(exp.expenseDate || new Date().toISOString().split('T')[0]);
    setPaymentMethod(exp.paymentMethod || 'CASH');
    setVendor(exp.vendor || '');
    setBillNumber(exp.billNumber || '');
    setNotes(exp.notes || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showError('Please enter an expense title');
      return;
    }
    if (!amount || amount <= 0) {
      showError('Please enter a valid amount greater than 0');
      return;
    }

    try {
      setIsSaving(true);
      const payload: Partial<Expense> = {
        title: title.trim(),
        category,
        amount,
        expenseDate,
        paymentMethod,
        vendor: vendor.trim() || undefined,
        billNumber: billNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      if (editingExpense && editingExpense.id) {
        await expenseService.updateExpense(editingExpense.id, payload);
        showSuccess(`Updated expense: ${title}`);
      } else {
        await expenseService.createExpense(payload);
        showSuccess(`Recorded expense: ₹${amount.toLocaleString('en-IN')}`);
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!expenseToDelete || !expenseToDelete.id) return;
    try {
      setIsDeleting(true);
      await expenseService.deleteExpense(expenseToDelete.id);
      showSuccess('Expense deleted successfully');
      setDeleteDialogOpen(false);
      loadData();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Failed to delete expense');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered expenses
  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.vendor && e.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.billNumber && e.billNumber.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Profit Metrics for current month
  const totalExpensesMonth = summary?.totalExpensesMonth || 0;
  const netProfitMonth = totalMonthCollection - totalExpensesMonth;
  const profitMarginMonth =
    totalMonthCollection > 0
      ? Math.round((netProfitMonth / totalMonthCollection) * 1000) / 10
      : 0;

  return (
    <Box sx={{ pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                bgcolor: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon sx={{ fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 }}>
                Daily Expenses & Profit Tracker
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748b' }}>
                Track daily operational costs, mess food bills, utilities, and calculate net hostel profit
              </Typography>
            </Box>
          </Box>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ fontWeight: 800, px: 2.5, py: 1, textTransform: 'none', borderRadius: 2 }}
        >
          + Record Expense
        </Button>
      </Box>

      {/* Top Financial KPI Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Expenses This Month */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="pro-card" sx={{ borderTop: '4px solid #ef4444' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  EXPENSES (THIS MONTH)
                </Typography>
                <AccountBalanceWalletIcon sx={{ color: '#ef4444' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#dc2626' }}>
                ₹{totalExpensesMonth.toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                {summary?.expenseCountMonth || 0} entries recorded
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Expenses Today */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="pro-card" sx={{ borderTop: '4px solid #f59e0b' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  EXPENSES TODAY
                </Typography>
                <TodayIcon sx={{ color: '#f59e0b' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#d97706' }}>
                ₹{(summary?.expensesToday || 0).toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Daily mess & operational spend
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Net Profit This Month */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="pro-card" sx={{ borderTop: `4px solid ${netProfitMonth >= 0 ? '#10b981' : '#dc2626'}` }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: netProfitMonth >= 0 ? '#15803d' : '#b91c1c',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  NET PROFIT (THIS MONTH)
                </Typography>
                {netProfitMonth >= 0 ? (
                  <TrendingUpIcon sx={{ color: '#10b981' }} />
                ) : (
                  <TrendingDownIcon sx={{ color: '#ef4444' }} />
                )}
              </Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  my: 1,
                  color: netProfitMonth >= 0 ? '#059669' : '#dc2626',
                }}
              >
                ₹{netProfitMonth.toLocaleString('en-IN')}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={`${profitMarginMonth}% Margin`}
                  size="small"
                  sx={{
                    bgcolor: netProfitMonth >= 0 ? '#dcfce7' : '#fee2e2',
                    color: netProfitMonth >= 0 ? '#15803d' : '#b91c1c',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  ₹{totalMonthCollection.toLocaleString('en-IN')} collected
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Annual Net Profit */}
        <Grid item xs={12} sm={6} md={3}>
          <Card className="pro-card" sx={{ borderTop: '4px solid #3b82f6' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  NET PROFIT ({new Date().getFullYear()})
                </Typography>
                <TrendingUpIcon sx={{ color: '#3b82f6' }} />
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 800, my: 1, color: '#1e40af' }}>
                ₹{(profitLoss?.netAnnualProfit || 0).toLocaleString('en-IN')}
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                Annual Margin: {profitLoss?.annualProfitMarginPercentage || 0}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(_e, v) => setTabIndex(v)}>
          <Tab label={`Daily Expense Ledger (${expenses.length})`} sx={{ fontWeight: 700 }} />
          <Tab label="Monthly Profit & Loss Statement" sx={{ fontWeight: 700 }} />
          <Tab label="Expense Breakdown by Category" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Tab 0: Expense Ledger */}
      {tabIndex === 0 && (
        <Paper className="pro-card" sx={{ overflow: 'hidden' }}>
          {/* Filter Bar */}
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
              bgcolor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
            }}
          >
            <TextField
              size="small"
              placeholder="Search expenses, vendors, bills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 280, bgcolor: '#ffffff' }}
            />

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                Category:
              </Typography>
              <TextField
                select
                size="small"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                sx={{ minWidth: 180, bgcolor: '#ffffff' }}
              >
                <MenuItem value="ALL">All Categories</MenuItem>
                <MenuItem value="FOOD_MESS">Food & Mess</MenuItem>
                <MenuItem value="UTILITIES">Utilities & Bills</MenuItem>
                <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                <MenuItem value="SALARIES">Staff Salaries</MenuItem>
                <MenuItem value="SUPPLIES">Cleaning & Supplies</MenuItem>
                <MenuItem value="MISCELLANEOUS">Miscellaneous</MenuItem>
              </TextField>
            </Box>
          </Box>

          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
              <CircularProgress />
            </Box>
          ) : filteredExpenses.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 40, color: '#10b981', mb: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#334155' }}>
                No expenses found
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 0.5 }}>
                Click "+ Record Expense" to log daily mess provisions, utilities, or staff payments.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Expense Title</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Vendor / Store</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Bill / Ref</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Mode</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Amount (₹)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredExpenses.map((exp) => {
                    const cfg = categoryConfig[exp.category] || categoryConfig.MISCELLANEOUS;
                    return (
                      <TableRow key={exp.id} hover sx={{ '&:hover': { bgcolor: '#fcfdfd' } }}>
                        <TableCell sx={{ fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                          {exp.expenseDate}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={cfg.icon as React.ReactElement}
                            label={cfg.label}
                            size="small"
                            sx={{
                              bgcolor: cfg.bg,
                              color: cfg.color,
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                            {exp.title}
                          </Typography>
                          {exp.notes && (
                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                              {exp.notes}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ color: '#475569' }}>{exp.vendor || '-'}</TableCell>
                        <TableCell sx={{ color: '#64748b', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                          {exp.billNumber || '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={exp.paymentMethod}
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 600, fontSize: '0.68rem', height: 20 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem' }}>
                          ₹{exp.amount?.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                            <Tooltip title="Edit Expense">
                              <IconButton size="small" onClick={() => handleOpenEdit(exp)} sx={{ color: '#2563eb' }}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {isAdmin && (
                              <Tooltip title="Delete Expense">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setExpenseToDelete(exp);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{ color: '#dc2626' }}
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Tab 1: Monthly Profit & Loss Statement */}
      {tabIndex === 1 && (
        <Paper className="pro-card" sx={{ overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Monthly Profit & Loss Statement ({new Date().getFullYear()})
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Comparison of total rent collections versus operating expenses and net earnings
            </Typography>
          </Box>

          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Month</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#16a34a' }}>Total Income / Fees (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#dc2626' }}>Total Expenses (₹)</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#0f172a' }}>Net Profit / Loss (₹)</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Profit Margin</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', color: '#475569' }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profitLoss?.monthlyBreakdown?.map((m) => (
                  <TableRow key={m.monthNumber} hover sx={{ '&:hover': { bgcolor: '#fcfdfd' } }}>
                    <TableCell sx={{ fontWeight: 700, color: '#0f172a' }}>{m.month}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#16a34a' }}>
                      ₹{m.totalRevenue?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#dc2626' }}>
                      ₹{m.totalExpenses?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.95rem',
                        color: m.netProfit >= 0 ? '#059669' : '#dc2626',
                      }}
                    >
                      {m.netProfit >= 0 ? '+' : ''}₹{m.netProfit?.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${m.profitMarginPercentage}%`}
                        size="small"
                        sx={{
                          bgcolor: m.profitable ? '#dcfce7' : '#fee2e2',
                          color: m.profitable ? '#15803d' : '#b91c1c',
                          fontWeight: 700,
                          fontSize: '0.72rem',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={m.profitable ? 'Profitable' : 'Deficit'}
                        size="small"
                        sx={{
                          bgcolor: m.profitable ? '#ecfdf5' : '#fef2f2',
                          color: m.profitable ? '#059669' : '#dc2626',
                          fontWeight: 800,
                          fontSize: '0.72rem',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Tab 2: Category Breakdown */}
      {tabIndex === 2 && (
        <Grid container spacing={3}>
          {Object.entries(categoryConfig).map(([catKey, cfg]) => {
            const catEnum = catKey as ExpenseCategory;
            const amount = summary?.expensesByCategory?.[catEnum] || 0;
            const percentage =
              totalExpensesMonth > 0 ? Math.round((amount / totalExpensesMonth) * 1000) / 10 : 0;

            return (
              <Grid item xs={12} sm={6} md={4} key={catKey}>
                <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', p: 1 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: 2,
                            bgcolor: cfg.bg,
                            color: cfg.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {cfg.icon}
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                          {cfg.label}
                        </Typography>
                      </Box>
                      <Chip label={`${percentage}%`} size="small" sx={{ fontWeight: 700 }} />
                    </Box>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: cfg.color, mb: 1 }}>
                      ₹{amount.toLocaleString('en-IN')}
                    </Typography>

                    <Box sx={{ width: '100%', bgcolor: '#f1f5f9', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ width: `${Math.min(percentage, 100)}%`, bgcolor: cfg.color, height: '100%' }} />
                    </Box>

                    <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
                      Total logged for current month
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Record / Edit Expense Dialog */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {editingExpense ? 'Edit Expense Record' : 'Record Daily Operational Expense'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
          <TextField
            label="Expense Title / Description"
            required
            size="small"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Vegetables & Rice for Mess, Electricity Bill, Staff Salary"
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Expense Category"
                required
                size="small"
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              >
                <MenuItem value="FOOD_MESS">🥦 Food & Mess Provisions</MenuItem>
                <MenuItem value="UTILITIES">⚡ Utilities & Bills (Current, Water, WiFi)</MenuItem>
                <MenuItem value="MAINTENANCE">🔧 Repairs & Maintenance</MenuItem>
                <MenuItem value="SALARIES">👥 Staff Salaries & Wages</MenuItem>
                <MenuItem value="SUPPLIES">🧼 Cleaning & Supplies</MenuItem>
                <MenuItem value="MISCELLANEOUS">📝 Miscellaneous</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Amount (₹)"
                required
                type="number"
                size="small"
                fullWidth
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Expense Date"
                type="date"
                size="small"
                fullWidth
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Payment Method"
                size="small"
                fullWidth
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="UPI">UPI (GPay / PhonePe / Paytm)</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer / NEFT</MenuItem>
                <MenuItem value="CARD">Debit / Credit Card</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Vendor / Store Name"
                size="small"
                fullWidth
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Venkatesh Kirana Store"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Bill / Invoice Number"
                size="small"
                fullWidth
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                placeholder="e.g. BILL-9981"
              />
            </Grid>
          </Grid>

          <TextField
            label="Additional Notes / Remarks"
            multiline
            rows={2}
            size="small"
            fullWidth
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Details of quantity, item breakdown or purpose"
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setModalOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={isSaving}
            sx={{ fontWeight: 700, px: 3 }}
          >
            {isSaving ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        title="Delete Expense Record"
        message={`Are you sure you want to delete the expense entry "${expenseToDelete?.title}" of ₹${expenseToDelete?.amount?.toLocaleString('en-IN')}? This will update profit calculations accordingly.`}
        confirmText="Delete Expense"
        confirmColor="error"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteDialogOpen(false)}
        isLoading={isDeleting}
      />
    </Box>
  );
};
