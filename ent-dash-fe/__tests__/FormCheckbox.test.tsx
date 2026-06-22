import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormCheckbox } from '../components/ui/FormCheckbox';

describe('FormCheckbox', () => {
    it('renders label text', () => {
        render(<FormCheckbox label="Active User" checked={false} onChange={() => {}} />);
        expect(screen.getByText('Active User')).toBeInTheDocument();
    });

    it('is unchecked when checked=false', () => {
        render(<FormCheckbox label="Option" checked={false} onChange={() => {}} />);
        const input = screen.getByRole('checkbox');
        expect(input).not.toBeChecked();
    });

    it('is checked when checked=true', () => {
        render(<FormCheckbox label="Option" checked={true} onChange={() => {}} />);
        const input = screen.getByRole('checkbox');
        expect(input).toBeChecked();
    });

    it('calls onChange with true when unchecked box is clicked', () => {
        const onChange = jest.fn();
        render(<FormCheckbox label="Option" checked={false} onChange={onChange} />);
        const input = screen.getByRole('checkbox');
        fireEvent.click(input);
        expect(onChange).toHaveBeenCalledWith(true);
    });

    it('calls onChange with false when checked box is clicked', () => {
        const onChange = jest.fn();
        render(<FormCheckbox label="Option" checked={true} onChange={onChange} />);
        const input = screen.getByRole('checkbox');
        fireEvent.click(input);
        expect(onChange).toHaveBeenCalledWith(false);
    });

    it('applies custom className', () => {
        const { container } = render(
            <FormCheckbox label="Styled" checked={false} onChange={() => {}} className="custom-class" />
        );
        const label = container.querySelector('label');
        expect(label).toHaveClass('custom-class');
    });

    it('applies active background style when checked', () => {
        const { container } = render(
            <FormCheckbox label="Checked" checked={true} onChange={() => {}} />
        );
        const label = container.querySelector('label');
        // When checked, background should not be transparent
        expect(label?.style.background).not.toBe('transparent');
    });

    it('applies transparent background when unchecked', () => {
        const { container } = render(
            <FormCheckbox label="Unchecked" checked={false} onChange={() => {}} />
        );
        const label = container.querySelector('label');
        expect(label?.style.background).toBe('transparent');
    });
});
