import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GridLayout } from '../src/layouts/GridLayout';
import { StackLayout } from '../src/layouts/StackLayout';

describe('Layout Components', () => {
  describe('GridLayout', () => {
    it('should render with specified columns', () => {
      render(
        <GridLayout type="grid" columns={3}>
          <div>Item 1</div>
          <div>Item 2</div>
        </GridLayout>
      );

      const grid = screen.getByTestId('liquid-grid-layout');
      expect(grid).toHaveAttribute('data-columns', '3');
    });

    it('should apply gap styling', () => {
      render(
        <GridLayout type="grid" columns={2} gap={16}>
          <div>Item</div>
        </GridLayout>
      );

      const grid = screen.getByTestId('liquid-grid-layout');
      expect(grid).toHaveStyle({ gap: '16px' });
    });

    it('should render with default gap of 0', () => {
      render(
        <GridLayout type="grid" columns={1}>
          <div>Item</div>
        </GridLayout>
      );

      const grid = screen.getByTestId('liquid-grid-layout');
      expect(grid).toHaveStyle({ gap: '0px' });
    });

    it('should render children correctly', () => {
      render(
        <GridLayout type="grid" columns={2}>
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </GridLayout>
      );

      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
      expect(screen.getByText('Child 3')).toBeInTheDocument();
    });
  });

  describe('StackLayout', () => {
    it('should render with vertical direction', () => {
      render(
        <StackLayout type="stack" direction="vertical">
          <div>Item 1</div>
          <div>Item 2</div>
        </StackLayout>
      );

      const stack = screen.getByTestId('liquid-stack-layout');
      expect(stack).toHaveAttribute('data-direction', 'vertical');
      expect(stack).toHaveStyle({ flexDirection: 'column' });
    });

    it('should render with horizontal direction', () => {
      render(
        <StackLayout type="stack" direction="horizontal">
          <div>Item</div>
        </StackLayout>
      );

      const stack = screen.getByTestId('liquid-stack-layout');
      expect(stack).toHaveAttribute('data-direction', 'horizontal');
      expect(stack).toHaveStyle({ flexDirection: 'row' });
    });

    it('should render with default vertical direction', () => {
      render(
        <StackLayout type="stack">
          <div>Item</div>
        </StackLayout>
      );

      const stack = screen.getByTestId('liquid-stack-layout');
      expect(stack).toHaveAttribute('data-direction', 'vertical');
    });

    it('should apply gap styling', () => {
      render(
        <StackLayout type="stack" gap={8}>
          <div>Item</div>
        </StackLayout>
      );

      const stack = screen.getByTestId('liquid-stack-layout');
      expect(stack).toHaveStyle({ gap: '8px' });
    });

    it('should render children correctly', () => {
      render(
        <StackLayout type="stack">
          <div>First</div>
          <div>Second</div>
        </StackLayout>
      );

      expect(screen.getByText('First')).toBeInTheDocument();
      expect(screen.getByText('Second')).toBeInTheDocument();
    });
  });
});
