require('./backend/node_modules/dotenv').config({ path: './backend/.env' });
const pool = require('./backend/db');

async function updateAwardStructure() {
  try {
    console.log('Updating campaigns with default award structure...');
    
    // Lấy tất cả các đợt thi hiện tại
    const [campaigns] = await pool.execute('SELECT id, name, award_structure FROM campaigns');
    
    console.log(`Found ${campaigns.length} campaigns`);
    
    // Cấu trúc giải thưởng mặc định
    const defaultAwardStructure = JSON.stringify([
      { name: 'Giải Nhất', quantity: 1, prize: '5,000,000 VND' },
      { name: 'Giải Nhì', quantity: 2, prize: '3,000,000 VND' },
      { name: 'Giải Ba', quantity: 3, prize: '1,000,000 VND' },
      { name: 'Giải Khuyến Khích', quantity: 5, prize: '500,000 VND' }
    ]);
    
    // Cập nhật các đợt thi không có award_structure
    for (const campaign of campaigns) {
      if (!campaign.award_structure || campaign.award_structure === null || campaign.award_structure === '') {
        console.log(`\nUpdating campaign ID ${campaign.id} (${campaign.name})...`);
        await pool.execute(
          'UPDATE campaigns SET award_structure = ? WHERE id = ?',
          [defaultAwardStructure, campaign.id]
        );
        console.log(`✓ Updated campaign ID ${campaign.id}`);
      } else {
        console.log(`\nCampaign ID ${campaign.id} already has award structure`);
        console.log(`  Structure: ${campaign.award_structure}`);
      }
    }
    
    console.log('\n✓ All campaigns updated successfully!');
    
  } catch (error) {
    console.error('Error updating campaigns:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateAwardStructure();
