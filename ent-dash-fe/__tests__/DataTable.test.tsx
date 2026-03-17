import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, DataTableColumn } from '../app/components/ui/DataTable';

interface TestItem {
    id: number;
    name: string;
    email: string;
}

const mockData: TestItem[] = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
}));

const columns: DataTableColumn<TestItem>[] = [
    {
        key: 'name',
        header: 'Nama',
        render: (row) => <span>{row.name}</span>,
    },
    {
        key: 'email',
        header: 'Email',
        render: (row) => <span>{row.email}</span>,
    },
];

describe('DataTable', () => {
    it('renders column headers', () => {
        render(<DataTable columns={columns} data={[]} rowKey={(r) => r.id} />);
        expect(screen.getByText('Nama')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('shows empty text when data is empty', () => {
        render(
            <DataTable
                columns={columns}
                data={[]}
                rowKey={(r) => r.id}
                emptyText="Tidak ada data"
            />
        );
        expect(screen.getByText('Tidak ada data')).toBeInTheDocument();
    });

    it('renders only the first page of data (defaultPageSize=10)', () => {
        render(
            <DataTable
                columns={columns}
                data={mockData}
                rowKey={(r) => r.id}
                defaultPageSize={10}
            />
        );
        expect(screen.getByText('User 1')).toBeInTheDocument();
        expect(screen.getByText('User 10')).toBeInTheDocument();
        expect(screen.queryByText('User 11')).not.toBeInTheDocument();
    });

    it('shows correct entry range in footer', () => {
        render(
            <DataTable
                columns={columns}
                data={mockData}
                rowKey={(r) => r.id}
                defaultPageSize={10}
            />
        );
        // "1–10 dari 25 entri"
        expect(screen.getByText(/1–10/)).toBeInTheDocument();
        expect(screen.getByText(/25/)).toBeInTheDocument();
    });

    it('navigates to next page on next button click', () => {
        render(
            <DataTable
                columns={columns}
                data={mockData}
                rowKey={(r) => r.id}
                defaultPageSize={10}
            />
        );
        const nextBtn = screen.getByTitle('Berikutnya');
        fireEvent.click(nextBtn);
        expect(screen.getByText('User 11')).toBeInTheDocument();
        expect(screen.queryByText('User 1')).not.toBeInTheDocument();
    });

    it('changes page size when dropdown is changed', () => {
        render(
            <DataTable
                columns={columns}
                data={mockData}
                rowKey={(r) => r.id}
                defaultPageSize={10}
            />
        );
        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: '20' } });
        expect(screen.getByText('User 20')).toBeInTheDocument();
    });

    it('shows loading skeleton when isLoading=true', () => {
        const { container } = render(
            <DataTable
                columns={columns}
                data={[]}
                rowKey={(r) => r.id}
                isLoading
                skeletonRows={3}
            />
        );
        // Skeleton renders <tr> rows with animate-pulse divs
        const skeletonRows = container.querySelectorAll('tbody tr');
        expect(skeletonRows).toHaveLength(3);
    });

    it('hides pagination when hidePagination=true', () => {
        render(
            <DataTable
                columns={columns}
                data={mockData}
                rowKey={(r) => r.id}
                hidePagination
            />
        );
        expect(screen.queryByTitle('Berikutnya')).not.toBeInTheDocument();
    });
});
