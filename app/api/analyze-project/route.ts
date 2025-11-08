import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Realistic estimate ranges by service
const serviceEstimates: Record<string, { base: { min: number, max: number}, factors: Record<string, number> }> = {
  'landscaping': {
    base: { min: 500, max: 2000 },
    factors: {
      'small': 0.5,
      'medium': 1.0,
      'large': 2.0,
      'design': 1.5,
      'hardscaping': 2.5
    }
  },
  'plumbing': {
    base: { min: 150, max: 500 },
    factors: {
      'emergency': 1.5,
      'installation': 2.0,
      'minor': 0.7
    }
  },
  'hvac': {
    base: { min: 100, max: 400 },
    factors: {
      'maintenance': 0.8,
      'repair': 1.2,
      'installation': 5.0
    }
  },
  'electrical': {
    base: { min: 150, max: 450 },
    factors: {
      'outlet': 0.8,
      'rewiring': 2.0,
      'panel': 2.5
    }
  },
  'painting': {
    base: { min: 300, max: 1500 },
    factors: {
      'interior': 1.0,
      'exterior': 1.5,
      'prep_heavy': 1.3
    }
  },
  'roofing': {
    base: { min: 500, max: 2500 },
    factors: {
      'repair': 0.5,
      'replacement': 3.0,
      'emergency': 1.5
    }
  },
  'cleaning': {
    base: { min: 100, max: 350 },
    factors: {
      'deep': 1.5,
      'standard': 1.0,
      'move_out': 1.8
    }
  },
  'flooring': {
    base: { min: 500, max: 3000 },
    factors: {
      'small_room': 0.5,
      'large_area': 2.0,
      'hardwood': 1.5,
      'tile': 1.8
    }
  },
  'lawn_care': {
    base: { min: 50, max: 200 },
    factors: {
      'weekly': 1.0,
      'monthly': 0.8,
      'large': 1.5
    }
  },
  'hardscaping': {
    base: { min: 1000, max: 5000 },
    factors: {
      'patio': 1.0,
      'retaining_wall': 1.5,
      'driveway': 2.0
    }
  },
  'remodeling': {
    base: { min: 2000, max: 15000 },
    factors: {
      'kitchen': 2.0,
      'bathroom': 1.5,
      'basement': 1.8
    }
  },
  'fencing': {
    base: { min: 1000, max: 4000 },
    factors: {
      'wood': 1.0,
      'vinyl': 1.3,
      'chain_link': 0.7
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { description, service, zip } = await req.json()

    if (!description || description.length < 50) {
      return NextResponse.json(
        { error: 'Description must be at least 50 characters' },
        { status: 400 }
      )
    }

    console.log(`📝 Analyzing ${service} project in ${zip}`)

    // AI Analysis
    const analysisPrompt = `You are analyzing a home service request. Extract structured information.

Service: ${service}
Location: ${zip}
Description: "${description}"

Extract these details (be SPECIFIC, not generic):
1. Specific project type (e.g., "gutter cleaning for 2-story home" not just "home maintenance")
2. Property size/scope if mentioned (sq ft, stories, room count, etc.)
3. Timeline/urgency if mentioned
4. Budget range if mentioned
5. Special requirements or concerns

Also identify key factors for cost estimation:
- Is this emergency/urgent work?
- What's the scope (small/medium/large)?
- Any specific materials or requirements mentioned?
- Complexity level?

Return JSON with this exact structure:
{
  "projectType": "specific description",
  "propertySize": "details or null",
  "timeline": "details or null",
  "budget": "mentioned budget or null",
  "specialRequirements": "special notes or null",
  "costFactors": ["factor1", "factor2"]
}`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You extract structured data from home service requests. Be specific and accurate. Return only valid JSON.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500
    })

    const extracted = JSON.parse(response.choices[0].message.content || '{}')
    console.log('✅ AI Extracted:', extracted)

    // Generate estimate
    const estimate = calculateEstimate(service, extracted.costFactors || [])

    console.log('💰 Estimate:', estimate)

    return NextResponse.json({
      extracted,
      estimate
    })

  } catch (error: any) {
    console.error('❌ Analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze project', details: error.message },
      { status: 500 }
    )
  }
}

