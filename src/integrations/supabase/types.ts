export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: "host" | "guest";
          first_name: string;
          last_name: string;
          phone_number: string | null;
          date_of_birth: string | null;
          nationality: string | null;
          languages: string[];
          bio: string | null;
          avatar_url: string | null;
          profile_complete: boolean;
          created_at: string;
          updated_at: string;
          // Host fields
          address: string | null;
          city: string | null;
          prefecture: string | null;
          postal_code: string | null;
          accommodation_type: "house" | "apartment" | null;
          room_type: "private" | "shared" | null;
          max_guests: number | null;
          amenities: string[] | null;
          house_rules: string[] | null;
          available_from: string | null;
          available_to: string | null;
          price_per_night: number | null;
          license_number: string | null;
          license_expiry: string | null;
          // Guest fields
          study_purpose: string | null;
          planned_duration: "1-3" | "3-6" | "6-12" | "12+" | null;
          dietary_restrictions: string[] | null;
          preferred_location: string[] | null;
          start_date: string | null;
          budget_min: number | null;
          budget_max: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "host" | "guest";
          first_name: string;
          last_name: string;
          phone_number?: string | null;
          date_of_birth?: string | null;
          nationality?: string | null;
          languages?: string[];
          bio?: string | null;
          avatar_url?: string | null;
          profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
          // Host fields
          address?: string | null;
          city?: string | null;
          prefecture?: string | null;
          postal_code?: string | null;
          accommodation_type?: "house" | "apartment" | null;
          room_type?: "private" | "shared" | null;
          max_guests?: number | null;
          amenities?: string[] | null;
          house_rules?: string[] | null;
          available_from?: string | null;
          available_to?: string | null;
          price_per_night?: number | null;
          license_number?: string | null;
          license_expiry?: string | null;
          // Guest fields
          study_purpose?: string | null;
          planned_duration?: "1-3" | "3-6" | "6-12" | "12+" | null;
          dietary_restrictions?: string[] | null;
          preferred_location?: string[] | null;
          start_date?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "host" | "guest";
          first_name?: string;
          last_name?: string;
          phone_number?: string | null;
          date_of_birth?: string | null;
          nationality?: string | null;
          languages?: string[];
          bio?: string | null;
          avatar_url?: string | null;
          profile_complete?: boolean;
          created_at?: string;
          updated_at?: string;
          // Host fields
          address?: string | null;
          city?: string | null;
          prefecture?: string | null;
          postal_code?: string | null;
          accommodation_type?: "house" | "apartment" | null;
          room_type?: "private" | "shared" | null;
          max_guests?: number | null;
          amenities?: string[] | null;
          house_rules?: string[] | null;
          available_from?: string | null;
          available_to?: string | null;
          price_per_night?: number | null;
          license_number?: string | null;
          license_expiry?: string | null;
          // Guest fields
          study_purpose?: string | null;
          planned_duration?: "1-3" | "3-6" | "6-12" | "12+" | null;
          dietary_restrictions?: string[] | null;
          preferred_location?: string[] | null;
          start_date?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
      PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
      PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
  ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;
