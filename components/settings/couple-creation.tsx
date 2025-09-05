"use client";

import { useState, useEffect } from "react";
import { Heart, Users, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface CoupleCreationProps {
  onCoupleCreated?: () => void;
}

interface Partner {
  id: string;
  name: string;
  email: string;
}

export function CoupleCreation({ onCoupleCreated }: CoupleCreationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [coupleUsername, setCoupleUsername] = useState("");
  const [relationshipStatus, setRelationshipStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingPartner, setExistingPartner] = useState<Partner | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    // Get current user ID from Supabase auth and check for existing couple
    const getCurrentUserAndCouple = async () => {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (user?.id) {
        // Check if user already has a couple
        try {
          const { data: couple } = await supabase
            .from("couples")
            .select("id, partner1_id, partner2_id")
            .or(`partner1_id.eq.${user.id},partner2_id.eq.${user.id}`)
            .single();

          if (couple) {
            // Get partner information
            const partnerId =
              couple.partner1_id === user.id
                ? couple.partner2_id
                : couple.partner1_id;

            const { data: partnerProfile } = await supabase
              .from("profiles")
              .select("id, full_name, username, email")
              .eq("id", partnerId)
              .single();

            if (partnerProfile) {
              const partnerData = {
                id: partnerProfile.id,
                name:
                  partnerProfile.full_name ||
                  partnerProfile.username ||
                  "Partner",
                email: partnerProfile.email || "Unknown email", // Use actual email from profile
              };

              setExistingPartner(partnerData);

              // Force the success UI to show by setting partner state
              setPartner(partnerData);

              // Force success state to true to ensure the success UI is shown
              setSuccess("Successfully connected with partner!");
            }
          }
        } catch (error) {
          console.warn("Could not fetch couple information:", error);
        }
      }
    };

    getCurrentUserAndCouple();
  }, []);

  const handleCreateCouple = async () => {
    if (!userId) {
      setError("User not authenticated. Please sign in again.");
      return;
    }

    if (!partnerEmail.trim()) {
      setError("Please enter your partner's email address");
      return;
    }

    if (!coupleUsername.trim()) {
      setError("Please enter a couple username");
      return;
    }

    // Validate username format
    const validation = validateUsernameFormat(coupleUsername);
    if (!validation.isValid) {
      setError(validation.error || "Invalid username format");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(partnerEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Validate relationship status is selected
    if (!relationshipStatus.trim()) {
      setError("Please select a relationship status");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setPartner(null);

    try {
      const response = await fetch("/api/couples/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerEmail,
          userId,
          coupleUsername,
          relationshipStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create couple");
        return;
      }

      setSuccess(`Couple created successfully with ${data.partner.name}!`);
      setPartner(data.partner);

      // Close dialog after successful creation
      setTimeout(() => {
        setIsOpen(false);
        setPartnerEmail("");
        setCoupleUsername("");
        onCoupleCreated?.();
      }, 2000);
    } catch (error) {
      console.error("Error creating couple:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
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
    setCoupleUsername(value);
    setUsernameError(null);

    // Validate format in real-time
    if (value) {
      const validation = validateUsernameFormat(value);
      if (!validation.isValid) {
        setUsernameError(validation.error || null);
      }
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPartnerEmail(e.target.value);
    setError(null);
    setSuccess(null);
    setPartner(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          {partner || existingPartner ? "Your Couple" : "Create Your Couple"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!partner && !existingPartner ? (
          <div className="text-center py-6">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Ready to start your journey together? Create your couple account
              to share memories, messages, and more!
            </p>
            <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger asChild>
                <Button className="bg-pink-500 hover:bg-pink-600">
                  <Heart className="h-4 w-4 mr-2" />
                  Create Couple
                </Button>
              </DrawerTrigger>
              <DrawerContent className="sm:max-w-md mx-auto">
                <div className="max-w-md mx-auto w-full">
                  <DrawerHeader>
                    <DrawerTitle className="text-center">
                      Create Your Couple
                    </DrawerTitle>
                    <DrawerDescription>
                      Connect with your partner to start sharing memories and
                      messages together.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="px-4 pb-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="coupleUsername">Couple Username</Label>
                        <Input
                          id="coupleUsername"
                          placeholder="your_couple_name"
                          value={coupleUsername}
                          onChange={handleUsernameChange}
                          disabled={isLoading}
                          className="rounded-xl"
                        />
                        {usernameError && (
                          <p className="text-sm text-red-600">
                            {usernameError}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Choose a unique username for your couple (3-20
                          characters, letters, numbers, and underscores only)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="partnerEmail">
                          Partner's Email Address
                        </Label>
                        <Input
                          id="partnerEmail"
                          type="email"
                          placeholder="partner@example.com"
                          value={partnerEmail}
                          onChange={handleEmailChange}
                          disabled={isLoading}
                          className="rounded-xl"
                        />
                        <p className="text-sm text-muted-foreground">
                          Enter your partner's email address to create your
                          couple account
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="relationshipStatus">
                          Relationship Status
                        </Label>
                        <Select
                          value={relationshipStatus}
                          onValueChange={setRelationshipStatus}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="rounded-xl w-full">
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
                        <p className="text-sm text-muted-foreground">
                          Select your current relationship status
                        </p>
                      </div>

                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      {success && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            {success}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                  <DrawerFooter>
                    <DrawerClose asChild>
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        disabled={isLoading}
                      >
                        Cancel
                      </Button>
                    </DrawerClose>
                    <Button
                      onClick={handleCreateCouple}
                      className="w-full rounded-xl bg-pink-500 hover:bg-pink-600"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating..." : "Create Couple"}
                    </Button>
                  </DrawerFooter>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Couple Created!</h3>
            <p className="text-muted-foreground mb-4">
              You're now connected with {partner?.name || existingPartner?.name}
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                Partner: {partner?.name || existingPartner?.name} (
                {partner?.email || existingPartner?.email})
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
