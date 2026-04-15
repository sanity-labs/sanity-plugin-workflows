import {LayerProvider, studioTheme, ThemeProvider, ToastProvider} from '@sanity/ui'
import {
  render as rtlRender,
  type RenderOptions,
  type RenderResult,
  type Queries,
  queries,
} from '@testing-library/react'
import type {ComponentType, ReactElement, ReactNode} from 'react'
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
    <ThemeProvider theme={studioTheme}>
      <ToastProvider>
        <LayerProvider>{children}</LayerProvider>
      </ToastProvider>
    </ThemeProvider>
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
