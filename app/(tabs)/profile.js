import React, { useEffect, useState ,useCallback} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useRouter ,useFocusEffect} from "expo-router";
import * as SecureStore from "expo-secure-store";
import { BackendUrl } from "../../secrets";
import { MaterialIcons } from "@expo/vector-icons";
import ToastComponent, { showToast } from "../components/Toast.js";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({});
  const [isAuthenticated, setIsAuthenticated] = useState(null); // New state to track auth status

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        setIsAuthenticated(false);
        router.replace("/");
      } else {
        setIsAuthenticated(true);
        fetchUserProfile(token);
      }
    };

    checkAuthentication();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      const refreshProfile = async () => {
        const token = await SecureStore.getItemAsync("accessToken");
        if (token) {
          fetchUserProfile(token);
        }
      };
      refreshProfile();
    }, [])
  );

  const fetchUserProfile = async (token) => {
    try {
      setLoading(true);
      const response = await fetch(`${BackendUrl}/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await response.json();
      if (response.ok && result.status === "success") {
        setUser(result.data.profile);
        setFormData(result.data.profile);
      } else {
        showToast(
          "error",
          "Error",
          result.message || "Failed to fetch profile."
        );
        setUser(null);
      }
    } catch (error) {
      showToast("error", "Error", "Something went wrong. Please try again.");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      const token = await SecureStore.getItemAsync("accessToken");
      if (!token) {
        showToast("error", "Unauthorized", "Please log in again.");
        // router.replace("/");
        // return;
      }
      const payload = {
        name: formData.name,
        mobileNumber: formData.mobileNumber,
        age: formData.age,
        city: formData.city,
        state: formData.state,
      };
      const response = await fetch(`${BackendUrl}/auth/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (response.ok) {
        showToast("success", "Success", "Profile updated successfully.");
        setUser((prev) => ({ ...prev, ...payload }));
        setModalVisible(false);
      } else {
        showToast(
          "error",
          "Error",
          result.message || "Failed to update profile."
        );
      }
    } catch (error) {
      showToast("error", "Error", "Something went wrong. Please try again.");
    }
  };

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    router.replace("/");
  };

  // Prevent rendering profile screen if authentication is not determined
  if (isAuthenticated === null || isAuthenticated === false) {
    return null; // Don't render anything while checking auth or if unauthorized
  }

  // If not authenticated, don't render anything (redirection should already be in progress)
  if (!isAuthenticated) {
    return null;
  }

  // If still loading profile data
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-blue-600 font-medium">
          Loading Profile...
        </Text>
      </View>
    );
  }

  // If user data failed to load
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <Text className="text-red-500">Failed to load profile.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        className="flex-grow px-4 py-6" // Changed from flex-1 to flex-grow
        contentContainerStyle={{ paddingBottom: 20 }} // Add some bottom padding
        showsVerticalScrollIndicator={false} // Explicitly show scrollbar
      >
        {/* Profile Card */}
        <View className="bg-white p-6 rounded-xl shadow-md relative items-center">
          {/* Points display in top left */}
          <TouchableOpacity
            onPress={() => router.push("/screens/points-history")}
            className="absolute top-4 left-4 flex-row items-center bg-yellow-100 px-3 py-1 rounded-full"
          >
            <MaterialIcons name="monetization-on" size={18} color="#f59e0b" />
            <Text className="ml-1 font-bold text-yellow-600">
              {user.points}
            </Text>
          </TouchableOpacity>

          {/* Edit button - keep on top right */}
          <TouchableOpacity
            onPress={() => {
              setFormData(user);
              setModalVisible(true);
            }}
            className="absolute top-4 right-4"
          >
            <MaterialIcons name="edit" size={22} color="#3b82f6" />
          </TouchableOpacity>

          {/* User profile content */}
          <MaterialIcons name="account-circle" size={80} color="#3b82f6" />
          <Text className="text-2xl font-bold mt-2 text-gray-800">
            {user.name}
          </Text>
          <Text className="text-gray-500">{user.email}</Text>
        </View>
        {/* Details Section */}
        <View className="bg-white mt-4 p-6 rounded-xl shadow-md">
          <ProfileDetail label="Mobile Number" value={user.mobileNumber} />
          <ProfileDetail label="Age" value={user.age} />
          <ProfileDetail label="City" value={user.city} />
          <ProfileDetail label="State" value={user.state} />
          <ProfileDetail
            label="Member Since"
            value={new Date(user.memberSince).toLocaleDateString()}
          />
        </View>
        {/* Statistics Section */}
        <View className="bg-white mt-4 p-6 rounded-xl shadow-md">
          <Text className="text-xl font-bold mb-4 text-gray-800">
            Statistics
          </Text>
          <View className="flex-row justify-between">
            <View className="flex-1 items-center mx-1">
              <Text className="text-2xl font-bold text-blue-600 mb-1">
                {user.stats?.totalCampaignsCreated || 0}
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Campaigns Created
              </Text>
            </View>
            <View className="flex-1 items-center mx-1">
              <Text className="text-2xl font-bold text-blue-600 mb-1">
                {user.stats?.totalCampaignsJoined || 0}
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Campaigns Joined
              </Text>
            </View>
            <View className="flex-1 items-center mx-1">
              <Text className="text-2xl font-bold text-blue-600 mb-1">
                {user.stats?.totalParticipantsManaged || 0}
              </Text>
              <Text className="text-sm text-gray-600 text-center">
                Participants Managed
              </Text>
            </View>
          </View>
        </View>
        {/* Buttons Section */}
        <View className="flex-row justify-between mt-4">
          <TouchableOpacity
            onPress={() => router.push("../screens/redeem-points")}
            className="bg-green-600 p-3 rounded-xl w-5/12 items-center shadow-md"
          >
            <Text className="text-white font-bold">Redeem Points</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            className="bg-red-600 p-3 rounded-xl w-5/12 items-center shadow-md"
          >
            <Text className="text-white font-bold">Logout</Text>
          </TouchableOpacity>
        </View>
        {/* Edit Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setFormData(user);
            setModalVisible(false);
          }}
        >
          <Pressable
            className="flex-1 justify-center items-center bg-black bg-opacity-50"
            onPress={() => {
              setFormData(user);
              setModalVisible(false);
            }}
          >
            <View
              className="bg-white p-6 rounded-xl w-11/12"
              onStartShouldSetResponder={() => true}
            >
              <Text className="text-xl font-bold mb-4 text-center">
                Edit Profile
              </Text>
              <View className="mb-4">
                <Text className="text-gray-600">Name</Text>
                <TextInput
                  className="border border-gray-300 p-3 rounded-md mt-1"
                  value={formData.name?.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>
              <View className="mb-4">
                <Text className="text-gray-600">Mobile Number</Text>
                <TextInput
                  className="border border-gray-300 p-3 rounded-md mt-1"
                  value={formData.mobileNumber?.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, mobileNumber: text })
                  }
                  keyboardType="phone-pad"
                />
              </View>
              <View className="mb-4">
                <Text className="text-gray-600">Age</Text>
                <TextInput
                  className="border border-gray-300 p-3 rounded-md mt-1"
                  value={formData.age?.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, age: text })
                  }
                  keyboardType="number-pad"
                />
              </View>
              <View className="mb-4">
                <Text className="text-gray-600">City</Text>
                <TextInput
                  className="border border-gray-300 p-3 rounded-md mt-1"
                  value={formData.city?.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, city: text })
                  }
                />
              </View>
              <View className="mb-6">
                <Text className="text-gray-600">State</Text>
                <TextInput
                  className="border border-gray-300 p-3 rounded-md mt-1"
                  value={formData.state?.toString()}
                  onChangeText={(text) =>
                    setFormData({ ...formData, state: text })
                  }
                />
              </View>
              <View className="flex-row justify-between mt-2">
                <TouchableOpacity
                  onPress={() => {
                    setFormData(user);
                    setModalVisible(false);
                  }}
                  className="bg-gray-300 py-3 pb-4 rounded-lg w-[48%] items-center"
                >
                  <Text className="font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={updateProfile}
                  className="bg-blue-600 py-3 pb-4 rounded-lg w-[48%] items-center"
                >
                  <Text className="text-white font-medium">Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
        <View
          style={{
            height: 50,
            marginTop: 20,
            borderRadius: 12,
          }}
        >
        </View>
      </ScrollView>
      <ToastComponent />
    </SafeAreaView>
  );
}

const ProfileDetail = ({ label, value }) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-200">
    <Text className="text-gray-600">{label}</Text>
    <Text className="text-gray-800 font-medium">{value}</Text>
  </View>
);
