import React, { useState } from 'react';
import { Search, Bell, Menu, Settings, Layout, Users, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen, setShowSettings, showSettings }) => {
  return (
    <div className={`${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } fixed lg:relative lg:translate-x-0 z-40 w-64 min-h-screen border-r border-gray-200 bg-white p-4 transition-transform duration-200 ease-in-out flex flex-col`}>
      <div className="flex items-center justify-between mb-8">
        <span className="text-lg font-semibold">Menu</span>
        {isOpen && (
          <button onClick={() => setIsOpen(false)} className="lg:hidden">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        )}
      </div>
      <nav className="space-y-4">
        <a href="#" className="flex items-center text-gray-700 hover:text-black">
          <Layout className="h-5 w-5 mr-3" />
          <span>Dashboard</span>
        </a>
        <a href="#" className="flex items-center text-gray-700 hover:text-black">
          <Users className="h-5 w-5 mr-3" />
          <span>Spaces</span>
        </a>
      </nav>
      <div className="mt-auto relative">
        <button onClick={() => setShowSettings(!showSettings)} className="w-full flex items-center text-gray-700 hover:text-black p-2 rounded-lg hover:bg-gray-100">
          <Settings className="h-5 w-5 mr-3" />
          <span>Settings</span>
        </button>
        {showSettings && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">Logout</button>
            <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">Delete Account</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar