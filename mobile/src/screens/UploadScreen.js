import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Card, Button, Title, Paragraph, Chip } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { plantationAPI } from '../utils/api';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const UploadScreen = ({ navigation, route }) => {
  const { user } = route.params;
  const [uploadData, setUploadData] = useState({
    photo: null,
    co2_removed: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUploadData({ ...uploadData, photo: result.assets[0] });
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setUploadData({ ...uploadData, photo: result.assets[0] });
    }
  };

  const handleSubmit = async () => {
    if (!uploadData.photo || !uploadData.co2_removed) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: uploadData.photo.uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      });
      formData.append('user_id', user.id);
      formData.append('co2_removed', uploadData.co2_removed);

      const response = await plantationAPI.uploadRequest(formData);
      
      setMessage(`Request uploaded successfully! Detected plant: ${response.data.detected_plant} (${(response.data.confidence * 100).toFixed(1)}% confidence)`);
      
      // Reset form
      setUploadData({ photo: null, co2_removed: '' });
      
    } catch (error) {
      setMessage(error.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Upload Plantation Request</Title>
        <Paragraph style={styles.subtitle}>
          Take a photo of your plantation and earn carbon credits
        </Paragraph>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          {/* Photo Upload */}
          <View style={styles.photoSection}>
            <Text style={styles.sectionTitle}>Plantation Photo</Text>
            
            {uploadData.photo ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: uploadData.photo.uri }} style={styles.image} />
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={pickImage}
                >
                  <Text style={styles.changePhotoText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.uploadArea}>
                <MaterialCommunityIcons name="leaf" size={40} color="#22c55e" />
                <Text style={styles.uploadText}>Upload a photo of your plantation</Text>
                <View style={styles.uploadButtons}>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <MaterialCommunityIcons name="camera" size={20} color="#22c55e" />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                    <MaterialCommunityIcons name="camera-alt" size={20} color="#22c55e" />
                    <Text style={styles.uploadButtonText}>Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* CO2 Input */}
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>CO2 Removed (tons)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter estimated CO2 removed"
              value={uploadData.co2_removed}
              onChangeText={(text) => setUploadData({ ...uploadData, co2_removed: text })}
              keyboardType="numeric"
            />
          </View>

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !uploadData.photo || !uploadData.co2_removed}
            style={styles.submitButton}
            buttonColor="#22c55e"
            icon={() => <MaterialCommunityIcons name="upload" size={20} color="#fff" />}
          >
            {loading ? 'Uploading...' : 'Upload Request'}
          </Button>

          {message && (
            <View style={[
              styles.messageContainer,
              message.includes('successfully') ? styles.successMessage : styles.errorMessage
            ]}>
              <Text style={[
                styles.messageText,
                message.includes('successfully') ? styles.successText : styles.errorText
              ]}>
                {message}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Navigation Buttons */}
      <View style={styles.navigationButtons}>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Wallet')}
          style={styles.navButton}
          buttonColor="#f0fdf4"
          textColor="#22c55e"
        >
          View Wallet
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
  card: {
    margin: 20,
    elevation: 4,
    borderRadius: 12,
  },
  photoSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#374151',
  },
  imageContainer: {
    alignItems: 'center',
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  changePhotoButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  changePhotoText: {
    color: '#fff',
    fontWeight: '600',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 10,
    marginBottom: 15,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  uploadButtonText: {
    color: '#22c55e',
    marginLeft: 5,
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  submitButton: {
    marginTop: 10,
    paddingVertical: 8,
  },
  messageContainer: {
    marginTop: 15,
    padding: 12,
    borderRadius: 8,
  },
  successMessage: {
    backgroundColor: '#dcfce7',
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
  },
  messageText: {
    fontSize: 14,
  },
  successText: {
    color: '#16a34a',
  },
  errorText: {
    color: '#dc2626',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  navButton: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default UploadScreen;
