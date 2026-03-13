import React from 'react';
import { render, screen } from '@testing-library/react';
import { FieldError, FormErrors } from '../app/components/ui/FormErrors';

describe('FieldError', () => {
    it('renders nothing when error is null', () => {
        const { container } = render(<FieldError error={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when error is undefined', () => {
        const { container } = render(<FieldError error={undefined} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders a single error string', () => {
        render(<FieldError error="Field is required" />);
        expect(screen.getByText('Field is required')).toBeInTheDocument();
    });

    it('renders multiple error strings from an array', () => {
        render(<FieldError error={['Must be at least 3 chars', 'Cannot be empty']} />);
        expect(screen.getByText('Must be at least 3 chars')).toBeInTheDocument();
        expect(screen.getByText('Cannot be empty')).toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
        render(<FieldError error="Required" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
});

describe('FormErrors', () => {
    it('renders nothing when error is null', () => {
        const { container } = render(<FormErrors error={null} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders the error message', () => {
        render(<FormErrors error="Server error occurred" />);
        expect(screen.getByText('Server error occurred')).toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
        render(<FormErrors error="Something went wrong" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('applies the animate-in class for visual feedback', () => {
        const { container } = render(<FormErrors error="Error" />);
        expect(container.firstChild).toHaveClass('animate-in');
    });
});
