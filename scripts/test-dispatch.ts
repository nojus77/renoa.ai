/**
 * Dispatch Optimization System Test Script
 *
 * Tests all dispatch optimization features including:
 * - Phase 1: Single worker route optimization
 * - Phase 2: Multi-worker batch optimization
 * - Phase 3: Real-time optimization and traffic
 *
 * Run with: DATABASE_URL="your-db-url" npx tsx scripts/test-dispatch.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  feature: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
  error?: string;
}

async function testDispatch() {
  const results: TestResult[] = [];

  console.log('\n🧪 Testing Dispatch Optimization System\n');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log('='.repeat(60));

  // ============================================
  // DATABASE CHECKS
  // ============================================
  console.log('\n📊 Database Schema Checks:\n');

  // Test 1: Check Provider has office coordinates fields
  try {
    const provider = await prisma.provider.findFirst({
      where: { officeLatitude: { not: null } },
      select: {
        id: true,
        businessName: true,
        officeLatitude: true,
        officeLongitude: true,
      },
    });

    if (provider) {
      results.push({
        feature: 'Provider office coordinates exist',
        status: 'PASS',
        details: `${provider.businessName}: (${provider.officeLatitude}, ${provider.officeLongitude})`,
      });
    } else {
      // Check if any providers exist
      const anyProvider = await prisma.provider.findFirst();
      if (anyProvider) {
        results.push({
          feature: 'Provider office coordinates exist',
          status: 'FAIL',
          details: 'Providers exist but none have geocoded office address',
        });
      } else {
        results.push({
          feature: 'Provider office coordinates exist',
          status: 'SKIP',
          details: 'No providers in database',
        });
      }
    }
  } catch (e) {
    results.push({
      feature: 'Provider office coordinates',
      status: 'FAIL',
      error: String(e),
    });
  }

  // Test 2: Check ProviderUser has home address fields
  try {
    const worker = await prisma.providerUser.findFirst({
      where: {
        homeLatitude: { not: null },
        role: 'field',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        homeLatitude: true,
        homeLongitude: true,
      },
    });

    if (worker) {
      results.push({
        feature: 'Worker home coordinates exist',
        status: 'PASS',
        details: `${worker.firstName} ${worker.lastName}: (${worker.homeLatitude}, ${worker.homeLongitude})`,
      });
    } else {
      const anyWorker = await prisma.providerUser.findFirst({ where: { role: 'field' } });
      if (anyWorker) {
        results.push({
          feature: 'Worker home coordinates exist',
          status: 'FAIL',
          details: 'Field workers exist but none have geocoded home address',
        });
      } else {
        results.push({
          feature: 'Worker home coordinates exist',
          status: 'SKIP',
          details: 'No field workers in database',
        });
      }
    }
  } catch (e) {
    results.push({
      feature: 'Worker home coordinates',
      status: 'FAIL',
      error: String(e),
    });
  }

  // Test 3: Check ProviderUser has current location fields (Phase 3)
  try {
    // Just check the schema supports the fields by trying to select them
    await prisma.providerUser.findFirst({
      select: {
        currentLatitude: true,
        currentLongitude: true,
        lastLocationUpdate: true,
      },
    });
    results.push({
      feature: 'Worker current location fields in schema',
      status: 'PASS',
      details: 'currentLatitude, currentLongitude, lastLocationUpdate fields exist',
    });
  } catch (e) {
    results.push({
      feature: 'Worker current location fields in schema',
      status: 'FAIL',
      error: 'Schema missing current location fields - run prisma db push',
    });
  }

  // Test 4: Check jobs have route optimization fields
  try {
    const job = await prisma.job.findFirst({
      select: {
        routeOrder: true,
        appointmentType: true,
        estimatedDuration: true,
      },
    });
    results.push({
      feature: 'Job route optimization fields',
      status: 'PASS',
      details: 'routeOrder, appointmentType, estimatedDuration fields exist',
    });
  } catch (e) {
    results.push({
      feature: 'Job route optimization fields',
      status: 'FAIL',
      error: String(e),
    });
  }

  // ============================================
  // API ENDPOINT CHECKS
  // ============================================
  console.log('\n🔌 API Endpoint Checks:\n');

  // Test 5: Check single worker optimize endpoint (Phase 1)
  try {
    const res = await fetch(`${BASE_URL}/api/provider/dispatch/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'test',
        date: new Date().toISOString().split('T')[0],
        workerIds: [],
      }),
    });
    results.push({
      feature: 'Single worker optimize endpoint (/api/provider/dispatch/optimize)',
      status: res.status !== 404 ? 'PASS' : 'FAIL',
      details: `Status: ${res.status}`,
    });
  } catch (e) {
    results.push({
      feature: 'Single worker optimize endpoint',
      status: 'FAIL',
      error: String(e),
    });
  }

  // Test 6: Check optimize-all endpoint (Phase 2)
  try {
    const res = await fetch(`${BASE_URL}/api/provider/dispatch/optimize-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        providerId: 'test',
        date: new Date().toISOString().split('T')[0],
        autoAssign: false,
      }),
    });
    results.push({
      feature: 'Multi-worker optimize-all endpoint (/api/provider/dispatch/optimize-all)',
      status: res.status !== 404 ? 'PASS' : 'FAIL',
      details: `Status: ${res.status}`,
    });
  } catch (e) {
    results.push({
      feature: 'Multi-worker optimize-all endpoint',
      status: 'FAIL',
      error: String(e),
    });
  }

  // Test 7: Check reoptimize endpoint (Phase 3)
  try {
    const res = await fetch(`${BASE_URL}/api/provider/dispatch/reoptimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workerId: 'test',
        providerId: 'test',
        trigger: 'test',
      }),
    });
    results.push({
      feature: 'Real-time reoptimize endpoint (/api/provider/dispatch/reoptimize)',
      status: res.status !== 404 ? 'PASS' : 'FAIL',
      details: `Status: ${res.status}`,
    });
  } catch (e) {
    results.push({
      feature: 'Real-time reoptimize endpoint',
      status: 'FAIL',
      error: String(e),
    });
  }

  // Test 8: Check worker location endpoint (Phase 3)
  try {
    const res = await fetch(`${BASE_URL}/api/worker/location`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test',
        latitude: 41.8781,
        longitude: -87.6298,
      }),
    });
    results.push({
      feature: 'Worker location tracking endpoint (/api/worker/location)',
      status: res.status !== 404 ? 'PASS' : 'FAIL',
      details: `Status: ${res.status}`,
    });
  } catch (e) {
    results.push({
      feature: 'Worker location tracking endpoint',
      status: 'FAIL',
      error: String(e),
    });
  }

  // Test 9: Check suggestions endpoint (Phase 3)
  try {
    const res = await fetch(
      `${BASE_URL}/api/provider/dispatch/suggestions?providerId=test&date=${new Date().toISOString().split('T')[0]}`
    );
    results.push({
      feature: 'Smart suggestions endpoint (/api/provider/dispatch/suggestions)',
      status: res.status !== 404 ? 'PASS' : 'FAIL',
      details: `Status: ${res.status}`,
    });
  } catch (e) {
    results.push({
      feature: 'Smart suggestions endpoint',
      status: 'FAIL',
      error: String(e),
    });
  }

  // ============================================
  // SERVICE/LIBRARY CHECKS
  // ============================================
  console.log('\n📚 Service/Library Checks:\n');

  // Test 10: Check distance service functions exist
  try {
    const distanceService = await import('../lib/services/distance-service');

    const functions = [
      'calculateHaversineDistance',
      'calculateDrivingDistance',
      'getDrivingTimeWithTraffic',
      'calculateRouteWithTraffic',
    ];

    const missing = functions.filter(fn => typeof (distanceService as Record<string, unknown>)[fn] !== 'function');

    if (missing.length === 0) {
      results.push({
        feature: 'Distance service functions',
        status: 'PASS',
        details: functions.join(', '),
      });
    } else {
      results.push({
        feature: 'Distance service functions',
        status: 'FAIL',
        details: `Missing: ${missing.join(', ')}`,
      });
    }
  } catch (e) {
    results.push({
      feature: 'Distance service',
      status: 'FAIL',
      error: String(e),
    });
  }

  // Test 11: Check Google Maps API key exists
  try {
    const apiKey = process.env.GOOGLE_MAPS_API || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    results.push({
      feature: 'Google Maps API key configured',
      status: apiKey ? 'PASS' : 'FAIL',
      details: apiKey ? 'API key found in environment' : 'Set GOOGLE_MAPS_API or NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
    });
  } catch (e) {
    results.push({
      feature: 'Google Maps API key',
      status: 'FAIL',
      error: String(e),
    });
  }

  // ============================================
  // PRINT RESULTS
  // ============================================
  console.log('\n' + '='.repeat(60));
  console.log('📋 RESULTS:');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  results.forEach(r => {
    let icon = '❓';
    if (r.status === 'PASS') {
      icon = '✅';
      passed++;
    } else if (r.status === 'FAIL') {
      icon = '❌';
      failed++;
    } else {
      icon = '⏭️';
      skipped++;
    }

    console.log(`${icon} ${r.feature}`);
    if (r.details) console.log(`   └─ ${r.details}`);
    if (r.error) console.log(`   └─ Error: ${r.error}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log(`⏭️  Skipped: ${skipped}/${results.length}\n`);

  if (failed > 0) {
    console.log('⚠️  Some features need attention. Check failed items above.\n');
    process.exit(1);
  } else {
    console.log('🎉 All dispatch optimization features are in place!\n');
    process.exit(0);
  }
}

// Run the tests
testDispatch()
  .catch(err => {
    console.error('Test script error:', err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
