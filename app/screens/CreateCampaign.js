import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import ToastComponent, { showToast } from "../components/Toast";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { BackendUrl } from "../../secrets.js";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/Feather";

export default function CreateCampaign() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [image, setImage] = useState(null);
  const [category, setCategory] = useState("Environment");
  const [loading, setLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(tomorrow);

  const handleCreateCampaign = async () => {
    if (!title || !description || !location || !maxParticipants || !image) {
      showToast("error", "Missing Fields", "Please fill in all fields and upload an image");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

    const errors = [];
    if (startDate < today) errors.push("Start date must be today or later.");
    if (endDate <= startDate) errors.push("End date must be after the start date.");

    if (errors.length > 0) {
      showToast("error", errors.join(" "));
      return;
    }

    setLoading(true);

    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        showToast("error", "Unauthorized", "Please log in again.");
        // router.push("/screens/login");
        // return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("location", location);
      formData.append("startDate", startDate.toISOString());
      formData.append("endDate", endDate.toISOString());
      formData.append("maxParticipants", maxParticipants);
      formData.append("category", category);
      const imageName = image.split("/").pop();
      const imageType = imageName.split(".").pop();
      formData.append("image", {
        uri: image,
        name: imageName,
        type: `image/${imageType}`,
      });

      const response = await fetch(`${BackendUrl}/campaigns`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        showToast("success", "Success", "Campaign Created Successfully!");
        router.push("/campaign");
      } else {
        showToast("error", "Error", data.message || "Failed to create campaign.");
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
      showToast("success", "Image Uploaded", "Your image has been selected successfully!");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps={"always"}>
        {/* Header with image overlay */}
        <View className="relative">
          <Image 
            source={{ uri: "https://img.freepik.com/free-vector/people-cleaning-beaches-together_23-2148417058.jpg" }}
            className="w-full h-48"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-black/40 flex justify-end">
            <View className="p-4">
              <Text className="text-white text-3xl font-bold">Create Campaign</Text>
              <Text className="text-white text-lg opacity-90">Organize a river cleanup initiative</Text>
            </View>
          </View>
        </View>

        <View className="p-6">
          {/* Form Section */}
          <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
            <Text className="text-lg font-semibold mb-4 text-gray-800">Campaign Details</Text>
            
            {/* Title Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Campaign Title <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="file-text" color="#4B5563" size={18} />
                <TextInput 
                  className="flex-1 ml-2 text-base"
                  placeholder="Enter campaign title" 
                  value={title} 
                  onChangeText={setTitle} 
                />
              </View>
            </View>
            
            {/* Description Input - FIXED ALIGNMENT */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Campaign Description <Text className="text-red-500">*</Text>
              </Text>
              <View className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                <View className="flex-row">
                  <Icon name="align-left" color="#4B5563" size={18} />
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
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Location <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="map-pin" color="#4B5563" size={18} />
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
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Maximum Participants <Text className="text-red-500">*</Text>
              </Text>
              <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                <Icon name="users" color="#4B5563" size={18} />
                <TextInput 
                  className="flex-1 ml-2 text-base"
                  placeholder="Number of participants" 
                  keyboardType="number-pad" 
                  value={maxParticipants} 
                  onChangeText={setMaxParticipants} 
                />
              </View>
            </View>
            
            {/* Category Dropdown */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">
                Category <Text className="text-red-500">*</Text>
              </Text>
              <View className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <View className="flex-row items-center px-3">
                  <Icon name="tag" color="#4B5563" size={18} />
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
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Schedule <Text className="text-red-500">*</Text>
            </Text>
            
            {/* Start Date Picker */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-1">Start Date</Text>
              <TouchableOpacity 
                className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50" 
                onPress={() => setShowStartPicker(true)}
              >
                <Icon name="calendar" color="#4B5563" size={18} />
                <Text className="ml-2 text-gray-700">{startDate.toDateString()}</Text>
              </TouchableOpacity>
              {showStartPicker && (
                <DateTimePicker 
                  value={startDate} 
                  mode="date" 
                  display="default" 
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                      const nextDay = new Date(selectedDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setEndDate(nextDay); // auto update end date
                    }
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
                <Icon name="calendar" color="#4B5563" size={18} />
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
            <Text className="text-lg font-semibold mb-4 text-gray-800">
              Campaign Media <Text className="text-red-500">*</Text>
            </Text>
            
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
              <Icon name="image" color="#4B5563" size={20} />
              <Text className="ml-2 text-gray-700 font-medium">
                {image ? "Change Image" : "Upload Campaign Image"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Create Campaign Button */}
          <TouchableOpacity 
            className={`py-4 rounded-lg ${loading ? "bg-blue-300" : "bg-blue-600"}`}
            onPress={handleCreateCampaign}
            disabled={loading}
          >
            {loading ? (
              <View className="flex-row justify-center items-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white text-center font-bold ml-2">Creating...</Text>
              </View>
            ) : (
              <Text className="text-white text-center font-bold text-lg">Create Campaign</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ToastComponent />
    </SafeAreaView>
  );
}
