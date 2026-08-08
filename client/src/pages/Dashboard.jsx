import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for workspace creation/join inputs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [workspaceTitle, setWorkspaceTitle] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  // Fetch workspaces on component load
  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get('/workspaces');
      setWorkspaces(res.data);
    } catch (err) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceTitle.trim()) {
      toast.error('Workspace title is required');
      return;
    }
    try {
      const res = await api.post('/workspaces', { title: workspaceTitle });
      toast.success('Workspace created successfully!');
      setWorkspaceTitle('');
      setShowCreateModal(false);
      fetchWorkspaces(); // Refresh list
    } catch (err) {
      toast.error('Failed to create workspace');
    }
  };

  const handleJoinWorkspace = async (e) => {
    e.preventDefault();
    if (!joinRoomId.trim()) {
      toast.error('Room ID is required');
      return;
    }
    try {
      // Validate room ID exists by calling join endpoint
      await api.post('/join', { roomId: joinRoomId, username: user.username });
      toast.success('Workspace found! Entering...');
      navigate(`/workspace/${joinRoomId}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Workspace not found');
    }
  };

  const handleDeleteWorkspace = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workspace?')) return;
    try {
      await api.delete(`/workspaces/${id}`);
      toast.success('Workspace deleted');
      fetchWorkspaces(); // Refresh list
    } catch (err) {
      toast.error('Failed to delete workspace');
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      {/* Top Navbar Header */}
      <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-8">
        <div className="flex items-center gap-2">
          <img src="/code-sync.png" alt="logo" className="h-8 w-8" />
          <div className="flex flex-col">
            <h1 className="text-md font-extrabold leading-none">
              <span className="text-[#0F172A]">Code</span>
              <span className="text-primary">Cast</span>
            </h1>
            <span className="text-[7px] uppercase font-bold tracking-wider text-[#64748B] mt-0.5">
              Code Together. Build Better.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Welcome, {user?.username}</span>
          <button onClick={logout} className="btn-secondary text-xs">
            Logout
          </button>
        </div>
      </div>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <button
          onClick={() => setShowCreateModal(true)}
          className="border border-gray-300 p-6 text-left hover:border-primary transition"
        >
          <h2 className="text-lg font-bold mb-1">+ Create Workspace</h2>
          <p className="text-gray-500 text-xs">Start a new project with default HTML, CSS, and JS files.</p>
        </button>

        <button
          onClick={() => setShowJoinModal(true)}
          className="border border-gray-300 p-6 text-left hover:border-primary transition"
        >
          <h2 className="text-lg font-bold mb-1">Join Workspace</h2>
          <p className="text-gray-500 text-xs">Enter a Room ID shared by an owner to collaborate.</p>
        </button>
      </div>

      {/* Workspaces List */}
      <div>
        <h2 className="text-md font-bold mb-4 uppercase tracking-wider text-gray-500">My Workspaces</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading workspaces...</p>
        ) : workspaces.length === 0 ? (
          <p className="text-sm text-gray-500 border border-dashed border-gray-300 p-8 text-center">
            No workspaces created yet. Create one to get started!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                className="flex items-center justify-between border border-gray-300 p-4"
              >
                <div>
                  <h3 className="font-bold text-sm">{workspace.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">Room ID: {workspace.roomId}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/workspace/${workspace.roomId}`)}
                    className="btn-primary text-xs"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteWorkspace(workspace._id)}
                    className="btn-secondary text-xs text-red-600 border-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Workspace Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 p-6 w-full max-w-md">
            <h3 className="font-bold text-md mb-4">Create Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Workspace Title"
                value={workspaceTitle}
                onChange={(e) => setWorkspaceTitle(e.target.value)}
                className="input-box"
                required
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join Workspace Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 p-6 w-full max-w-md">
            <h3 className="font-bold text-md mb-4">Join Workspace</h3>
            <form onSubmit={handleJoinWorkspace} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Workspace Room ID"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                className="input-box"
                required
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs">
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
