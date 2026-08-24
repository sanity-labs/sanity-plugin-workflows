import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
  type Queries,
  queries,
} from '@testing-library/react'
import {StrictMode, type ComponentType, type ReactElement, type ReactNode} from 'react'
if (typeof window !== 'undefined' && !window.matchMedia) {
  const noop = () => {}

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: noop,
      removeListener: noop,
      addEventListener: noop,
      removeEventListener: noop,
      dispatchEvent: () => true,
    }),
  })
}

export function TestProviders({children}: {children: ReactNode}) {
  return (
    <StrictMode>
      <ThemeProvider theme={studioTheme}>
        <LayerProvider>{children}</LayerProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

export function renderWithProviders<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  ui: ReactElement,
  options?: Omit<RenderOptions<Q, Container, BaseElement>, 'wrapper'> & {
    wrapper?: ComponentType<{children: ReactNode}>
  },
): RenderResult<Q, Container, BaseElement> {
  return rtlRender<Q, Container, BaseElement>(ui, {wrapper: TestProviders, ...options})
}
