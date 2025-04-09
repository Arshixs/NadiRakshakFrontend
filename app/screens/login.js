import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Feather";
import { BackendUrl } from "../../secrets.js";
import ToastComponent, { showToast } from "../components/Toast.js"; // Import Toast Component

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await fetch(`${BackendUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store tokens securely
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);

      router.replace("/");
    } catch (error) {
      showToast("error", "Login Failed", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
          {/* Header with Image Overlay */}
          <View className="relative">
            <Image
              source={{
                uri: "https://img.freepik.com/free-vector/volunteers-helping-community_23-2148501943.jpg",
              }}
              className="w-full h-48"
              resizeMode="cover"
            />
            <View className="absolute inset-0 bg-black/40 flex justify-end">
              <View className="p-4">
                <Text className="text-white text-3xl font-bold">Nadi Rakshak</Text>
                <Text className="text-white text-lg opacity-90">
                  River Pollution Reporting
                </Text>
              </View>
            </View>
          </View>

          <View className="p-6">
            {/* Login Form */}
            <View className="bg-white p-5 rounded-xl shadow-sm mb-6">
              <Text className="text-lg font-semibold mb-4 text-gray-800">
                Welcome Back
              </Text>

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Email
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <Icon name="mail" color="#4B5563" size={18} />
                  <TextInput
                    className="flex-1 ml-2 text-base"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-2">
                <Text className="text-sm font-medium text-gray-700 mb-1">
                  Password
                </Text>
                <View className="flex-row items-center border border-gray-300 rounded-lg p-3 bg-gray-50">
                  <Icon name="lock" color="#4B5563" size={18} />
                  <TextInput
                    className="flex-1 ml-2 text-base"
                    placeholder="Enter password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                  />
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? (
                      <Icon name="eye" color="#4B5563" size={18} />
                    ) : (
                      <Icon name="eye-off" color="#4B5563" size={18} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <View className="items-end mb-6">
                <TouchableOpacity onPress={() => router.push("/screens/forgot-password")}>
                  <Text className="text-blue-600 font-semibold">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                className="py-4 rounded-lg bg-blue-600"
                onPress={handleLogin}
              >
                <Text className="text-white text-center font-bold text-lg">
                  Login
                </Text>
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View className="flex-row justify-center mt-4">
                <Text className="text-gray-700">
                  Don't have an account?{" "}
                </Text>

                <TouchableOpacity onPress={() => router.push("/screens/signup")}>
                  <Text className="text-blue-600 font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row justify-center">
                <Text className="text-gray-700">Go back to </Text>
                <TouchableOpacity onPress={() => router.push("/")}>
                  <Text className="text-blue-600 font-semibold">Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast Component */}
      <ToastComponent />
    </SafeAreaView>
  );
}
