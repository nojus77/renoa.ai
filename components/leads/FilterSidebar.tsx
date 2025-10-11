"use client"

import { useState } from 'react'
import { useLeadFilterStore } from '@/lib/leads/filters'
import { ServiceCategory, type Lead } from '@prisma/client'
import { type LeadTier, type LeadStatus } from '@/lib/types/lead'

const serviceOptions = [
  { value: ServiceCategory.landscaping, label: 'Landscaping' },
  { value: ServiceCategory.remodeling, label: 'Remodeling' },
  { value: ServiceCategory.roofing, label: 'Roofing' },
  { value: ServiceCategory.fencing, label: 'Fencing' },
  { value: ServiceCategory.hvac, label: 'HVAC' },
  { value: ServiceCategory.plumbing, label: 'Plumbing' },
  { value: ServiceCategory.painting, label: 'Painting' },
]

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: '🆕 New' },
  { value: 'contacted', label: '📞 Contacted' },
  { value: 'replied', label: '💬 Replied' },
  { value: 'matched', label: '✅ Matched' },
  { value: 'converted', label: '🏆 Converted' },
  { value: 'unqualified', label: '❌ Unqualified' },
]

const tierOptions: Array<{ value: LeadTier; label: string }> = [
  { value: 'T1', label: 'Tier 1 (Premium)' },
  { value: 'T2', label: 'Tier 2 (Standard)' },
  { value: 'T3', label: 'Tier 3 (Basic)' },
]

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b pb-4 mb-4 last:border-0">
      <button
        className="flex items-center justify-between w-full mb-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <svg
          className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="space-y-2">{children}</div>}
    </div>
  )
}

interface RangeSliderProps {
  value: [number, number]
  onChange: (value: [number, number]) => void
  min: number
  max: number
  step?: number
  formatValue?: (value: number) => string
}

function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  formatValue = (v) => v.toString()
}: RangeSliderProps) {
  return (
    <div className="space-y-2">
      {/* Range inputs */}
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => onChange([Number(e.target.value), value[1]])}
          className="flex-1"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => onChange([value[0], Number(e.target.value)])}
          className="flex-1"
        />
      </div>

      {/* Value display */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">{formatValue(value[0])}</span>
        <span className="text-sm text-gray-600">{formatValue(value[1])}</span>
      </div>
    </div>
  )
}

export default function FilterSidebar() {
  const [
    filters,
    setFilter,
    clearFilter,
    clearAllFilters
  ] = useLeadFilterStore((state) => [
    state.filters,
    state.setFilter,
    state.clearFilter,
    state.clearAllFilters
  ])

  // Format currency for display
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value)

  return (
    <div className="w-64 bg-white rounded-lg shadow p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">Filters</h2>
        <button
          onClick={clearAllFilters}
          className="text-sm text-indigo-600 hover:text-indigo-700"
        >
          Clear all
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search leads..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="w-full p-2 border rounded-lg text-sm"
        />
      </div>

      {/* Score Range */}
      <FilterSection title="Score Range">
        <RangeSlider
          value={filters.scoreRange || [0, 100]}
          onChange={(value) => setFilter('scoreRange', value)}
          min={0}
          max={100}
        />
      </FilterSection>

      {/* Tier */}
      <FilterSection title="Tier">
        <div className="space-y-2">
          {tierOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.tiers?.includes(option.value as any)}
                onChange={(e) =>
                  setFilter(
                    'tiers',
                    e.target.checked
                      ? [...(filters.tiers || []), option.value]
                      : (filters.tiers || []).filter((t) => t !== option.value)
                  )
                }
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Status */}
      <FilterSection title="Status">
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="checkbox"
                checked={filters.statuses?.includes(option.value as any)}
                onChange={(e) =>
                  setFilter(
                    'statuses',
                    e.target.checked
                      ? [...(filters.statuses || []), option.value]
                      : (filters.statuses || []).filter((s) => s !== option.value)
                  )
                }
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Service */}
      <FilterSection title="Service">
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.confirmedOnly}
              onChange={(e) => setFilter('confirmedOnly', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Confirmed Only</span>
          </label>
          
          <div className="mt-2 space-y-2">
            {serviceOptions.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.services?.includes(option.value)}
                  onChange={(e) =>
                    setFilter(
                      'services',
                      e.target.checked
                        ? [...(filters.services || []), option.value]
                        : (filters.services || []).filter((s) => s !== option.value)
                    )
                  }
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Replied Filter */}
      <FilterSection title="Has Replied">
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              checked={filters.hasReplied === true}
              onChange={() => setFilter('hasReplied', true)}
              className="w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              checked={filters.hasReplied === false}
              onChange={() => setFilter('hasReplied', false)}
              className="w-4 h-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">No</span>
          </label>
        </div>
      </FilterSection>

      {/* Property Filters */}
      <FilterSection title="Property Details" defaultOpen={false}>
        <div className="space-y-4">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <RangeSlider
              value={filters.property?.priceRange || [0, 2000000]}
              onChange={(value) =>
                setFilter('property', {
                  ...filters.property,
                  priceRange: value
                })
              }
              min={0}
              max={2000000}
              step={50000}
              formatValue={formatCurrency}
            />
          </div>

          {/* Square Feet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Square Feet
            </label>
            <RangeSlider
              value={filters.property?.squareFeetRange || [0, 10000]}
              onChange={(value) =>
                setFilter('property', {
                  ...filters.property,
                  squareFeetRange: value
                })
              }
              min={0}
              max={10000}
              step={100}
              formatValue={(v) => `${v.toLocaleString()} sqft`}
            />
          </div>

          {/* Lot Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lot Size
            </label>
            <RangeSlider
              value={filters.property?.lotSizeRange || [0, 5]}
              onChange={(value) =>
                setFilter('property', {
                  ...filters.property,
                  lotSizeRange: value
                })
              }
              min={0}
              max={5}
              step={0.1}
              formatValue={(v) => `${v} acres`}
            />
          </div>

          {/* Bedrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bedrooms
            </label>
            <select
              value={filters.property?.bedrooms?.[0] || ''}
              onChange={(e) =>
                setFilter('property', {
                  ...filters.property,
                  bedrooms: e.target.value ? [Number(e.target.value)] : undefined
                })
              }
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Any</option>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>{n}+ beds</option>
              ))}
            </select>
          </div>

          {/* Bathrooms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bathrooms
            </label>
            <select
              value={filters.property?.bathrooms?.[0] || ''}
              onChange={(e) =>
                setFilter('property', {
                  ...filters.property,
                  bathrooms: e.target.value ? [Number(e.target.value)] : undefined
                })
              }
              className="w-full p-2 border rounded-lg text-sm"
            >
              <option value="">Any</option>
              {[1, 1.5, 2, 2.5, 3, 3.5, 4].map((n) => (
                <option key={n} value={n}>{n}+ baths</option>
              ))}
            </select>
          </div>
        </div>
      </FilterSection>

      {/* Apply Filters Button */}
      <button
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={() => {
          // Filters are already applied immediately, but this could trigger a refetch
        }}
      >
        Apply Filters
      </button>
    </div>
  )
}