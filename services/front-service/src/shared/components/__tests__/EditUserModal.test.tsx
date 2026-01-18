import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders, userEvent, waitFor } from '../../../test/utils';
import { EditUserModal } from '../EditUserModal';
import * as userServiceModule from '../../service/userService';

// Mock del servicio
vi.mock('../../service/userService');

describe('EditUserModal', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '123456789',
    address: '123 Main St',
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  const mockProps = {
    user: mockUser,
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userServiceModule.userService.updateUserProfile).mockResolvedValue({
      success: true,
      data: mockUser,
    });
  });

  it('debe renderizar el modal cuando isOpen es true', () => {
    const { getByText } = renderWithProviders(<EditUserModal {...mockProps} />);

    expect(getByText('Editar Usuario')).toBeInTheDocument();
  });

  it('no debe renderizar el modal cuando isOpen es false', () => {
    const { queryByText } = renderWithProviders(
      <EditUserModal {...mockProps} isOpen={false} />
    );

    expect(queryByText('Editar Usuario')).not.toBeInTheDocument();
  });

  it('debe mostrar los datos del usuario en el formulario', () => {
    const { getByDisplayValue } = renderWithProviders(<EditUserModal {...mockProps} />);

    expect(getByDisplayValue('John')).toBeInTheDocument();
    expect(getByDisplayValue('Doe')).toBeInTheDocument();
    expect(getByDisplayValue('123456789')).toBeInTheDocument();
    expect(getByDisplayValue('123 Main St')).toBeInTheDocument();
  });

  it('debe permitir editar los campos', async () => {
    const user = userEvent.setup();
    const { getByDisplayValue } = renderWithProviders(<EditUserModal {...mockProps} />);

    const firstNameInput = getByDisplayValue('John');
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Jane');

    expect(firstNameInput).toHaveValue('Jane');
  });

  it('debe llamar a updateUserProfile cuando se envía el formulario', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithProviders(<EditUserModal {...mockProps} />);

    const submitButton = getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(userServiceModule.userService.updateUserProfile).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        })
      );
    });
  });

  it('debe llamar a onSuccess y onClose después de actualizar exitosamente', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithProviders(<EditUserModal {...mockProps} />);

    const submitButton = getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
      expect(mockProps.onClose).toHaveBeenCalled();
    });
  });

  it('debe mostrar error cuando falla la actualización', async () => {
    vi.mocked(userServiceModule.userService.updateUserProfile).mockRejectedValue({
      response: {
        data: {
          error: {
            message: 'Error al actualizar',
          },
        },
      },
    });

    const user = userEvent.setup();
    const { getByRole, findByText } = renderWithProviders(<EditUserModal {...mockProps} />);

    const submitButton = getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(async () => {
      const errorMessage = await findByText(/Error al actualizar/i);
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
