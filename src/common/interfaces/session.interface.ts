import { Context, Scenes } from 'telegraf';

export interface BotSession extends Scenes.WizardSession {
  capitalRange?: string;
  selectedFlow?: 'copytrading' | 'signals' | 'contact';
  email?: string;
  currentStep?: string;
  awaitingEmail?: boolean;
  awaitingAccount?: boolean;
  awaitingLinkSource?: boolean;
  isVip?: boolean;
  inAiChat?: boolean;
  tier?: string;
}

export interface BotContext extends Context {
  session: BotSession;
  scene: Scenes.SceneContextScene<BotContext, Scenes.WizardSessionData>;
  wizard: Scenes.WizardContextWizard<BotContext>;
}
