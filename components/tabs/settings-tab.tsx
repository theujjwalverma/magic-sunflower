"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

declare global {
  interface Window {
    google: {
      maps: {
        Geocoder: new () => {
          geocode: (
            request: {
              location: { lat: number; lng: number };
            },
            callback: (results: any[] | null, status: string) => void
          ) => void;
        };
        places: {
          Autocomplete: new (
            inputField: HTMLInputElement,
            options?: { types?: string[] }
          ) => {
            addListener: (event: string, callback: () => void) => void;
            getPlace: () => {
              geometry?: {
                location: {
                  lat: () => number;
                  lng: () => number;
                };
              };
              address_components?: Array<{
                types: string[];
                long_name: string;
              }>;
              formatted_address?: string;
            };
          };
        };
      };
    };
  }
}
import {
  User,
  Heart,
  Plus,
  Bell,
  Shield,
  LogOut,
  Moon,
  Sun,
  Smartphone,
  CheckCircle,
  MapPin,
  Navigation,
} from "lucide-react";
import { BottomTabs } from "@/components/navigation/bottom-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CoupleCreation } from "@/components/settings/couple-creation";
import { ChangelogViewer } from "@/components/settings/changelog-viewer";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { calculateAge } from "@/lib/time-utils";
import {
  loadGoogleMapsSDK,
  getGoogleMapsLoadedStatus,
} from "@/lib/google-maps-utils";
import { Mail } from "lucide-react";
import { LoaderRing } from "@/components/ui/loader";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  full_name?: string;
  gender?: string;
  dob?: string;
  location?: string | null;
}

interface CoupleInfo {
  id: string;
  couple_username: string;
  partner1_id: string;
  partner2_id: string;
  partner1_name?: string;
  partner2_name?: string;
  partner1_email?: string;
  partner2_email?: string;
  relationship_status?: string;
  created_at: string;
}

