import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { demoApi } from './lib/api';

describe('App', () => {
  it('submits an application and shows the decision and history', async () => {
    const user = userEvent.setup();
    render(<App api={demoApi()} />);

    await user.click(await screen.findByRole('button', { name: /get decision/i }));

    const decision = await screen.findByText(/Ayesha Khan · PERSONAL/);
    expect(decision).toBeInTheDocument();
    expect(screen.getByTestId('score')).toHaveTextContent('100');
    expect(screen.getByText(/debt-to-income 16.9% is within 36%/)).toBeInTheDocument();

    const table = screen.getByRole('table');
    expect(within(table).getByText('$516.31')).toBeInTheDocument();
  });

  it('asks for collateral when a secured product is selected', async () => {
    const user = userEvent.setup();
    render(<App api={demoApi()} />);
    await user.selectOptions(await screen.findByRole('combobox', { name: /loan product/i }), 'HOME');
    await user.click(screen.getByRole('button', { name: /get decision/i }));
    expect(await screen.findByText(/Collateral value is required for Home Loan/)).toBeInTheDocument();
  });

  it('filters the history by status', async () => {
    const user = userEvent.setup();
    render(<App api={demoApi()} />);
    const score = await screen.findByRole('spinbutton', { name: /credit score/i });
    await user.click(screen.getByRole('button', { name: /get decision/i }));
    await user.clear(score);
    await user.type(score, '500');
    await user.click(screen.getByRole('button', { name: /get decision/i }));
    await screen.findAllByText('Rejected');

    await user.selectOptions(screen.getByRole('combobox', { name: /filter by status/i }), 'REJECTED');
    const rows = await screen.findAllByRole('row');
    expect(rows).toHaveLength(2); // header + one rejected application
  });
});
