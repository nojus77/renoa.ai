export interface QuestionOption {
  value: string;
  label: string;
}

export interface ServiceQuestion {
  id: string;
  question: string;
  type: 'radio' | 'checkbox' | 'textarea' | 'text' | 'ai_textarea';
  required: boolean;
  options?: QuestionOption[];
  placeholder?: string;
  subtitle?: string;
  aiPrompt?: string;
}

export interface ServiceQuestionnaire {
  steps: ServiceQuestion[];
}

export const serviceQuestions: Record<string, ServiceQuestionnaire> = {
  landscaping: {
    steps: [
      {
        id: 'project_type',
        question: 'What type of landscaping work do you need?',
        type: 'radio',
        required: true,
        options: [
          { value: 'new_lawn', label: 'New Lawn Installation' },
          { value: 'lawn_maintenance', label: 'Ongoing Lawn Maintenance' },
          { value: 'hardscaping', label: 'Hardscaping (Patio, Walkway, etc.)' },
          { value: 'landscape_design', label: 'Landscape Design & Installation' },
          { value: 'tree_service', label: 'Tree/Shrub Service' },
          { value: 'irrigation', label: 'Irrigation System' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'property_size',
        question: 'What is your property size?',
        type: 'radio',
        required: true,
        options: [
          { value: 'small', label: 'Small (< 5,000 sq ft)' },
          { value: 'medium', label: 'Medium (5,000-10,000 sq ft)' },
          { value: 'large', label: 'Large (10,000-20,000 sq ft)' },
          { value: 'xlarge', label: 'Very Large (20,000+ sq ft)' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'current_condition',
        question: 'Current condition of the area?',
        type: 'radio',
        required: true,
        options: [
          { value: 'excellent', label: 'Excellent - Well maintained' },
          { value: 'good', label: 'Good - Minor work needed' },
          { value: 'fair', label: 'Fair - Needs significant work' },
          { value: 'poor', label: 'Poor - Starting from scratch' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'specific_needs',
        question: 'What specific work is needed? (Select all that apply)',
        type: 'checkbox',
        required: false,
        options: [
          { value: 'sod', label: 'Sod Installation' },
          { value: 'seed', label: 'Grass Seeding' },
          { value: 'mulch', label: 'Mulching' },
          { value: 'trees', label: 'Tree Planting/Removal' },
          { value: 'irrigation', label: 'Irrigation/Sprinklers' },
          { value: 'grading', label: 'Grading/Drainage' },
          { value: 'edging', label: 'Edging/Borders' },
          { value: 'patio', label: 'Patio/Hardscape' }
        ]
      },
      {
        id: 'budget_range',
        question: 'What is your budget range?',
        type: 'radio',
        required: false,
        options: [
          { value: 'under_1k', label: 'Under $1,000' },
          { value: '1k_2.5k', label: '$1,000 - $2,500' },
          { value: '2.5k_5k', label: '$2,500 - $5,000' },
          { value: '5k_10k', label: '$5,000 - $10,000' },
          { value: 'over_10k', label: 'Over $10,000' },
          { value: 'not_sure', label: 'Not sure yet' }
        ]
      },
      {
        id: 'ai_description',
        question: 'Or, describe your project in your own words',
        subtitle: 'Let our AI analyze what you need and auto-fill details',
        type: 'ai_textarea',
        required: false,
        placeholder: 'Example: "I need to redo my backyard. The grass is mostly dead, there are some bare patches, and I want to add a small patio area. My yard is about 30x40 feet. Budget is around $3-5k and I\'d like it done before summer."',
        aiPrompt: 'Extract structured information from this description for a landscaping project'
      },
      {
        id: 'timeline',
        question: 'When do you need this done?',
        type: 'radio',
        required: true,
        options: [
          { value: 'asap', label: 'ASAP (within 1 week)' },
          { value: '1_month', label: 'Within 1 month' },
          { value: '3_months', label: 'Within 3 months' },
          { value: 'flexible', label: 'Flexible / Planning stage' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'additional_notes',
        question: 'Any additional details?',
        type: 'textarea',
        required: false,
        placeholder: 'Tell us more about your project...'
      }
    ]
  },

  lawn_care: {
    steps: [
      {
        id: 'service_type',
        question: 'What lawn care services do you need?',
        type: 'checkbox',
        required: true,
        options: [
          { value: 'mowing', label: 'Mowing' },
          { value: 'edging', label: 'Edging' },
          { value: 'trimming', label: 'Trimming' },
          { value: 'fertilization', label: 'Fertilization' },
          { value: 'weed_control', label: 'Weed Control' },
          { value: 'aeration', label: 'Aeration' },
          { value: 'leaf_removal', label: 'Leaf Removal' }
        ]
      },
      {
        id: 'frequency',
        question: 'How often do you need service?',
        type: 'radio',
        required: true,
        options: [
          { value: 'weekly', label: 'Weekly' },
          { value: 'biweekly', label: 'Bi-weekly (every 2 weeks)' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'one_time', label: 'One-time service' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'property_size',
        question: 'What is your lawn size?',
        type: 'radio',
        required: true,
        options: [
          { value: 'small', label: 'Small (< 5,000 sq ft)' },
          { value: 'medium', label: 'Medium (5,000-10,000 sq ft)' },
          { value: 'large', label: 'Large (10,000+ sq ft)' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'timeline',
        question: 'When do you want to start?',
        type: 'radio',
        required: true,
        options: [
          { value: 'asap', label: 'As soon as possible' },
          { value: 'next_week', label: 'Next week' },
          { value: 'next_month', label: 'Next month' },
          { value: 'flexible', label: 'Flexible' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      }
    ]
  },

  plumbing: {
    steps: [
      {
        id: 'issue_type',
        question: 'What type of plumbing work do you need?',
        type: 'radio',
        required: true,
        options: [
          { value: 'leak', label: 'Leak Repair' },
          { value: 'clog', label: 'Drain/Toilet Clog' },
          { value: 'installation', label: 'New Installation (Fixture, Appliance)' },
          { value: 'water_heater', label: 'Water Heater Issue' },
          { value: 'pipe_repair', label: 'Pipe Repair/Replacement' },
          { value: 'emergency', label: 'Emergency/Urgent Issue' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'urgency',
        question: 'How urgent is this issue?',
        type: 'radio',
        required: true,
        options: [
          { value: 'emergency', label: 'Emergency - Water damage occurring' },
          { value: 'urgent', label: 'Urgent - Need fix within 24-48 hours' },
          { value: 'soon', label: 'Soon - Within a week' },
          { value: 'planning', label: 'Planning - No rush' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'location',
        question: 'Where is the issue located?',
        type: 'checkbox',
        required: false,
        options: [
          { value: 'kitchen', label: 'Kitchen' },
          { value: 'bathroom', label: 'Bathroom' },
          { value: 'basement', label: 'Basement' },
          { value: 'garage', label: 'Garage' },
          { value: 'outdoor', label: 'Outdoor' },
          { value: 'multiple', label: 'Multiple locations' }
        ]
      },
      {
        id: 'additional_notes',
        question: 'Describe the issue in detail',
        type: 'textarea',
        required: false,
        placeholder: 'Please describe what is happening, when it started, etc.'
      }
    ]
  },

  hvac: {
    steps: [
      {
        id: 'service_needed',
        question: 'What HVAC service do you need?',
        type: 'radio',
        required: true,
        options: [
          { value: 'repair', label: 'Repair - System not working properly' },
          { value: 'maintenance', label: 'Maintenance/Tune-up' },
          { value: 'installation', label: 'New System Installation' },
          { value: 'replacement', label: 'System Replacement' },
          { value: 'emergency', label: 'Emergency - No heat/cooling' }
        ]
      },
      {
        id: 'system_type',
        question: 'What type of system do you have?',
        type: 'radio',
        required: true,
        options: [
          { value: 'central_ac', label: 'Central Air Conditioning' },
          { value: 'furnace', label: 'Furnace' },
          { value: 'heat_pump', label: 'Heat Pump' },
          { value: 'ductless', label: 'Ductless Mini-Split' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'system_age',
        question: 'How old is your system?',
        type: 'radio',
        required: false,
        options: [
          { value: 'new', label: 'Less than 5 years' },
          { value: 'mid', label: '5-10 years' },
          { value: 'old', label: '10-15 years' },
          { value: 'very_old', label: 'Over 15 years' },
          { value: 'unknown', label: 'Not sure' }
        ]
      },
      {
        id: 'home_size',
        question: 'What is your home size?',
        type: 'radio',
        required: true,
        options: [
          { value: 'small', label: 'Small (< 1,500 sq ft)' },
          { value: 'medium', label: 'Medium (1,500-2,500 sq ft)' },
          { value: 'large', label: 'Large (2,500-4,000 sq ft)' },
          { value: 'xlarge', label: 'Very Large (4,000+ sq ft)' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      }
    ]
  },

  roofing: {
    steps: [
      {
        id: 'service_type',
        question: 'What roofing service do you need?',
        type: 'radio',
        required: true,
        options: [
          { value: 'repair', label: 'Roof Repair' },
          { value: 'replacement', label: 'Full Roof Replacement' },
          { value: 'inspection', label: 'Roof Inspection' },
          { value: 'emergency', label: 'Emergency Leak Repair' },
          { value: 'maintenance', label: 'Maintenance/Cleaning' }
        ]
      },
      {
        id: 'roof_type',
        question: 'What type of roof do you have?',
        type: 'radio',
        required: true,
        options: [
          { value: 'asphalt', label: 'Asphalt Shingles' },
          { value: 'metal', label: 'Metal' },
          { value: 'tile', label: 'Tile' },
          { value: 'flat', label: 'Flat Roof' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'roof_age',
        question: 'How old is your roof?',
        type: 'radio',
        required: false,
        options: [
          { value: 'new', label: 'Less than 5 years' },
          { value: 'mid', label: '5-15 years' },
          { value: 'old', label: '15-25 years' },
          { value: 'very_old', label: 'Over 25 years' },
          { value: 'unknown', label: 'Not sure' }
        ]
      },
      {
        id: 'home_stories',
        question: 'How many stories is your home?',
        type: 'radio',
        required: true,
        options: [
          { value: '1', label: '1 story' },
          { value: '2', label: '2 stories' },
          { value: '3+', label: '3+ stories' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'issue_description',
        question: 'Describe the issue or what you need',
        type: 'textarea',
        required: false,
        placeholder: 'e.g., leak in bedroom, missing shingles, hail damage, etc.'
      }
    ]
  },

  remodeling: {
    steps: [
      {
        id: 'project_type',
        question: 'What type of remodeling project?',
        type: 'radio',
        required: true,
        options: [
          { value: 'kitchen', label: 'Kitchen Remodel' },
          { value: 'bathroom', label: 'Bathroom Remodel' },
          { value: 'basement', label: 'Basement Finishing' },
          { value: 'addition', label: 'Home Addition' },
          { value: 'whole_home', label: 'Whole Home Remodel' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'project_scope',
        question: 'What is the scope of work?',
        type: 'radio',
        required: true,
        options: [
          { value: 'cosmetic', label: 'Cosmetic updates (paint, fixtures, countertops)' },
          { value: 'moderate', label: 'Moderate (some layout changes, new cabinets)' },
          { value: 'major', label: 'Major (gut renovation, structural changes)' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'budget_range',
        question: 'What is your budget range?',
        type: 'radio',
        required: false,
        options: [
          { value: 'under_10k', label: 'Under $10,000' },
          { value: '10k_25k', label: '$10,000 - $25,000' },
          { value: '25k_50k', label: '$25,000 - $50,000' },
          { value: '50k_100k', label: '$50,000 - $100,000' },
          { value: 'over_100k', label: 'Over $100,000' },
          { value: 'not_sure', label: 'Not sure yet' }
        ]
      },
      {
        id: 'timeline',
        question: 'When do you want to start?',
        type: 'radio',
        required: true,
        options: [
          { value: 'asap', label: 'ASAP' },
          { value: '1_3_months', label: '1-3 months' },
          { value: '3_6_months', label: '3-6 months' },
          { value: 'planning', label: 'Just planning / Getting quotes' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      }
    ]
  },

  fencing: {
    steps: [
      {
        id: 'fence_type',
        question: 'What type of fence are you interested in?',
        type: 'radio',
        required: true,
        options: [
          { value: 'wood', label: 'Wood Fence' },
          { value: 'vinyl', label: 'Vinyl Fence' },
          { value: 'chain_link', label: 'Chain Link' },
          { value: 'aluminum', label: 'Aluminum/Metal' },
          { value: 'not_sure', label: 'Not sure yet' }
        ]
      },
      {
        id: 'fence_purpose',
        question: 'Primary purpose of the fence?',
        type: 'radio',
        required: true,
        options: [
          { value: 'privacy', label: 'Privacy' },
          { value: 'security', label: 'Security' },
          { value: 'pet_containment', label: 'Pet Containment' },
          { value: 'decorative', label: 'Decorative/Property Line' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'linear_feet',
        question: 'Approximately how many linear feet?',
        type: 'radio',
        required: true,
        options: [
          { value: 'small', label: 'Small (< 100 ft)' },
          { value: 'medium', label: 'Medium (100-200 ft)' },
          { value: 'large', label: 'Large (200-300 ft)' },
          { value: 'xlarge', label: 'Very Large (300+ ft)' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'height',
        question: 'Desired fence height?',
        type: 'radio',
        required: true,
        options: [
          { value: '4ft', label: '4 feet' },
          { value: '6ft', label: '6 feet' },
          { value: '8ft', label: '8 feet' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      }
    ]
  },

  painting: {
    steps: [
      {
        id: 'project_type',
        question: 'What needs to be painted?',
        type: 'checkbox',
        required: true,
        options: [
          { value: 'interior', label: 'Interior rooms' },
          { value: 'exterior', label: 'Exterior (siding, trim)' },
          { value: 'cabinets', label: 'Cabinets' },
          { value: 'deck', label: 'Deck/Fence' },
          { value: 'ceiling', label: 'Ceiling' }
        ]
      },
      {
        id: 'number_of_rooms',
        question: 'How many rooms? (if interior)',
        type: 'radio',
        required: false,
        options: [
          { value: '1', label: '1 room' },
          { value: '2-3', label: '2-3 rooms' },
          { value: '4-6', label: '4-6 rooms' },
          { value: 'whole_house', label: 'Whole house' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'prep_work',
        question: 'Will prep work be needed?',
        type: 'radio',
        required: true,
        options: [
          { value: 'minimal', label: 'Minimal - Good condition' },
          { value: 'moderate', label: 'Moderate - Some patching' },
          { value: 'extensive', label: 'Extensive - Major repairs needed' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'timeline',
        question: 'When do you need this done?',
        type: 'radio',
        required: true,
        options: [
          { value: 'asap', label: 'ASAP' },
          { value: '1_month', label: 'Within 1 month' },
          { value: 'flexible', label: 'Flexible' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      }
    ]
  },

  flooring: {
    steps: [
      {
        id: 'flooring_type',
        question: 'What type of flooring are you interested in?',
        type: 'radio',
        required: true,
        options: [
          { value: 'hardwood', label: 'Hardwood' },
          { value: 'laminate', label: 'Laminate' },
          { value: 'vinyl', label: 'Vinyl/LVP' },
          { value: 'tile', label: 'Tile' },
          { value: 'carpet', label: 'Carpet' },
          { value: 'not_sure', label: 'Not sure yet' }
        ]
      },
      {
        id: 'square_footage',
        question: 'Approximate square footage?',
        type: 'radio',
        required: true,
        options: [
          { value: 'small', label: 'Small (< 500 sq ft)' },
          { value: 'medium', label: 'Medium (500-1,000 sq ft)' },
          { value: 'large', label: 'Large (1,000-2,000 sq ft)' },
          { value: 'xlarge', label: 'Very Large (2,000+ sq ft)' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'rooms',
        question: 'Which rooms?',
        type: 'checkbox',
        required: false,
        options: [
          { value: 'living', label: 'Living Room' },
          { value: 'bedroom', label: 'Bedroom(s)' },
          { value: 'kitchen', label: 'Kitchen' },
          { value: 'bathroom', label: 'Bathroom(s)' },
          { value: 'basement', label: 'Basement' },
          { value: 'whole_house', label: 'Whole House' }
        ]
      },
      {
        id: 'timeline',
        question: 'When do you want this done?',
        type: 'radio',
        required: true,
        options: [
          { value: 'asap', label: 'ASAP' },
          { value: '1_month', label: 'Within 1 month' },
          { value: '3_months', label: 'Within 3 months' },
          { value: 'planning', label: 'Planning / Getting quotes' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      }
    ]
  },

  hardscaping: {
    steps: [
      {
        id: 'project_type',
        question: 'What hardscaping project do you need?',
        type: 'checkbox',
        required: true,
        options: [
          { value: 'patio', label: 'Patio' },
          { value: 'walkway', label: 'Walkway' },
          { value: 'driveway', label: 'Driveway' },
          { value: 'retaining_wall', label: 'Retaining Wall' },
          { value: 'outdoor_kitchen', label: 'Outdoor Kitchen' },
          { value: 'fire_pit', label: 'Fire Pit' }
        ]
      },
      {
        id: 'material',
        question: 'Preferred material?',
        type: 'radio',
        required: true,
        options: [
          { value: 'pavers', label: 'Pavers' },
          { value: 'concrete', label: 'Concrete' },
          { value: 'natural_stone', label: 'Natural Stone' },
          { value: 'brick', label: 'Brick' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'size',
        question: 'Approximate size of project?',
        type: 'radio',
        required: true,
        options: [
          { value: 'small', label: 'Small (< 200 sq ft)' },
          { value: 'medium', label: 'Medium (200-400 sq ft)' },
          { value: 'large', label: 'Large (400+ sq ft)' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      },
      {
        id: 'budget_range',
        question: 'Budget range?',
        type: 'radio',
        required: false,
        options: [
          { value: 'under_5k', label: 'Under $5,000' },
          { value: '5k_10k', label: '$5,000 - $10,000' },
          { value: '10k_20k', label: '$10,000 - $20,000' },
          { value: 'over_20k', label: 'Over $20,000' },
          { value: 'not_sure', label: 'Not sure' }
        ]
      }
    ]
  }
};
