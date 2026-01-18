import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../../test/utils';
import Container from '../Container';

describe('Container', () => {
  it('debe renderizar el componente con children', () => {
    const { getByText } = renderWithProviders(
      <Container>
        <div>Test Content</div>
      </Container>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('debe aplicar las clases CSS correctas', () => {
    const { container } = renderWithProviders(
      <Container>
        <div>Test</div>
      </Container>
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('mx-auto', 'w-full', 'max-w-6xl', 'px-4');
  });
});
