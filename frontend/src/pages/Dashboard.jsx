import React, { useEffect, useState } from 'react';
import { Layout, Users, X, Menu, Settings } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Dashboard = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [spaceCode, setSpaceCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const [spaces, setSpaces] = useState([]);
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const response = await api.get("/boards/");
        const formattedSpaces = response.data.data.map((board) => ({
          name: board.boardname,
          code: board.code,
          members: board.participants,
          _id: board._id,
        }));
        setSpaces(formattedSpaces);
      } catch (error) {
        console.error("Error fetching spaces:", error);
      }
    };
    fetchSpaces();
  }, []);

  const handleCreateSpace = async () => {
    try {
      const formData = new FormData();
      formData.append('boardname', newSpaceName);
      const response = await api.post('/boards/create', formData);
      if (response.status === 200) {
        navigate(`/board/${response.data.data._id}`);
      }
      setNewSpaceName('');
      setShowCreateDialog(false);
    } catch (error) {
      console.error("Error creating space:", error);
    }
  };

  const handleBoardClick = async (code) => {
    try {
      const formData = new FormData();
      formData.append('code', code);
      const response = await api.post("/boards/join", formData);
      navigate(`/board/${response.data.data._id}`);
    } catch (error) {
      console.error("Error joining board:", error);
    }
  };

  const joinBoard = async () => {
    try {
      const formData = new FormData();
      formData.append('code', spaceCode);
      const response = await api.post("/boards/join", formData);
      navigate(`/board/${response.data.data._id}`);
    } catch (error) {
      console.error("Error joining board:", error);
    }
  };

  const logout = () => {
    window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, "_self");
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 relative">
      {/* Mobile Menu Button */}
      {!isOpen && (
        <button
          className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {/* Create Space Dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Create New Space</h2>
              <button
                onClick={() => setShowCreateDialog(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
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
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSpace}
                disabled={!newSpaceName.trim()}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Create Space
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed lg:relative lg:translate-x-0 z-40 w-64 min-h-screen bg-white shadow-lg p-6 transition-transform duration-300 ease-in-out flex flex-col`}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-xl font-bold text-gray-800">DrawInk</span>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <nav className="space-y-2 flex-1">
          {[
            { name: 'Dashboard', icon: <Layout className="h-5 w-5 mr-3" /> },
            { name: 'Spaces', icon: <Users className="h-5 w-5 mr-3" /> },
          ].map((item) => (
            <div key={item.name} className="relative group">
              <a
                href="#"
                className="flex items-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-all duration-200"
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
              <span className="absolute left-1/2 -translate-x-1/2 bottom-12 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {item.name}
              </span>
            </div>
          ))}
        </nav>
        <div className="mt-auto relative">
          <div className="relative group">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full flex items-center text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-3 rounded-lg transition-all duration-200"
            >
              <Settings className="h-5 w-5 mr-3" />
              <span>Settings</span>
            </button>
            <span className="absolute left-1/2 -translate-x-1/2 bottom-12 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              Settings
            </span>
          </div>
          {showSettings && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              <button
                onClick={logout}
                className="w-full text-left px-4 py-2.5 text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              >
                Logout
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                Delete Account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        <header className="border-b border-gray-200 p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800 ml-12 lg:ml-0">DrawInk</h1>
            <img
              src={user.avatar}
              alt="User Avatar"
              className="h-10 w-10 rounded-full border border-gray-200"
            />
          </div>
        </header>
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 w-full md:w-auto"
            >
              Create New Space
            </button>
            <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Enter space code"
                value={spaceCode}
                onChange={(e) => setSpaceCode(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              />
              <button
                onClick={joinBoard}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 whitespace-nowrap"
              >
                Join Space
              </button>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Space Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                    Space ID
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">
                    Members
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {spaces.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                      No spaces available
                    </td>
                  </tr>
                ) : (
                  spaces.map((space) => (
                    <tr
                      key={space.code}
                      className="hover:bg-blue-50 cursor-pointer transition-all duration-200"
                      onClick={() => handleBoardClick(space.code)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-800">
                        {space.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {space.code}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right flex justify-end -space-x-3">
                        {Array.isArray(space.members) && space.members.length > 0 ? (
                          space.members.slice(0, 3).map((member, index) => (
                            <img
                              key={index}
                              src={member.avatar || 'https://via.placeholder.com/32'}
                              alt={member.name || 'User'}
                              className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
                            />
                          ))
                        ) : (
                          <span className="text-gray-500">No members</span>
                        )}
                        {Array.isArray(space.members) && space.members.length > 3 && (
                          <span className="text-xs font-medium text-gray-600 bg-white rounded-full h-9 flex items-center px-3">
                            +{space.members.length - 3}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;