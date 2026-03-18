import { InputMediaPhoto } from 'telegraf/types';
import { IMAGES } from './constants';
import * as fs from 'fs';

// Helper to create InputMediaPhoto from file path
function photo(filePath: string, caption?: string): InputMediaPhoto {
  if (!fs.existsSync(filePath)) {
    // Return placeholder if image doesn't exist yet
    return { type: 'photo', media: filePath, caption };
  }
  return {
    type: 'photo',
    media: { source: filePath },
    caption,
  };
}

// CopyTrading "Already have Pu Prime" - Mobile IB transfer guide (4 photos)
export function ctIbMobileMedia(): InputMediaPhoto[] {
  const imgs = IMAGES.copytrading.step1Ib;
  return [
    photo(imgs.mobile1, '⚡️ STEP TO TRANSFER SUPPORT CODE IN MOBILE'),
    photo(imgs.mobile2),
    photo(imgs.mobile3),
    photo(imgs.mobile4),
  ];
}

// CopyTrading "Already have Pu Prime" - Web IB transfer guide (1 photo)
export function ctIbWebMedia(): InputMediaPhoto[] {
  const imgs = IMAGES.copytrading.step1Ib;
  return [photo(imgs.web1, '⚡️ STEP TO TRANSFER SUPPORT CODE IN WEB')];
}

// CopyTrading Step 2 - Open Copy Trading Account (4 photos)
export function ctStep2Media(): InputMediaPhoto[] {
  const imgs = IMAGES.copytrading.step2;
  return [
    photo(imgs.appLive, 'Next STEP 2: Open Copy Trading Account'),
    photo(imgs.accountMgmt),
    photo(imgs.accountOpening),
    photo(imgs.congratulations),
  ];
}

// CopyTrading Step 3 - Transfer Funds (2 photos)
export function ctStep3Media(): InputMediaPhoto[] {
  const imgs = IMAGES.copytrading.step3;
  return [
    photo(imgs.profileTransfer, 'Next STEP 3: Transfer Funds to Copy Trading Account'),
    photo(imgs.transferFunds),
  ];
}

// CopyTrading Step 4 - Find Master Traders (2 photos)
export function ctStep4Media(): InputMediaPhoto[] {
  const imgs = IMAGES.copytrading.step4;
  return [
    photo(imgs.copyTradingHome, 'Step 4: Find Master Traders'),
    photo(imgs.redBullDetail),
  ];
}

// CopyTrading Final Step - Configure Copy Settings (2 photos)
export function ctFinalMedia(): InputMediaPhoto[] {
  const imgs = IMAGES.copytrading.step5;
  return [
    photo(imgs.copySettings1, 'FINAL STEP: Configure and Start Copying'),
    photo(imgs.copySettings2),
  ];
}
