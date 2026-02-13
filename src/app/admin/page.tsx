'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit, Save, X, Download, Upload, 
  Clock, Users, DollarSign, Package, AlertCircle,
  ArrowLeft, Settings, Trophy
} from 'lucide-react';
import Link from 'next/link';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Item, Bidder, AuctionSettings } from '@/lib/database.types';

interface ItemFormData {
  title: string;
  description: string;
  starting_bid: number;
  donor_name: string;
  category: string;
  image_url: string;
}

const emptyItem: ItemFormData = {
  title: '',
  description: '',
  starting_bid: 10,
  donor_name: '',
  category: '',
  image_url: '',
};

export default function AdminPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [settings, setSettings] = useState<AuctionSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemForm, setItemForm] = useState<ItemFormData>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    end_time: '',
    is_active: true,
  });

  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setIsDemo(true);
      setLoading(false);
      return;
    }

    try {
      const [itemsRes, biddersRes, settingsRes] = await Promise.all([
        supabase.from('items').select('*').order('created_at'),
        supabase.from('bidders').select('*').order('created_at'),
        supabase.from('auction_settings').select('*').single(),
      ]);

      if (itemsRes.data) setItems(itemsRes.data);
      if (biddersRes.data) setBidders(biddersRes.data);
      if (settingsRes.data) {
        setSettings(settingsRes.data);
        setSettingsForm({
          end_time: new Date(settingsRes.data.end_time).toISOString().slice(0, 16),
          is_active: settingsRes.data.is_active,
        });
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveItem = async () => {
    if (!itemForm.title || !itemForm.starting_bid) {
      setError('Title and starting bid are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      if (editingItem) {
        // Update existing item
        const { error } = await supabase
          .from('items')
          .update({
            title: itemForm.title,
            description: itemForm.description || null,
            starting_bid: itemForm.starting_bid,
            donor_name: itemForm.donor_name || null,
            category: itemForm.category || null,
            image_url: itemForm.image_url || null,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
      } else {
        // Create new item
        const { error } = await supabase
          .from('items')
          .insert({
            title: itemForm.title,
            description: itemForm.description || null,
            starting_bid: itemForm.starting_bid,
            current_bid: itemForm.starting_bid,
            donor_name: itemForm.donor_name || null,
            category: itemForm.category || null,
            image_url: itemForm.image_url || null,
          });

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

  const handleUpdateSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('auction_settings')
        .update({
          end_time: new Date(settingsForm.end_time).toISOString(),
          is_active: settingsForm.is_active,
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

  // Stats
  const totalBids = items.reduce((sum, item) => sum + (item.current_bid > item.starting_bid ? 1 : 0), 0);
  const totalValue = items.reduce((sum, item) => sum + item.current_bid, 0);
  const itemsWithBids = items.filter(item => item.current_bidder_id).length;

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
                <p className="text-sm text-gray-500">Manage your auction</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        {/* Items section */}
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
                                category: item.category || '',
                                image_url: item.image_url || '',
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
                    className="input"
                    placeholder="Item title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="input min-h-[100px]"
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
                      className="input"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      value={itemForm.category}
                      onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                      className="input"
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
                    className="input"
                    placeholder="Who donated this item?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={itemForm.image_url}
                    onChange={(e) => setItemForm({ ...itemForm, image_url: e.target.value })}
                    className="input"
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

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    value={settingsForm.end_time}
                    onChange={(e) => setSettingsForm({ ...settingsForm, end_time: e.target.value })}
                    className="input"
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
