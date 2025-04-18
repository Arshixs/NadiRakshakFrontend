import React, { useEffect, useState, useCallback } from "react";
import { ScrollView, View, TouchableOpacity, ActivityIndicator, Text ,RefreshControl} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import Header from "../components/Header";
import CampaignCard from "../components/CampaignCard";
import { showToast } from "../components/Toast";
import { BackendUrl } from "../../secrets";
import { SafeAreaView } from "react-native-safe-area-context";


export default function CampaignsScreen() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // This will be called when component mounts
  useEffect(() => {
    fetchCampaigns();
  }, []);

  // This will be called every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchCampaigns();
      return () => {
        // Optional cleanup function
      };
    }, [])
  );

  const fetchCampaigns = async () => {
    try {
      if(!refreshing){
        setLoading(true);;
      }
      const token = await SecureStore.getItemAsync("accessToken");
      
      if (!token) {
        showToast("error", "Unauthorized", "Please log in again.");
        // router.push("/screens/login");
        // return;
      }

      const response = await fetch(`${BackendUrl}/campaigns`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (response.ok && result.status === "success") {
        setCampaigns(result.data.campaigns);
      } else {
        setError(result.message || "Failed to fetch campaigns");
        showToast("error", "Error", result.message || "Failed to fetch campaigns");
      }
    } catch (error) {
      setError("Something went wrong. Please try again.");
      showToast("error", "Error", "Something went wrong. Please try again.");
    } finally {
      if(!refreshing){
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCampaigns();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header with Plus Button */}
      <View className="relative">
      <Header 
          title="Community Campaign" 
          subtitle="Join a course and make a difference"
          showButton={true}
          onAddPress={() => router.push("/screens/CreateCampaign")}
      />

        {/* <TouchableOpacity
          onPress={() => router.push("/screens/CreateCampaign")}
          style={{
            position: "absolute",
            top: "50%",
            left: "80%",
            transform: [{ translateX: -20 }, { translateY: -20 }],

            backgroundColor: "white",
            borderRadius: 25,
            width: 40,
            height: 40,
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5, // for Android shadow
          }}
        >
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity> */}
      </View>

      {/* Campaign List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-blue-600 mt-4 font-medium">Loading campaigns...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-red-500 text-center mb-4">{error}</Text>
          <TouchableOpacity 
            onPress={handleRefresh}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : campaigns.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-700 text-center mb-4">No campaigns found.</Text>
          <TouchableOpacity 
            onPress={() => router.push("/screens/CreateCampaign")}
            className="bg-blue-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-medium">Create Campaign</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3b82f6"]}
              tintColor="#3b82f6"
            />
          }
        >
          {campaigns.map((campaign) => (
            <CampaignCard 
              key={campaign.id || campaign._id}
              title={campaign.title}
              description={campaign.description}
              image={campaign.image}
              volunteers={campaign.participants ? campaign.participants.length : 0}
              maxParticipants={campaign.maxParticipants}
              location={campaign.location}
              startDate={campaign.startDate}
              endDate={campaign.endDate}
              category={campaign.category}
              spotsRemaining={campaign.spotsRemaining}
              isParticipant={campaign.isParticipant}
              onPress={() => router.push({
                pathname: "../screens/campaign-details",
                params: { campaignId: campaign.id || campaign._id }
              })}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}