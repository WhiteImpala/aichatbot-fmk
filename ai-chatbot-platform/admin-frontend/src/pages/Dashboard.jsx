import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '../lib/pocketbase';
import { Plus, Trash2, Edit2, X, Copy, Code, Palette } from 'lucide-react';

// Get middleware URL from environment variable
const MIDDLEWARE_URL = import.meta.env.VITE_MIDDLEWARE_URL || 'http://localhost:3000';

const Dashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [embedCodeClient, setEmbedCodeClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    websiteUrl: '',
    contextText: '',
    chatbotId: '',
    isActive: true
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const records = await pb.collection('Clients').getFullList({
        sort: '-created',
        requestKey: null
      });
      setClients(records);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this chatbot?')) {
      await pb.collection('Clients').delete(id);
      fetchClients();
    }
  };

  const openModal = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        websiteUrl: client.websiteUrl,
        contextText: client.contextText,
        chatbotId: client.chatbotId,
        isActive: client.isActive
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        websiteUrl: '',
        contextText: '',
        chatbotId: `bot_${Math.random().toString(36).substr(2, 9)}`,
        isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await pb.collection('Clients').update(editingClient.id, formData);
      } else {
        await pb.collection('Clients').create(formData);
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client. Ensure API rules allow this action.");
    }
  };

  const generateEmbedCode = (chatbotId) => {
    const widgetUrl = `${window.location.origin}/widget.js`;
    const apiUrl = `${MIDDLEWARE_URL}/api/v1/chat`;
    return `<script src="${widgetUrl}" data-chatbot-id="${chatbotId}" data-api-url="${apiUrl}"></script>`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Embed code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Chatbot Clients</h2>
        <button
          onClick={() => openModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Chatbot
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
                <p className="text-sm text-gray-500">{client.websiteUrl}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {client.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mb-4">
              <p className="text-xs font-mono bg-gray-50 p-2 rounded border text-gray-600 break-all">
                ID: {client.chatbotId}
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <button onClick={() => navigate(`/chatbot/${client.id}/theme`)} className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Theme & Styling">
                <Palette className="w-5 h-5" />
              </button>
              <button onClick={() => setEmbedCodeClient(client)} className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Get Embed Code">
                <Code className="w-5 h-5" />
              </button>
              <button onClick={() => openModal(client)} className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition" title="Edit">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingClient ? 'Edit Chatbot' : 'Create New Chatbot'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website URL</label>
                  <input
                    type="text"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Chatbot ID (Unique)</label>
                <input
                  type="text"
                  value={formData.chatbotId}
                  onChange={(e) => setFormData({ ...formData, chatbotId: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">System Context / Instructions</label>
                <textarea
                  value={formData.contextText}
                  onChange={(e) => setFormData({ ...formData, contextText: e.target.value })}
                  rows={6}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="You are a helpful support agent for..."
                  required
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Active</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Save Chatbot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {embedCodeClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Embed Code for {embedCodeClient.name}
              </h3>
              <button onClick={() => setEmbedCodeClient(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Copy and paste this code into your website's HTML, just before the closing <code className="bg-gray-100 px-1 rounded">&lt;/body&gt;</code> tag:
            </p>
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto font-mono">
                {generateEmbedCode(embedCodeClient.chatbotId)}
              </pre>
              <button
                onClick={() => copyToClipboard(generateEmbedCode(embedCodeClient.chatbotId))}
                className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> The widget will connect to the middleware at <code className="bg-blue-100 px-1 rounded">{MIDDLEWARE_URL}</code>
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setEmbedCodeClient(null)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
