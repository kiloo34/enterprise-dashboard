import { ID } from "./locales/id";
import { EN } from "./locales/en";

export const translations = {
    Common: {
        ID: ID.Common,
        EN: EN.Common
    },
    Sidebar: {
        ID: ID.Sidebar,
        EN: EN.Sidebar
    },
    Header: {
        ID: ID.Header,
        EN: EN.Header
    },
    FilterBar: {
        ID: ID.FilterBar,
        EN: EN.FilterBar
    },
    DataTable: {
        ID: ID.DataTable,
        EN: EN.DataTable
    },
    Metrics: {
        ID: ID.Metrics,
        EN: EN.Metrics
    },
    Settings: {
        ID: ID.Settings,
        EN: EN.Settings
    },
    Dashboard: {
        ID: ID.Dashboard,
        EN: EN.Dashboard
    },
    Login: {
        ID: ID.Login,
        EN: EN.Login
    },
    Users: {
        ID: ID.Users,
        EN: EN.Users
    },
    Roles: {
        ID: ID.Roles,
        EN: EN.Roles
    },
    Permissions: {
        ID: ID.Permissions,
        EN: EN.Permissions
    },
    RekonEngine: {
        ID: ID.RekonEngine,
        EN: EN.RekonEngine
    },
    Reconciliation: {
        ID: ID.Reconciliation,
        EN: EN.Reconciliation
    }
};

export type TranslationsType = typeof translations;
