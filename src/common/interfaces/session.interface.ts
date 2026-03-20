import { Context, Scenes } from 'telegraf';

export interface BotSession extends Scenes.WizardSession {
  profitTarget?: number;
  selectedFlow?: 'copytrading' | 'signals' | 'contact';
  email?: string;
  currentStep?: string;
  awaitingEmail?: boolean;
  awaitingProfitTarget?: boolean;
  awaitingLinkSource?: boolean;
}

export interface BotContext extends Context {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<BotContext>;
}
