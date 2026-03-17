export interface TranslationSchema {
    Common: {
        appTitle: string;
        add: string;
        edit: string;
        delete: string;
        save: string;
        cancel: string;
        actions: string;
        search: string;
        loading: string;
        noData: string;
        confirm: string;
        success: string;
        error: string;
        yes: string;
        no: string;
        searchPlaceholder: string;
    };
    Sidebar: {
        dashboard: string;
        direksi: string;
        direkturUtama: string;
        divisiOperasi: string;
        summary: string;
        rekonQris: string;
        rekonQrisRintis: string;
        rekonQrisOnus: string;
        reports: string;
        analytics: string;
        userAccess: string;
        settings: string;
        support: string;
        profile: string;
        signOut: string;
        accountSettings: string;
        manageRbac: string;
        manageUser: string;
        manageAccess: string;
        managePermission: string;
        engine: string;
        reconciliation: string;
        importData: string;
        monitoring: string;
        noResults: string;
    };
    Header: {
        title: string;
        asOf: string;
        export: string;
        notifications: string;
    };
    FilterBar: {
        network: string;
        conventional: string;
        area: string;
        branch: string;
        dateRange: string;
        rekonStatus: string;
        transactionType: string;
        match: string;
        unmatch: string;
        suspect: string;
        payment: string;
        refund: string;
        clear: string;
        apply: string;
        summary: string;
        all: string;
        collapsed: string;
    };
    DataTable: {
        showDetails: string;
        hideDetails: string;
        headers: {
            keterangan: string;
            realisasi: string;
            target: string;
            nominal: string;
            deviasi: string;
            dtd: string;
            mtd: string;
            ytd: string;
            yoy: string;
            date: string;
            stan: string;
            merchant: string;
            bankStatus: string;
            artajasaStatus: string;
            reconStatus: string;
        };
        pagination: {
            showing: string;
            to: string;
            of: string;
            entries: string;
            filteredFrom: string;
            prev: string;
            next: string;
        };
    };
    Metrics: {
        totalAsset: string;
        dpk: string;
        loan: string;
        npl: string;
        target: string;
        safe: string;
    };
    Settings: {
        title: string;
        subtitle: string;
        visualTitle: string;
        visualSubtitle: string;
        comfortTitle: string;
        comfortSubtitle: string;
        langTitle: string;
        langSubtitle: string;
        themes: {
            light: { label: string; desc: string };
            dark: { label: string; desc: string };
            system: { label: string; desc: string };
        };
        views: {
            compact: { label: string; desc: string };
            comfortable: { label: string; desc: string };
            large: { label: string; desc: string };
        };
        languages: {
            ID: string;
            EN: string;
        };
        footer: string;
        privacy: string;
        agreement: string;
        searchMenu: string;
    };
    Login: {
        welcome: string;
        subtitle: string;
        email: string;
        emailPlaceholder: string;
        password: string;
        passwordPlaceholder: string;
        signIn: string;
        signingIn: string;
        forgot: string;
        rememberMe: string;
        noAccount: string;
        contactAdmin: string;
        error: string;
        brandingTitle: string;
        brandingDesc: string;
        feature1Title: string;
        feature1Desc: string;
        feature2Title: string;
        feature2Desc: string;
        copyright: string;
    };
    Users: {
        title: string;
        subtitle: string;
        addButton: string;
        searchPlaceholder: string;
        table: {
            info: string;
            positionUnit: string;
            roles: string;
            actions: string;
            loading: string;
            empty: string;
        };
        form: {
            addTitle: string;
            editTitle: string;
            addDesc: string;
            editDesc: string;
            name: string;
            namePlaceholder: string;
            email: string;
            emailPlaceholder: string;
            password: string;
            passwordPlaceholderAdd: string;
            passwordPlaceholderEdit: string;
            passwordConfirm: string;
            passwordConfirmPlaceholder: string;
            role: string;
            position: string;
            positionPlaceholder: string;
            unit: string;
            unitPlaceholder: string;
            superior: string;
            superiorPlaceholder: string;
            permissionsOptional: string;
            permissionsOptionalDesc: string;
            successCreate: string;
            successUpdate: string;
            errorSave: string;
            validation: {
                nameRequired: string;
                nameMax: string;
                emailInvalid: string;
                passwordMin: string;
                passwordMismatch: string;
            };
        };
        delete: {
            confirmTitle: string;
            confirmMessage: string;
            success: string;
            error: string;
        };
    };
    Roles: {
        title: string;
        subtitle: string;
        addButton: string;
        searchPlaceholder: string;
        table: {
            name: string;
            guard: string;
            permsCount: string;
            permsSuffix: string;
            actions: string;
            loading: string;
            empty: string;
            adminDeleteError: string;
            adminDeleteTooltip: string;
        };
        form: {
            addTitle: string;
            editTitle: string;
            addDesc: string;
            editDesc: string;
            name: string;
            namePlaceholder: string;
            guard: string;
            permissions: string;
            moduleLabel: string;
            successCreate: string;
            successUpdate: string;
            errorSave: string;
            validation: {
                nameRequired: string;
                nameMax: string;
                permissionsRequired: string;
            };
            groups: {
                dashboardFinancial: string;
                opsQris: string;
                opsOther: string;
                engine: string;
                rbac: string;
                user: string;
                mapping: string;
                organization: string;
                other: string;
            };
        };
        delete: {
            confirmTitle: string;
            confirmMessage: string;
            success: string;
            error: string;
        };
    };
    Permissions: {
        title: string;
        subtitle: string;
        addButton: string;
        searchPlaceholder: string;
        table: {
            name: string;
            owner: string;
            description: string;
            actions: string;
            loading: string;
            empty: string;
            errorFetch: string;
        };
        pagination: {
            showing: string;
            to: string;
            of: string;
            entries: string;
            prev: string;
            next: string;
        };
        form: {
            addTitle: string;
            editTitle: string;
            addDesc: string;
            editDesc: string;
            name: string;
            namePlaceholder: string;
            guard: string;
            owner: string;
            ownerPlaceholder: string;
            description: string;
            descriptionPlaceholder: string;
            successCreate: string;
            successUpdate: string;
            errorSave: string;
            validation: {
                nameRequired: string;
                guardRequired: string;
            };
        };
        delete: {
            confirmTitle: string;
            confirmMessage: string;
            success: string;
            error: string;
        };
    };
    Dashboard: {
        scale: string;
        footerInfo: string;
        financial: {
            title: string;
            subtitle: string;
            giro: {
                title: string;
                subtitle: string;
                pemda: string;
                swasta: string;
                perorangan: string;
            };
            tabungan: {
                title: string;
                subtitle: string;
                label: string;
            };
            deposito: {
                title: string;
                subtitle: string;
                pemda: string;
                swasta: string;
                perorangan: string;
            };
        };
        operations: {
            title: string;
            subtitle: string;
            metrics: {
                totalQris: string;
                successSettlement: string;
                unmatchedSuspect: string;
            };
            charts: {
                channelDistribution: string;
            };
            rekonStatus: {
                title: string;
                subtitle: string;
                unsettled: string;
            };
        };
        filter: {
            title: string;
            summary: string;
            network: string;
            conventional: string;
            area: string;
            branch: string;
            dateRange: string;
            today: string;
            thisMonth: string;
            rekonStatus: string;
            transactionType: string;
            payment: string;
            refund: string;
            all: string;
            match: string;
            unmatch: string;
            suspect: string;
            apply: string;
            clear: string;
        };
    };
    RekonEngine: {
        title: string;
        importTitle: string;
        monitoring: string;
        description: string;
        configTitle: string;
        configDesc: string;
        targetTable: string;
        fileLabel: string;
        maxSize: string;
        selectFile: string;
        noFile: string;
        uploading: string;
        startImport: string;
        historyTitle: string;
        historyDesc: string;
        searchPlaceholder: string;
        statusFilter: string;
        status: {
            completed: string;
            processing: string;
            pending: string;
            failed: string;
        };
        tableFilter: string;
        schemas: {
            rekon: string;
            tableau: string;
        };
        tables: {
            engine_job_entry_log: string;
            engine_job_log: string;
            engine_process_group: string;
            engine_process_group_his: string;
            engine_sts_load_data: string;
            engine_sts_load_data_his: string;
            engine_sts_proses_rpt: string;
            engine_sts_proses_rpt_his: string;
            rekon_qris_aj: string;
            rekon_qris_onus: string;
            rekon_qris_rintis: string;
            fact_kinerjaprc: string;
        };
        table: {
            file: string;
            table: string;
            status: string;
            processed: string;
            date: string;
            empty: string;
            queuing: string;
        };
        successUpload: string;
        errorUpload: string;
    };
    Reconciliation: {
        totalTransactions: string;
        settledAmount: string;
        unsettledAmount: string;
        totalDiscrepancy: string;
        qrisArtajasa: {
            title: string;
            description: string;
        };
        qrisRintis: {
            title: string;
            description: string;
        };
        qrisOnus: {
            title: string;
            description: string;
        };
    };
}
