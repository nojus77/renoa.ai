import { CampaignEngine } from '@/lib/services/campaign-engine';

async function test() {
  console.log('Creating test campaign...');
  
  const campaign = await CampaignEngine.createCampaign({
    name: 'Test Campaign',
    serviceType: 'landscaping',
    sequences: [
      {
        stepNumber: 1,
        delayDays: 0,
        delayHours: 0,
        template: {
          name: 'Test Email',
          subject: 'Hello {{firstName}}!',
          body: '<html><body><p>Hi {{firstName}} from {{city}}!</p></body></html>',
        },
      },
    ],
  });

  console.log('✅ Campaign created:', campaign.id);
  console.log('✅ Starting campaign...');
  
  await CampaignEngine.startCampaign(campaign.id);
  console.log('✅ Campaign is now ACTIVE');
}

test();
