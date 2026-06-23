import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from '@/app/store';
import { queryClient } from '@/app/queryClient';
import { theme } from '@/theme/theme';
import App from '@/App';
import '@/index.css';
const container = document.getElementById('root');
if (!container) {
    throw new Error('Failed to find the root element');
}
const root = createRoot(container);
root.render(_jsx(StrictMode, { children: _jsx(Provider, { store: store, children: _jsxs(QueryClientProvider, { client: queryClient, children: [_jsxs(ThemeProvider, { theme: theme, children: [_jsx(CssBaseline, {}), _jsxs(BrowserRouter, { children: [_jsx(App, {}), _jsx(ToastContainer, { position: "top-right", autoClose: 5000, hideProgressBar: false, newestOnTop: true, closeOnClick: true, rtl: false, pauseOnFocusLoss: true, draggable: true, pauseOnHover: true, theme: "colored", limit: 5 })] })] }), _jsx(ReactQueryDevtools, { initialIsOpen: false, position: "bottom" })] }) }) }));
