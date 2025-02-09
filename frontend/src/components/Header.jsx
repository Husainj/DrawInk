import React, { useState } from 'react';
import { Search, Bell, Menu, Settings, Layout, Users, X } from 'lucide-react';

const Header = () => {
    return (
      <header className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold ml-12 lg:ml-0">DrawInk</h1>
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search..." className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <Bell className="h-5 w-5 text-gray-500" />
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>
    );
  };

export default Header;