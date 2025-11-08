'use client'

interface LiveSummaryProps {
  service: string
  zip: string
  projectDetails: Record<string, any>
  city?: string
  state?: string
}

export default function LiveSummary({ service, zip, projectDetails, city, state }: LiveSummaryProps) {
  // Format service name for display
  const formatServiceName = (service: string) => {
    return service
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Extract key details based on what's been answered
  const getKeyDetails = () => {
    const details: string[] = []

    // Property/project size
    if (projectDetails.property_size) {
      const sizeLabel = ({
        small: 'Small property',
        medium: 'Medium property',
        large: 'Large property',
        xlarge: 'Very large property',
        not_sure: 'Size TBD'
      } as any)[projectDetails.property_size] || projectDetails.property_size
      details.push(sizeLabel)
    }

    if (projectDetails.square_footage) {
      const sqftLabel = ({
        small: 'Small area',
        medium: 'Medium area',
        large: 'Large area',
        xlarge: 'Very large area',
        not_sure: 'Size TBD'
      } as any)[projectDetails.square_footage] || projectDetails.square_footage
      details.push(sqftLabel)
    }

    if (projectDetails.linear_feet) {
      const linearLabel = ({
        small: '<100 ft',
        medium: '100-200 ft',
        large: '200-300 ft',
        xlarge: '300+ ft',
        not_sure: 'Length TBD'
      } as any)[projectDetails.linear_feet] || projectDetails.linear_feet
      details.push(linearLabel)
    }

    // Timeline
    if (projectDetails.timeline) {
      const timelineLabel = ({
        asap: 'ASAP',
        '1_month': 'Within 1 month',
        '3_months': 'Within 3 months',
        next_week: 'Next week',
        next_month: 'Next month',
        flexible: 'Flexible timing',
        planning: 'Planning stage',
        not_sure: 'Timeline TBD'
      } as any)[projectDetails.timeline] || 'Timeline set'
      details.push(timelineLabel)
    }

    // Budget
    if (projectDetails.budget_range && projectDetails.budget_range !== 'not_sure') {
      details.push('Budget set')
    }

    // Project type specifics
    if (projectDetails.project_type) {
      const typeLabel = ({
        new_lawn: 'New lawn',
        lawn_maintenance: 'Maintenance',
        kitchen: 'Kitchen',
        bathroom: 'Bathroom',
        basement: 'Basement',
        repair: 'Repair',
        replacement: 'Replacement',
        installation: 'Installation',
        not_sure: 'Type TBD'
      } as any)[projectDetails.project_type] || projectDetails.project_type
      if (typeLabel !== 'Type TBD') {
        details.push(typeLabel)
      }
    }

    // Service type for lawn care
    if (projectDetails.service_type && Array.isArray(projectDetails.service_type) && projectDetails.service_type.length > 0) {
      details.push(`${projectDetails.service_type.length} services`)
    }

    // Frequency for recurring services
    if (projectDetails.frequency) {
      const freqLabel = ({
        weekly: 'Weekly',
        biweekly: 'Bi-weekly',
        monthly: 'Monthly',
        one_time: 'One-time',
        not_sure: 'Frequency TBD'
      } as any)[projectDetails.frequency] || projectDetails.frequency
      details.push(freqLabel)
    }

    return details
  }

  const keyDetails = getKeyDetails()
  const location = city && state ? `${city}, ${state}` : zip

  return (
    <div className="live-summary">
      <div className="live-summary-content">
        <span className="live-summary-icon">📋</span>
        <span className="live-summary-text">
          <strong>{formatServiceName(service)}</strong>
          <span className="live-summary-separator">•</span>
          <span className="live-summary-location">{location}</span>
          {keyDetails.length > 0 && (
            <>
              <span className="live-summary-separator">•</span>
              <span className="live-summary-details">{keyDetails.join(' • ')}</span>
            </>
          )}
        </span>
      </div>
    </div>
  )
}