export function SettingsTab() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    messages: true,
    questions: true,
    memories: false,
    reminders: true,
  });
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    lastSeen: true,
    readReceipts: true,
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [isEditingRelationship, setIsEditingRelationship] = useState(false);
  const [newRelationshipStatus, setNewRelationshipStatus] = useState("");
  const [relationshipError, setRelationshipError] = useState<string | null>(
    null
  );
  const [isUpdatingRelationship, setIsUpdatingRelationship] = useState(false);
  const [relationshipSuccess, setRelationshipSuccess] = useState<string | null>(
    null
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(
    getGoogleMapsLoadedStatus()
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUserData();

    // Load Google Maps SDK if not already loaded
    if (!isGoogleMapsLoaded) {
      loadGoogleMapsSDK()
        .then(() => setIsGoogleMapsLoaded(true))
        .catch((error) => {
          console.error("Failed to load Google Maps SDK:", error);
          setLocationError("Failed to load location services");
        });
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const supabase = createBrowserSupabaseClient();

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("[DEBUG] Auth user:", user);

      if (!user) return;

      // Get user profile from profiles table with error handling
      let profile = null;
      console.log("[DEBUG] Fetching profile for user ID:", user.id);
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select(
            "id, full_name, username, relationship, location, gender, dob"
          )
          .eq("id", user.id)
          .single();

        console.log("[DEBUG] Profile data from DB:", profileData);
        profile = profileData;
      } catch (profileError) {
        console.error("[DEBUG] Profile fetch error:", profileError);
        console.warn(
          "Profiles table not accessible or user profile not found:",
          profileError
        );
        // Continue without profile data
      }

      if (profile) {
        // Get couple information
        const { data: couple } = await supabase
          .from("couples")
          .select(
            "id, couple_username, partner1_id, partner2_id, relationship_status, created_at"
          )
          .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
          .single();

        if (couple) {
          // Get partner information from auth.users
          const partnerId =
            couple.partner1_id === user.id
              ? couple.partner2_id
              : couple.partner1_id;

          // Get partner info from API endpoint (which gets email from auth.users)
          let partnerProfile = null;
          try {
            const response = await fetch(`/api/user?userId=${partnerId}`);
            if (response.ok) {
              const partnerData = await response.json();
              partnerProfile = {
                full_name: partnerData.profile?.full_name,
                username: partnerData.profile?.username,
                email: partnerData.user?.email, // Get email from auth.users
              };
            } else {
              console.warn("Partner data not accessible:", response.status);
            }
          } catch (partnerError) {
            console.warn("Partner profile not accessible:", partnerError);
          }

          setCoupleInfo({
            ...couple,
            partner1_name:
              couple.partner1_id === user.id
                ? "You"
                : partnerProfile?.full_name ||
                  partnerProfile?.username ||
                  "Partner",
            partner2_name:
              couple.partner2_id === user.id
                ? "You"
                : partnerProfile?.full_name ||
                  partnerProfile?.username ||
                  "Partner",
            partner1_email:
              couple.partner1_id === user.id
                ? user.email
                : partnerProfile?.email,
            partner2_email:
              couple.partner2_id === user.id
                ? user.email
                : partnerProfile?.email,
          });
        }

        // Extract display name from full_name (which might be an email)
        const getDisplayName = (fullName: string | null) => {
          if (!fullName) return "User";
          // If it's an email address, extract the part before @
          if (fullName.includes("@")) {
            return fullName.split("@")[0];
          }
          return fullName;
        };

        // Set user profile with the correct data structure
        setUserProfile({
          id: user.id,
          name:
            getDisplayName(profile.full_name) ||
            user.email?.split("@")[0] ||
            "User",
          email: user.email || "",
          full_name: profile.full_name || undefined,
          gender: profile.gender,
          dob: profile.dob,
          location: profile.location,
        });
      } else {
        // Set basic user profile if profiles table is not accessible
        setUserProfile({
          id: user.id,
          name: user.email?.split("@")[0] || "User",
          email: user.email || "",
        });
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = async (formData: {
    full_name: string;
    dob: string;
    gender: string;
    location: string;
  }) => {
    try {
      const supabase = createBrowserSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user found");
        return;
      }

      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          full_name: formData.full_name,
          dob: formData.dob,
          gender: formData.gender,
          location: formData.location,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - refresh user data
        await fetchUserData();
        setIsEditingProfile(false);
      } else {
        console.error("Profile update failed:", data.error);
        alert(data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      alert("An error occurred while updating profile");
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications((prev) => ({ ...prev, [key]: value }));
  };

  const handlePrivacyChange = (key: string, value: boolean) => {
    setPrivacy((prev) => ({ ...prev, [key]: value }));
  };

  const handleCoupleCreated = () => {
    fetchUserData(); // Refresh couple information
  };

  const handleLinkPartner = async (partnerEmail: string) => {
    try {
      const supabase = createBrowserSupabaseClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user found");
        return;
      }

      const response = await fetch("/api/couples/link-partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          partnerEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success - refresh couple information
        await fetchUserData();
        alert("Partner linked successfully!");
      } else {
        alert(data.error || "Failed to link partner");
      }
    } catch (error) {
      console.error("Error linking partner:", error);
      alert("An error occurred while linking partner");
    }
  };

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        setLogoutError(error.message);
      } else {
        // Redirect to login page after successful logout
        router.push("/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout error:", error);
      setLogoutError("An error occurred during logout. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const validateUsernameFormat = (
    username: string
  ): { isValid: boolean; error?: string } => {
    // Check length
    if (username.length < 3 || username.length > 20) {
      return {
        isValid: false,
        error: "Username must be between 3 and 20 characters",
      };
    }

    // Check for spaces
    if (username.includes(" ")) {
      return {
        isValid: false,
        error: "Username cannot contain spaces",
      };
    }

    // Check for leading/trailing underscores
    if (username.startsWith("_") || username.endsWith("_")) {
      return {
        isValid: false,
        error: "Username cannot start or end with an underscore",
      };
    }

    // Check for double underscores
    if (username.includes("__")) {
      return {
        isValid: false,
        error: "Username cannot contain consecutive underscores",
      };
    }

    // Check character set - only alphanumeric and underscores
    const validRegex = /^[a-zA-Z0-9_]+$/;
    if (!validRegex.test(username)) {
      return {
        isValid: false,
        error: "Username can only contain letters, numbers, and underscores",
      };
    }

    return { isValid: true };
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewUsername(value);

    // Clear previous errors/success
    setUsernameError(null);
    setUsernameSuccess(null);

    // Validate format in real-time
    if (value) {
      const validation = validateUsernameFormat(value);
      if (!validation.isValid) {
        setUsernameError(validation.error || null);
      }
    }
  };

  const handleUpdateUsername = async () => {
    if (!coupleInfo || !userProfile) return;

    // Validate format
    const validation = validateUsernameFormat(newUsername);
    if (!validation.isValid) {
      setUsernameError(validation.error || null);
      return;
    }

    setIsUpdatingUsername(true);
    setUsernameError(null);
    setUsernameSuccess(null);

    try {
      const response = await fetch("/api/couples/update-username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coupleId: coupleInfo.id,
          username: newUsername,
          userId: userProfile.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUsernameSuccess("Username updated successfully!");
        setNewUsername("");
        setIsEditingUsername(false);
        // Refresh couple data to show updated username
        await fetchUserData();
      } else {
        setUsernameError(data.error || "Failed to update username");
      }
    } catch (error) {
      console.error("Error updating username:", error);
      setUsernameError("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleUpdateRelationshipStatus = async () => {
    if (!coupleInfo || !userProfile) return;

    if (!newRelationshipStatus) {
      setRelationshipError("Please select a relationship status");
      return;
    }

    setIsUpdatingRelationship(true);
    setRelationshipError(null);
    setRelationshipSuccess(null);

    try {
      const response = await fetch("/api/couples/update-relationship-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coupleId: coupleInfo.id,
          relationshipStatus: newRelationshipStatus,
          userId: userProfile.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setRelationshipSuccess("Relationship status updated successfully!");
        setNewRelationshipStatus("");
        setIsEditingRelationship(false);
        // Refresh couple data to show updated relationship status
        await fetchUserData();
      } else {
        setRelationshipError(
          data.error || "Failed to update relationship status"
        );
      }
    } catch (error) {
      console.error("Error updating relationship status:", error);
      setRelationshipError("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdatingRelationship(false);
    }
  };

  const validatePassword = (
    password: string
  ): { isValid: boolean; error?: string } => {
    // Check minimum length
    if (password.length < 8) {
      return {
        isValid: false,
        error: "Password must be at least 8 characters long",
      };
    }

    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one uppercase letter",
      };
    }

    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one lowercase letter",
      };
    }

    // Check for at least one number
    if (!/\d/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one number",
      };
    }

    // Check for at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return {
        isValid: false,
        error: "Password must contain at least one special character",
      };
    }

    return { isValid: true };
  };

  const handlePasswordChange = async () => {
    // Clear previous errors/success
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validate current password is provided
    if (!currentPassword) {
      setPasswordError("Please enter your current password");
      return;
    }

    // Validate new password format
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordError(validation.error || null);
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const supabase = createBrowserSupabaseClient();

      // First verify current password by re-authenticating
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: userProfile?.email || "",
          password: currentPassword,
        });

      if (authError) {
        setPasswordError("Current password is incorrect");
        return;
      }

      // Update password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message || "Failed to update password");
      } else {
        setPasswordSuccess("Password updated successfully!");
        // Clear form fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        // Close drawer after successful update
        setTimeout(() => setIsChangingPassword(false), 2000);
      }
    } catch (error) {
      console.error("Error updating password:", error);
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleHardRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Preserve Supabase auth tokens (they typically start with 'sb-')
      const authKeysToPreserve = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("sb-")) {
          authKeysToPreserve.push({
            key,
            value: localStorage.getItem(key),
          });
        }
      }

      // Clear all localStorage
      localStorage.clear();

      // Restore preserved auth tokens
      authKeysToPreserve.forEach(({ key, value }) => {
        if (value) {
          localStorage.setItem(key, value);
        }
      });

      // Refresh the page to apply changes
      window.location.reload();
    } catch (error) {
      console.error("Error during hard refresh:", error);
      setIsRefreshing(false);
    }
  };

  const detectLocation = async () => {
    if (!isGoogleMapsLoaded) {
      setLocationError(
        "Location services are still loading. Please try again in a moment."
      );
      return;
    }

    setIsDetectingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError(
        "Your browser doesn't support location detection. You can enter your location manually below."
      );
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const geocoder = new window.google.maps.Geocoder();

          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any[] | null, status: string) => {
              if (status === "OK" && results && results[0]) {
                let city = "";
                let country = "";

                // Extract city and country from address components
                for (const component of results[0].address_components) {
                  if (component.types.includes("locality")) {
                    city = component.long_name;
                  }
                  if (component.types.includes("country")) {
                    country = component.long_name;
                  }
                }

                const location =
                  city && country
                    ? `${city}, ${country}`
                    : results[0].formatted_address;

                // Update local state
                setUserProfile((prev) => (prev ? { ...prev, location } : null));

                // Save to database
                if (userProfile) {
                  handleProfileUpdate({
                    full_name: userProfile.full_name || userProfile.name,
                    dob: userProfile.dob || "",
                    gender: userProfile.gender || "",
                    location: location,
                  });
                }
              } else {
                setLocationError(
                  "We couldn't determine your exact location. Please enter it manually below."
                );
              }
              setIsDetectingLocation(false);
            }
          );
        } catch (error) {
          console.error("Geocoding error:", error);
          setLocationError(
            "Failed to determine your location. You can enter it manually below."
          );
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(
              "Location access was denied. You can enter your location manually below."
            );
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(
              "Location information is currently unavailable. Please enter your location manually below."
            );
            break;
          case error.TIMEOUT:
            setLocationError(
              "Location detection timed out. Please try again or enter your location manually below."
            );
            break;
          default:
            setLocationError(
              "We couldn't detect your location. Please enter it manually below."
            );
        }
        setIsDetectingLocation(false);
      },
      { timeout: 10000 }
    );
  };

  useEffect(() => {
    // Initialize Google Places Autocomplete when drawer opens
    if (isEditingProfile && isGoogleMapsLoaded) {
      const initAutocomplete = () => {
        const input = document.getElementById(
          "editLocation"
        ) as HTMLInputElement;
        if (input && window.google?.maps?.places) {
          const autocomplete = new window.google.maps.places.Autocomplete(
            input,
            {
              types: ["(cities)"],
            }
          );

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              // Extract city and country from place details
              let city = "";
              let country = "";

              if (place.address_components) {
                for (const component of place.address_components) {
                  if (component.types.includes("locality")) {
                    city = component.long_name;
                  }
                  if (component.types.includes("country")) {
                    country = component.long_name;
                  }
                }
              }

              const location =
                city && country
                  ? `${city}, ${country}`
                  : place.formatted_address;
              input.value = location || "";
            }
          });
        }
      };

      // Wait a bit for the drawer to fully render
      setTimeout(initAutocomplete, 100);
    }
  }, [isEditingProfile, isGoogleMapsLoaded]);

  useEffect(() => {
    // Auto-detect location when component mounts and user has no location set
    if (userProfile && !userProfile.location && isGoogleMapsLoaded) {
      detectLocation();
    }
  }, [userProfile, isGoogleMapsLoaded]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card/95 backdrop-blur-sm border-b border-border px-4 py-4">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <h1 className="text-xl font-bold text-foreground">Settings</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-center py-12">
            <LoaderRing size="lg" />
          </div>
        </div>

        <BottomTabs />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile picture */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center border-4 border-primary/30">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <Button
                  size="icon"
                  className="absolute -bottom-1 -right-1 rounded-full h-6 w-6 bg-primary hover:bg-primary/90"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{userProfile?.name || "User"}</h3>
                <p className="text-sm text-muted-foreground">
                  @{coupleInfo?.couple_username || "username"}
                </p>
                <Drawer
                  open={isEditingProfile}
                  onOpenChange={setIsEditingProfile}
                >
                  <DrawerTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 rounded-xl bg-transparent"
                    >
                      Edit Profile
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="sm:max-w-md max-w-md mx-auto w-full">
                    <div className="max-w-md mx-auto w-full">
                      <DrawerHeader>
                        <DrawerTitle>Edit Profile</DrawerTitle>
                        <DrawerDescription>
                          Update your profile information below.
                        </DrawerDescription>
                      </DrawerHeader>
                      <div className="px-4 pb-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="editName">Full Name</Label>
                            <Input
                              id="editName"
                              defaultValue={
                                userProfile?.full_name ||
                                userProfile?.name ||
                                ""
                              }
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editDob">Date of Birth</Label>
                            <Input
                              id="editDob"
                              type="date"
                              defaultValue={userProfile?.dob || ""}
                              max={new Date().toISOString().split("T")[0]}
                              className="rounded-xl"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Gender</Label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-2">
                                <Input
                                  type="radio"
                                  name="editGender"
                                  value="male"
                                  defaultChecked={
                                    userProfile?.gender === "male"
                                  }
                                  className="rounded-xl"
                                />
                                Male
                              </label>
                              <label className="flex items-center gap-2">
                                <Input
                                  type="radio"
                                  name="editGender"
                                  value="female"
                                  defaultChecked={
                                    userProfile?.gender === "female"
                                  }
                                  className="rounded-xl"
                                />
                                Female
                              </label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="editLocation">Location</Label>
                            <div className="flex gap-2">
                              <Input
                                id="editLocation"
                                placeholder="Enter your location"
                                defaultValue={userProfile?.location || ""}
                                className="rounded-xl flex-1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={detectLocation}
                                disabled={isDetectingLocation}
                                className="rounded-xl"
                                title="Detect current location"
                              >
                                {isDetectingLocation ? (
                                  <LoaderRing size="sm" />
                                ) : (
                                  <Navigation className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                            {locationError && (
                              <p className="text-sm text-red-600">
                                {locationError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <DrawerFooter>
                        <DrawerClose asChild>
                          <Button
                            variant="outline"
                            className="w-full rounded-xl"
                          >
                            Cancel
                          </Button>
                        </DrawerClose>
                        <Button
                          onClick={async () => {
                            const formData = {
                              full_name:
                                (
                                  document.getElementById(
                                    "editName"
                                  ) as HTMLInputElement
                                )?.value || "",
                              dob:
                                (
                                  document.getElementById(
                                    "editDob"
                                  ) as HTMLInputElement
                                )?.value || "",
                              gender:
                                (
                                  document.querySelector(
                                    'input[name="editGender"]:checked'
                                  ) as HTMLInputElement
                                )?.value || "",
                              location:
                                (
                                  document.getElementById(
                                    "editLocation"
                                  ) as HTMLInputElement
                                )?.value || "",
                            };
                            await handleProfileUpdate(formData);
                          }}
                          className="w-full rounded-xl bg-primary hover:bg-primary/90"
                        >
                          Save Changes
                        </Button>
                      </DrawerFooter>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>

            <Separator />

            {/* Personal details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.dob
                    ? new Date(userProfile.dob).toLocaleDateString()
                    : "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.dob
                    ? `${calculateAge(userProfile.dob)} years old`
                    : "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.gender?.toUpperCase() || "Not specified"}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex items-center gap-2">
                  {userProfile?.location ? (
                    <>
                      <MapPin className="h-4 w-4 text-primary" />
                      <p className="text-sm text-muted-foreground">
                        {userProfile.location}
                      </p>
                    </>
                  ) : (
                    <>
                      {isDetectingLocation ? (
                        <div className="flex items-center gap-2">
                          <LoaderRing size="sm" />
                          <p className="text-sm text-muted-foreground">
                            Detecting location...
                          </p>
                        </div>
                      ) : locationError ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-muted-foreground">
                            Location not set
                          </p>
                          <button
                            onClick={detectLocation}
                            className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                            disabled={isDetectingLocation}
                          >
                            <Navigation className="h-4 w-4" />
                            Try again
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={detectLocation}
                          className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                          disabled={isDetectingLocation}
                        >
                          <Navigation className="h-4 w-4" />
                          Allow location access
                        </button>
                      )}
                    </>
                  )}
                </div>
                {locationError && (
                  <p className="text-sm text-muted-foreground">
                    {locationError}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combined Couple Information and Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              {coupleInfo ? "Couple Information" : "Create Your Couple"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coupleInfo ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Couple Username</Label>
                    <p className="text-sm text-muted-foreground">
                      @{coupleInfo.couple_username}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl bg-transparent"
                    onClick={() => setIsEditingUsername(true)}
                  >
                    Edit Username
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Partner</Label>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-base">
                        {coupleInfo.partner1_id === userProfile?.id
                          ? coupleInfo.partner2_name || "Partner"
                          : coupleInfo.partner1_name || "Partner"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-foreground">
                          {coupleInfo.partner1_id === userProfile?.id
                            ? coupleInfo.partner2_email || "Email not available"
                            : coupleInfo.partner1_email ||
                              "Email not available"}
                        </p>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Relationship Status</Label>
                    <p className="text-sm text-muted-foreground">
                      {coupleInfo.relationship_status || "Not specified"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl bg-transparent"
                    onClick={() => {
                      setIsEditingRelationship(true);
                      setNewRelationshipStatus(
                        coupleInfo.relationship_status || ""
                      );
                      setRelationshipError(null);
                      setRelationshipSuccess(null);
                    }}
                  >
                    Edit
                  </Button>
                </div>
                <div>
                  <Label>Together Since</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(coupleInfo.created_at).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>

                {/* Username Edit Section */}
                <div className="space-y-2">
                  <Label>Couple Username</Label>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      @{coupleInfo.couple_username}
                    </p>
                    <Drawer
                      open={isEditingUsername}
                      onOpenChange={setIsEditingUsername}
                    >
                      <DrawerTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl bg-transparent"
                        >
                          Edit
                        </Button>
                      </DrawerTrigger>
                      <DrawerContent className="sm:max-w-md mx-auto">
                        <DrawerHeader>
                          <DrawerTitle>Edit Couple Username</DrawerTitle>
                        </DrawerHeader>
                        <div className="px-4 pb-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="editUsername">New Username</Label>
                            <Input
                              id="editUsername"
                              value={newUsername}
                              onChange={handleUsernameChange}
                              placeholder="Enter new username"
                              className="rounded-xl"
                              disabled={isUpdatingUsername}
                            />
                            {usernameError && (
                              <p className="text-sm text-red-600">
                                {usernameError}
                              </p>
                            )}
                            {usernameSuccess && (
                              <p className="text-sm text-green-600">
                                {usernameSuccess}
                              </p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Username must be 3-20 characters, letters,
                              numbers, and underscores only
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsEditingUsername(false);
                                setNewUsername("");
                                setUsernameError(null);
                                setUsernameSuccess(null);
                              }}
                              className="flex-1 rounded-xl"
                              disabled={isUpdatingUsername}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleUpdateUsername}
                              className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                              disabled={isUpdatingUsername}
                            >
                              {isUpdatingUsername ? "Updating..." : "Update"}
                            </Button>
                          </div>
                        </div>
                      </DrawerContent>
                    </Drawer>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="text-sm text-green-700">Couple Created</p>
                  </div>
                </div>

                {/* Relationship Status Edit Drawer */}
                <Drawer
                  open={isEditingRelationship}
                  onOpenChange={setIsEditingRelationship}
                >
                  <DrawerContent className="sm:max-w-md mx-auto">
                    <DrawerHeader>
                      <DrawerTitle>Edit Relationship Status</DrawerTitle>
                    </DrawerHeader>
                    <div className="px-4 pb-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="editRelationshipStatus">
                          Relationship Status
                        </Label>
                        <Select
                          value={newRelationshipStatus}
                          onValueChange={setNewRelationshipStatus}
                        >
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select relationship status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Talking">Talking</SelectItem>
                            <SelectItem value="Complicated">
                              Complicated
                            </SelectItem>
                            <SelectItem value="Long Distance">
                              Long Distance
                            </SelectItem>
                            <SelectItem value="Dating">Dating</SelectItem>
                            <SelectItem value="Live in">Live in</SelectItem>
                            <SelectItem value="Engaged">Engaged</SelectItem>
                            <SelectItem value="Married">Married</SelectItem>
                          </SelectContent>
                        </Select>
                        {relationshipError && (
                          <p className="text-sm text-red-600">
                            {relationshipError}
                          </p>
                        )}
                        {relationshipSuccess && (
                          <p className="text-sm text-green-600">
                            {relationshipSuccess}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingRelationship(false);
                            setNewRelationshipStatus("");
                            setRelationshipError(null);
                            setRelationshipSuccess(null);
                          }}
                          className="flex-1 rounded-xl"
                          disabled={isUpdatingRelationship}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleUpdateRelationshipStatus}
                          className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                          disabled={isUpdatingRelationship}
                        >
                          {isUpdatingRelationship ? "Updating..." : "Update"}
                        </Button>
                      </div>
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            ) : (
              <CoupleCreation onCoupleCreated={handleCoupleCreated} />
            )}
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Drawer
              open={isChangingPassword}
              onOpenChange={setIsChangingPassword}
            >
              <DrawerTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full rounded-xl bg-transparent"
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setPasswordError(null);
                    setPasswordSuccess(null);
                  }}
                >
                  Change Password
                </Button>
              </DrawerTrigger>
              <DrawerContent className="sm:max-w-md mx-auto">
                <DrawerHeader>
                  <DrawerTitle>Change Password</DrawerTitle>
                  <DrawerDescription>
                    Enter your current password and set a new one.
                  </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="rounded-xl"
                      disabled={isUpdatingPassword}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="rounded-xl"
                      disabled={isUpdatingPassword}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="rounded-xl"
                      disabled={isUpdatingPassword}
                    />
                  </div>
                  {passwordError && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded-lg">
                      {passwordSuccess}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>At least 8 characters long</li>
                      <li>At least one uppercase letter</li>
                      <li>At least one lowercase letter</li>
                      <li>At least one number</li>
                      <li>At least one special character</li>
                    </ul>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                        setPasswordError(null);
                        setPasswordSuccess(null);
                      }}
                      className="flex-1 rounded-xl"
                      disabled={isUpdatingPassword}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handlePasswordChange}
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? (
                        <>
                          <LoaderRing size="sm" className="mr-2" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              App Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Dark Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark themes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4" />
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
                <Moon className="h-4 w-4" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Language</Label>
              <Select defaultValue="english">
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Hard Refresh</Label>
              <p className="text-sm text-muted-foreground">
                Clear app cache and refresh to apply new functionality updates
              </p>
              <Button
                variant="outline"
                className="w-full rounded-xl bg-transparent"
                onClick={handleHardRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <>
                    <LoaderRing size="sm" className="mr-2" />
                    Refreshing...
                  </>
                ) : (
                  "Hard Refresh App"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start bg-transparent"
            >
              Export Data
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start bg-transparent"
            >
              Help & Support
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start bg-transparent"
            >
              About
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl justify-start bg-transparent"
              onClick={() => setIsChangelogOpen(true)}
            >
              Changelog
            </Button>
            <Separator />
            <Button
              variant="destructive"
              className="w-full rounded-xl justify-start"
              onClick={handleSignOut}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </Button>
            {logoutError && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
                {logoutError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Changelog Drawer */}
      <Drawer open={isChangelogOpen} onOpenChange={setIsChangelogOpen}>
        <DrawerContent className="sm:max-w-md mx-auto">
          <div className="px-4 pb-4">
            <ChangelogViewer
              open={isChangelogOpen}
              onOpenChange={setIsChangelogOpen}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <BottomTabs />
    </div>
  );
}
