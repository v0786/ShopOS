// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { AuthScreen } from './AuthScreen'

describe('AuthScreen Component', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders sign in tab by default', () => {
    const handleSignIn = vi.fn().mockResolvedValue(undefined)
    const handleSignUp = vi.fn().mockResolvedValue(undefined)

    render(<AuthScreen onSignIn={handleSignIn} onSignUpAndOnboard={handleSignUp} />)

    expect(screen.getByRole('heading', { level: 1, name: 'ShopOS Access' })).toBeDefined()
    expect(screen.getByLabelText(/email address/i)).toBeDefined()
    expect(screen.getByLabelText(/password/i)).toBeDefined()
    expect(screen.getByRole('button', { name: /sign in to shopos/i })).toBeDefined()
  })

  it('switches to register & onboard tab and submits details', async () => {
    const handleSignIn = vi.fn().mockResolvedValue(undefined)
    const handleSignUp = vi.fn().mockResolvedValue(undefined)

    render(<AuthScreen onSignIn={handleSignIn} onSignUpAndOnboard={handleSignUp} />)

    // Switch to register tab
    fireEvent.click(screen.getByRole('tab', { name: /register & onboard/i }))

    expect(screen.getByLabelText(/owner full name/i)).toBeDefined()
    expect(screen.getByLabelText(/organization \/ shop name/i)).toBeDefined()
    expect(screen.getByLabelText(/first store branch/i)).toBeDefined()
    expect(screen.getByLabelText(/store code/i)).toBeDefined()

    // Fill form
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'owner@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/owner full name/i), { target: { value: 'Ramesh Patel' } })
    fireEvent.change(screen.getByLabelText(/organization \/ shop name/i), { target: { value: 'Patel Mobiles' } })
    fireEvent.change(screen.getByLabelText(/first store branch/i), { target: { value: 'Main Branch' } })
    fireEvent.change(screen.getByLabelText(/store code/i), { target: { value: 'MAIN' } })

    fireEvent.click(screen.getByRole('button', { name: /create organization & first store/i }))

    await waitFor(() => {
      expect(handleSignUp).toHaveBeenCalledWith({
        email: 'owner@test.com',
        password: 'password123',
        fullName: 'Ramesh Patel',
        orgName: 'Patel Mobiles',
        orgSlug: 'patel-mobiles',
        storeName: 'Main Branch',
        storeCode: 'MAIN',
      })
    })
  })
})
