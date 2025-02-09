import React, { useState } from 'react';
import { Search, Bell, Menu, Settings, Layout, Users, X } from 'lucide-react';

const CreateSpaceDialog = ({ showCreateDialog, setShowCreateDialog, newSpaceName, setNewSpaceName, handleCreateSpace }) => {
    if (!showCreateDialog) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-10 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Create New Space</h2>
            <button onClick={() => setShowCreateDialog(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            <input type="text" placeholder="Enter space name" value={newSpaceName} onChange={(e) => setNewSpaceName(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
          </div>
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
            <button onClick={() => setShowCreateDialog(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button onClick={handleCreateSpace} disabled={!newSpaceName.trim()} className="px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">Create Space</button>
          </div>
        </div>
      </div>
    );
  };

  export default CreateSpaceDialog