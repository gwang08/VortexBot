import * as path from 'path';

// PuPrime signup link
export const PUPRIME_SIGNUP_LINK =
  'https://www.puprime.com/campaign?cs=BMRMasterTrader';

// IB Code for existing PuPrime users
export const IB_CODE = 'hmZDV5Xa';

// Video guide URLs
export const VIDEO_GUIDES = {
  openAccount: 'https://youtu.be/_nCn1NHuLHI',
  idAuth: 'https://youtu.be/jJ6IFPOjGDE',
  addressVerify: 'https://youtu.be/XhDtV0h_tqo',
  usePromotions: 'https://youtu.be/4Z3q9yFRdPA',
  depositCrypto: 'https://youtu.be/pG1k2xPpzRQ',
  depositCreditCard: 'https://youtu.be/5LYD7DYW3tA',
  depositEWallet: 'https://youtu.be/VYlr2KPg19w',
  depositLocalBank: 'https://youtu.be/P2dtW_ccXMs',
  depositIntlBank: 'https://youtu.be/wQD1dWhuaqA',
  withdrawCrypto: 'https://youtu.be/pykRHpOsyqA',
  withdrawCreditCard: 'https://youtu.be/NakNND_T_ZA',
  withdrawEWallet: 'https://youtu.be/ZZ9zWmWcCKo',
  withdrawLocalBank: 'https://youtu.be/VNQyoTr7bfQ',
  withdrawIntlBank: 'https://youtu.be/R48576DzGqo',
};

// Text templates for account creation (shared between CopyTrading & Signals)
export const ACCOUNT_CREATION_TEXT = `Create account Pu Prime follow this link: ${PUPRIME_SIGNUP_LINK}

Video GUIDE:

📣 Opening A Live Account PuPrime: ${VIDEO_GUIDES.openAccount}
💋 ID Authentication  ${VIDEO_GUIDES.idAuth}
⭐️ Address Verification  ${VIDEO_GUIDES.addressVerify}
🎲 Use Promotions ${VIDEO_GUIDES.usePromotions}

If you already have account Pu Prime Press Button Below`;

// Deposit/withdrawal video guide text (shared)
export const DEPOSIT_VIDEO_GUIDE_TEXT = `Video GUIDE:

🔪 Deposit With Crypto  ${VIDEO_GUIDES.depositCrypto}
⭐️ Deposit By Credit Card   ${VIDEO_GUIDES.depositCreditCard}
💸 Deposit With E-Wallet ${VIDEO_GUIDES.depositEWallet}
🍒 Deposit With Local Bank   ${VIDEO_GUIDES.depositLocalBank}
💝 Deposit By International Bank    ${VIDEO_GUIDES.depositIntlBank}
🍀 Crypto Withdrawals  ${VIDEO_GUIDES.withdrawCrypto}
🔺 Withdraw Money By Credit Card   ${VIDEO_GUIDES.withdrawCreditCard}
🟫 Withdraw Funds Using E-Wallet    ${VIDEO_GUIDES.withdrawEWallet}
💠 Withdraw Funds Using Local Bank   ${VIDEO_GUIDES.withdrawLocalBank}
💻 Withdrawal by International Bank   ${VIDEO_GUIDES.withdrawIntlBank}`;

// Image paths (relative to project root)
const PUBLIC = path.join(process.cwd(), 'public');

export const IMAGES = {
  copytrading: {
    step1Ib: {
      mobile1: path.join(PUBLIC, 'copytrading/step1-ib/1.jpg'),
      mobile2: path.join(PUBLIC, 'copytrading/step1-ib/2.jpg'),
      mobile3: path.join(PUBLIC, 'copytrading/step1-ib/3.jpg'),
      mobile4: path.join(PUBLIC, 'copytrading/step1-ib/4.jpg'),
      web1: path.join(PUBLIC, 'copytrading/step1-ib/5.jpg'),
    },
    step2: {
      appLive: path.join(PUBLIC, 'copytrading/step2/1.jpg'),
      accountMgmt: path.join(PUBLIC, 'copytrading/step2/2.jpg'),
      accountOpening: path.join(PUBLIC, 'copytrading/step2/3.jpg'),
      congratulations: path.join(PUBLIC, 'copytrading/step2/4.jpg'),
    },
    step3: {
      profileTransfer: path.join(PUBLIC, 'copytrading/step3/1.jpg'),
      transferFunds: path.join(PUBLIC, 'copytrading/step3/2.jpg'),
    },
    step4: {
      copyTradingHome: path.join(PUBLIC, 'copytrading/step4/1.jpg'),
      redBullDetail: path.join(PUBLIC, 'copytrading/step4/2.jpg'),
    },
    step5: {
      copySettings1: path.join(PUBLIC, 'copytrading/step5/1.jpg'),
      copySettings2: path.join(PUBLIC, 'copytrading/step5/2.jpg'),
    },
  },
};

// Callback data keys for inline buttons
export const CALLBACKS = {
  copytrading: 'select_copytrading',
  signals: 'select_signals',
  contactAdmin: 'contact_admin',
  alreadyHavePuPrime: 'ct_already_puprime',
  ctNextStep2: 'ct_next_step2',
  ctNextStep3: 'ct_next_step3',
  ctNextStep4: 'ct_next_step4',
  ctFinalStep: 'ct_final_step',
  sigCreatedAccount: 'sig_created_account',
  sigAlreadyHaveAccount: 'sig_already_have_account',
  sigDepositedDone: 'sig_deposited_done',
  sigVideoGuide: 'sig_video_guide',
};
