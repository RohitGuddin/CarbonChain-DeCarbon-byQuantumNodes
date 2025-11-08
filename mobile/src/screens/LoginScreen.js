import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Card, Button, Title, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const LoginScreen = ({ navigation, route }) => {
  const { onLogin } = route.params;
  const [formData, setFormData] = useState({
    name: '',
    role: 'cultivator',
    wallet_address: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.wallet_address) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const userData = {
          id: data.user_id,
          name: data.name,
          role: data.role,
          wallet_address: formData.wallet_address
        };
        onLogin(userData);
      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'cultivator', label: 'Cultivator', description: 'Plant trees and earn credits' },
    { value: 'company', label: 'Company', description: 'Buy carbon credits' },
    { value: 'admin', label: 'Admin', description: 'Verify requests' }
  ];

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="leaf" size={60} color="#22c55e" />
          <Title style={styles.title}>CarbonChain</Title>
          <Paragraph style={styles.subtitle}>
            Join the carbon credit marketplace
          </Paragraph>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.cardTitle}>Register</Title>
            
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Wallet Address"
              value={formData.wallet_address}
              onChangeText={(text) => setFormData({ ...formData, wallet_address: text })}
            />

            <Text style={styles.label}>Select Your Role</Text>
            {roleOptions.map((role) => (
              <TouchableOpacity
                key={role.value}
                style={[
                  styles.roleOption,
                  formData.role === role.value && styles.roleOptionSelected
                ]}
                onPress={() => setFormData({ ...formData, role: role.value })}
              >
                <Text style={[
                  styles.roleLabel,
                  formData.role === role.value && styles.roleLabelSelected
                ]}>
                  {role.label}
                </Text>
                <Text style={[
                  styles.roleDescription,
                  formData.role === role.value && styles.roleDescriptionSelected
                ]}>
                  {role.description}
                </Text>
              </TouchableOpacity>
            ))}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              buttonColor="#22c55e"
            >
              {loading ? 'Registering...' : 'Register & Continue'}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    elevation: 4,
    borderRadius: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  roleOption: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  roleOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#f0fdf4',
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  roleLabelSelected: {
    color: '#22c55e',
  },
  roleDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  roleDescriptionSelected: {
    color: '#16a34a',
  },
  submitButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});

export default LoginScreen;
