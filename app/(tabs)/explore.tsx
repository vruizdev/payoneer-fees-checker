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
  calculateAvailableToWithdraw,
  formatCurrency,
  AvailableBalanceResult,
} from '@/utils/feeCalculator';

export default function BalanceScreen() {
  const [balance, setBalance] = useState('');
  const [selectedBank, setSelectedBank] = useState<Bank>(BANKS[0]);
  const [includeConversion, setIncludeConversion] = useState(true);
  const [result, setResult] = useState<AvailableBalanceResult | null>(null);

  const handleCalculate = () => {
    const numBalance = parseFloat(balance);
    if (isNaN(numBalance) || numBalance <= 0) {
      return;
    }
    const available = calculateAvailableToWithdraw(numBalance, selectedBank, includeConversion);
    setResult(available);
  };

  const handleBalanceChange = (text: string) => {
    const filtered = text.replace(/[^0-9.]/g, '');
    const parts = filtered.split('.');
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    setBalance(filtered);
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
            <Text style={styles.title}>Saldo Disponible</Text>
            <Text style={styles.subtitle}>
              Calcula cuánto puedes retirar de tu saldo Payoneer
            </Text>
          </View>

          {/* Input Section */}
          <View style={styles.card}>
            <Text style={styles.label}>Saldo en Payoneer (USD)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.input}
                value={balance}
                onChangeText={handleBalanceChange}
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
                    <Text style={styles.bankFeeTextRed}>+${bank.atmFee}</Text>
                  )}
                  <Text style={styles.bankLimitText}>
                    Máx: ${bank.maxWithdrawal}
                  </Text>
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
                trackColor={{ false: '#333', true: '#00C853' }}
                thumbColor={includeConversion ? '#fff' : '#888'}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.calculateButton,
                !balance && styles.calculateButtonDisabled,
              ]}
              onPress={handleCalculate}
              disabled={!balance}
            >
              <Text style={styles.calculateButtonText}>Calcular</Text>
            </TouchableOpacity>
          </View>

          {/* Results Section */}
          {result && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Desglose de Comisiones</Text>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Tu saldo Payoneer:</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(result.balance)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Comisión Payoneer (fija):</Text>
                <Text style={styles.resultValueFee}>
                  -{formatCurrency(result.payoneerFee)}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>
                  Comisión Cajero ({selectedBank.name}):
                </Text>
                <Text style={styles.resultValueFee}>
                  -{formatCurrency(result.atmFee)}
                </Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Comisión Banco (1.8%):</Text>
                <Text style={styles.resultValueFee}>
                  -{formatCurrency(result.bankFee)}
                </Text>
              </View>

              {includeConversion && (
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Comisión Conversión (3.5%):</Text>
                  <Text style={styles.resultValueFee}>
                    -{formatCurrency(result.conversionFee)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.resultRow}>
                <Text style={styles.totalLabel}>DISPONIBLE A RETIRAR:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(result.availableToWithdraw)}
                </Text>
              </View>

              {/* Show comparison */}
              {includeConversion && result.availableWithoutConversion > result.availableToWithdraw && (
                <View style={styles.comparisonBox}>
                  <Text style={styles.comparisonText}>
                    💡 Sin conversión: {formatCurrency(result.availableWithoutConversion)}
                  </Text>
                </View>
              )}

              {result.isLimitedByBank && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ℹ️ Limitado al máximo de {selectedBank.name}:{' '}
                    {formatCurrency(result.maxWithdrawal)} por retiro
                  </Text>
                </View>
              )}

              {result.availableToWithdraw <= 0 && (
                <View style={styles.warningBox}>
                  <Text style={styles.warningText}>
                    ⚠️ Saldo insuficiente para cubrir las comisiones
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
    color: '#00C853',
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
    borderColor: '#00C853',
    backgroundColor: '#0a2515',
  },
  bankButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888',
  },
  bankButtonTextSelected: {
    color: '#00C853',
  },
  bankFeeTextRed: {
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
    backgroundColor: '#00C853',
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
    color: '#00C853',
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
  infoBox: {
    backgroundColor: '#0a2515',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#00C853',
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#3d1515',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  warningText: {
    fontSize: 14,
    color: '#ff6b6b',
    textAlign: 'center',
  },
});
