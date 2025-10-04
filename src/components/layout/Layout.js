import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  styled,
  Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import PrintIcon from '@mui/icons-material/Print';
import AddIcon from '@mui/icons-material/Add';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalPrintshopIcon from '@mui/icons-material/LocalPrintshop';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import RepeatIcon from '@mui/icons-material/Repeat';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';
import AssignmentIcon from '@mui/icons-material/Assignment';

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

function Layout({ children }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [open, setOpen] = useState(true);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Print Shop Management
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.name || user?.username}
          </Typography>
          <Button
            color="inherit"
            onClick={handleLogout}
            startIcon={<LogoutIcon />}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/"
              selected={location.pathname === '/'}
            >
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/customers"
              selected={location.pathname.startsWith('/customers')}
            >
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Customers" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/print-jobs"
              selected={location.pathname === '/print-jobs'}
            >
              <ListItemIcon>
                <PrintIcon />
              </ListItemIcon>
              <ListItemText primary="Print Jobs" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/expenses"
              selected={location.pathname.startsWith('/expenses')}
            >
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText primary="Expenses" />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Divider />
        <List subheader={
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 1 }}>
            Loan Management
          </Typography>
        }>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/loan-dashboard"
              selected={location.pathname === '/loan-dashboard'}
            >
              <ListItemIcon>
                <AccountBalanceIcon />
              </ListItemIcon>
              <ListItemText primary="Loan Dashboard" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/loans"
              selected={location.pathname === '/loans'}
            >
              <ListItemIcon>
                <AccountBalanceIcon />
              </ListItemIcon>
              <ListItemText primary="My Loans" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/loan-payments"
              selected={location.pathname === '/loan-payments'}
            >
              <ListItemIcon>
                <PaymentIcon />
              </ListItemIcon>
              <ListItemText primary="Loan Payments" />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Divider />
        <List subheader={
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 1 }}>
            Expense Management
          </Typography>
        }>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/recurring-expenses"
              selected={location.pathname === '/recurring-expenses'}
            >
              <ListItemIcon>
                <RepeatIcon />
              </ListItemIcon>
              <ListItemText primary="Recurring Expenses" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/monthly-expenses"
              selected={location.pathname === '/monthly-expenses'}
            >
              <ListItemIcon>
                <CalendarTodayIcon />
              </ListItemIcon>
              <ListItemText primary="Monthly Expenses" />
            </ListItemButton>
          </ListItem>
        </List>

        <List subheader={
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 1 }}>
            System
          </Typography>
        }>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/audit-logs"
              selected={location.pathname === '/audit-logs'}
            >
              <ListItemIcon>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText primary="Audit Logs" />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Divider />
        <List subheader={
          <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2, pt: 2, pb: 1 }}>
            New Print Job
          </Typography>
        }>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/digital-prints/new"
              selected={location.pathname === '/digital-prints/new'}
            >
              <ListItemIcon>
                <LocalPrintshopIcon />
              </ListItemIcon>
              <ListItemText primary="Digital Print" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/offset-prints/new"
              selected={location.pathname === '/offset-prints/new'}
            >
              <ListItemIcon>
                <LocalPrintshopIcon />
              </ListItemIcon>
              <ListItemText primary="Offset Print" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/duplo-prints/new"
              selected={location.pathname === '/duplo-prints/new'}
            >
              <ListItemIcon>
                <LocalPrintshopIcon />
              </ListItemIcon>
              <ListItemText primary="Duplo Print" />
            </ListItemButton>
          </ListItem>

          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/sublimation-prints/new"
              selected={location.pathname === '/sublimation-prints/new'}
            >
              <ListItemIcon>
                <ColorLensIcon />
              </ListItemIcon>
              <ListItemText primary="Sublimation Print" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/other-prints/new"
              selected={location.pathname === '/other-prints/new'}
            >
              <ListItemIcon>
                <LocalPrintshopIcon />
              </ListItemIcon>
              <ListItemText primary="Other Print" />
            </ListItemButton>
          </ListItem>
        </List>
        
        <Divider />
        <List>
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/customers/new"
            >
              <ListItemIcon>
                <AddIcon />
              </ListItemIcon>
              <ListItemText primary="New Customer" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton
              component={Link}
              to="/print-jobs?status=UNPAID"
            >
              <ListItemIcon>
                <PaymentIcon />
              </ListItemIcon>
              <ListItemText primary="Pending Payments" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        {children}
      </Main>
    </Box>
  );
}

export default Layout;