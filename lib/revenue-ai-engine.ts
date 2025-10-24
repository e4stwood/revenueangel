/**
 * Revenue AI Engine
 * 
 * Generates personalized messages for nurture, upsell, and churn save campaigns.
 * Built on existing OpenRouter integration from ai-engine.ts
 */

import OpenAI from 'openai';
import { config, logger, retry } from './shared-utils';

export interface MessageGenerationParams {
  type: 'nurture' | 'upsell' | 'churnsave';
  tone: 'friendly' | 'expert' | 'hype' | 'minimal' | 'custom';
  recipientData: {
    firstName?: string;
    planName?: string;
    tenure?: number;
  };
  companyContext?: string;
  stepContext?: {
    order: number;
    totalSteps: number;
    delay?: string;
  };
  targetProduct?: {
    name: string;
    benefits: string[];
    price?: string;
  };
  incentive?: {
    type: 'discount' | 'bonus' | 'trial';
    value: string;
  };
}

class RevenueAIEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: config.OPENROUTER_API_KEY,
    });
  }

  /**
   * Generate a nurture message for lead → first purchase
   */
  async generateNurtureMessage(params: MessageGenerationParams): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(params);
    const userPrompt = this.buildNurturePrompt(params);

    return await this.generateMessage(systemPrompt, userPrompt);
  }

  /**
   * Generate an upsell message for tier upgrade
   */
  async generateUpsellMessage(params: MessageGenerationParams): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(params);
    const userPrompt = this.buildUpsellPrompt(params);

    return await this.generateMessage(systemPrompt, userPrompt);
  }

  /**
   * Generate a churn save message for retention
   */
  async generateChurnSaveMessage(params: MessageGenerationParams): Promise<string> {
    const systemPrompt = this.buildSystemPrompt(params);
    const userPrompt = this.buildChurnSavePrompt(params);

    return await this.generateMessage(systemPrompt, userPrompt);
  }

  private buildSystemPrompt(params: MessageGenerationParams): string {
    let prompt = 'You are an expert at writing conversion-focused messages for online communities and digital products.\n\n';

    // Add tone guidance
    switch (params.tone) {
      case 'friendly':
        prompt += 'Write in a warm, friendly, and conversational tone. Be approachable and personal.\n';
        break;
      case 'expert':
        prompt += 'Write in a professional, authoritative tone. Be confident and informative.\n';
        break;
      case 'hype':
        prompt += 'Write in an energetic, exciting tone. Build enthusiasm and urgency.\n';
        break;
      case 'minimal':
        prompt += 'Write in a brief, direct tone. Be concise and to the point.\n';
        break;
      case 'custom':
        prompt += 'Write in a natural, balanced tone.\n';
        break;
    }

    // Add company context if provided
    if (params.companyContext) {
      prompt += `\nCompany Context: ${params.companyContext}\n`;
    }

    prompt += '\nGuidelines:\n';
    prompt += '- Keep messages under 150 words\n';
    prompt += '- Use personalization variables when appropriate: {{first_name}}, {{plan_name}}\n';
    prompt += '- Include a clear call-to-action\n';
    prompt += '- Be genuine and avoid pushy sales language\n';
    prompt += '- Focus on value and benefits, not just features\n';

    return prompt;
  }

  private buildNurturePrompt(params: MessageGenerationParams): string {
    const step = params.stepContext?.order || 1;
    const total = params.stepContext?.totalSteps || 3;

    let prompt = `Write a nurture message (step ${step} of ${total}) for someone who hasn't made their first purchase yet.\n\n`;

    if (step === 1) {
      prompt += 'This is the first touchpoint. Remind them what they showed interest in and reinforce the value proposition.';
    } else if (step === 2) {
      prompt += 'This is a follow-up. Share a success story or social proof to build trust.';
    } else {
      prompt += 'This is the final touchpoint. Create urgency and offer an incentive if applicable.';
      if (params.incentive) {
        prompt += `\nIncentive: ${params.incentive.type} - ${params.incentive.value}`;
      }
    }

    if (params.targetProduct) {
      prompt += `\n\nProduct: ${params.targetProduct.name}`;
      prompt += `\nBenefits: ${params.targetProduct.benefits.join(', ')}`;
    }

    return prompt;
  }

  private buildUpsellPrompt(params: MessageGenerationParams): string {
    let prompt = 'Write an upgrade message for an existing member to move to a higher tier.\n\n';

    prompt += `Current plan: {{plan_name}}\n`;
    
    if (params.recipientData.tenure) {
      prompt += `Member for ${params.recipientData.tenure} days\n`;
    }

    if (params.targetProduct) {
      prompt += `\nUpgrade to: ${params.targetProduct.name}`;
      prompt += `\nWhat they'll unlock: ${params.targetProduct.benefits.join(', ')}`;
      if (params.targetProduct.price) {
        prompt += `\nPrice: ${params.targetProduct.price}`;
      }
    }

    prompt += '\n\nFocus on what they\'re missing out on and how the upgrade will help them achieve their goals.';

    return prompt;
  }

  private buildChurnSavePrompt(params: MessageGenerationParams): string {
    const step = params.stepContext?.order || 1;

    let prompt = 'Write a retention message for a member experiencing payment issues or considering cancellation.\n\n';

    if (step === 1) {
      prompt += 'This is the immediate response. Acknowledge the issue and offer to help resolve it quickly.';
      prompt += '\nOffer options: retry payment, update payment method, or contact support.';
    } else {
      prompt += 'This is a follow-up. Offer alternatives like downgrading to a lower tier or pausing membership.';
      if (params.incentive) {
        prompt += `\nIncentive: ${params.incentive.type} - ${params.incentive.value}`;
      }
    }

    prompt += '\n\nBe empathetic and helpful, not pushy. Focus on finding a solution that works for them.';

    return prompt;
  }

  private async generateMessage(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      const response = await retry(async () => {
        return await this.openai.chat.completions.create({
          model: config.OPENROUTER_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 300,
          temperature: 0.7,
        });
      });

      const message = response.choices[0]?.message?.content?.trim() || '';

      if (!message) {
        throw new Error('No message generated');
      }

      logger.debug('Message generated successfully', {
        messageLength: message.length,
      });

      return message;

    } catch (error) {
      logger.error('Failed to generate message', error as Error);
      throw error;
    }
  }

  /**
   * Substitute variables in a message template
   */
  substituteVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value || '');
    }

    return result;
  }
}

export const revenueAI = new RevenueAIEngine();

