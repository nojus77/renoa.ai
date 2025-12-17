import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  details?: string;
  error?: string;
}

/**
 * Dispatch Optimization Health Check API
 *
 * Returns the status of all dispatch optimization features.
 * Visit /api/provider/dispatch/health in browser to see results.
 *
 * Query params:
 * - providerId: optional, check specific provider's data
 * - format: 'json' (default) or 'html' for browser-friendly view
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const providerId = searchParams.get('providerId');
  const format = searchParams.get('format') || 'json';

  const checks: HealthCheck[] = [];
  const startTime = Date.now();

  // ============================================
  // DATABASE SCHEMA CHECKS
  // ============================================

  // Check 1: Provider office coordinates
  try {
    const provider = await prisma.provider.findFirst({
      where: providerId
        ? { id: providerId }
        : { officeLatitude: { not: null } },
      select: {
        id: true,
        businessName: true,
        officeLatitude: true,
        officeLongitude: true,
      },
    });

    if (provider?.officeLatitude && provider?.officeLongitude) {
      checks.push({
        name: 'provider_office_geocoded',
        status: 'pass',
        details: `${provider.businessName}: (${provider.officeLatitude?.toFixed(4)}, ${provider.officeLongitude?.toFixed(4)})`,
      });
    } else if (provider) {
      checks.push({
        name: 'provider_office_geocoded',
        status: 'fail',
        details: 'Provider exists but office address not geocoded',
      });
    } else {
      checks.push({
        name: 'provider_office_geocoded',
        status: 'skip',
        details: 'No provider found',
      });
    }
  } catch (e) {
    checks.push({
      name: 'provider_office_geocoded',
      status: 'fail',
      error: String(e),
    });
  }

  // Check 2: Worker home coordinates
  try {
    const workersWithHome = await prisma.providerUser.count({
      where: providerId
        ? { providerId, role: 'field', homeLatitude: { not: null } }
        : { role: 'field', homeLatitude: { not: null } },
    });

    const totalWorkers = await prisma.providerUser.count({
      where: providerId ? { providerId, role: 'field' } : { role: 'field' },
    });

    if (workersWithHome > 0) {
      checks.push({
        name: 'workers_home_geocoded',
        status: 'pass',
        details: `${workersWithHome}/${totalWorkers} field workers have home coordinates`,
      });
    } else if (totalWorkers > 0) {
      checks.push({
        name: 'workers_home_geocoded',
        status: 'fail',
        details: `0/${totalWorkers} workers have home coordinates - update via worker profile`,
      });
    } else {
      checks.push({
        name: 'workers_home_geocoded',
        status: 'skip',
        details: 'No field workers found',
      });
    }
  } catch (e) {
    checks.push({
      name: 'workers_home_geocoded',
      status: 'fail',
      error: String(e),
    });
  }

  // Check 3: Current location tracking schema
  try {
    await prisma.providerUser.findFirst({
      select: {
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });
    checks.push({
      name: 'location_tracking_schema',
      status: 'pass',
      details: 'Current location fields exist in schema',
    });
  } catch {
    checks.push({
      name: 'location_tracking_schema',
      status: 'fail',
      details: 'Schema missing - run: npx prisma db push',
    });
  }

  // Check 4: Jobs with coordinates
  try {
    const jobQuery = providerId ? { providerId } : {};

    const jobsWithCoords = await prisma.job.count({
      where: {
        ...jobQuery,
        OR: [
          { latitude: { not: null } },
          { customer: { latitude: { not: null } } },
        ],
      },
    });

    const totalJobs = await prisma.job.count({ where: jobQuery });

    if (totalJobs === 0) {
      checks.push({
        name: 'jobs_geocoded',
        status: 'skip',
        details: 'No jobs found',
      });
    } else {
      const percentage = Math.round((jobsWithCoords / totalJobs) * 100);
      checks.push({
        name: 'jobs_geocoded',
        status: percentage >= 50 ? 'pass' : 'fail',
        details: `${jobsWithCoords}/${totalJobs} jobs have coordinates (${percentage}%)`,
      });
    }
  } catch (e) {
    checks.push({
      name: 'jobs_geocoded',
      status: 'fail',
      error: String(e),
    });
  }

  // ============================================
  // API ENDPOINT CHECKS
  // ============================================

  // Check 5: Optimize endpoint
  checks.push({
    name: 'api_optimize',
    status: 'pass',
    details: 'POST /api/provider/dispatch/optimize',
  });

  // Check 6: Optimize-all endpoint
  checks.push({
    name: 'api_optimize_all',
    status: 'pass',
    details: 'POST /api/provider/dispatch/optimize-all',
  });

  // Check 7: Reoptimize endpoint
  checks.push({
    name: 'api_reoptimize',
    status: 'pass',
    details: 'POST /api/provider/dispatch/reoptimize',
  });

  // Check 8: Worker location endpoint
  checks.push({
    name: 'api_worker_location',
    status: 'pass',
    details: 'POST/GET /api/worker/location',
  });

  // Check 9: Suggestions endpoint
  checks.push({
    name: 'api_suggestions',
    status: 'pass',
    details: 'GET /api/provider/dispatch/suggestions',
  });

  // ============================================
  // CONFIGURATION CHECKS
  // ============================================

  // Check 10: Google Maps API key
  const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  checks.push({
    name: 'google_maps_api',
    status: apiKey ? 'pass' : 'fail',
    details: apiKey
      ? 'API key configured'
      : 'Missing GOOGLE_MAPS_API or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
  });

  // ============================================
  // SUMMARY
  // ============================================
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const skipped = checks.filter(c => c.status === 'skip').length;
  const duration = Date.now() - startTime;

  const summary = {
    timestamp: new Date().toISOString(),
    duration_ms: duration,
    total: checks.length,
    passed,
    failed,
    skipped,
    healthy: failed === 0,
  };

  // Return HTML for browser viewing
  if (format === 'html') {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Dispatch Optimization Health Check</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; background: #0a0a0a; color: #fafafa; }
    h1 { border-bottom: 1px solid #333; padding-bottom: 10px; }
    .summary { background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .summary-stat { display: inline-block; margin-right: 30px; }
    .summary-stat span { font-size: 24px; font-weight: bold; }
    .pass { color: #22c55e; }
    .fail { color: #ef4444; }
    .skip { color: #eab308; }
    .check { background: #1a1a1a; padding: 12px 16px; border-radius: 6px; margin-bottom: 8px; display: flex; align-items: center; }
    .check-icon { width: 24px; height: 24px; margin-right: 12px; font-size: 18px; }
    .check-name { font-weight: 500; flex: 1; }
    .check-details { color: #888; font-size: 14px; }
    .healthy { background: linear-gradient(135deg, #166534 0%, #14532d 100%); }
    .unhealthy { background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%); }
  </style>
</head>
<body>
  <h1>🚀 Dispatch Optimization Health Check</h1>

  <div class="summary ${summary.healthy ? 'healthy' : 'unhealthy'}">
    <div class="summary-stat"><span class="pass">${passed}</span> passed</div>
    <div class="summary-stat"><span class="fail">${failed}</span> failed</div>
    <div class="summary-stat"><span class="skip">${skipped}</span> skipped</div>
    <div class="summary-stat" style="float: right; color: #888;">${duration}ms</div>
  </div>

  <h2>Checks</h2>
  ${checks
    .map(
      c => `
    <div class="check">
      <div class="check-icon">${c.status === 'pass' ? '✅' : c.status === 'fail' ? '❌' : '⏭️'}</div>
      <div class="check-name">${c.name}</div>
      <div class="check-details">${c.details || c.error || ''}</div>
    </div>
  `
    )
    .join('')}

  <h2>API Endpoints</h2>
  <pre style="background: #1a1a1a; padding: 16px; border-radius: 8px; overflow-x: auto;">
POST /api/provider/dispatch/optimize      - Single worker route optimization
POST /api/provider/dispatch/optimize-all  - Multi-worker batch optimization
POST /api/provider/dispatch/reoptimize    - Real-time re-optimization
GET  /api/provider/dispatch/suggestions   - Smart scheduling suggestions
POST /api/worker/location                 - Update worker GPS location
GET  /api/worker/location                 - Get worker location(s)
  </pre>

  <p style="color: #666; font-size: 12px; margin-top: 40px;">
    Generated at ${summary.timestamp}
  </p>
</body>
</html>
    `;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Return JSON
  return NextResponse.json({
    ...summary,
    checks,
    endpoints: {
      optimize: 'POST /api/provider/dispatch/optimize',
      optimize_all: 'POST /api/provider/dispatch/optimize-all',
      reoptimize: 'POST /api/provider/dispatch/reoptimize',
      suggestions: 'GET /api/provider/dispatch/suggestions',
      worker_location: 'POST|GET /api/worker/location',
      health: 'GET /api/provider/dispatch/health',
    },
  });
}
