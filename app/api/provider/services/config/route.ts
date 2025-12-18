import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/provider/services/config
 * Returns all ServiceTypeConfig records for a provider with skill names
 * Auto-creates configs from provider.serviceTypes if none exist (migration)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 });
    }

    // Fetch all service type configs for this provider
    let configs = await prisma.serviceTypeConfig.findMany({
      where: { providerId },
      orderBy: { serviceType: 'asc' },
    });

    // If no configs exist, auto-create from provider.serviceTypes
    if (configs.length === 0) {
      const provider = await prisma.provider.findUnique({
        where: { id: providerId },
        select: { serviceTypes: true },
      });

      if (provider?.serviceTypes && provider.serviceTypes.length > 0) {
        console.log('[ServiceConfig API] Auto-creating configs for provider:', providerId);

        // Create configs for each service type
        await prisma.serviceTypeConfig.createMany({
          data: provider.serviceTypes.map(serviceType => ({
            providerId,
            serviceType,
            estimatedDuration: 1.0, // Default 1 hour
            crewSizeMin: 1,
            crewSizeMax: 4,
            requiredSkills: [],
            preferredSkills: [],
          })),
          skipDuplicates: true,
        });

        // Fetch the newly created configs
        configs = await prisma.serviceTypeConfig.findMany({
          where: { providerId },
          orderBy: { serviceType: 'asc' },
        });

        console.log('[ServiceConfig API] Created', configs.length, 'configs');
      }
    }

    // Fetch all skills for this provider to get names
    const skills = await prisma.skill.findMany({
      where: { providerId },
      select: { id: true, name: true, category: true },
    });

    const skillMap = new Map(skills.map(s => [s.id, s]));

    // Transform configs with skill names
    const transformedConfigs = configs.map(config => ({
      id: config.id,
      serviceType: config.serviceType,
      estimatedDuration: config.estimatedDuration,
      crewSizeMin: config.crewSizeMin,
      crewSizeMax: config.crewSizeMax,
      requiredSkillIds: config.requiredSkills,
      preferredSkillIds: config.preferredSkills,
      requiredSkills: config.requiredSkills.map(id => {
        const skill = skillMap.get(id);
        return skill ? { id, name: skill.name, category: skill.category } : { id, name: id, category: null };
      }),
      preferredSkills: config.preferredSkills.map(id => {
        const skill = skillMap.get(id);
        return skill ? { id, name: skill.name, category: skill.category } : { id, name: id, category: null };
      }),
      skillWeight: config.skillWeight,
      availabilityWeight: config.availabilityWeight,
      workloadWeight: config.workloadWeight,
      historyWeight: config.historyWeight,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
    }));

    return NextResponse.json({ configs: transformedConfigs, skills });
  } catch (error) {
    console.error('[ServiceConfig API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service configurations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/provider/services/config
 * Creates a new ServiceTypeConfig record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      providerId,
      serviceType,
      estimatedDuration = 60, // Default 60 minutes
      crewSizeMin = 1,
      crewSizeMax = 4,
      requiredSkillIds = [],
      preferredSkillIds = [],
      category = 'landscaping',
    } = body;

    if (!providerId || !serviceType) {
      return NextResponse.json(
        { error: 'Provider ID and service type are required' },
        { status: 400 }
      );
    }

    // Check if service type already exists for this provider
    const existing = await prisma.serviceTypeConfig.findFirst({
      where: {
        providerId,
        serviceType: { equals: serviceType, mode: 'insensitive' },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Service type already exists', existingId: existing.id },
        { status: 400 }
      );
    }

    // Create the new service type config
    const config = await prisma.serviceTypeConfig.create({
      data: {
        providerId,
        serviceType,
        estimatedDuration: estimatedDuration / 60, // Convert minutes to hours for storage
        crewSizeMin,
        crewSizeMax,
        requiredSkills: requiredSkillIds,
        preferredSkills: preferredSkillIds,
      },
    });

    // Fetch skill names for response
    const skills = requiredSkillIds.length > 0 || preferredSkillIds.length > 0
      ? await prisma.skill.findMany({
          where: { id: { in: [...requiredSkillIds, ...preferredSkillIds] } },
          select: { id: true, name: true, category: true },
        })
      : [];

    const skillMap = new Map(skills.map(s => [s.id, s]));

    return NextResponse.json({
      success: true,
      config: {
        id: config.id,
        serviceType: config.serviceType,
        estimatedDuration: config.estimatedDuration,
        crewSizeMin: config.crewSizeMin,
        crewSizeMax: config.crewSizeMax,
        requiredSkillIds: config.requiredSkills,
        preferredSkillIds: config.preferredSkills,
        requiredSkills: config.requiredSkills.map(id => {
          const skill = skillMap.get(id);
          return skill ? { id, name: skill.name, category: skill.category } : { id, name: id, category: null };
        }),
        preferredSkills: config.preferredSkills.map(id => {
          const skill = skillMap.get(id);
          return skill ? { id, name: skill.name, category: skill.category } : { id, name: id, category: null };
        }),
      },
    });
  } catch (error) {
    console.error('[ServiceConfig API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create service configuration' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/provider/services/config
 * Updates an existing ServiceTypeConfig record
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      providerId,
      serviceType,
      estimatedDuration,
      crewSizeMin,
      crewSizeMax,
      requiredSkillIds,
      preferredSkillIds,
    } = body;

    if (!id || !providerId) {
      return NextResponse.json(
        { error: 'ID and Provider ID are required' },
        { status: 400 }
      );
    }

    // Verify the config belongs to this provider
    const existing = await prisma.serviceTypeConfig.findFirst({
      where: { id, providerId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {};
    if (serviceType !== undefined) updateData.serviceType = serviceType;
    if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration / 60;
    if (crewSizeMin !== undefined) updateData.crewSizeMin = crewSizeMin;
    if (crewSizeMax !== undefined) updateData.crewSizeMax = crewSizeMax;
    if (requiredSkillIds !== undefined) updateData.requiredSkills = requiredSkillIds;
    if (preferredSkillIds !== undefined) updateData.preferredSkills = preferredSkillIds;

    const config = await prisma.serviceTypeConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, config });
  } catch (error) {
    console.error('[ServiceConfig API] PUT Error:', error);
    return NextResponse.json(
      { error: 'Failed to update service configuration' },
      { status: 500 }
    );
  }
}
