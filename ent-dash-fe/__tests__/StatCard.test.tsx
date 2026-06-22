import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../components/ui/StatCard';
import { Users } from 'lucide-react';

describe('StatCard', () => {
  it('renders label and value correctly', () => {
    render(
      <StatCard
        icon={Users}
        label="Total Users"
        value="1,234"
        color="bg-blue-500"
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders subtext if provided', () => {
    render(
      <StatCard
        icon={Users}
        label="Total Users"
        value="1,234"
        sub="+10 today"
        color="bg-blue-500"
      />
    );

    expect(screen.getByText('+10 today')).toBeInTheDocument();
  });
});
