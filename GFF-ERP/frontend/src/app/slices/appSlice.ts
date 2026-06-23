import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  link?: string;
}

export type ThemeMode = 'light' | 'dark';
export type Language = 'en' | 'ar';

export interface AppState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: ThemeMode;
  language: Language;
  notifications: Notification[];
  unreadNotifications: number;
  loading: Record<string, boolean>;
  pageTitle: string;
  pageSubtitle: string;
  breadcrumbs: Array<{ label: string; path?: string }>;
}

const initialState: AppState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: (localStorage.getItem('theme') as ThemeMode) || 'light',
  language: (localStorage.getItem('language') as Language) || 'en',
  notifications: [],
  unreadNotifications: 0,
  loading: {},
  pageTitle: '',
  pageSubtitle: '',
  breadcrumbs: [],
};

export const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<ThemeMode>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setLanguage: (state, action: PayloadAction<Language>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
      document.documentElement.dir = action.payload === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = action.payload;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'createdAt'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
      };
      state.notifications.unshift(notification);
      if (!notification.read) {
        state.unreadNotifications += 1;
      }
      // Keep max 50 notifications
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50);
      }
    },
    markNotificationRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
    },
    markAllNotificationsRead: (state) => {
      state.notifications.forEach((n) => {
        n.read = true;
      });
      state.unreadNotifications = 0;
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification && !notification.read) {
        state.unreadNotifications = Math.max(0, state.unreadNotifications - 1);
      }
      state.notifications = state.notifications.filter((n) => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadNotifications = 0;
    },
    setLoading: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    setPageTitle: (state, action: PayloadAction<string>) => {
      state.pageTitle = action.payload;
    },
    setPageSubtitle: (state, action: PayloadAction<string>) => {
      state.pageSubtitle = action.payload;
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path?: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    resetApp: () => initialState,
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  setTheme,
  setLanguage,
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  removeNotification,
  clearNotifications,
  setLoading,
  setPageTitle,
  setPageSubtitle,
  setBreadcrumbs,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;