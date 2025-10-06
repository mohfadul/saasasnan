import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentProvider } from '../entities/payment.entity';

@Injectable()
export class PaymentValidationService {
  /**
   * Validate Sudan mobile wallet phone number
   * Format: +2499XXXXXXXX (9 followed by 8 digits)
   */
  validateSudanPhone(phone: string): boolean {
    const sudanPhoneRegex = /^\+2499[0-9]{8}$/;
    return sudanPhoneRegex.test(phone);
  }

  /**
   * Validate transaction reference ID based on provider
   */
  validateReferenceId(provider: PaymentProvider, referenceId: string): void {
    const validationRules: Record<PaymentProvider, RegExp | null> = {
      [PaymentProvider.BANK_OF_KHARTOUM]: /^BOK[0-9]{10,15}$/,
      [PaymentProvider.FAISAL_ISLAMIC_BANK]: /^FIB[0-9]{10,15}$/,
      [PaymentProvider.OMDURMAN_NATIONAL_BANK]: /^ONB[0-9]{10,15}$/,
      [PaymentProvider.ZAIN_BEDE]: /^[0-9]{10,15}$/,
      [PaymentProvider.CASHI]: /^CASHI[0-9]{8,12}$/,
      [PaymentProvider.CASH_ON_DELIVERY]: null, // No validation needed
      [PaymentProvider.CASH_AT_BRANCH]: null, // No validation needed
      [PaymentProvider.OTHER]: null,
    };

    const rule = validationRules[provider];

    if (rule && !rule.test(referenceId)) {
      throw new BadRequestException(
        `Invalid reference ID format for ${provider}. Please check your transaction reference.`,
      );
    }
  }

  /**
   * Check if receipt is required based on provider and amount
   */
  isReceiptRequired(provider: PaymentProvider, amount: number): boolean {
    const receiptThresholds: Record<PaymentProvider, number | null> = {
      [PaymentProvider.BANK_OF_KHARTOUM]: 5000,
      [PaymentProvider.FAISAL_ISLAMIC_BANK]: 5000,
      [PaymentProvider.OMDURMAN_NATIONAL_BANK]: 5000,
      [PaymentProvider.ZAIN_BEDE]: 3000,
      [PaymentProvider.CASHI]: 3000,
      [PaymentProvider.CASH_ON_DELIVERY]: null,
      [PaymentProvider.CASH_AT_BRANCH]: null,
      [PaymentProvider.OTHER]: 1000,
    };

    const threshold = receiptThresholds[provider];

    if (threshold === null) {
      return false;
    }

    return amount >= threshold;
  }

  /**
   * Validate that wallet phone is provided for mobile wallet payments
   */
  validateWalletPhone(provider: PaymentProvider, walletPhone?: string): void {
    const mobileWalletProviders = [
      PaymentProvider.ZAIN_BEDE,
      PaymentProvider.CASHI,
    ];

    if (mobileWalletProviders.includes(provider)) {
      if (!walletPhone) {
        throw new BadRequestException(
          `Wallet phone number is required for ${provider} payments`,
        );
      }

      if (!this.validateSudanPhone(walletPhone)) {
        throw new BadRequestException(
          'Invalid Sudan mobile number format. Must be +2499XXXXXXXX',
        );
      }
    }
  }

  /**
   * Validate complete payment submission
   */
  validatePaymentSubmission(
    provider: PaymentProvider,
    referenceId: string,
    amount: number,
    walletPhone?: string,
    receiptUrl?: string,
  ): void {
    // Validate reference ID
    this.validateReferenceId(provider, referenceId);

    // Validate wallet phone for mobile wallets
    this.validateWalletPhone(provider, walletPhone);

    // Check if receipt is required
    if (this.isReceiptRequired(provider, amount) && !receiptUrl) {
      throw new BadRequestException(
        `Receipt upload is required for ${provider} payments above the threshold amount`,
      );
    }
  }

  /**
   * Get payment instructions for a provider
   */
  getPaymentInstructions(provider: PaymentProvider): string {
    const instructions: Record<PaymentProvider, string> = {
      [PaymentProvider.BANK_OF_KHARTOUM]:
        'Transfer to Account: 1234567890\nSwift: BOKKSDKH\nEnter transaction reference starting with BOK',
      [PaymentProvider.FAISAL_ISLAMIC_BANK]:
        'Transfer to Account: 0987654321\nSwift: FIBSSDKH\nEnter transaction reference starting with FIB',
      [PaymentProvider.OMDURMAN_NATIONAL_BANK]:
        'Transfer to Account: 1122334455\nEnter transaction reference starting with ONB',
      [PaymentProvider.ZAIN_BEDE]:
        'Send to: +249123456789\nEnter wallet transaction ID\nProvide your wallet phone number',
      [PaymentProvider.CASHI]:
        'Pay at any Cashi agent\nEnter agent code and transaction ID\nProvide your wallet phone number',
      [PaymentProvider.CASH_ON_DELIVERY]:
        'Pay cash when you receive your order',
      [PaymentProvider.CASH_AT_BRANCH]:
        'Pay cash at our branch location',
      [PaymentProvider.OTHER]:
        'Contact support for payment instructions',
    };

    return instructions[provider] || 'Payment instructions not available';
  }
}

