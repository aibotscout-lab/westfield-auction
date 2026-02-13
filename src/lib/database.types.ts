export interface Database {
  public: {
    Tables: {
      items: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          image_url: string | null;
          starting_bid: number;
          current_bid: number;
          current_bidder_id: string | null;
          donor_name: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          image_url?: string | null;
          starting_bid?: number;
          current_bid?: number;
          current_bidder_id?: string | null;
          donor_name?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          image_url?: string | null;
          starting_bid?: number;
          current_bid?: number;
          current_bidder_id?: string | null;
          donor_name?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bidders: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string;
          created_at?: string;
        };
      };
      bids: {
        Row: {
          id: string;
          item_id: string;
          bidder_id: string;
          amount: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          bidder_id: string;
          amount: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          bidder_id?: string;
          amount?: number;
          created_at?: string;
        };
      };
      auction_settings: {
        Row: {
          id: string;
          start_time: string;
          end_time: string;
          is_active: boolean;
          title: string;
          description: string | null;
        };
        Insert: {
          id?: string;
          start_time: string;
          end_time: string;
          is_active?: boolean;
          title?: string;
          description?: string | null;
        };
        Update: {
          id?: string;
          start_time?: string;
          end_time?: string;
          is_active?: boolean;
          title?: string;
          description?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Item = Database['public']['Tables']['items']['Row'];
export type Bidder = Database['public']['Tables']['bidders']['Row'];
export type Bid = Database['public']['Tables']['bids']['Row'];
export type AuctionSettings = Database['public']['Tables']['auction_settings']['Row'];

// Extended types with relations
export interface ItemWithBidder extends Item {
  current_bidder?: Bidder | null;
}

export interface BidWithDetails extends Bid {
  bidder?: Bidder;
  item?: Item;
}
