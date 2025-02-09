import React, { useState } from 'react';
import { Search, Bell, Menu, Settings, Layout, Users, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import Header from "../components/Header";
import Sidebar from "../components/Sidebar"
import SpaceList from "../components/SpaceList"
import CreateSpaceDialog from '../components/CreateSpaceDialog';
import api from '../services/api';
const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [spaceCode, setSpaceCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const user = useSelector((state) => state.auth.user);


  const handleCreateSpace = async() => {
    // Here you would typically handle the space creation
     console.log('Creating space:', newSpaceName);

     try {
        const formData = new FormData();
        formData.append('boardname', newSpaceName);
       
        const response = await api.post('/boards/create' , formData)
        console.log("Response from creation of board : " , response)
        setNewSpaceName('');
        setShowCreateDialog(false);
     } catch (error) {
        console.log( "Error in creating new Space" , error)
     }
   
  };

  const spaces = [
    { name: 'Project Alpha', id: 'SPACE001', members: 5 },
    { name: 'Design Team', id: 'SPACE002', members: 8 },
    { name: 'Marketing Campaign', id: 'SPACE003', members: 4 },
  ];

  const logout = () => {
    window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, "_self");
};
  return (
    <div className="flex min-h-screen bg-white relative">
      {/* Mobile Menu Button - Only visible when sidebar is closed */}
      {!isOpen && (
        <button 
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Custom Create Space Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-10 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Create New Space</h2>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              <input
                type="text"
                placeholder="Enter space name"
                value={newSpaceName}
                onChange={(e) => setNewSpaceName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpace}
                disabled={!newSpaceName.trim()}
                className="px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Space
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } fixed lg:relative lg:translate-x-0 z-40 w-64 min-h-screen border-r border-gray-200 bg-white p-4 transition-transform duration-200 ease-in-out flex flex-col`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-8">
          <span className="text-lg font-semibold">Menu</span>
          {isOpen && (
            <button 
              onClick={() => setIsOpen(false)}
              className="lg:hidden"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>
        
        {/* Main Navigation */}
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

        {/* Settings Section at Bottom */}
        <div className="mt-auto relative">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center text-gray-700 hover:text-black p-2 rounded-lg hover:bg-gray-100"
          >
            <Settings className="h-5 w-5 mr-3" />
            <span>Settings</span>
          </button>

          {/* Settings Dropdown */}
          {showSettings && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <button onClick={logout} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                Logout
              </button>
              <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <header className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold ml-12 lg:ml-0">DrawInk</h1>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Bell className="h-5 w-5 text-gray-500" /> 
              <img src={user.avatar} className="h-8 w-8 bg-gray-200 rounded-full"></img>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <button 
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 w-full md:w-auto"
            >
              Create new Space
            </button>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <input
                type="text"
                placeholder="Enter space code"
                value={spaceCode}
                onChange={(e) => setSpaceCode(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap">
                Join Space
              </button>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Space Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">
                    Space ID
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                    Members
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {spaces.map((space) => (
                  <tr key={space.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {space.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {space.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">
                      {space.members}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;


// const Dashboard = () => {
//     const [isOpen, setIsOpen] = useState(true);
//     const [showSettings, setShowSettings] = useState(false);
//     const [showCreateDialog, setShowCreateDialog] = useState(false);
//     const [newSpaceName, setNewSpaceName] = useState('');
//     const spaces = [
//       { name: 'Project Alpha', id: 'SPACE001', members: 5 },
//       { name: 'Design Team', id: 'SPACE002', members: 8 },
//       { name: 'Marketing Campaign', id: 'SPACE003', members: 4 },
//     ];
//     return (
//       <div className="flex min-h-screen bg-white relative">
//         <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} showSettings={showSettings} setShowSettings={setShowSettings} />
//         <div className="flex-1">
//         <Header />
//           <CreateSpaceDialog showCreateDialog={showCreateDialog} setShowCreateDialog={setShowCreateDialog} newSpaceName={newSpaceName} setNewSpaceName={setNewSpaceName} handleCreateSpace={() => setShowCreateDialog(false)} />
//           <SpaceList spaces={spaces} />
//         </div>
//       </div>
//     );
//   };
//   export default Dashboard;
  