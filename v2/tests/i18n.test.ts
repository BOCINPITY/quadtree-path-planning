import { describe, expect, it } from 'vitest'
import enUS from '../src/i18n/locales/en-US'
import zhCN from '../src/i18n/locales/zh-CN'

function messageKeys(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => messageKeys(child, prefix ? `${prefix}.${key}` : key))
}

describe('i18n messages', () => {
  it('keeps Simplified Chinese and English message keys in sync', () => {
    expect(messageKeys(enUS).sort()).toEqual(messageKeys(zhCN).sort())
  })
})
