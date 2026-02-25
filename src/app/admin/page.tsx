'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit, Save, X, Download, Upload, 
  Clock, Users, DollarSign, Package, AlertCircle,
  ArrowLeft, Settings, Trophy, Shield, History,
  UserPlus, TrendingUp, Bell, Eye, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Item, Bidder, AuctionSettings } from '@/lib/database.types';

// Admin password - change this!
const ADMIN_PASSWORD = 'westfield2026admin';

interface Bid {
  id: string;
  item_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  item?: Item;
  bidder?: Bidder;
}

interface ItemFormData {
  title: string;
  description: string;
  starting_bid: number;
  donor_name: string;
  donor_phone: string;
  donor_email: string;
  category: string;
  image_url: string;
  estimated_value: number | '';
  bid_increment: number;
  auction_wave: number;
}

const emptyItem: ItemFormData = {
  title: '',
  description: '',
  starting_bid: 10,
  donor_name: '',
  donor_phone: '',
  donor_email: '',
  category: '',
  image_url: '',
  estimated_value: '',
  bid_increment: 1,
  auction_wave: 1,
};

export default function AdminPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Data state
  const [items, setItems] = useState<Item[]>([]);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [bids, setBids] = useState<Bid[]>([]);
  const [settings, setSettings] = useState<AuctionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  
  // UI state
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    end_time: '',
    end_time_wave2: '',
    is_active: true,
    disclaimer_text: '',
    qr_code_url: '',
  });
  const [activeTab, setActiveTab] = useState<'items' | 'bids' | 'bidders' | 'winners' | 'live'>('items');

  // Check for saved auth
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
      setAuthError('');
    } else {
      setAuthError('Incorrect password');
    }
  };

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsDemo(true);
      setLoading(false);
      return;
    }

    try {
      const [itemsRes, biddersRes, settingsRes, bidsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at'),
        supabase.from('bidders').select('*').order('created_at', { ascending: false }),
        supabase.from('auction_settings').select('*').single(),
        supabase.from('bids').select('*').order('created_at', { ascending: false }).limit(100),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (biddersRes.data) setBidders(biddersRes.data);
      if (bidsRes.data) setBids(bidsRes.data);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
        setSettingsForm({
          end_time: new Date(settingsRes.data.end_time).toISOString().slice(0, 16),
          end_time_wave2: settingsRes.data.end_time_wave2
            ? new Date(settingsRes.data.end_time_wave2).toISOString().slice(0, 16)
            : '',
          is_active: settingsRes.data.is_active,
          disclaimer_text: settingsRes.data.disclaimer_text ?? '',
          qr_code_url: settingsRes.data.qr_code_url ?? '',
        });
      }
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchData, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchData, isAuthenticated]);

  // Real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated || !isSupabaseConfigured()) return;

    const bidsChannel = supabase
      .channel('admin-bids')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, () => {
        fetchData();
      })
      .subscribe();

    const biddersChannel = supabase
      .channel('admin-bidders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bidders' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(bidsChannel);
      supabase.removeChannel(biddersChannel);
    };
  }, [fetchData, isAuthenticated]);

  const handleSaveItem = async () => {
    if (!itemForm.title || !itemForm.starting_bid) {
      setError('Title and starting bid are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const itemPayload = {
        title: itemForm.title,
        description: itemForm.description || null,
        starting_bid: itemForm.starting_bid,
        donor_name: itemForm.donor_name || null,
        donor_phone: itemForm.donor_phone || null,
        donor_email: itemForm.donor_email || null,
        category: itemForm.category || null,
        image_url: itemForm.image_url || null,
        estimated_value: itemForm.estimated_value !== '' ? Number(itemForm.estimated_value) : null,
        bid_increment: itemForm.bid_increment || 1,
        auction_wave: itemForm.auction_wave || 1,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update(itemPayload)
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('items')
          .insert({ ...itemPayload, current_bid: itemForm.starting_bid });
        if (error) throw error;
      }

      setShowItemModal(false);
      setEditingItem(null);
      setItemForm(emptyItem);
      fetchData();
    } catch (err) {
      console.error('Error saving item:', err);
      setError('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting item:', err);
    }
  };

  const handleDeleteBidder = async (id: string) => {
    if (!confirm('Are you sure you want to remove this bidder? Their bids will remain.')) return;

    try {
      const { error } = await supabase.from('bidders').delete().eq('id', id);
      if (error) throw error;
      fetchData();
    } catch (err) {
      console.error('Error deleting bidder:', err);
    }
  };

  const handleUpdateSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('auction_settings')
        .update({
          end_time: new Date(settingsForm.end_time).toISOString(),
          end_time_wave2: settingsForm.end_time_wave2
            ? new Date(settingsForm.end_time_wave2).toISOString()
            : null,
          is_active: settingsForm.is_active,
          disclaimer_text: settingsForm.disclaimer_text || null,
          qr_code_url: settingsForm.qr_code_url || null,
        })
        .eq('id', settings.id);

      if (error) throw error;
      setShowSettingsModal(false);
      fetchData();
    } catch (err) {
      console.error('Error updating settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const exportWinners = () => {
    const winners = items
      .filter(item => item.current_bidder_id)
      .map(item => {
        const bidder = bidders.find(b => b.id === item.current_bidder_id);
        return {
          item: item.title,
          category: item.category || '',
          winning_bid: item.current_bid,
          winner_name: bidder?.name || 'Unknown',
          winner_email: bidder?.email || '',
          winner_phone: bidder?.phone || '',
        };
      });

    const csv = [
      ['Item', 'Category', 'Winning Bid', 'Winner Name', 'Winner Email', 'Winner Phone'].join(','),
      ...winners.map(w => [
        `"${w.item}"`,
        `"${w.category}"`,
        w.winning_bid,
        `"${w.winner_name}"`,
        w.winner_email,
        w.winner_phone,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-winners-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportAllBids = () => {
    const bidData = bids.map(bid => {
      const item = items.find(i => i.id === bid.item_id);
      const bidder = bidders.find(b => b.id === bid.bidder_id);
      return {
        timestamp: new Date(bid.created_at).toLocaleString(),
        item: item?.title || 'Unknown',
        bidder: bidder?.name || 'Unknown',
        email: bidder?.email || '',
        amount: bid.amount,
      };
    });

    const csv = [
      ['Timestamp', 'Item', 'Bidder', 'Email', 'Amount'].join(','),
      ...bidData.map(b => [
        `"${b.timestamp}"`,
        `"${b.item}"`,
        `"${b.bidder}"`,
        b.email,
        b.amount,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auction-all-bids-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Stats
  const totalValue = items.reduce((sum, item) => sum + item.current_bid, 0);
  const itemsWithBids = items.filter(item => item.current_bidder_id).length;

  // Get enriched bids with item and bidder info
  const enrichedBids = bids.map(bid => ({
    ...bid,
    item: items.find(i => i.id === bid.item_id),
    bidder: bidders.find(b => b.id === bid.bidder_id),
  }));

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-2xl w-full max-w-md"
        >
          <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mx-auto mb-6">
            <Shield className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-gray-800 text-center mb-2">
            Admin Access
          </h1>
          <p className="text-gray-500 text-center mb-6">
            Enter the admin password to continue
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            {authError && (
              <p className="text-red-500 text-sm text-center">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
            >
              Enter Admin Panel
            </button>
          </form>
          
          <Link href="/" className="block text-center text-gray-400 text-sm mt-6 hover:text-gray-600">
            ← Back to Auction
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isDemo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold text-gray-800 mb-2">
            Admin Unavailable
          </h1>
          <p className="text-gray-600 mb-6">
            Connect Supabase to access the admin panel and manage your auction.
          </p>
          <Link href="/" className="btn-primary inline-block">
            Back to Auction
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="font-heading text-xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-sm text-gray-500">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh data"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={exportWinners}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Winners
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{items.length}</p>
                <p className="text-sm text-gray-500">Items</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{itemsWithBids}</p>
                <p className="text-sm text-gray-500">With Bids</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{bidders.length}</p>
                <p className="text-sm text-gray-500">Bidders</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{bids.length}</p>
                <p className="text-sm text-gray-500">Total Bids</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">${totalValue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { id: 'items', label: 'Items', icon: Package, count: undefined },
            { id: 'bids', label: 'Bid History', icon: History, count: bids.length },
            { id: 'bidders', label: 'Bidders', icon: Users, count: bidders.length },
            { id: 'winners', label: 'Winners Report', icon: Trophy, count: undefined },
            { id: 'live', label: 'Live Feed', icon: Bell, count: undefined },
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
                activeTab === id
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4 inline mr-2" />
              {label}{count !== undefined ? ` (${count})` : ''}
            </button>
          ))}
        </div>

        {/* Items Tab */}
        {activeTab === 'items' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-gray-800">Items</h2>
              <button
                onClick={() => {
                  setEditingItem(null);
                  setItemForm(emptyItem);
                  setShowItemModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Item</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Starting</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Current</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">High Bidder</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => {
                    const bidder = bidders.find(b => b.id === item.current_bidder_id);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-800">{item.title}</p>
                            {item.donor_name && (
                              <p className="text-xs text-gray-400">by {item.donor_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{item.category || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm text-gray-600">${item.starting_bid}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-sm font-semibold ${item.current_bid > item.starting_bid ? 'text-emerald-600' : 'text-gray-600'}`}>
                            ${item.current_bid}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {bidder ? (
                            <span className="text-sm text-gray-600">{bidder.name}</span>
                          ) : (
                            <span className="text-sm text-gray-400">No bids</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  title: item.title,
                                  description: item.description || '',
                                  starting_bid: item.starting_bid,
                                  donor_name: item.donor_name || '',
                                  donor_phone: item.donor_phone || '',
                                  donor_email: item.donor_email || '',
                                  category: item.category || '',
                                  image_url: item.image_url || '',
                                  estimated_value: item.estimated_value ?? '',
                                  bid_increment: item.bid_increment ?? 1,
                                  auction_wave: item.auction_wave ?? 1,
                                });
                                setShowItemModal(true);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4 text-gray-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bids Tab */}
        {activeTab === 'bids' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-gray-800">
                <History className="w-5 h-5 inline mr-2" />
                Bid History
              </h2>
              <button
                onClick={exportAllBids}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export All Bids
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Time</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Bidder</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Item</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {enrichedBids.map((bid) => (
                    <tr key={bid.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {new Date(bid.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-800">{bid.bidder?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">{bid.bidder?.email || ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{bid.item?.title || 'Unknown Item'}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-emerald-600">${bid.amount}</span>
                      </td>
                    </tr>
                  ))}
                  {bids.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                        No bids yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bidders Tab */}
        {activeTab === 'bidders' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-heading text-lg font-bold text-gray-800">
                <Users className="w-5 h-5 inline mr-2" />
                Registered Bidders
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Email</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Phone</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Registered</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bidders.map((bidder) => (
                    <tr key={bidder.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{bidder.name}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{bidder.email}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{bidder.phone}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-500">
                          {new Date(bidder.created_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDeleteBidder(bidder.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove bidder"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {bidders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        No bidders registered yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Winners Report Tab */}
        {activeTab === 'winners' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-gray-800">
                <Trophy className="w-5 h-5 inline mr-2 text-amber-500" />
                Winners Report
              </h2>
              <button
                onClick={() => {
                  const printContent = document.getElementById('winners-print-area');
                  if (printContent) {
                    const w = window.open('', '_blank');
                    if (w) {
                      w.document.write(`<html><head><title>Auction Winners</title>
                        <style>
                          body{font-family:sans-serif;padding:20px;color:#111}
                          h1{font-size:24px;margin-bottom:8px}
                          .winner-card{border:2px solid #ddd;border-radius:12px;padding:20px;margin-bottom:24px;page-break-inside:avoid}
                          .winner-name{font-size:20px;font-weight:bold;margin-bottom:4px}
                          .contact{color:#555;font-size:14px;margin-bottom:12px}
                          table{width:100%;border-collapse:collapse;margin-top:12px}
                          th{background:#f5f5f5;text-align:left;padding:8px;border:1px solid #ddd;font-size:13px}
                          td{padding:8px;border:1px solid #ddd;font-size:13px}
                          .total{font-size:18px;font-weight:bold;margin-top:12px;text-align:right;color:#059669}
                          .donor-info{font-size:12px;color:#777}
                          @media print{.winner-card{page-break-inside:avoid}}
                        </style></head><body>`);
                      w.document.write(printContent.innerHTML);
                      w.document.write('</body></html>');
                      w.document.close();
                      w.print();
                    }
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors"
              >
                🖨️ Print All Reports
              </button>
            </div>

            <div id="winners-print-area">
              <h1>Westfield 1st Ward Silent Auction — Winners Report</h1>
              {(() => {
                // Group items by winner
                const winnerMap = new Map<string, { bidder: Bidder; items: Item[] }>();
                items.filter(i => i.current_bidder_id).forEach(item => {
                  const bidder = bidders.find(b => b.id === item.current_bidder_id);
                  if (!bidder) return;
                  if (!winnerMap.has(bidder.id)) {
                    winnerMap.set(bidder.id, { bidder, items: [] });
                  }
                  winnerMap.get(bidder.id)!.items.push(item);
                });

                if (winnerMap.size === 0) {
                  return <p className="text-gray-400 text-center py-8">No winners yet — auction still in progress.</p>;
                }

                return Array.from(winnerMap.values()).map(({ bidder, items: wonItems }) => {
                  const total = wonItems.reduce((sum, i) => sum + i.current_bid, 0);
                  return (
                    <div key={bidder.id} className="winner-card bg-white border-2 border-gray-200 rounded-2xl p-6 mb-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="winner-name font-heading text-xl font-bold text-gray-800">{bidder.name}</p>
                          <p className="contact text-gray-500 text-sm">
                            📱 {bidder.phone} &nbsp;·&nbsp; ✉️ {bidder.email}
                          </p>
                          {bidder.is_anonymous && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Anonymous bidder</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="total text-2xl font-bold text-emerald-600">${total.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Total owed</p>
                        </div>
                      </div>
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="text-left px-3 py-2 border border-gray-200">Item Won</th>
                            <th className="text-left px-3 py-2 border border-gray-200">Donated By</th>
                            <th className="text-left px-3 py-2 border border-gray-200">Donor Contact</th>
                            <th className="text-right px-3 py-2 border border-gray-200">Winning Bid</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wonItems.map(item => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 border border-gray-200 font-medium">{item.title}</td>
                              <td className="px-3 py-2 border border-gray-200 text-gray-600">{item.donor_name || '—'}</td>
                              <td className="px-3 py-2 border border-gray-200 donor-info text-gray-500 text-xs">
                                {item.donor_phone && <span>📱 {item.donor_phone}<br /></span>}
                                {item.donor_email && <span>✉️ {item.donor_email}</span>}
                                {!item.donor_phone && !item.donor_email && '—'}
                              </td>
                              <td className="px-3 py-2 border border-gray-200 text-right font-bold text-emerald-600">${item.current_bid.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-emerald-50">
                            <td colSpan={3} className="px-3 py-2 border border-gray-200 font-bold text-right">Total Due</td>
                            <td className="px-3 py-2 border border-gray-200 font-bold text-right text-emerald-700 text-lg">${total.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                      <p className="text-xs text-gray-400 mt-3 italic">
                        Payment is due tonight. Please see the auction coordinator to settle your balance.
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        )}

        {/* Live Feed Tab */}
        {activeTab === 'live' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-gray-800">
                <Bell className="w-5 h-5 inline mr-2 text-indigo-500" />
                Live Bid Feed
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-gray-400">Real-time</span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {enrichedBids.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-400">No bids yet</div>
              ) : (
                enrichedBids.map((bid, idx) => {
                  // Always show real name in admin
                  const displayName = bid.bidder?.name ?? 'Unknown';
                  const isWinning = bid.item?.current_bidder_id === bid.bidder_id && bid.amount === bid.item?.current_bid;
                  return (
                    <motion.div
                      key={bid.id}
                      initial={idx === 0 ? { backgroundColor: '#ecfdf5' } : {}}
                      animate={{ backgroundColor: '#ffffff' }}
                      transition={{ duration: 2 }}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isWinning ? 'bg-emerald-500' : 'bg-indigo-400'}`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm">{displayName}</span>
                            {bid.bidder?.is_anonymous && (
                              <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">anon</span>
                            )}
                            {isWinning && (
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">Leading</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            {bid.item?.title ?? 'Unknown item'} · {new Date(bid.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-bold text-sm ${isWinning ? 'text-emerald-600' : 'text-gray-700'}`}>
                        ${bid.amount.toLocaleString()}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowItemModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-heading text-xl font-bold text-gray-800">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <button onClick={() => setShowItemModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={itemForm.title}
                    onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Item title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[100px]"
                    placeholder="Item description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Starting Bid *</label>
                    <input
                      type="number"
                      value={itemForm.starting_bid}
                      onChange={(e) => setItemForm({ ...itemForm, starting_bid: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="e.g., Food, Services"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Donor Name</label>
                  <input
                    type="text"
                    value={itemForm.donor_name}
                    onChange={(e) => setItemForm({ ...itemForm, donor_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="Who donated this item?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donor Phone</label>
                    <input
                      type="tel"
                      value={itemForm.donor_phone}
                      onChange={(e) => setItemForm({ ...itemForm, donor_phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="(555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Donor Email</label>
                    <input
                      type="email"
                      value={itemForm.donor_email}
                      onChange={(e) => setItemForm({ ...itemForm, donor_email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="donor@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Est. Value ($)
                      <span className="text-gray-400 text-xs ml-1">optional</span>
                    </label>
                    <input
                      type="number"
                      value={itemForm.estimated_value}
                      onChange={(e) => setItemForm({ ...itemForm, estimated_value: e.target.value === '' ? '' : parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="e.g. 50"
                      min="0"
                    />
                    {itemForm.estimated_value !== '' && itemForm.estimated_value > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        Suggested start: ${Math.round(Number(itemForm.estimated_value) * 0.3)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bid Increment ($)
                    </label>
                    <input
                      type="number"
                      value={itemForm.bid_increment}
                      onChange={(e) => setItemForm({ ...itemForm, bid_increment: parseInt(e.target.value) || 1 })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      min="1"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {itemForm.starting_bid >= 100 ? 'High value → $10+' : itemForm.starting_bid >= 30 ? 'Mid value → $5+' : 'Low value → $1-5'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wave
                    </label>
                    <select
                      value={itemForm.auction_wave}
                      onChange={(e) => setItemForm({ ...itemForm, auction_wave: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value={1}>Wave 1</option>
                      <option value={2}>Wave 2</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={itemForm.image_url}
                    onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="https://..."
                  />
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="font-heading text-xl font-bold text-gray-800">Auction Settings</h3>
              </div>

              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wave 1 End Time</label>
                    <input
                      type="datetime-local"
                      value={settingsForm.end_time}
                      onChange={(e) => setSettingsForm({ ...settingsForm, end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wave 2 End Time
                      <span className="text-gray-400 text-xs ml-1">optional</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={settingsForm.end_time_wave2}
                      onChange={(e) => setSettingsForm({ ...settingsForm, end_time_wave2: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">App URL (for QR code)</label>
                  <input
                    type="url"
                    value={settingsForm.qr_code_url}
                    onChange={(e) => setSettingsForm({ ...settingsForm, qr_code_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    placeholder="https://westfield-auction.vercel.app"
                  />
                  {settingsForm.qr_code_url && (
                    <div className="mt-2 flex items-center gap-2">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(settingsForm.qr_code_url)}`}
                        alt="QR Code"
                        className="w-24 h-24 rounded-lg border border-gray-200"
                      />
                      <div>
                        <p className="text-sm text-gray-600 font-medium">QR Code Preview</p>
                        <a
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(settingsForm.qr_code_url)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-500 underline"
                          download="auction-qr.png"
                        >
                          Download high-res PNG →
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disclaimer Text</label>
                  <textarea
                    value={settingsForm.disclaimer_text}
                    onChange={(e) => setSettingsForm({ ...settingsForm, disclaimer_text: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[80px]"
                    placeholder="All sales are final. Payment is due at the end of the auction..."
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Auction Active</span>
                  <button
                    onClick={() => setSettingsForm({ ...settingsForm, is_active: !settingsForm.is_active })}
                    className={`w-12 h-7 rounded-full transition-colors ${settingsForm.is_active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                  >
                    <motion.div
                      animate={{ x: settingsForm.is_active ? 22 : 2 }}
                      className="w-5 h-5 bg-white rounded-full shadow"
                    />
                  </button>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
