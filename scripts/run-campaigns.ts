import { CampaignEngine } from '@/lib/services/campaign-engine';

async function run() {
  console.log('🚀 Running campaign processor...');
  
  try {
    await CampaignEngine.processCampaigns();
  } catch (error) {
    console.error('❌ Campaign processing failed:', error);
  }
}

run();
