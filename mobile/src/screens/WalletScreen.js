import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Card, Title, Paragraph, Button, Chip, List } from 'react-native-paper';
import { userAPI } from '../utils/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const WalletScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [userCredits, setUserCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await userAPI.getUserCredits(user.id);
      setUserCredits(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  };

  const downloadInvoice = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:8000/invoice/${requestId}`);
      const blob = await response.blob();
      
      // In a real app, you would use expo-file-system and expo-sharing
      // to save and share the PDF file
      Alert.alert('Success', 'Invoice downloaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to download invoice');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Title style={styles.title}>My Wallet</Title>
        <Paragraph style={styles.subtitle}>
          Your carbon credit balance and transaction history
        </Paragraph>
      </View>

      {/* Wallet Balance */}
      <Card style={styles.walletCard}>
        <Card.Content style={styles.walletContent}>
          <View style={styles.walletHeader}>
            <MaterialCommunityIcons name="wallet" size={30} color="#22c55e" />
            <View style={styles.walletInfo}>
              <Text style={styles.balanceLabel}>Total Credits</Text>
              <Text style={styles.balanceAmount}>
                {userCredits?.total_credits?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
          <View style={styles.walletAddress}>
            <Text style={styles.addressLabel}>Wallet Address</Text>
            <Text style={styles.addressText}>
              {user.wallet_address.slice(0, 10)}...{user.wallet_address.slice(-10)}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="leaf" size={24} color="#22c55e" />
            <Text style={styles.statNumber}>{userCredits?.credits?.length || 0}</Text>
            <Text style={styles.statLabel}>Credits Earned</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.statCard}>
          <Card.Content style={styles.statContent}>
            <MaterialCommunityIcons name="trending-up" size={24} color="#22c55e" />
            <Text style={styles.statNumber}>
              {userCredits?.recent_transactions?.length || 0}
            </Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Recent Transactions */}
      <Card style={styles.transactionsCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Recent Transactions</Title>
          {userCredits?.recent_transactions?.length > 0 ? (
            userCredits.recent_transactions.slice(0, 5).map((tx) => (
              <List.Item
                key={tx.id}
                title={`${tx.type === 'received' ? '+' : '-'}${tx.credits} Credits`}
                description={`${tx.other_party} • ${new Date(tx.timestamp).toLocaleDateString()}`}
                left={() => (
                  <View style={[
                    styles.transactionIcon,
                    tx.type === 'received' ? styles.receivedIcon : styles.sentIcon
                  ]}>
                    <MaterialCommunityIcons 
                      name="leaf" 
                      size={20} 
                      color={tx.type === 'received' ? '#22c55e' : '#ef4444'} 
                    />
                  </View>
                )}
                right={() => (
                  <Chip 
                    mode="outlined"
                    textStyle={styles.chipText}
                    style={[
                      styles.chip,
                      tx.type === 'received' ? styles.receivedChip : styles.sentChip
                    ]}
                  >
                    {tx.type}
                  </Chip>
                )}
              />
            ))
          ) : (
            <Text style={styles.noTransactions}>No recent transactions</Text>
          )}
        </Card.Content>
      </Card>

      {/* Carbon Credits */}
      {userCredits?.credits?.length > 0 && (
        <Card style={styles.creditsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Your Carbon Credits</Title>
            {userCredits.credits.map((credit) => (
              <Card key={credit.id} style={styles.creditItem}>
                <Card.Content style={styles.creditContent}>
                  <View style={styles.creditHeader}>
                    <View style={styles.creditInfo}>
                      <Text style={styles.creditType}>{credit.plant_type}</Text>
                      <Text style={styles.creditAmount}>{credit.credits} Credits</Text>
                    </View>
                    <Chip 
                      mode="outlined" 
                      textStyle={styles.approvedChip}
                      style={styles.approvedChipStyle}
                    >
                      Approved
                    </Chip>
                  </View>
                  <Text style={styles.creditDate}>
                    {new Date(credit.created_at).toLocaleDateString()}
                  </Text>
                  <Button
                    mode="outlined"
                    onPress={() => downloadInvoice(credit.id)}
                    style={styles.downloadButton}
                    icon={() => <MaterialCommunityIcons name="download" size={16} color="#22c55e" />}
                  >
                    Download Invoice
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Navigation Button */}
      <View style={styles.navigationButtons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Upload')}
          style={styles.navButton}
          buttonColor="#22c55e"
          icon={() => <MaterialCommunityIcons name="leaf" size={20} color="#fff" />}
        >
          Upload New Plantation
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  walletCard: {
    margin: 20,
    elevation: 4,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
  },
  walletContent: {
    padding: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  walletInfo: {
    marginLeft: 15,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#22c55e',
  },
  walletAddress: {
    borderTopWidth: 1,
    borderTopColor: '#d1d5db',
    paddingTop: 15,
  },
  addressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    borderRadius: 8,
  },
  statContent: {
    alignItems: 'center',
    padding: 15,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22c55e',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  transactionsCard: {
    margin: 20,
    elevation: 2,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#374151',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receivedIcon: {
    backgroundColor: '#dcfce7',
  },
  sentIcon: {
    backgroundColor: '#fef2f2',
  },
  chip: {
    marginLeft: 10,
  },
  chipText: {
    fontSize: 12,
  },
  receivedChip: {
    borderColor: '#22c55e',
  },
  sentChip: {
    borderColor: '#ef4444',
  },
  noTransactions: {
    textAlign: 'center',
    color: '#6b7280',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  creditsCard: {
    margin: 20,
    elevation: 2,
    borderRadius: 12,
  },
  creditItem: {
    marginBottom: 10,
    elevation: 1,
    borderRadius: 8,
  },
  creditContent: {
    padding: 15,
  },
  creditHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditInfo: {
    flex: 1,
  },
  creditType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  creditAmount: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '600',
  },
  approvedChip: {
    fontSize: 12,
    color: '#16a34a',
  },
  approvedChipStyle: {
    borderColor: '#16a34a',
  },
  creditDate: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 10,
  },
  downloadButton: {
    alignSelf: 'flex-start',
  },
  navigationButtons: {
    padding: 20,
  },
  navButton: {
    paddingVertical: 8,
  },
});

export default WalletScreen;
