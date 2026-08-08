const path = require('path');
const { io } = require(path.resolve(__dirname, '../client/node_modules/socket.io-client'));

const BASE_URL = 'http://localhost:5000';

let authToken = '';
let testUserId = '';
let createdWorkspaceId = '';
let createdRoomId = '';

const logPass = (feature, detail = '') => {
  console.log(`[PASS] ${feature}${detail ? ` - ${detail}` : ''}`);
};

const logFail = (feature, error) => {
  console.error(`[FAIL] ${feature} - ${error.message || error}`);
  process.exit(1);
};

async function apiRequest(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, data };
}

async function runTests() {
  console.log('====================================================');
  console.log('   STARTING CODECAST FULL FEATURE AUTOMATED TEST    ');
  console.log('====================================================\n');

  // TEST 1: User Registration
  try {
    const randomUser = `user_${Date.now()}`;
    const regRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: randomUser,
        email: `${randomUser}@example.com`,
        password: 'TestPassword123!',
      }),
    });

    if (regRes.data.success) {
      logPass('1. User Registration', `User '${randomUser}' registered successfully`);
    } else {
      throw new Error(`Registration failed with status ${regRes.status}: ${JSON.stringify(regRes.data)}`);
    }

    // TEST 1b: Duplicate Registration Handling
    const dupRes = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: randomUser,
        email: `${randomUser}@example.com`,
        password: 'TestPassword123!',
      }),
    });
    if (dupRes.status === 400) {
      logPass('1b. Duplicate Registration Rejection', 'Correctly rejected existing user with status 400');
    } else {
      throw new Error(`Expected 400 status for duplicate user, got ${dupRes.status}`);
    }

    // TEST 2: User Login & JWT Generation
    const loginRes = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: `${randomUser}@example.com`,
        password: 'TestPassword123!',
      }),
    });
    if (loginRes.data.token && loginRes.data.user) {
      authToken = loginRes.data.token;
      testUserId = loginRes.data.user.id;
      logPass('2. User Login & JWT Token', `JWT token received for user ID: ${testUserId}`);
    } else {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.data)}`);
    }

    // TEST 3: Create Workspace
    const wsTitle = `Automated Test Project ${Date.now()}`;
    const wsRes = await apiRequest('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ title: wsTitle }),
    });
    if (wsRes.data && wsRes.data.roomId && wsRes.data.files.length === 3) {
      createdWorkspaceId = wsRes.data._id;
      createdRoomId = wsRes.data.roomId;
      logPass('3. Workspace Creation', `Created '${wsTitle}' with Room ID: ${createdRoomId} and 3 default files`);
    } else {
      throw new Error(`Workspace creation failed: ${JSON.stringify(wsRes.data)}`);
    }

    // TEST 4: Fetch User Workspaces
    const listRes = await apiRequest('/workspaces', { method: 'GET' });
    const found = listRes.data.find((w) => w._id === createdWorkspaceId);
    if (found) {
      logPass('4. Fetch Workspaces List', `Found created workspace in user's list (${listRes.data.length} total)`);
    } else {
      throw new Error('Created workspace not found in user list');
    }

    // TEST 5: Join Workspace API (Owner vs Guest)
    const ownerJoin = await apiRequest('/join', {
      method: 'POST',
      body: JSON.stringify({
        roomId: createdRoomId,
        username: randomUser,
        userId: testUserId,
      }),
    });
    if (ownerJoin.data.role === 'owner') {
      logPass('5a. Join Workspace (Owner)', 'Correctly assigned role: owner');
    } else {
      throw new Error(`Expected owner role, got ${ownerJoin.data.role}`);
    }

    const guestJoin = await apiRequest('/join', {
      method: 'POST',
      body: JSON.stringify({
        roomId: createdRoomId,
        username: 'Guest_Automation_Tester',
      }),
    });
    if (guestJoin.data.role === 'guest' && guestJoin.data.workspace.members.includes('Guest_Automation_Tester')) {
      logPass('5b. Join Workspace (Guest)', 'Guest joined room and username added to members array');
    } else {
      throw new Error('Guest join failed or members list not updated');
    }

    // TEST 6: Auto-save Files Persistence
    const updatedFiles = [
      ...wsRes.data.files,
      {
        id: '4',
        name: 'test_script.py',
        type: 'file',
        parent: null,
        content: 'print("Automated python test")',
      },
    ];
    const saveRes = await apiRequest(`/workspaces/${createdRoomId}/files`, {
      method: 'PUT',
      body: JSON.stringify({ files: updatedFiles }),
    });
    if (saveRes.data.files.length === 4) {
      logPass('6. Workspace Files Persistence', 'Files updated and saved to MongoDB (4 items now)');
    } else {
      throw new Error('Save files API did not update files');
    }

    // TEST 7: Socket.io Real-time Synchronization
    console.log('\n--- Testing Socket.io Real-time Event Channels ---');
    await testSockets(createdRoomId, randomUser, 'Guest_Automation_Tester');

    // TEST 8: Workspace Deletion
    const delRes = await apiRequest(`/workspaces/${createdWorkspaceId}`, { method: 'DELETE' });
    if (delRes.data.message && delRes.data.message.includes('removed')) {
      logPass('8. Workspace Deletion', `Successfully deleted workspace ID: ${createdWorkspaceId}`);
    } else {
      throw new Error(`Workspace deletion failed: ${JSON.stringify(delRes.data)}`);
    }

    console.log('\n====================================================');
    console.log('   🎉 ALL FEATURE TESTS PASSED SUCCESSFULLY!       ');
    console.log('====================================================\n');
  } catch (err) {
    logFail('Test Suite execution failed', err);
  }
}