function calculateEstimate(
  service: string,
  costFactors: string[]
): {
  min: number
  max: number
  confidence: 'high' | 'medium' | 'low'
  explanation: string
} {
  const serviceKey = service.toLowerCase()

  // Special case: Gutter cleaning (check costFactors for specific mentions)
  const hasGutter = costFactors.some(f => f.toLowerCase().includes('gutter'))
  if (hasGutter || serviceKey.includes('gutter')) {
    return {
      min: 150,
      max: 400,
      confidence: 'high',
      explanation: 'Gutter cleaning for a typical home ranges from $150-$400 depending on home size, gutter length, and condition. This includes debris removal and basic flushing.'
    }
  }

  // Special case: Power washing
  const hasPowerWash = costFactors.some(f => {
    const lower = f.toLowerCase()
    return lower.includes('power wash') || lower.includes('pressure wash') || lower.includes('washing')
  })
  if (hasPowerWash || serviceKey.includes('wash')) {
    return {
      min: 200,
      max: 500,
      confidence: 'high',
      explanation: 'Power washing costs typically range from $200-$500 based on surface area, type of surface, and whether it includes deck, driveway, or siding.'
    }
  }

  const serviceConfig = serviceEstimates[serviceKey]

  if (!serviceConfig) {
    // Fallback for unknown services
    return {
      min: 200,
      max: 800,
      confidence: 'low',
      explanation: `This is a general estimate. Actual costs vary based on project specifics.`
    }
  }

  let multiplier = 1.0
  const appliedFactors: string[] = []

  // Apply relevant factors
  for (const [factorKey, factorValue] of Object.entries(serviceConfig.factors)) {
    for (const costFactor of costFactors) {
      if (costFactor.toLowerCase().includes(factorKey.toLowerCase())) {
        multiplier *= factorValue
        appliedFactors.push(factorKey)
        break
      }
    }
  }

  const min = Math.round(serviceConfig.base.min * multiplier)
  const max = Math.round(serviceConfig.base.max * multiplier)

  // Determine confidence
  const confidence = appliedFactors.length >= 2 ? 'high' : appliedFactors.length === 1 ? 'medium' : 'low'

  const explanation = generateExplanation(service, min, max, appliedFactors)

  return { min, max, confidence, explanation }
}

function generateExplanation(service: string, min: number, max: number, factors: string[]): string {
  const baseExplanations: Record<string, string> = {
    'landscaping': 'landscaping costs depend on project size, materials, and labor',
    'plumbing': 'plumbing costs vary by complexity and whether parts need replacement',
    'hvac': 'HVAC work pricing depends on the type of service and system age',
    'electrical': 'electrical work costs depend on scope and code requirements',
    'painting': 'painting costs vary by area size and surface preparation needed',
    'roofing': 'roofing costs depend on damage extent and materials',
    'cleaning': 'cleaning costs depend on home size and service level',
    'flooring': 'flooring costs vary by material type and room size',
    'lawn_care': 'lawn care costs depend on yard size and frequency',
    'hardscaping': 'hardscaping costs vary by materials and project complexity',
    'remodeling': 'remodeling costs depend on scope and material choices',
    'fencing': 'fencing costs vary by material type and linear footage'
  }

  const serviceKey = service.toLowerCase()
  let explanation = `The cost of ${service.toLowerCase()} typically ranges from $${min.toLocaleString()} to $${max.toLocaleString()}.`

  if (factors.length > 0) {
    explanation += ` This estimate considers: ${factors.join(', ')}.`
  }

  explanation += ` ${baseExplanations[serviceKey] || 'Costs vary based on specific requirements'}.`

  return explanation
}
