import { Markup } from 'telegraf';
import { CALLBACKS, BOT_TRADING_URL } from './constants';

// Capital selection (replaces profit target input)
export const capitalSelectionKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('💵 $100 – $500', CALLBACKS.capital100_500)],
    [Markup.button.callback('💰 $500 – $2,000', CALLBACKS.capital500_2000)],
    [Markup.button.callback('🏦 $2,000 – $5,000', CALLBACKS.capital2000_5000)],
    [Markup.button.callback('💎 $5,000 – $10,000', CALLBACKS.capital5000_10000)],
    [Markup.button.callback('👑 $10,000+', CALLBACKS.capital10000plus)],
    [Markup.button.url('📊 Bot Trading', BOT_TRADING_URL)],
  ]);

// Main menu - Retail tier
export const mainMenuRetailKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('📊 CopyTrading', CALLBACKS.copytrading)],
    [Markup.button.callback('📡 Signals', CALLBACKS.signals)],
    [Markup.button.callback('💬 AI Support', CALLBACKS.aiSupport)],
    [Markup.button.url('📊 Bot Trading', BOT_TRADING_URL)],
  ]);

// Main menu - Semi tier
export const mainMenuSemiKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('📊 CopyTrading', CALLBACKS.copytrading)],
    [Markup.button.callback('📡 Signals', CALLBACKS.signals)],
    [Markup.button.callback('💬 AI Support', CALLBACKS.aiSupport)],
    [Markup.button.url('📊 Bot Trading', BOT_TRADING_URL)],
  ]);

// Main menu - VIP tier
export const mainMenuVipKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('📊 CopyTrading', CALLBACKS.copytrading)],
    [Markup.button.callback('📡 Signals', CALLBACKS.signals)],
    [Markup.button.callback('💎 VIP Support', CALLBACKS.vipSupport)],
    [Markup.button.url('📊 Bot Trading', BOT_TRADING_URL)],
  ]);

// CopyTrading Step 1 - with registration confirm
export const ctStep1Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✅ I Registered', CALLBACKS.ctRegistered)],
    [Markup.button.callback('✅ Already have Pu Prime', CALLBACKS.alreadyHavePuPrime)],
    [Markup.button.callback('💬 Contact Admin', CALLBACKS.contactAdmin)],
  ]);

// CopyTrading IB sub-flow (after "Already have Pu Prime")
export const ctIbKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('💬 Contact Admin', CALLBACKS.contactAdmin)],
  ]);

// CopyTrading account collection - skip button
export const ctAccountKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('⏭ Skip', CALLBACKS.ctSkipAccount)],
  ]);

// CopyTrading Step 2 -> 3
export const ctStep2Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('➡️ Next Step 3', CALLBACKS.ctNextStep3)],
  ]);

// CopyTrading Step 3 -> 4 (with deposit confirm)
export const ctStep3Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('💰 I Deposited', CALLBACKS.ctDeposited)],
    [Markup.button.callback('➡️ Next Step 4', CALLBACKS.ctNextStep4)],
  ]);

// CopyTrading Step 4 -> Final
export const ctStep4Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('🏁 Final Step', CALLBACKS.ctFinalStep)],
  ]);

// CopyTrading final - copy enabled confirm
export const ctFinalKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✅ I Enabled CopyTrade', CALLBACKS.ctCopyEnabled)],
  ]);

// Signals Step 1
export const sigStep1Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('✅ I Registered', CALLBACKS.sigRegistered)],
    [Markup.button.callback('✅ Already have Pu Prime', CALLBACKS.sigAlreadyHaveAccount)],
    [Markup.button.callback('💬 Contact Admin', CALLBACKS.contactAdmin)],
  ]);

// Signals account collection - skip button
export const sigAccountKeyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('⏭ Skip', CALLBACKS.sigSkipAccount)],
  ]);

// Signals Step 2 (deposit with confirm)
export const sigStep2Keyboard = () =>
  Markup.inlineKeyboard([
    [Markup.button.callback('💰 I Deposited', CALLBACKS.sigDeposited)],
    [Markup.button.callback('🎥 Video guide how to deposit', CALLBACKS.sigVideoGuide)],
  ]);
