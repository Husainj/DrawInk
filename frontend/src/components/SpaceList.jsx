import React, { useState } from 'react';
import { Search, Bell, Menu, Settings, Layout, Users, X } from 'lucide-react';

const SpaceList = ({ spaces }) => {
    return (
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Space Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Space ID</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Members</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {spaces.map((space) => (
              <tr key={space.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{space.name}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{space.id}</td>
                <td className="px-6 py-4 text-sm text-gray-500 text-right">{space.members}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  export default SpaceList