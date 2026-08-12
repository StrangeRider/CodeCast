import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Home = () => {
  const { login, register, loginAsGuest } = useContext(AuthContext);
  const navigate = useNavigate();

  // Modal controller state: null | 'login' | 'register' | 'guest'
  const [activeModal, setActiveModal] = useState(null);

  // Form input states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeModal === 'login') {
      if (!email || !password) {
        toast.error('Email and Password are required');
        return;
      }
      try {
        await login(email, password);
        toast.success('Logged in successfully!');
        setActiveModal(null);
        navigate('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } else if (activeModal === 'register') {
      if (!username || !email || !password) {
        toast.error('All fields are required');
        return;
      }
      try {
        await register(username, email, password);
        toast.success('Registration successful! Please login.');
        setActiveModal('login');
        setPassword('');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Registration failed');
      }
    } else if (activeModal === 'guest') {
      if (!username || !roomId) {
        toast.error('Username and Room ID are required');
        return;
      }
      try {
        loginAsGuest(username);
        toast.success('Welcome, joining room...');
        setActiveModal(null);
        navigate(`/workspace/${roomId}`);
      } catch (err) {
        toast.error('Failed to join workspace');
      }
    }
  };

  const closeModals = () => {
    setActiveModal(null);
    setUsername('');
    setEmail('');
    setPassword('');
    setRoomId('');
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col font-sans selection:bg-blue-100 selection:text-primary">
      
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Motto */}
          <div className="flex items-center gap-3">
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

          {/* Center Links */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#about" className="text-xs font-semibold text-gray-500 hover:text-black transition">
              About Project
            </a>
            <a href="#features" className="text-xs font-semibold text-gray-500 hover:text-black transition">
              Features
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveModal('guest')}
              className="btn-secondary text-xs"
            >
              Join as Guest
            </button>
            <button
              onClick={() => setActiveModal('login')}
              className="text-xs font-semibold text-gray-500 hover:text-black transition px-2"
            >
              Login
            </button>
            <button
              onClick={() => setActiveModal('register')}
              className="btn-primary text-xs"
            >
              Register
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-20 md:py-28 text-center flex flex-col items-center">
        <div className="border border-gray-200 px-3 py-1 mb-6 text-[10px] uppercase font-bold tracking-widest text-gray-500 bg-gray-50">
          Simple Real-time Collaboration
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-tight text-[#0F172A] max-w-3xl leading-tight">
          Collaborative Code Editing, <span className="text-primary">Made Simple</span>
        </h2>
        <p className="text-sm md:text-base text-gray-500 max-w-2xl mt-6 leading-relaxed">
          A clean, high-performance real-time code editor built for small Project Building, peer learning, and simple classroom coding. No complex configuration, templates, or lag.
        </p>
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            onClick={() => setActiveModal('register')}
            className="btn-primary px-8 py-3 text-sm font-semibold"
          >
            Get Started
          </button>
          <button
            onClick={() => setActiveModal('guest')}
            className="btn-secondary px-8 py-3 text-sm font-semibold"
          >
            Join with Room ID
          </button>
        </div>
      </section>

      {/* 3. About Project Section */}
      <section id="about" className="border-t border-gray-200 bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-primary mb-3">About CodeCast</div>
              <h3 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight">
                Designed for Collaborative Development
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-4 leading-relaxed">
                Our CodeCast makes it easy for multiple users to work on the same coding project simultaneously. Changes made by one user are instantly synchronized and visible to everyone in the workspace, eliminating the need to repeatedly share files or manually merge changes.              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-3 leading-relaxed">
                The platform provides a simple and efficient environment for team projects, pair programming, coding practice, and collaborative development — all in one place.              </p>
            </div>

            { <div className="border border-gray-200 p-8 bg-white flex flex-col gap-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400">Main Features</h4>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div className="border border-gray-200 p-3 bg-gray-50">Create Multiple Rooms</div>
                <div className="border border-gray-200 p-3 bg-gray-50">Create a Hierarchy of Files & Folders</div>
                <div className="border border-gray-200 p-3 bg-gray-50">Allow Multiple Developers to Work on a Project</div>
                <div className="border border-gray-200 p-3 bg-gray-50">Download the Project as a ZIP File with One Click</div>
              </div>

            </div> }

          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <section id="features" className="border-t border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-[10px] uppercase font-bold tracking-widest text-primary mb-3">Capabilities</div>
            <h3 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight">
              Everything you need, nothing you don't
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 p-6 flex flex-col gap-3">
              <span className="text-lg">⌨️</span>
              <h4 className="font-bold text-sm text-[#0F172A]">Monaco Editor</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Uses the VS Code editor core directly inside your browser. Enjoy auto-bracket closing, line numbers, and standard indentations.
              </p>
            </div>

            <div className="border border-gray-200 p-6 flex flex-col gap-3">
              <span className="text-lg">⚡</span>
              <h4 className="font-bold text-sm text-[#0F172A]">Real-time Keystrokes</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every code edit, file creation, or file deletion broadcasts instantly to all joined members in the room using Socket.io.
              </p>
            </div>

            <div className="border border-gray-200 p-6 flex flex-col gap-3">
              <span className="text-lg">👁️</span>
              <h4 className="font-bold text-sm text-[#0F172A]">Live Sandbox Preview</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Provides a sandboxed iframe that automatically builds and runs HTML/CSS/JS workspace configurations with zero compile delays.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-gray-200 py-8 bg-gray-50 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/code-sync.png" alt="logo" className="h-5 w-5" />
            <span className="text-xs font-bold text-[#0F172A]">CodeCast</span>
          </div>
          <p className="text-[10px] text-gray-400">
            Code Together. Build Better.
          </p>
          <p className="text-[10px] text-gray-500 font-semibold">
            © 2026 CodeCast. All rights reserved.
          </p>
        </div>
      </footer>

      {/* 6. Centered Modal Overlays for Forms */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-25 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-300 p-8 w-full max-w-md flex flex-col gap-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#0F172A]">
                {activeModal === 'login' && 'Account Login'}
                {activeModal === 'register' && 'Account Register'}
                {activeModal === 'guest' && 'Join as Guest'}
              </h3>
              <button onClick={closeModals} className="text-gray-400 hover:text-black font-bold text-sm p-1">
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {activeModal === 'register' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Choose username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-box text-xs"
                    required
                  />
                </div>
              )}

              {activeModal === 'guest' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Username</label>
                  <input
                    type="text"
                    placeholder="Enter guest username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-box text-xs"
                    required
                  />
                </div>
              )}

              {activeModal !== 'guest' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-box text-xs"
                    required
                  />
                </div>
              )}

              {activeModal !== 'guest' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Password</label>
                  <input
                    type="password"
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-box text-xs"
                    required
                  />
                </div>
              )}

              {activeModal === 'guest' && (
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Room ID</label>
                  <input
                    type="text"
                    placeholder="Enter Workspace Room ID"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="input-box text-xs"
                    required
                  />
                </div>
              )}

              <button type="submit" className="btn-primary text-xs w-full py-2.5 mt-2">
                {activeModal === 'login' && 'Login'}
                {activeModal === 'register' && 'Register'}
                {activeModal === 'guest' && 'Join'}
              </button>
            </form>

            {/* Switch Mode Links */}
            <div className="text-center text-[10px] text-gray-500 border-t border-gray-100 pt-3">
              {activeModal === 'login' && (
                <span>
                  Don't have an account?{' '}
                  <button onClick={() => setActiveModal('register')} className="text-primary font-bold hover:underline">
                    Register
                  </button>
                </span>
              )}
              {activeModal === 'register' && (
                <span>
                  Already have an account?{' '}
                  <button onClick={() => setActiveModal('login')} className="text-primary font-bold hover:underline">
                    Login
                  </button>
                </span>
              )}
              {activeModal === 'guest' && (
                <span>
                  Or,{' '}
                  <button onClick={() => setActiveModal('login')} className="text-primary font-bold hover:underline">
                    login to your account
                  </button>
                </span>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
