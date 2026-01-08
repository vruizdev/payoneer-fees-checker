// Bank configuration for Nicaraguan ATMs
export interface Bank {
    id: string;
    name: string;
    atmFee: number; // Fee charged by the ATM in USD
    maxWithdrawal: number; // Maximum withdrawal per transaction in USD
}

export const BANKS: Bank[] = [
    {
        id: 'bac',
        name: 'BAC',
        atmFee: 5.0,
        maxWithdrawal: 600, // User confirmed this limit per transaction
    },
    {
        id: 'lafise',
        name: 'Lafise',
        atmFee: 0,
        maxWithdrawal: 500, // Official limit per transaction
    },
    {
        id: 'banpro',
        name: 'Banpro',
        atmFee: 0,
        maxWithdrawal: 800, // Standard ATM limit
    },
    {
        id: 'ficohsa',
        name: 'Ficohsa',
        atmFee: 0,
        maxWithdrawal: 600, // BANCARED network limit per transaction
    },
];

// Payoneer fees
export const PAYONEER_FEES = {
    atmFee: 3.15, // Fixed fee per ATM withdrawal
    conversionRate: 0.035, // 3.5% conversion fee (only if converting USD to local currency)
    bankFeeRate: 0.018, // 1.8% bank fee
    balanceInquiry: 1.0, // Fee for balance inquiry at ATM
};
