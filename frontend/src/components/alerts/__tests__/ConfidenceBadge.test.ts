import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ConfidenceBadge from '../ConfidenceBadge.vue'

describe('ConfidenceBadge', () => {
  it('shows VERIFIED in green for score >= 0.9', () => {
    const wrapper = mount(ConfidenceBadge, {
      props: { score: 0.95 },
    })
    expect(wrapper.text()).toContain('VERIFIED')
    expect(wrapper.classes()).toContain('badge--verified')
    // Verify green color class or style
    const badge = wrapper.find('[data-testid="confidence-badge"]')
    expect(badge.classes().join(' ')).toMatch(/green|verified/)
  })

  it('shows LIKELY in yellow for score >= 0.7 and < 0.9', () => {
    const wrapper = mount(ConfidenceBadge, {
      props: { score: 0.75 },
    })
    expect(wrapper.text()).toContain('LIKELY')
    expect(wrapper.classes()).toContain('badge--likely')
  })

  it('shows UNCONFIRMED in orange for score >= 0.5 and < 0.7', () => {
    const wrapper = mount(ConfidenceBadge, {
      props: { score: 0.55 },
    })
    expect(wrapper.text()).toContain('UNCONFIRMED')
    expect(wrapper.classes()).toContain('badge--unconfirmed')
  })

  it('shows RUMOR in red for score < 0.5', () => {
    const wrapper = mount(ConfidenceBadge, {
      props: { score: 0.3 },
    })
    expect(wrapper.text()).toContain('RUMOR')
    expect(wrapper.classes()).toContain('badge--rumor')
    const badge = wrapper.find('[data-testid="confidence-badge"]')
    expect(badge.classes().join(' ')).toMatch(/red|rumor/)
  })

  it('displays percentage rounded to nearest integer', () => {
    const wrapper = mount(ConfidenceBadge, {
      props: { score: 0.876 },
    })
    expect(wrapper.text()).toContain('88%')
  })

  it('displays 0% for score of 0', () => {
    const wrapper = mount(ConfidenceBadge, {
      props: { score: 0 },
    })
    expect(wrapper.text()).toContain('0%')
    expect(wrapper.text()).toContain('RUMOR')
  })

  it('displays 98% for score of 0.98', () => {
    const wrapper = mount(ConfidenceBadge, {
      props: { score: 0.98 },
    })
    expect(wrapper.text()).toContain('98%')
    expect(wrapper.text()).toContain('VERIFIED')
  })
})
