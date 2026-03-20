import { Markup } from 'telegraf';
import { CALLBACKS } from './constants';

// Main menu after profit target - VIP (deposit >= $5k)
export const mainMenuVipKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('📊 CopyTrading', CALLBACKS.copytrading)],
    [Markup.button.callback('📡 Signals', CALLBACKS.signals)],
    [Markup.button.callback('💎 VIP Support', CALLBACKS.vipSupport)],
  ]);

// Main menu after profit target - Standard (deposit < $5k)
export const mainMenuStandardKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('📊 CopyTrading', CALLBACKS.copytrading)],
    [Markup.button.callback('📡 Signals', CALLBACKS.signals)],
    [Markup.button.callback('💬 Support', CALLBACKS.aiSupport)],
  ]);

// CopyTrading Step 1
export const ctStep1Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✅ Already have Pu Prime', CALLBACKS.alreadyHavePuPrime)],
    [Markup.button.callback('➡️ Next Step 2', CALLBACKS.ctNextStep2)],
    [Markup.button.callback('💬 Contact Admin', CALLBACKS.contactAdmin)],
  ]);

// CopyTrading IB sub-flow (after "Already have Pu Prime")
export const ctIbKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('💬 Contact Admin', CALLBACKS.contactAdmin)],
  ]);

// CopyTrading Step 2 → 3
export const ctStep2Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('➡️ Next Step 3', CALLBACKS.ctNextStep3)],
  ]);

// CopyTrading Step 3 → 4
export const ctStep3Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('➡️ Next Step 4', CALLBACKS.ctNextStep4)],
  ]);

// CopyTrading Step 4 → Final
export const ctStep4Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('🏁 Final Step', CALLBACKS.ctFinalStep)],
  ]);

// Signals Step 1
export const sigStep1Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("✅ I'm created account Done", CALLBACKS.sigCreatedAccount)],
    [Markup.button.callback('✅ I already have account Pu Prime', CALLBACKS.sigAlreadyHaveAccount)],
    [Markup.button.callback('💬 Contact Admin', CALLBACKS.contactAdmin)],
  ]);

// Signals Step 2 (deposit)
export const sigStep2Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback("✅ I'm deposited done", CALLBACKS.sigDepositedDone)],
    [Markup.button.callback('🎥 Video guide how to deposit', CALLBACKS.sigVideoGuide)],
  ]);
