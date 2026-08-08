import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor from '@monaco-editor/react';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { initSocket } from '../services/socket';
import api from '../services/api';
import JSZip from 'jszip';

const Workspace = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [workspace, setWorkspace] = useState(null);
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState('');
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // States for creation inputs
  const [newitemName, setNewitemName] = useState('');
  const [newitemType, setNewitemType] = useState('file'); // 'file' | 'folder'
  const [selectedParentId, setSelectedParentId] = useState(''); // null/empty for root
  const [showCreateForm, setShowCreateForm] = useState(false);

  const socketRef = useRef(null);
  const localUpdateRef = useRef(false);

  // Get active file object
  const activeFile = files.find((f) => f.id === activeFileId);

  // Map file extension to Monaco Editor language
  const getLanguage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html': return 'html';
      case 'css': return 'css';
      case 'js': return 'javascript';
      case 'jsx': return 'javascript';
      case 'py': return 'python';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  // 1. Fetch Workspace Data
  useEffect(() => {
    const fetchWorkspace = async () => {
      try {
        const res = await api.post('/join', {
          roomId,
          username: user.username,
          userId: user.id,
        });
        setWorkspace(res.data.workspace);
        setFiles(res.data.workspace.files);
        setIsOwner(res.data.role === 'owner');

        // Set default active file
        const firstFile = res.data.workspace.files.find((f) => f.type === 'file');
        if (firstFile) {
          setActiveFileId(firstFile.id);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to join workspace');
        navigate(user.isGuest ? '/' : '/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchWorkspace();
  }, [roomId, user]);

  // 2. Setup Socket Connection & Listeners
  useEffect(() => {
    if (loading || !workspace) return;

    socketRef.current = initSocket();

    // Join room passing role states (guest vs registered vs owner)
    socketRef.current.emit('join-room', {
      roomId,
      username: user.username,
      isGuest: !!user.isGuest,
      isOwner: isOwner
    });

    // Handle new user joined
    socketRef.current.on('joined', ({ users, username }) => {
      setConnectedUsers(users);
      if (username !== user.username) {
        toast.success(`${username} joined`);
      }
    });

    // Handle code changes from others
    socketRef.current.on('code-change', ({ fileId, code }) => {
      localUpdateRef.current = true;
      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === fileId ? { ...f, content: code } : f))
      );
    });

    // Handle file structure changes from others
    socketRef.current.on('file-change', ({ files: updatedFiles }) => {
      setFiles(updatedFiles);
    });

    // Handle user left
    socketRef.current.on('left', ({ users, username }) => {
      setConnectedUsers(users);
      toast.success(`${username} left`);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [loading, workspace]);

  // 3. Debounced DB auto-save whenever files change
  useEffect(() => {
    if (loading || !workspace) return;

    // Skip database saving if files change was triggered by websocket incoming message
    if (localUpdateRef.current) {
      localUpdateRef.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await api.put(`/workspaces/${roomId}/files`, { files });
      } catch (err) {
        console.error('Failed to auto-save files:', err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [files]);

  // 4. Monaco Editor Content Change
  const handleEditorChange = (value) => {
    if (!activeFileId) return;

    // Update local state
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFileId ? { ...f, content: value } : f))
    );

    // Emit Socket code change
    if (socketRef.current) {
      socketRef.current.emit('code-change', {
        roomId,
        fileId: activeFileId,
        code: value,
      });
    }
  };

  // 5. Explorer Operations (Owner Only)
  const handleCreateItem = (e) => {
    e.preventDefault();
    if (!newitemName.trim()) return;

    const newItem = {
      id: Math.random().toString(36).substring(7),
      name: newitemName.trim(),
      type: newitemType,
      parent: selectedParentId || null,
      content: newitemType === 'file' ? '' : undefined,
    };

    const updatedFiles = [...files, newItem];
    setFiles(updatedFiles);

    // Broadcast file structure change
    if (socketRef.current) {
      socketRef.current.emit('file-change', { roomId, files: updatedFiles });
    }

    // Set active if it is a file
    if (newitemType === 'file') {
      setActiveFileId(newItem.id);
    }

    // Reset Form
    setNewitemName('');
    setShowCreateForm(false);
    toast.success(`${newitemType} created`);
  };

  const handleDeleteItem = (itemId) => {
    if (!window.confirm('Delete this item and all its contents?')) return;

    // Recursively collect all ids to delete
    const toDelete = new Set([itemId]);
    let hasMore = true;
    while (hasMore) {
      hasMore = false;
      files.forEach((f) => {
        if (f.parent && toDelete.has(f.parent) && !toDelete.has(f.id)) {
          toDelete.add(f.id);
          hasMore = true;
        }
      });
    }

    const updatedFiles = files.filter((f) => !toDelete.has(f.id));
    setFiles(updatedFiles);

    // Broadcast change
    if (socketRef.current) {
      socketRef.current.emit('file-change', { roomId, files: updatedFiles });
    }

    // If currently active file was deleted, pick another
    if (toDelete.has(activeFileId)) {
      const remainingFile = updatedFiles.find((f) => f.type === 'file');
      setActiveFileId(remainingFile ? remainingFile.id : '');
    }

    toast.success('Deleted successfully');
  };

  // Download Workspace as ZIP
  const downloadWorkspace = async () => {
    const zip = new JSZip();

    // Helper to compute full path of an item recursively
    const getFullPath = (item) => {
      const pathParts = [];
      let current = item;
      while (current) {
        pathParts.unshift(current.name);
        current = files.find(f => f.id === current.parent);
      }
      return pathParts.join('/');
    };

    // Add all files and folders to JSZip instance
    files.forEach((item) => {
      if (item.type === 'folder') {
        const path = getFullPath(item);
        zip.folder(path);
      } else {
        if (item.parent) {
          const parentFolder = files.find(f => f.id === item.parent);
          if (parentFolder) {
            const path = getFullPath(parentFolder);
            zip.folder(path).file(item.name, item.content || '');
          } else {
            zip.file(item.name, item.content || '');
          }
        } else {
          zip.file(item.name, item.content || '');
        }
      }
    });

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${workspace?.title || 'workspace'}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('ZIP download started!');
    } catch (err) {
      toast.error('Failed to generate ZIP');
      console.error(err);
    }
  };

  // 6. Flat Tree Sort and Render Helper
  const getDepth = (item) => {
    let depth = 0;
    let parentId = item.parent;
    while (parentId) {
      const parent = files.find((f) => f.id === parentId);
      if (!parent) break;
      depth += 1;
      parentId = parent.parent;
    }
    return depth;
  };

  const getSortedItems = () => {
    const result = [];
    const traverse = (parentId) => {
      const children = files.filter((f) => f.parent === parentId);
      const folders = children.filter((c) => c.type === 'folder').sort((a, b) => a.name.localeCompare(b.name));
      const fileItems = children.filter((c) => c.type === 'file').sort((a, b) => a.name.localeCompare(b.name));

      folders.forEach((f) => {
        result.push(f);
        traverse(f.id);
      });
      fileItems.forEach((file) => {
        result.push(file);
      });
    };

    // Traverse root level
    const rootFolders = files.filter((f) => !f.parent && f.type === 'folder').sort((a, b) => a.name.localeCompare(b.name));
    const rootFiles = files.filter((f) => !f.parent && f.type === 'file').sort((a, b) => a.name.localeCompare(b.name));

    rootFolders.forEach((f) => {
      result.push(f);
      traverse(f.id);
    });
    rootFiles.forEach((file) => {
      result.push(file);
    });

    return result;
  };

  // 7. Live Preview iframe content compile
  const getPreviewSrcDoc = () => {
    const htmlFile = files.find((f) => f.name === 'index.html' && !f.parent);
    const cssFile = files.find((f) => f.name === 'style.css' && !f.parent);
    const jsFile = files.find((f) => f.name === 'script.js' && !f.parent);

    const html = htmlFile ? htmlFile.content : '<h1>No index.html at root</h1>';
    const css = cssFile ? cssFile.content : '';
    const js = jsFile ? jsFile.content : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>${css}</style>
        </head>
        <body>
          ${html}
          <script>
            try {
              ${js}
            } catch(err) {
              console.error(err);
            }
          </script>
        </body>
      </html>
    `;
  };

  const isWebLanguage = activeFile && ['html', 'css', 'js', 'jsx'].includes(activeFile.name.split('.').pop().toLowerCase());

  if (loading) {
    return <div className="p-8 text-black text-sm">Loading workspace collaboration...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      {/* 1. Navbar */}
      <div className="flex items-center justify-between border-b border-gray-300 px-6 py-3 h-14">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(user.isGuest ? '/' : '/dashboard')}
            className="btn-secondary text-xs"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2 border-r border-gray-300 pr-4">
            <img src="/code-sync.png" alt="logo" className="h-6 w-6" />
            <h1 className="text-sm font-extrabold leading-none">
              <span className="text-[#0F172A]">Code</span>
              <span className="text-primary">Cast</span>
            </h1>
          </div>
          <h2 className="font-bold text-sm">{workspace?.title}</h2>
          <span className="text-xs text-gray-500 font-mono select-all">Room ID: {roomId}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={downloadWorkspace}
            className="btn-secondary text-xs"
          >
            Download ZIP
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(roomId);
              toast.success('Room ID copied!');
            }}
            className="btn-secondary text-xs"
          >
            Copy Room ID
          </button>
          <button
            onClick={() => navigate(user.isGuest ? '/' : '/dashboard')}
            className="btn-secondary text-xs text-red-600 border-red-200"
          >
            Leave Workspace
          </button>
        </div>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Explorer & Connected Users Sidebar */}
        <div className="w-64 border-r border-gray-300 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="p-4 border-b border-gray-300 flex justify-between items-center bg-gray-50">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-600">Files</span>
              {isOwner && (
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="text-xs text-primary font-bold"
                >
                  {showCreateForm ? 'Cancel' : '+ New'}
                </button>
              )}
            </div>

            {/* Create File/Folder Form */}
            {isOwner && showCreateForm && (
              <form onSubmit={handleCreateItem} className="p-4 border-b border-gray-300 bg-gray-50 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Name (e.g. index.html)"
                  value={newitemName}
                  onChange={(e) => setNewitemName(e.target.value)}
                  className="input-box text-xs"
                  required
                />
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="itemtype"
                      checked={newitemType === 'file'}
                      onChange={() => setNewitemType('file')}
                    />
                    File
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="radio"
                      name="itemtype"
                      checked={newitemType === 'folder'}
                      onChange={() => setNewitemType('folder')}
                    />
                    Folder
                  </label>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 uppercase block mb-1">Parent Folder</label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full border border-gray-300 bg-white p-1 text-xs outline-none"
                  >
                    <option value="">Root</option>
                    {files
                      .filter((f) => f.type === 'folder')
                      .map((fold) => (
                        <option key={fold.id} value={fold.id}>
                          {fold.name}
                        </option>
                      ))}
                  </select>
                </div>
                <button type="submit" className="btn-primary text-xs w-full py-1">
                  Create
                </button>
              </form>
            )}

            {/* File List */}
            <div className="p-2">
              {files.length === 0 ? (
                <p className="text-xs text-gray-400 p-2">No files or folders.</p>
              ) : (
                getSortedItems().map((item) => {
                  const depth = getDepth(item);
                  const isActive = item.id === activeFileId;
                  return (
                    <div
                      key={item.id}
                      style={{ paddingLeft: `${depth * 12 + 8}px` }}
                      className={`group flex items-center justify-between py-1.5 px-2 text-xs cursor-pointer ${
                        isActive ? 'bg-blue-50 text-primary font-medium' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (item.type === 'file') {
                          setActiveFileId(item.id);
                        }
                      }}
                    >
                      <span className="truncate">
                        {item.type === 'folder' ? '📁' : '📄'} {item.name}
                      </span>
                      {isOwner && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteItem(item.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-[10px] ml-2"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Connected Users List at Bottom */}
          <div className="border-t border-gray-300 p-4 bg-gray-50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Connected Users</h3>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {connectedUsers.map((member, idx) => {
                const name = typeof member === 'string' ? member : member.username;
                const isGuestUser = typeof member === 'string' ? false : member.isGuest;
                const isOwnerUser = typeof member === 'string' ? false : member.isOwner;
                
                return (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 truncate">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="truncate font-medium">{name}</span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono text-gray-500 bg-gray-200">
                      {isOwnerUser ? 'Admin' : isGuestUser ? 'Guest' : 'User'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Monaco Editor */}
        <div className="flex-1 flex flex-col border-r border-gray-300 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-300 bg-gray-50 text-xs font-medium text-gray-600 flex justify-between items-center">
            <span>{activeFile ? `Editing: ${activeFile.name}` : 'No active file open'}</span>
            <span className="text-[10px] uppercase bg-gray-200 px-1.5 py-0.5 rounded text-gray-600">
              {activeFile ? getLanguage(activeFile.name) : 'plain'}
            </span>
          </div>
          <div className="flex-1">
            {activeFile ? (
              <MonacoEditor
                height="100%"
                language={getLanguage(activeFile.name)}
                theme="vs-light"
                value={activeFile.content}
                onChange={handleEditorChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select a file from the explorer to begin editing.
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="w-80 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-300 bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-600">
            Live Preview
          </div>
          <div className="flex-1 bg-white">
            {isWebLanguage ? (
              <iframe
                key={files.map((f) => f.content).join('')} // Trigger reload when code changes
                srcDoc={getPreviewSrcDoc()}
                title="Live Preview"
                sandbox="allow-scripts"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-6 text-center text-xs text-gray-400">
                Preview available only for HTML/CSS/JavaScript.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Workspace;
