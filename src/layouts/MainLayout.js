import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open' && prop !== 'collapsed',
})(({ theme, open, collapsed }) => ({
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
})(({ theme, open, collapsed }) => ({
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
const iconMap = {
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
export default function MainLayout({ children }) {
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
    const [openGroups, setOpenGroups] = useState({});
    const [anchorElUser, setAnchorElUser] = useState(null);
    const [anchorElNotif, setAnchorElNotif] = useState(null);
    const toggleGroup = useCallback((groupId) => {
        setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
    }, []);
    const handleDrawerToggle = useCallback(() => {
        dispatch(toggleSidebarCollapsed());
    }, [dispatch]);
    const handleCloseSidebar = useCallback(() => {
        dispatch(setSidebarCollapsed(true));
    }, [dispatch]);
    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };
    const handleOpenNotifMenu = (event) => {
        setAnchorElNotif(event.currentTarget);
    };
    const handleCloseNotifMenu = () => {
        setAnchorElNotif(null);
    };
    const handleBranchChange = (event) => {
        const selected = branchList.find((b) => b.id === event.target.value);
        if (selected) {
            dispatch(setCurrentBranch(selected));
        }
    };
    const handleNavigate = (path) => {
        navigate(path);
        if (window.innerWidth < 960) {
            dispatch(toggleSidebar());
        }
    };
    const getIcon = (iconName) => {
        const IconComponent = iconMap[iconName];
        return IconComponent ? _jsx(IconComponent, {}) : _jsx(DashboardIcon, {});
    };
    const isActiveRoute = (path) => {
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
    return (_jsxs(Box, { sx: { display: 'flex' }, children: [_jsx(CssBaseline, {}), _jsx(AppBar, { position: "fixed", open: sidebarOpen, collapsed: sidebarCollapsed, children: _jsxs(Toolbar, { sx: { justifyContent: 'space-between' }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center' }, children: [_jsx(IconButton, { color: "inherit", "aria-label": "toggle drawer", onClick: handleDrawerToggle, edge: "start", sx: { mr: 2 }, children: sidebarCollapsed && sidebarOpen ? _jsx(ChevronRightIcon, {}) : _jsx(MenuIcon, {}) }), _jsxs(Box, { sx: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                    }, onClick: () => navigate('/dashboard'), children: [_jsx(Box, { sx: {
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
                                            }, children: "GFF" }), _jsx(Typography, { variant: "h6", noWrap: true, component: "div", sx: { fontWeight: 600, color: 'text.primary' }, children: "GFF ERP" })] })] }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [branchList.length > 1 && (_jsx(FormControl, { size: "small", sx: { minWidth: 150, mr: 2 }, children: _jsx(Select, { value: currentBranch?.id || '', onChange: handleBranchChange, displayEmpty: true, variant: "outlined", sx: {
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: 'divider',
                                            },
                                            fontSize: '0.875rem',
                                        }, children: branchList.map((branch) => (_jsx(MenuItem, { value: branch.id, children: branch.name }, branch.id))) }) })), _jsx(Typography, { variant: "body2", sx: {
                                        color: 'text.secondary',
                                        mr: 2,
                                        display: { xs: 'none', md: 'block' },
                                    }, children: new Date().toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    }) }), _jsx(Tooltip, { title: appTheme === 'dark' ? 'Light Mode' : 'Dark Mode', children: _jsx(IconButton, { size: "small", sx: { mr: 1 }, children: appTheme === 'dark' ? _jsx(LightModeIcon, {}) : _jsx(DarkModeIcon, {}) }) }), _jsx(Tooltip, { title: "Notifications", children: _jsx(IconButton, { size: "small", onClick: handleOpenNotifMenu, sx: { mr: 1 }, children: _jsx(Badge, { badgeContent: unreadCount, color: "error", children: unreadCount > 0 ? (_jsx(NotificationsIcon, {})) : (_jsx(NotificationsNoneIcon, {})) }) }) }), _jsx(Box, { sx: { display: 'flex', alignItems: 'center', ml: 1 }, children: _jsx(IconButton, { onClick: handleOpenUserMenu, size: "small", children: _jsx(Avatar, { sx: {
                                                width: 36,
                                                height: 36,
                                                bgcolor: 'primary.main',
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                            }, children: userInitials }) }) })] })] }) }), _jsxs(Menu, { anchorEl: anchorElNotif, open: Boolean(anchorElNotif), onClose: handleCloseNotifMenu, PaperProps: {
                    sx: {
                        width: 360,
                        maxHeight: 400,
                        mt: 1.5,
                    },
                }, transformOrigin: { horizontal: 'right', vertical: 'top' }, anchorOrigin: { horizontal: 'right', vertical: 'bottom' }, TransitionComponent: Fade, children: [_jsx(Box, { sx: { p: 2, borderBottom: '1px solid', borderColor: 'divider' }, children: _jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: "Notifications" }) }), notifications.length === 0 ? (_jsxs(Box, { sx: { p: 3, textAlign: 'center' }, children: [_jsx(NotificationsNoneIcon, { sx: { color: 'text.secondary', mb: 1, fontSize: 32 } }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "No notifications" })] })) : (notifications.slice(0, 10).map((notif) => (_jsx(MenuItem, { onClick: handleCloseNotifMenu, sx: {
                            py: 1.5,
                            px: 2,
                            borderLeft: 3,
                            borderLeftColor: notif.type === 'error'
                                ? 'error.main'
                                : notif.type === 'warning'
                                    ? 'warning.main'
                                    : notif.type === 'success'
                                        ? 'success.main'
                                        : 'info.main',
                            bgcolor: notif.read ? 'inherit' : 'action.selected',
                        }, children: _jsxs(Box, { sx: { flex: 1 }, children: [_jsx(Typography, { variant: "body2", fontWeight: notif.read ? 400 : 600, noWrap: true, children: notif.title }), _jsx(Typography, { variant: "caption", color: "text.secondary", noWrap: true, display: "block", children: notif.message })] }) }, notif.id))))] }), _jsxs(Menu, { anchorEl: anchorElUser, open: Boolean(anchorElUser), onClose: handleCloseUserMenu, PaperProps: {
                    sx: { width: 220, mt: 1.5 },
                }, transformOrigin: { horizontal: 'right', vertical: 'top' }, anchorOrigin: { horizontal: 'right', vertical: 'bottom' }, children: [_jsxs(Box, { sx: { px: 2, py: 1.5 }, children: [_jsxs(Typography, { variant: "subtitle2", fontWeight: 600, children: [user?.firstName, " ", user?.lastName] }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: user?.email })] }), _jsx(Divider, {}), _jsxs(MenuItem, { onClick: () => {
                            handleCloseUserMenu();
                            navigate('/settings');
                        }, children: [_jsx(ListItemIcon, { children: _jsx(AccountCircleIcon, { fontSize: "small" }) }), "Profile"] }), _jsxs(MenuItem, { onClick: () => {
                            handleCloseUserMenu();
                            navigate('/settings');
                        }, children: [_jsx(ListItemIcon, { children: _jsx(SettingsIcon, { fontSize: "small" }) }), "Settings"] }), _jsx(Divider, {}), _jsxs(MenuItem, { onClick: () => {
                            handleCloseUserMenu();
                            logout();
                        }, sx: { color: 'error.main' }, children: [_jsx(ListItemIcon, { children: _jsx(LogoutIcon, { fontSize: "small", color: "error" }) }), "Logout"] })] }), _jsxs(Drawer, { variant: "permanent", open: sidebarOpen, collapsed: sidebarCollapsed, children: [_jsxs(DrawerHeader, { children: [!sidebarCollapsed && (_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', ml: 2 }, children: [_jsx(Box, { sx: {
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
                                        }, children: "GFF" }), _jsx(Typography, { variant: "subtitle1", fontWeight: 600, children: "Golden Farms" })] })), _jsx(IconButton, { onClick: handleDrawerToggle, children: theme.direction === 'rtl' ? (sidebarCollapsed ? _jsx(ChevronLeftIcon, {}) : _jsx(ChevronRightIcon, {})) : sidebarCollapsed ? (_jsx(ChevronRightIcon, {})) : (_jsx(ChevronLeftIcon, {})) })] }), _jsx(Divider, {}), _jsx(List, { sx: { px: 1, py: 1 }, children: menuGroups.map((group) => (_jsx(Box, { children: group.items.length > 1 ? (_jsxs(_Fragment, { children: [_jsxs(ListItemButton, { onClick: () => toggleGroup(group.id), sx: {
                                            borderRadius: 2,
                                            mb: 0.5,
                                            px: sidebarCollapsed ? 1.5 : 2,
                                            justifyContent: sidebarCollapsed ? 'center' : 'initial',
                                            minHeight: 44,
                                        }, children: [_jsx(Tooltip, { title: group.label, placement: "right", disableHoverListener: !sidebarCollapsed, children: _jsx(ListItemIcon, { sx: {
                                                        minWidth: 0,
                                                        mr: sidebarCollapsed ? 0 : 2,
                                                        justifyContent: 'center',
                                                        color: 'text.secondary',
                                                    }, children: getIcon(group.icon) }) }), !sidebarCollapsed && (_jsxs(_Fragment, { children: [_jsx(ListItemText, { primary: group.label, primaryTypographyProps: {
                                                            fontSize: '0.875rem',
                                                            fontWeight: 600,
                                                            color: 'text.secondary',
                                                        }, sx: { opacity: sidebarCollapsed ? 0 : 1 } }), openGroups[group.id] ? (_jsx(ExpandLess, { sx: { color: 'text.secondary' } })) : (_jsx(ExpandMore, { sx: { color: 'text.secondary' } }))] }))] }), _jsx(Collapse, { in: openGroups[group.id] && !sidebarCollapsed, timeout: "auto", unmountOnExit: true, children: _jsx(List, { component: "div", disablePadding: true, children: group.items.map((item) => (_jsxs(ListItemButton, { selected: isActiveRoute(item.path), onClick: () => handleNavigate(item.path), sx: {
                                                    pl: 4,
                                                    borderRadius: 2,
                                                    mb: 0.5,
                                                    '&.Mui-selected': {
                                                        bgcolor: 'action.selected',
                                                        '&:hover': {
                                                            bgcolor: 'action.selected',
                                                        },
                                                    },
                                                }, children: [_jsx(ListItemIcon, { sx: { minWidth: 32, color: 'inherit' }, children: getIcon(item.icon) }), _jsx(ListItemText, { primary: item.label, primaryTypographyProps: {
                                                            fontSize: '0.8125rem',
                                                            fontWeight: isActiveRoute(item.path) ? 600 : 400,
                                                        } })] }, item.path))) }) })] })) : (
                            /* Single item group */
                            _jsxs(ListItemButton, { selected: isActiveRoute(group.items[0]?.path || ''), onClick: () => handleNavigate(group.items[0]?.path || '/dashboard'), sx: {
                                    borderRadius: 2,
                                    mb: 0.5,
                                    px: sidebarCollapsed ? 1.5 : 2,
                                    justifyContent: sidebarCollapsed ? 'center' : 'initial',
                                    minHeight: 44,
                                    '&.Mui-selected': {
                                        bgcolor: 'action.selected',
                                    },
                                }, children: [_jsx(Tooltip, { title: group.label, placement: "right", disableHoverListener: !sidebarCollapsed, children: _jsx(ListItemIcon, { sx: {
                                                minWidth: 0,
                                                mr: sidebarCollapsed ? 0 : 2,
                                                justifyContent: 'center',
                                            }, children: getIcon(group.icon) }) }), !sidebarCollapsed && (_jsx(ListItemText, { primary: group.items[0]?.label || group.label, primaryTypographyProps: {
                                            fontSize: '0.875rem',
                                            fontWeight: isActiveRoute(group.items[0]?.path || '') ? 600 : 400,
                                        } }))] })) }, group.id))) }), !sidebarCollapsed && currentBranch && (_jsxs(_Fragment, { children: [_jsx(Box, { sx: { flexGrow: 1 } }), _jsx(Divider, {}), _jsxs(Box, { sx: { p: 2 }, children: [_jsx(Typography, { variant: "caption", color: "text.secondary", display: "block", children: "Current Branch" }), _jsx(Typography, { variant: "body2", fontWeight: 500, children: currentBranch.name }), _jsx(Typography, { variant: "caption", color: "text.secondary", children: currentBranch.code })] })] }))] }), _jsxs(Box, { component: "main", sx: {
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
                }, children: [location.pathname !== '/dashboard' && (_jsxs(Breadcrumbs, { "aria-label": "breadcrumb", sx: { mb: 2, mt: 1 }, separator: "\u203A", children: [_jsx(Link, { underline: "hover", color: "inherit", sx: { cursor: 'pointer' }, onClick: () => navigate('/dashboard'), children: "Dashboard" }), getBreadcrumbs().map((crumb, index) => crumb.path ? (_jsx(Link, { underline: "hover", color: "inherit", sx: { cursor: 'pointer' }, onClick: () => crumb.path && navigate(crumb.path), children: crumb.label }, index)) : (_jsx(Typography, { color: "text.primary", fontWeight: 500, children: crumb.label }, index)))] })), _jsx(Fade, { in: true, timeout: 300, children: _jsx(Box, { children: children }) })] })] }));
}
export { drawerWidth, collapsedWidth };
