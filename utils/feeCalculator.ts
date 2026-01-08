import { Bank, PAYONEER_FEES } from '@/constants/banks';

export interface WithdrawalFeeResult {
    withdrawalAmount: number; // Amount you want to receive
    payoneerFee: number; // $3.15 fixed
    atmFee: number; // Bank ATM fee
    bankFee: number; // 1.8% of amount
    conversionFee: number; // 3.5% of amount (only if converting)
    totalRequired: number; // Total needed in Payoneer account
    totalWithoutConversion: number; // Total without conversion fee
}

export interface AvailableBalanceResult {
    balance: number; // Your Payoneer balance
    payoneerFee: number; // $3.15 fixed
    atmFee: number; // Bank ATM fee
    bankFee: number; // 1.8% of available
    conversionFee: number; // 3.5% of available (only if converting)
    availableToWithdraw: number; // What you can actually get (with conversion)
    availableWithoutConversion: number; // What you can get without conversion
    maxWithdrawal: number; // Bank's limit
    isLimitedByBank: boolean; // True if limited by bank max
}

/**
 * Calculate fees when you want to withdraw a specific amount
 * @param amount - Amount you want to receive in USD
 * @param bank - Bank configuration
 * @param includeConversion - Whether to include the 3.5% conversion fee
 * @returns Fee breakdown and total required
 */
export function calculateWithdrawalFees(
    amount: number,
    bank: Bank,
    includeConversion: boolean = true
): WithdrawalFeeResult {
    const payoneerFee = PAYONEER_FEES.atmFee;
    const atmFee = bank.atmFee;
    const bankFee = amount * PAYONEER_FEES.bankFeeRate;
    const conversionFee = includeConversion ? amount * PAYONEER_FEES.conversionRate : 0;

    const totalWithoutConversion = amount + payoneerFee + atmFee + bankFee;
    const totalRequired = totalWithoutConversion + (amount * PAYONEER_FEES.conversionRate);

    return {
        withdrawalAmount: amount,
        payoneerFee,
        atmFee,
        bankFee: Math.round(bankFee * 100) / 100,
        conversionFee: Math.round(conversionFee * 100) / 100,
        totalRequired: Math.round(totalRequired * 100) / 100,
        totalWithoutConversion: Math.round(totalWithoutConversion * 100) / 100,
    };
}

/**
 * Calculate how much you can withdraw given your Payoneer balance
 * @param balance - Your current Payoneer balance in USD
 * @param bank - Bank configuration
 * @param includeConversion - Whether to include the 3.5% conversion fee
 * @returns Available amount and fee breakdown
 */
export function calculateAvailableToWithdraw(
    balance: number,
    bank: Bank,
    includeConversion: boolean = true
): AvailableBalanceResult {
    const payoneerFee = PAYONEER_FEES.atmFee;
    const atmFee = bank.atmFee;

    // Calculate available WITH conversion
    const feeMultiplierWithConversion = 1 + PAYONEER_FEES.bankFeeRate + PAYONEER_FEES.conversionRate;
    let availableWithConversion = (balance - payoneerFee - atmFee) / feeMultiplierWithConversion;

    // Calculate available WITHOUT conversion
    const feeMultiplierWithoutConversion = 1 + PAYONEER_FEES.bankFeeRate;
    let availableWithoutConversion = (balance - payoneerFee - atmFee) / feeMultiplierWithoutConversion;

    // Can't withdraw negative amount
    if (availableWithConversion < 0) availableWithConversion = 0;
    if (availableWithoutConversion < 0) availableWithoutConversion = 0;

    // Check if limited by bank's max withdrawal
    const isLimitedByBank = availableWithConversion > bank.maxWithdrawal || availableWithoutConversion > bank.maxWithdrawal;

    if (availableWithConversion > bank.maxWithdrawal) {
        availableWithConversion = bank.maxWithdrawal;
    }
    if (availableWithoutConversion > bank.maxWithdrawal) {
        availableWithoutConversion = bank.maxWithdrawal;
    }

    // Round to 2 decimals
    availableWithConversion = Math.round(availableWithConversion * 100) / 100;
    availableWithoutConversion = Math.round(availableWithoutConversion * 100) / 100;

    // Use the appropriate available amount based on toggle
    const availableToWithdraw = includeConversion ? availableWithConversion : availableWithoutConversion;

    // Calculate the actual fees based on available amount
    const bankFee = availableToWithdraw * PAYONEER_FEES.bankFeeRate;
    const conversionFee = includeConversion ? availableToWithdraw * PAYONEER_FEES.conversionRate : 0;

    return {
        balance,
        payoneerFee,
        atmFee,
        bankFee: Math.round(bankFee * 100) / 100,
        conversionFee: Math.round(conversionFee * 100) / 100,
        availableToWithdraw,
        availableWithoutConversion,
        maxWithdrawal: bank.maxWithdrawal,
        isLimitedByBank,
    };
}

/**
 * Format a number as USD currency
 */
export function formatCurrency(amount: number): string {
    return `$${amount.toFixed(2)}`;
}
