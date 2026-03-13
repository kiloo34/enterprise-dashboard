import { render, screen } from '@testing-library/react';
import React from 'react';

// Simulation of a dummy component fetching external data
const TestComponent = ({ content }: { content: string }) => {
    return <div data-testid="content-area">{content}</div>;
};

describe('XSS Protection Testing', () => {
    it('Automatically escapes XSS injections via React DOM escaping', () => {
        const maliciousPayload = "<script>alert('XSS Hack!')</script>";

        render(<TestComponent content={maliciousPayload} />);

        const contentArea = screen.getByTestId('content-area');

        // Output should never be rendered as raw <script> HTML in the DOM
        // Instead, it should be a pure string: &lt;script&gt;alert('XSS Hack!')&lt;/script&gt;
        expect(contentArea.innerHTML).not.toContain('<script>');
        expect(contentArea.textContent).toBe(maliciousPayload);
    });
});
