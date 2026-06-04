const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test data
const testCampaign = {
  name: 'Test Campaign with Awards',
  academic_year: '2024-2025',
  start_date: '2024-01-01',
  end_date: '2024-12-31',
  award_structure: JSON.stringify([
    { name: 'Giải Nhất', quantity: 1, prize: '5,000,000 VND' },
    { name: 'Giải Nhì', quantity: 2, prize: '3,000,000 VND' },
    { name: 'Giải Ba', quantity: 3, prize: '1,000,000 VND' }
  ])
};

(async () => {
  try {
    // Test 1: Create campaign with award structure
    console.log('Test 1: Creating campaign with award structure...');
    const createRes = await axios.post(`${API_URL}/campaigns`, testCampaign);
    console.log('✓ Campaign created:', createRes.data);
    const campaignId = createRes.data.id;

    // Test 2: Get campaigns and verify award_structure
    console.log('\nTest 2: Getting campaigns to verify award_structure...');
    const getRes = await axios.get(`${API_URL}/campaigns`);
    const campaign = getRes.data.find(c => c.id === campaignId);
    if (campaign && campaign.award_structure) {
      console.log('✓ Award structure found:', campaign.award_structure);
    } else {
      console.log('✗ Award structure not found!');
    }

    // Test 3: Update campaign with new award structure
    console.log('\nTest 3: Updating campaign with new award structure...');
    const updateRes = await axios.put(`${API_URL}/campaigns/${campaignId}`, {
      ...testCampaign,
      award_structure: JSON.stringify([
        { name: 'Giải Khuyến Khích', quantity: 5, prize: '500,000 VND' }
      ])
    });
    console.log('✓ Campaign updated:', updateRes.data);

    // Test 4: Verify update
    console.log('\nTest 4: Verifying update...');
    const verifyRes = await axios.get(`${API_URL}/campaigns`);
    const updatedCampaign = verifyRes.data.find(c => c.id === campaignId);
    console.log('✓ Updated campaign award_structure:', updatedCampaign.award_structure);

    console.log('\n✓ All tests passed!');
  } catch (error) {
    console.error('✗ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
})();