function testSockets(roomId, user1Name, user2Name) {
  return new Promise((resolve, reject) => {
    let client1Joined = false;
    let codeSyncTested = false;
    let fileSyncTested = false;

    const socket1 = io(BASE_URL, { transports: ['websocket'], forceNew: true });
    const socket2 = io(BASE_URL, { transports: ['websocket'], forceNew: true, autoConnect: false });

    const timeout = setTimeout(() => {
      socket1.disconnect();
      socket2.disconnect();
      reject(new Error('Socket.io test timed out'));
    }, 8000);

    socket1.on('connect', () => {
      socket1.emit('join-room', { roomId, username: user1Name, isGuest: false, isOwner: true });
    });

    socket1.on('joined', ({ users, username }) => {
      if (username === user1Name && !client1Joined) {
        client1Joined = true;
        logPass('7a. Socket Client 1 Joined', `User '${user1Name}' joined room`);

        // Now connect Client 2
        socket2.connect();
      } else if (username === user2Name) {
        logPass('7b. Socket Member Join Broadcast', `Client 1 notified that '${user2Name}' joined room`);

        // Client 1 sends code change
        socket1.emit('code-change', {
          roomId,
          fileId: '1',
          code: '<h1>Updated Live Code</h1>',
        });
      }
    });

    socket2.on('connect', () => {
      socket2.emit('join-room', { roomId, username: user2Name, isGuest: true, isOwner: false });
    });

    socket2.on('code-change', ({ fileId, code }) => {
      if (fileId === '1' && code === '<h1>Updated Live Code</h1>') {
        logPass('7c. Real-time Code Change Broadcast', 'Client 2 received live code edit from Client 1');
        codeSyncTested = true;

        // Client 1 sends file change
        socket1.emit('file-change', {
          roomId,
          files: [{ id: '1', name: 'index.html', type: 'file', parent: null, content: '<h1>Updated Live Code</h1>' }],
        });
      }
    });

    socket2.on('file-change', ({ files }) => {
      if (files.length === 1 && codeSyncTested && !fileSyncTested) {
        fileSyncTested = true;
        logPass('7d. Real-time File Structure Broadcast', 'Client 2 received live tree change from Client 1');

        // Client 2 disconnects to test leave notification
        socket2.disconnect();
      }
    });

    socket1.on('left', ({ username }) => {
      if (username === user2Name) {
        logPass('7e. Real-time User Disconnect Broadcast', `Client 1 notified that '${user2Name}' disconnected`);
        clearTimeout(timeout);
        socket1.disconnect();
        resolve();
      }
    });
  });
}

runTests();
