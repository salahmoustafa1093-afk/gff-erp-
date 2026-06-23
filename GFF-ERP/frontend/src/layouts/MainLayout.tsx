import { useState, useCallback, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { type AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import Fade from '@mui/material/Fade';

// Icons
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StoreIcon from '@mui/icons-material/Store';
import InventoryIcon from '@mui/icons-material/Inventory';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import BookIcon from '@mui/icons-material/Book';
import BadgeIcon from '@mui/icons-material/Badge';
import GroupIcon from '@mui/icons-material/Group';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import GrainIcon from '@mui/icons-material/Grain';
import EggIcon from '@mui/icons-material/Egg';
import BabyChangingStationIcon from '@mui/icons-material/BabyChangingStation';
import InsertChartIcon from '@mui/icons-material/InsertChart';
import SettingsIcon from '@mui/icons-material/Settings';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { toggleSidebar, setSidebarCollapsed, toggleSidebarCollapsed } from '@/app/slices/appSlice';
import { setCurrentBranch } from '@/app/slices/branchSlice';
import { useAuth } from '@/hooks/useAuth';
import { menuGroups } from '@/utils/constants';

const drawerWidth = 280;
const collapsedWidth = 72;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
  collapsed?: boolean;
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'collapsed',
})<AppBarProps>(({ theme, open, collapsed }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: collapsed ? collapsedWidth : drawerWidth,
    width: `calc(100% - ${collapsed ? collapsedWidth : drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== 'open' && prop !== 'collapsed',
})(({ theme, open, collapsed }: { theme: typeof import('@mui/material/styles').theme; open: boolean; collapsed: boolean }) => ({
  width: collapsed ? collapsedWidth : drawerWidth,
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  ...(open && {
    width: collapsed ? collapsedWidth : drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& .MuiDrawer-paper': {
      width: collapsed ? collapsedWidth : drawerWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      overflowX: 'hidden',
    },
  }),
  ...(!open && {
    width: collapsedWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    '& .MuiDrawer-paper': {
      width: collapsedWidth,
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: 'hidden',
    },
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const iconMap: Record<string, typeof DashboardIcon> = {
  Dashboard: DashboardIcon,
  ShoppingCart: ShoppingCartIcon,
  Store: StoreIcon,
  Inventory: InventoryIcon,
  Warehouse: WarehouseIcon,
  Business: BusinessIcon,
  People: PeopleIcon,
  Person: PersonIcon,
  AccountBalance: AccountBalanceIcon,
  AccountBalanceWallet: AccountBalanceWalletIcon,
  LocalAtm: LocalAtmIcon,
  Book: BookIcon,
  Badge: BadgeIcon,
  Group: GroupIcon,
  LocalShipping: LocalShippingIcon,
  PrecisionManufacturing: PrecisionManufacturingIcon,
  Grain: GrainIcon,
  Egg: EggIcon,
  BabyChangingStation: BabyChangingStationIcon,
  InsertChart: InsertChartIcon,
  Settings: SettingsIcon,
};

interface MainLayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const sidebarOpen = useAppSelector((state) => state.app.sidebarOpen);
  const sidebarCollapsed = useAppSelector((state) => state.app.sidebarCollapsed);
  const branchList = useAppSelector((state) => state.branch.branchList);
  const currentBranch = useAppSelector((state) => state.branch.currentBranch);
  const notifications = useAppSelector((state) => state.app.notifications);
  const unreadCount = useAppSelector((state) => state.app.unreadNotifications);
  const appTheme = useAppSelector((state) => state.app.theme);

  const { user, logout } = useAuth();

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotif, setAnchorElNotif] = useState<null | HTMLElement>(null);

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  }, []);

  const handleDrawerToggle = useCallback(() => {
    dispatch(toggleSidebarCollapsed());
  }, [dispatch]);

  const handleCloseSidebar = useCallback(() => {
    dispatch(setSidebarCollapsed(true));
  }, [dispatch]);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotif(event.currentTarget);
  };

  const handleCloseNotifMenu = () => {
    setAnchorElNotif(null);
  };

  const handleBranchChange = (event: SelectChangeEvent<string>) => {
    const selected = branchList.find((b) => b.id === event.target.value);
    if (selected) {
      dispatch(setCurrentBranch(selected));
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 960) {
      dispatch(toggleSidebar());
    }
  };

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent /> : <DashboardIcon />;
  };

  const isActiveRoute = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((name, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      return {
        label: name.charAt(0).toUpperCase() + name.slice(1).replace(/-/g, ' '),
        path: isLast ? undefined : path,
      };
    });
  };

  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar position="fixed" open={sidebarOpen} collapsed={sidebarCollapsed}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="toggle drawer"
              onClick={handleDrawerToggle}
              edge="start"
              sx={{ mr: 2 }}
            >
              {sidebarCollapsed && sidebarOpen ? <ChevronRightIcon /> : <MenuIcon />}
            </IconButton>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() => navigate('/dashboard')}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '8px',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                }}
              >
                GFF
              </Box>
              <Typography
                variant="h6"
                noWrap
                component="div"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                GFF ERP
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Branch Selector */}
            {branchList.length > 1 && (
              <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
                <Select<string>
                  value={currentBranch?.id || ''}
                  onChange={handleBranchChange}
                  displayEmpty
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'divider',
                    },
                    fontSize: '0.875rem',
                  }}
                >
                  {branchList.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            {/* Date Display */}
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mr: 2,
                display: { xs: 'none', md: 'block' },
              }}
            >
              {new Date().toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Typography>

            {/* Theme Toggle */}
            <Tooltip title={appTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}>
              <IconButton size="small" sx={{ mr: 1 }}>
                {appTheme === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                onClick={handleOpenNotifMenu}
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={unreadCount} color="error">
                  {unreadCount > 0 ? (
                    <NotificationsIcon />
                  ) : (
                    <NotificationsNoneIcon />
                  )}
                </Badge>
              </IconButton>
            </Tooltip>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <IconButton onClick={handleOpenUserMenu} size="small">
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  {userInitials}
                </Avatar>
              </IconButton>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorElNotif}
        open={Boolean(anchorElNotif)}
        onClose={handleCloseNotifMenu}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 400,
            mt: 1.5,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        TransitionComponent={Fade}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            Notifications
          </Typography>
        </Box>
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ color: 'text.secondary', mb: 1, fontSize: 32 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          notifications.slice(0, 10).map((notif) => (
            <MenuItem
              key={notif.id}
              onClick={handleCloseNotifMenu}
              sx={{
                py: 1.5,
                px: 2,
                borderLeft: 3,
                borderLeftColor:
                  notif.type === 'error'
                    ? 'error.main'
                    : notif.type === 'warning'
                      ? 'warning.main'
                      : notif.type === 'success'
                        ? 'success.main'
                        : 'info.main',
                bgcolor: notif.read ? 'inherit' : 'action.selected',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={notif.read ? 400 : 600} noWrap>
                  {notif.title}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {notif.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        )}
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={anchorElUser}
        open={Boolean(anchorElUser)}
        onClose={handleCloseUserMenu}
        PaperProps={{
          sx: { width: 220, mt: 1.5 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            handleCloseUserMenu();
            navigate('/settings');
          }}
        >
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleCloseUserMenu();
            navigate('/settings');
          }}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            handleCloseUserMenu();
            logout();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" color="error" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Sidebar Drawer */}
      <Drawer
        variant="permanent"
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
      >
        <DrawerHeader>
          {!sidebarCollapsed && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '8px',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                }}
              >
                GFF
              </Box>
              <Typography variant="subtitle1" fontWeight={600}>
                Golden Farms
              </Typography>
            </Box>
          )}
          <IconButton onClick={handleDrawerToggle}>
            {theme.direction === 'rtl' ? (
              sidebarCollapsed ? <ChevronLeftIcon /> : <ChevronRightIcon />
            ) : sidebarCollapsed ? (
              <ChevronRightIcon />
            ) : (
              <ChevronLeftIcon />
            )}
          </IconButton>
        </DrawerHeader>
        <Divider />

        <List sx={{ px: 1, py: 1 }}>
          {menuGroups.map((group) => (
            <Box key={group.id}>
              {/* Group Header (collapsible) */}
              {group.items.length > 1 ? (
                <>
                  <ListItemButton
                    onClick={() => toggleGroup(group.id)}
                    sx={{
                      borderRadius: 2,
                      mb: 0.5,
                      px: sidebarCollapsed ? 1.5 : 2,
                      justifyContent: sidebarCollapsed ? 'center' : 'initial',
                      minHeight: 44,
                    }}
                  >
                    <Tooltip title={group.label} placement="right" disableHoverListener={!sidebarCollapsed}>
                      <ListItemIcon
                        sx={{
                          minWidth: 0,
                          mr: sidebarCollapsed ? 0 : 2,
                          justifyContent: 'center',
                          color: 'text.secondary',
                        }}
                      >
                        {getIcon(group.icon)}
                      </ListItemIcon>
                    </Tooltip>
                    {!sidebarCollapsed && (
                      <>
                        <ListItemText
                          primary={group.label}
                          primaryTypographyProps={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'text.secondary',
                          }}
                          sx={{ opacity: sidebarCollapsed ? 0 : 1 }}
                        />
                        {openGroups[group.id] ? (
                          <ExpandLess sx={{ color: 'text.secondary' }} />
                        ) : (
                          <ExpandMore sx={{ color: 'text.secondary' }} />
                        )}
                      </>
                    )}
                  </ListItemButton>
                  <Collapse in={openGroups[group.id] && !sidebarCollapsed} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {group.items.map((item) => (
                        <ListItemButton
                          key={item.path}
                          selected={isActiveRoute(item.path)}
                          onClick={() => handleNavigate(item.path)}
                          sx={{
                            pl: 4,
                            borderRadius: 2,
                            mb: 0.5,
                            '&.Mui-selected': {
                              bgcolor: 'action.selected',
                              '&:hover': {
                                bgcolor: 'action.selected',
                              },
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                            {getIcon(item.icon)}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{
                              fontSize: '0.8125rem',
                              fontWeight: isActiveRoute(item.path) ? 600 : 400,
                            }}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  </Collapse>
                </>
              ) : (
                /* Single item group */
                <ListItemButton
                  selected={isActiveRoute(group.items[0]?.path || '')}
                  onClick={() => handleNavigate(group.items[0]?.path || '/dashboard')}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    px: sidebarCollapsed ? 1.5 : 2,
                    justifyContent: sidebarCollapsed ? 'center' : 'initial',
                    minHeight: 44,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <Tooltip title={group.label} placement="right" disableHoverListener={!sidebarCollapsed}>
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: sidebarCollapsed ? 0 : 2,
                        justifyContent: 'center',
                      }}
                    >
                      {getIcon(group.icon)}
                    </ListItemIcon>
                  </Tooltip>
                  {!sidebarCollapsed && (
                    <ListItemText
                      primary={group.items[0]?.label || group.label}
                      primaryTypographyProps={{
                        fontSize: '0.875rem',
                        fontWeight: isActiveRoute(group.items[0]?.path || '') ? 600 : 400,
                      }}
                    />
                  )}
                </ListItemButton>
              )}
            </Box>
          ))}
        </List>

        {/* Branch info at bottom */}
        {!sidebarCollapsed && currentBranch && (
          <>
            <Box sx={{ flexGrow: 1 }} />
            <Divider />
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">
                Current Branch
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {currentBranch.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentBranch.code}
              </Typography>
            </Box>
          </>
        )}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          minHeight: '100vh',
          pt: `${64 + 16}px`,
          px: 3,
          pb: 3,
          transition: theme.transitions.create('padding', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        {/* Breadcrumbs */}
        {location.pathname !== '/dashboard' && (
          <Breadcrumbs
            aria-label="breadcrumb"
            sx={{ mb: 2, mt: 1 }}
            separator="›"
          >
            <Link
              underline="hover"
              color="inherit"
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Link>
            {getBreadcrumbs().map((crumb, index) =>
              crumb.path ? (
                <Link
                  key={index}
                  underline="hover"
                  color="inherit"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => crumb.path && navigate(crumb.path)}
                >
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={index} color="text.primary" fontWeight={500}>
                  {crumb.label}
                </Typography>
              )
            )}
          </Breadcrumbs>
        )}

        {/* Page Content */}
        <Fade in timeout={300}>
          <Box>{children}</Box>
        </Fade>
      </Box>
    </Box>
  );
}

export { drawerWidth, collapsedWidth };