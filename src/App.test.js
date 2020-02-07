import React from 'react';
import { render } from '@testing-library/react';
import App from './App';

test('renders Minerva main page', () => {
  const { getByText } = render(<App />);
  const linkElement = getByText(/Minerva/i);
  expect(linkElement).toBeInTheDocument();
});
