require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Workspace = require('./models/Workspace');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB Atlas...');

    // 1. Clean existing records
    await User.deleteMany({});
    await Workspace.deleteMany({});
    console.log('Cleared existing mock data.');

    // 2. Create a mock user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const mockUser = await User.create({
      username: 'collab_coder',
      email: 'coder@codecast.com',
      password: hashedPassword,
    });
    console.log('Successfully created user: coder@codecast.com (Password: password123)');

    // 3. Create a mock workspace
    const mockWorkspace = await Workspace.create({
      title: 'Demo Web Project',
      owner: mockUser._id,
      roomId: 'demo-room-id-999',
      members: ['collab_coder'],
      files: [
        {
          id: '1',
          name: 'index.html',
          type: 'file',
          parent: null,
          content: '<h1>Hello, CodeCast!</h1>\n<p>Start editing code in real-time.</p>\n<script src="script.js"></script>',
        },
        {
          id: '2',
          name: 'style.css',
          type: 'file',
          parent: null,
          content: 'body {\n  font-family: sans-serif;\n  text-align: center;\n  background: #f8fafc;\n  padding-top: 50px;\n}',
        },
        {
          id: '3',
          name: 'script.js',
          type: 'file',
          parent: null,
          content: 'console.log("Welcome to CodeCast!");',
        },
      ],
    });
    console.log('Successfully created workspace: "Demo Web Project" (Room ID: demo-room-id-999)');

    await mongoose.disconnect();
    console.log('Database seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
