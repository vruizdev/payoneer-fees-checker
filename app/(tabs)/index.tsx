import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BANKS, Bank } from '@/constants/banks';
import {
  calculateWithdrawalFees,
  formatCurrency,
  WithdrawalFeeResult,
} from '@/utils/feeCalculator';

export default function WithdrawalScreen() {
  const [amount, setAmount] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank>(BANKS[0]);
  const [includeConversion, setIncludeConversion] = useState(true);
  const [result, setResult] = useState<WithdrawalFeeResult | null>(null);

  const handleCalculate = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return;
    }
    const fees = calculateWithdrawalFees(numAmount, selectedBank, includeConversion);
    setResult(fees);
  };

  const handleAmountChange = (text: string) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setAmount(filtered);
    setResult(null);
  };

  const toggleConversion = () => {
    setIncludeConversion(!includeConversion);
    setResult(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Retiro ATM</Text>
            <Text style={styles.subtitle}>
              Calcula cuánto necesitas en tu cuenta Payoneer
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.card}>
            <Text style={styles.label}>Monto a Retirar (USD)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.label}>Selecciona el Cajero</Text>
            <View style={styles.bankSelector}>
              {BANKS.map((bank) => (
                <TouchableOpacity
                  key={bank.id}
                  style={[
                    styles.bankButton,
                    selectedBank.id === bank.id && styles.bankButtonSelected,
                  ]}
                  onPress={() => {
                    setSelectedBank(bank);
                    setResult(null);
                  }}
                >
                  <Text
                    style={[
                      styles.bankButtonText,
                      selectedBank.id === bank.id && styles.bankButtonTextSelected,
                    ]}
                  >
                    {bank.name}
                  </Text>
                  {bank.atmFee > 0 && (
                    <Text style={styles.bankFeeText}>+${bank.atmFee}</Text>
                  )}
                  <Text style={styles.bankLimitText}>Máx: ${bank.maxWithdrawal}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Conversion Toggle */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Incluir conversión (3.5%)</Text>
                <Text style={styles.toggleHint}>
                  {includeConversion
                    ? 'Retiro en Córdobas (USD → NIO)'
                    : 'Retiro en Dólares (sin conversión)'}
                </Text>
              </View>
              <Switch
                value={includeConversion}
                onValueChange={toggleConversion}
                trackColor={{ false: '#333', true: '#FF6B00' }}
                thumbColor={includeConversion ? '#fff' : '#888'}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.calculateButton,
                !amount && styles.calculateButtonDisabled,
              ]}
              onPress={handleCalculate}
              disabled={!amount}
            >
              <Text style={styles.calculateButtonText}>Calcular</Text>
            </TouchableOpacity>
          </View>

          {/* Results Section */}
          {result && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Desglose de Comisiones</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Monto a recibir:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(result.withdrawalAmount)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Comisión Payoneer (fija):</Text>
                <Text style={styles.resultValueFee}>
                  {formatCurrency(result.payoneerFee)}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>
                  Comisión Cajero ({selectedBank.name}):
                </Text>
                <Text style={styles.resultValueFee}>
                  {formatCurrency(result.atmFee)}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Comisión Banco (1.8%):</Text>
                <Text style={styles.resultValueFee}>
                  {formatCurrency(result.bankFee)}
                </Text>
              </View>

              {includeConversion && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Comisión Conversión (3.5%):</Text>
                  <Text style={styles.resultValueFee}>
                    {formatCurrency(result.conversionFee)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.resultRow}>
                <Text style={styles.totalLabel}>TOTAL REQUERIDO:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(includeConversion ? result.totalRequired : result.totalWithoutConversion)}
                </Text>
              </View>

              {/* Show both totals for comparison */}
              {includeConversion && (
                <View style={styles.comparisonBox}>
                  <Text style={styles.comparisonText}>
                    💡 Sin conversión: {formatCurrency(result.totalWithoutConversion)}
                  </Text>
                </View>
              )}

              {result.withdrawalAmount > selectedBank.maxWithdrawal && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ El límite de {selectedBank.name} es{' '}
                    {formatCurrency(selectedBank.maxWithdrawal)} por retiro
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    paddingVertical: 16,
  },
  bankSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  bankButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bankButtonSelected: {
    borderColor: '#FF6B00',
    backgroundColor: '#2a2015',
  },
  bankButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  bankButtonTextSelected: {
    color: '#FF6B00',
  },
  bankFeeText: {
    fontSize: 11,
    color: '#ff6b6b',
    marginTop: 2,
  },
  bankLimitText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  toggleHint: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  calculateButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  calculateButtonDisabled: {
    backgroundColor: '#333',
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  resultLabel: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  resultValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  resultValueFee: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B00',
  },
  comparisonBox: {
    backgroundColor: '#1a2a1a',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  comparisonText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#3d2a00',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#ffb800',
    textAlign: 'center',
  },
});
