import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { expect, it } from 'vitest';
import App from './App.jsx';

function renderWithRouter(initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <App />
    </MemoryRouter>,
  );
}

it('routing smoke test: renders Tickets page and Create Ticket link', async () => {
  renderWithRouter(['/tickets']);

  expect(
    await screen.findByRole('heading', { name: /tickets/i }),
  ).toBeInTheDocument();

  expect(
    screen.getByRole('link', { name: /create ticket/i }),
  ).toBeInTheDocument();
});