import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDate } from './utils'

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })
  })

  describe('formatCurrency', () => {
    it('should format INR currency', () => {
      const result = formatCurrency(1000)
      expect(result).toContain('1,000')
    })

    it('should handle negative amounts', () => {
      const result = formatCurrency(-500)
      expect(result).toContain('500')
    })
  })

  describe('formatDate', () => {
    it('should format date string', () => {
      const result = formatDate('2024-01-15')
      expect(result).toContain('Jan')
      expect(result).toContain('2024')
    })

    it('should format Date object', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toContain('Jan')
    })
  })
})
