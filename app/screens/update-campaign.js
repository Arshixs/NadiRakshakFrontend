import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter, useGlobalSearchParams } from "expo-router";
import ToastComponent, { showToast } from "../components/Toast.js";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { BackendUrl } from "../../secrets.js";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/Feather";

export default function UpdateCampaign() {
  const router = useRouter();
  const params = useGlobalSearchParams();
  const { campaignId } = params;


  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [maxParticipants, setMaxParticipants] = useState("");
  const [image, setImage] = useState(null);
  const [imageChanged, setImageChanged] = useState(false);
  const [category, setCategory] = useState("Environment");
  const [isActive, setIsActive] = useState(false);
  
  // Original data to compare changes
  const [originalData, setOriginalData] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [authToken, setAuthToken] = useState(null);

  // Fetch campaign data on component mount
  useEffect(() => {
    const getAuthTokenAndCampaignData = async () => {
      try {
        const token = await SecureStore.getItemAsync("accessToken");
        if (!token) {
          showToast("error", "Unauthorized", "Please log in again.");
          // router.push("/screens/login");
          // return;
        }
        setAuthToken(token);
        
        // Fetch campaign data
        const response = await fetch(`${BackendUrl}/campaigns/${campaignId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        const data = await response.json();
        
        if (response.ok) {
          const campaign = data.data.campaign;
          
          // Set form values with existing data
          setTitle(campaign.title);
          setDescription(campaign.description);
          setLocation(campaign.location);
          setStartDate(new Date(campaign.startDate));
          setEndDate(new Date(campaign.endDate));
          setMaxParticipants(campaign.maxParticipants.toString());
          setImage(campaign.image);
          setCategory(campaign.category);
          setIsActive(campaign.status === 'active');
          
          // Store original data for comparison
          setOriginalData({
            title: campaign.title,
            description: campaign.description,
            location: campaign.location,
            startDate: new Date(campaign.startDate),
            endDate: new Date(campaign.endDate),
            maxParticipants: campaign.maxParticipants.toString(),
            category: campaign.category,
          });
        } else {
          showToast("error", "Error", data.message || "Failed to load campaign details");
          router.back();
        }
      } catch (error) {
        showToast("error", "Error", "Failed to load campaign details");
        router.back();
      } finally {
        setInitialLoading(false);
      }
    };
    
    getAuthTokenAndCampaignData();
  }, [campaignId]);

  const handleUpdateCampaign = async () => {
    if (!title || !description || !location || !maxParticipants || !image) {
      showToast("error", "Missing Fields", "Please fill in all fields and upload an image");
      return;
    }

    setLoading(true);

    try {
      // Create an object with only the changed fields
      const changedFields = {};
      
      if (title !== originalData.title) changedFields.title = title;
      if (description !== originalData.description) changedFields.description = description;
      if (location !== originalData.location) changedFields.location = location;
      if (startDate.toISOString() !== originalData.startDate.toISOString()) changedFields.startDate = startDate.toISOString();
      if (endDate.toISOString() !== originalData.endDate.toISOString()) changedFields.endDate = endDate.toISOString();
      if (maxParticipants !== originalData.maxParticipants) changedFields.maxParticipants = maxParticipants;
      if (category !== originalData.category) changedFields.category = category;
      
      // If no fields changed and image not changed, show message and return
      if (Object.keys(changedFields).length === 0 && !imageChanged) {
        showToast("info", "No Changes", "No changes were made to the campaign");
        setLoading(false);
        return;
      }
      
      // Handle the request based on whether the image changed
      if (imageChanged) {
        // If image changed, use FormData with multipart/form-data
        const formData = new FormData();
        
        // Add all changed fields to FormData
        Object.keys(changedFields).forEach(key => {
          formData.append(key, changedFields[key]);
        });
        
        // Add image to FormData
        const imageName = image.split("/").pop();
        const imageType = imageName.split(".").pop();
        formData.append("image", {
          uri: image,
          name: imageName,
          type: `image/${imageType}`,
        });
        
        const response = await fetch(`${BackendUrl}/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${authToken}`,
          },
          body: formData,
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showToast("success", "Success", "Campaign updated successfully!");
          router.back();
        } else {
          showToast("error", "Error", data.message || "Failed to update campaign");
        }
      } else {
        // If image not changed, use JSON with application/json
        const response = await fetch(`${BackendUrl}/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(changedFields),
        });
        
        const data = await response.json();
        
        if (response.ok) {
          showToast("success", "Success", "Campaign updated successfully!");
          router.back();
        } else {
          showToast("error", "Error", data.message || "Failed to update campaign");
        }
      }
    } catch (error) {
      showToast("error", "Error", "Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageChanged(true);
      showToast("success", "Image Updated", "Your image has been selected successfully!");
    }
  };

  if (initialLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-blue-600 mt-4 font-medium">Loading campaign data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
        {/* Header with image overlay */}
        <View className="relative">
          <Image 
            source={{ uri: image || "https://img.freepik.com/free-vector/people-cleaning-beaches-together_23-2148417058.jpg" }}
            className="w-full h-48"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40 flex justify-end">
            <View className="p-4">
              <Text className="text-white text-3xl font-bold">Update Campaign</Text>
              <Text className="text-white text-lg opacity-90">Make changes to your river cleanup initiative</Text>
            </View>
          </View>
        </View>

        <View className="p-6">
          {/* Form Section */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-semibold mb-4 text-gray-800">Campaign Details</Text>
            
            {/* Title Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Campaign Title</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="file-text" size={18} color="#4B5563" />
                <TextInput 
                  className="flex-1 ml-2 text-base"
                  placeholder="Enter campaign title" 
                  value={title} 
                  onChangeText={setTitle} 
                />
              </View>
            </View>
            
            {/* Description Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Campaign Description</Text>
              <View className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <View className="flex-row">
                  <Icon name="align-left" size={18} color="#4B5563" />
                  <View className="flex-1 ml-2">
                    <TextInput 
                      className="text-base"
                      placeholder="Describe your campaign" 
                      value={description} 
                      onChangeText={setDescription} 
                      multiline 
                      numberOfLines={4}
                      textAlignVertical="top"
                      style={{ minHeight: 100 }}
                    />
                  </View>
                </View>
              </View>
            </View>
            
            {/* Location Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Location</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="map-pin" size={18} color="#4B5563" />
                <TextInput 
                  className="flex-1 ml-2 text-base"
                  placeholder="Event location" 
                  value={location} 
                  onChangeText={setLocation} 
                />
              </View>
            </View>
            
            {/* Max Participants Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Maximum Participants</Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="users" size={18} color="#4B5563" />
                <TextInput 
                  className="flex-1 ml-2 text-base"
                  placeholder="Number of participants" 
                  keyboardType="numeric" 
                  value={maxParticipants} 
                  onChangeText={setMaxParticipants} 
                />
              </View>
            </View>
            
            {/* Category Dropdown */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Category</Text>
              <View className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <View className="flex-row items-center px-3">
                  <Icon name="tag" size={18} color="#4B5563" />
                  <View className="flex-1 ml-2">
                    <Picker
                      selectedValue={category}
                      onValueChange={(itemValue) => setCategory(itemValue)}
                      style={{ color: "#4B5563" }}
                    >
                      <Picker.Item label="Environment" value="Environment" />
                      <Picker.Item label="Health" value="Health" />
                      <Picker.Item label="Education" value="Education" />
                      <Picker.Item label="Social" value="Social" />
                      <Picker.Item label="Other" value="Other" />
                    </Picker>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Date Section */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-semibold mb-4 text-gray-800">Schedule</Text>
            
            {/* Start Date Picker */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Start Date</Text>
              <TouchableOpacity 
                className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50" 
                onPress={() => setShowStartPicker(true)}
              >
                <Icon name="calendar" size={18} color="#4B5563" />
                <Text className="ml-2 text-gray-700">{startDate.toDateString()}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker 
                  value={startDate} 
                  mode="date" 
                  display="default" 
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) setStartDate(selectedDate);
                  }} 
                />
              )}
            </View>
            
            {/* End Date Picker */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">End Date</Text>
              <TouchableOpacity 
                className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50" 
                onPress={() => setShowEndPicker(true)}
              >
                <Icon name="calendar" size={18} color="#4B5563" />
                <Text className="ml-2 text-gray-700">{endDate.toDateString()}</Text>
              </TouchableOpacity>
              {showEndPicker && (
                <DateTimePicker 
                  value={endDate} 
                  mode="date" 
                  display="default" 
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);
                    if (selectedDate) setEndDate(selectedDate);
                  }} 
                />
              )}
            </View>
          </View>

          {/* Media Section */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-semibold mb-4 text-gray-800">Campaign Media</Text>
            
            {/* Image Preview */}
            {image && (
              <View className="mb-3">
                <Image 
                  source={{ uri: image }} 
                  className="w-full h-48 rounded-lg"
                  resizeMode="cover"
                />
              </View>
            )}
            
            {/* Upload Image Button */}
            <TouchableOpacity 
              className="flex-row items-center justify-center bg-gray-100 p-4 rounded-lg border border-dashed border-gray-300"
              onPress={pickImage}
            >
              <Icon name="image" size={20} color="#4B5563" />
              <Text className="ml-2 text-gray-700 font-medium">Change Campaign Image</Text>
            </TouchableOpacity>
          </View>

          {/* Update Campaign Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg ${loading ? "bg-green-300" : "bg-green-600"} mb-6`}
            onPress={handleUpdateCampaign}
            disabled={loading}
          >
            {loading ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-center font-bold ml-2">Updating...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-bold text-lg">Update Campaign</Text>
            )}
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity 
            className="py-4 rounded-lg bg-gray-200 mb-6"
            onPress={() => router.back()}
          >
            <Text className="text-gray-700 text-center font-bold">Cancel</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
      <ToastComponent />
    </SafeAreaView>
  );
}