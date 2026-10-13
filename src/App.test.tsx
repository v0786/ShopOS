// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('ShopOS foundation screen', () => {
  it('explains that setup is still in progress without showing template actions', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: 'A steadier way to run your shop.' })).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Phase 1 foundation')
    expect(screen.queryByRole('button')).toBeNull()
  })
})
