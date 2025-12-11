import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import pb from '../lib/pocketbase';
import { Save, ArrowLeft, Smartphone, Monitor, RotateCcw } from 'lucide-react';

const PRESETS = {
    light: {
        primaryColor: '#4F46E5',
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        userTextColor: '#ffffff',
        borderRadius: '12px',
    },
    dark: {
        primaryColor: '#6366f1',
        backgroundColor: '#1f2937',
        textColor: '#f9fafb',
        userTextColor: '#ffffff',
        borderRadius: '12px',
    },
    minimal: {
        primaryColor: '#000000',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        userTextColor: '#ffffff',
        borderRadius: '0px',
    }
};

const ThemeEditor = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const iframeRef = useRef(null);
    const [device, setDevice] = useState('desktop');
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);

    const [theme, setTheme] = useState(PRESETS.light);

    useEffect(() => {
        fetchClient();
    }, [id]);

    useEffect(() => {
        // Send theme update to iframe whenever theme changes
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.postMessage({ type: 'THEME_UPDATE', theme }, '*');
        }
    }, [theme]);

    const fetchClient = async () => {
        try {
            const record = await pb.collection('Clients').getOne(id, {
                requestKey: null
            });
            setClient(record);
            if (record.themeConfig && Object.keys(record.themeConfig).length > 0) {
                // Ensure default props exist for new features
                setTheme({
                    ...PRESETS.light,
                    ...record.themeConfig
                });
            }
            setLoading(false);
        } catch (error) {
            console.error("Error fetching client:", error);
            alert("Error loading chatbot");
            navigate('/');
        }
    };

    const handleSave = async () => {
        try {
            await pb.collection('Clients').update(id, {
                themeConfig: theme
            });
            alert('Theme saved successfully!');
        } catch (error) {
            console.error("Error saving theme:", error);
            alert('Failed to save theme.');
        }
    };

    const handlePresetChange = (presetName) => {
        setTheme(PRESETS[presetName]);
    };

    const handleReset = () => {
        if (window.confirm('Reset theme to default Light preset?')) {
            setTheme(PRESETS.light);
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <div className="flex items-center">
                    <button onClick={() => navigate('/')} className="mr-4 text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Theme Editor</h1>
                        <p className="text-sm text-gray-500">{client.name}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                        <button
                            onClick={() => setDevice('desktop')}
                            className={`p-2 rounded-md ${device === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            <Monitor className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setDevice('mobile')}
                            className={`p-2 rounded-md ${device === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                        >
                            <Smartphone className="w-5 h-5" />
                        </button>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        title="Reset to Default"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Controls */}
                <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
                    <div className="space-y-8">

                        {/* Presets */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Presets</h3>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.keys(PRESETS).map(preset => (
                                    <button
                                        key={preset}
                                        onClick={() => handlePresetChange(preset)}
                                        className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:border-indigo-500 capitalize"
                                    >
                                        {preset}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Colors */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Colors</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Primary Color</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={theme.primaryColor}
                                            onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            value={theme.primaryColor}
                                            onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                                            className="flex-1 text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Background Color</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={theme.backgroundColor}
                                            onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            value={theme.backgroundColor}
                                            onChange={(e) => setTheme({ ...theme, backgroundColor: e.target.value })}
                                            className="flex-1 text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Text Color (Bot)</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={theme.textColor}
                                            onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            value={theme.textColor}
                                            onChange={(e) => setTheme({ ...theme, textColor: e.target.value })}
                                            className="flex-1 text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">User Text Color</label>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="color"
                                            value={theme.userTextColor || '#ffffff'}
                                            onChange={(e) => setTheme({ ...theme, userTextColor: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-0"
                                        />
                                        <input
                                            type="text"
                                            value={theme.userTextColor || '#ffffff'}
                                            onChange={(e) => setTheme({ ...theme, userTextColor: e.target.value })}
                                            className="flex-1 text-sm border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layout */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Layout</h3>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
                                <select
                                    value={theme.borderRadius}
                                    onChange={(e) => setTheme({ ...theme, borderRadius: e.target.value })}
                                    className="w-full border-gray-300 rounded-md text-sm"
                                >
                                    <option value="0px">None (0px)</option>
                                    <option value="4px">Small (4px)</option>
                                    <option value="8px">Medium (8px)</option>
                                    <option value="12px">Large (12px)</option>
                                    <option value="20px">Round (20px)</option>
                                </select>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Preview Area */}
                <div className="flex-1 bg-gray-100 flex items-center justify-center p-8">
                    <div
                        className="transition-all duration-300 bg-white shadow-2xl overflow-hidden"
                        style={{
                            width: device === 'mobile' ? '375px' : '100%',
                            height: device === 'mobile' ? '667px' : '100%',
                            maxWidth: device === 'desktop' ? '1200px' : undefined,
                            borderRadius: device === 'mobile' ? '30px' : '8px',
                            border: device === 'mobile' ? '12px solid #1f2937' : 'none',
                        }}
                    >
                        <iframe
                            ref={iframeRef}
                            src={`/preview.html?chatbotId=${client.chatbotId}&apiUrl=${encodeURIComponent((import.meta.env.VITE_MIDDLEWARE_URL || 'http://localhost:3000').replace(/\/$/, '') + '/api/v1/chat')}`}
                            className="w-full h-full border-0 bg-white"
                            title="Chatbot Preview"
                            onLoad={() => {
                                if (iframeRef.current && iframeRef.current.contentWindow) {
                                    iframeRef.current.contentWindow.postMessage({ type: 'THEME_UPDATE', theme }, '*');
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeEditor;
