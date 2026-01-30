/**
 * Phone Input Component
 * International phone number input with country code selector
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  useColorScheme
} from 'react-native';

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: 'NO', name: 'Norge', dialCode: '+47', flag: '🇳🇴' },
  { code: 'SE', name: 'Sverige', dialCode: '+46', flag: '🇸🇪' },
  { code: 'DK', name: 'Danmark', dialCode: '+45', flag: '🇩🇰' },
  { code: 'FI', name: 'Finland', dialCode: '+358', flag: '🇫🇮' },
  { code: 'DE', name: 'Tyskland', dialCode: '+49', flag: '🇩🇪' },
  { code: 'GB', name: 'Storbritannia', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'USA', dialCode: '+1', flag: '🇺🇸' },
  { code: 'PL', name: 'Polen', dialCode: '+48', flag: '🇵🇱' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onChangeCountry?: (country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function PhoneInput({
  value,
  onChangeText,
  onChangeCountry,
  placeholder = 'Telefonnummer',
  disabled = false,
  error
}: PhoneInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country);
    setShowCountryPicker(false);
    onChangeCountry?.(country);
  };

  const handlePhoneChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^\d]/g, '');
    onChangeText(cleaned);
  };

  const getFullPhoneNumber = () => {
    return `${selectedCountry.dialCode}${value}`;
  };

  const styles = createStyles(isDark);

  return (
    <View style={styles.container}>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {/* Country Code Selector */}
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setShowCountryPicker(true)}
          disabled={disabled}
        >
          <Text style={styles.flag}>{selectedCountry.flag}</Text>
          <Text style={styles.dialCode}>{selectedCountry.dialCode}</Text>
          <Text style={styles.chevron}>▼</Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Phone Number Input */}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          placeholderTextColor={isDark ? '#888' : '#999'}
          keyboardType="phone-pad"
          editable={!disabled}
          maxLength={15}
        />
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Velg land</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    item.code === selectedCountry.code && styles.countryItemSelected
                  ]}
                  onPress={() => handleSelectCountry(item)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDialCode}>{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Export helper to get full phone number
PhoneInput.getFullNumber = (countryCode: string, phoneNumber: string) => {
  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  return `${country.dialCode}${phoneNumber}`;
};

const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      width: '100%'
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#3A3A3C' : '#E5E5EA',
      overflow: 'hidden'
    },
    inputError: {
      borderColor: '#FF3B30'
    },
    countrySelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 16
    },
    flag: {
      fontSize: 20,
      marginRight: 6
    },
    dialCode: {
      fontSize: 16,
      fontWeight: '500',
      color: isDark ? '#FFFFFF' : '#000000',
      marginRight: 4
    },
    chevron: {
      fontSize: 10,
      color: isDark ? '#8E8E93' : '#8E8E93'
    },
    divider: {
      width: 1,
      height: 24,
      backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    input: {
      flex: 1,
      fontSize: 16,
      paddingHorizontal: 12,
      paddingVertical: 16,
      color: isDark ? '#FFFFFF' : '#000000'
    },
    errorText: {
      color: '#FF3B30',
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end'
    },
    modalContent: {
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '60%'
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: isDark ? '#FFFFFF' : '#000000'
    },
    closeButton: {
      fontSize: 20,
      color: isDark ? '#8E8E93' : '#8E8E93',
      padding: 4
    },
    countryItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? '#3A3A3C' : '#E5E5EA'
    },
    countryItemSelected: {
      backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7'
    },
    countryFlag: {
      fontSize: 24,
      marginRight: 12
    },
    countryName: {
      flex: 1,
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000'
    },
    countryDialCode: {
      fontSize: 16,
      color: isDark ? '#8E8E93' : '#8E8E93'
    }
  });

export default PhoneInput;
