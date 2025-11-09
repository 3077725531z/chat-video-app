// Socket.io 连接
const socket = io();
let localStream = null;
let remoteStream = null;
let peerConnections = new Map(); // 存储多个PeerConnection
let isVideoEnabled = false;
let isAudioEnabled = false;
let currentUsername = '';
let isJoined = false;
let currentUserId = null;
let onlineUsers = [];

// 获取DOM元素
const usernameInput = document.getElementById('usernameInput');
const joinBtn = document.getElementById('joinBtn');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const chatMessages = document.getElementById('chatMessages');
const usersList = document.getElementById('usersList');
const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startVideoBtn = document.getElementById('startVideoBtn');
const stopVideoBtn = document.getElementById('stopVideoBtn');
const startAudioBtn = document.getElementById('startAudioBtn');
const stopAudioBtn = document.getElementById('stopAudioBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const exitFullscreenBtn = document.getElementById('exitFullscreenBtn');
const remoteVideoWrapper = document.querySelector('.remote-video-wrapper');
const clearChatBtn = document.getElementById('clearChatBtn');

// WebRTC 配置
const rtcConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// 保存用户名到localStorage
function saveUsername(username) {
    try {
        localStorage.setItem('chat_username', username);
    } catch (error) {
        console.error('保存用户名失败:', error);
    }
}

// 加载用户名
function loadUsername() {
    try {
        return localStorage.getItem('chat_username') || '';
    } catch (error) {
        return '';
    }
}

// 页面加载时初始化
function initializeApp() {
    // 恢复用户名
    const savedUsername = loadUsername();
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
    }
    
    // 清空聊天窗口
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 清除本地存储的聊天记录（刷新后重新开始）
    clearMessagesStorage();
}

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// 加入聊天
joinBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        currentUsername = username;
        isJoined = true;
        
        // 保存用户名
        saveUsername(username);
        
        // 确保Socket已连接
        if (!socket.connected) {
            socket.connect();
            socket.once('connect', () => {
                socket.emit('join-room', username);
            });
        } else {
            socket.emit('join-room', username);
        }
        
        usernameInput.disabled = true;
        joinBtn.disabled = true;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        startVideoBtn.disabled = false;
        startAudioBtn.disabled = false;
        
        addMessage('系统', '你已加入聊天室', true);
        
        // 显示清除聊天记录按钮
        if (clearChatBtn) {
            clearChatBtn.style.display = 'block';
        }
    }
});

// 清除聊天记录
if (clearChatBtn) {
    clearChatBtn.addEventListener('click', () => {
        if (confirm('确定要清除所有聊天记录吗？')) {
            // 清空聊天窗口
            if (chatMessages) {
                chatMessages.innerHTML = '';
            }
            // 清除本地存储
            clearMessagesStorage();
            addMessage('系统', '聊天记录已清除', true);
            
            // 通知服务器清除消息（可选）
            // socket.emit('clear-messages');
        }
    });
}

// Socket连接管理
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

socket.on('connect', () => {
    currentUserId = socket.id;
    reconnectAttempts = 0;
    console.log('Socket连接成功, ID:', socket.id);
    
    // 如果之前已加入，自动重新加入
    if (isJoined && currentUsername) {
        socket.emit('join-room', currentUsername);
        addMessage('系统', '连接已恢复', true);
    }
});

socket.on('disconnect', (reason) => {
    console.log('Socket断开连接:', reason);
    
    if (reason === 'io server disconnect') {
        // 服务器主动断开，需要手动重连
        socket.connect();
    } else {
        // 网络问题，自动重连
        addMessage('系统', '连接断开，正在重连...', false);
    }
});

socket.on('connect_error', (error) => {
    console.error('Socket连接错误:', error);
    reconnectAttempts++;
    
    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
        addMessage('系统', `连接失败，正在重试 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`, false);
    } else {
        addMessage('系统', '连接失败次数过多，请刷新页面', false);
    }
});

socket.on('reconnect', (attemptNumber) => {
    console.log('Socket重连成功，尝试次数:', attemptNumber);
    reconnectAttempts = 0;
    addMessage('系统', '连接已恢复', true);
    
    // 重新加入房间
    if (isJoined && currentUsername) {
        socket.emit('join-room', currentUsername);
    }
});

// 全屏功能
let isFullscreen = false;

if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
        enterFullscreen();
    });
}

if (exitFullscreenBtn) {
    exitFullscreenBtn.addEventListener('click', () => {
        exitFullscreen();
    });
}

function enterFullscreen() {
    if (!remoteVideoWrapper) return;
    
    if (remoteVideoWrapper.requestFullscreen) {
        remoteVideoWrapper.requestFullscreen().then(() => {
            isFullscreen = true;
            updateFullscreenButton();
        }).catch(err => {
            console.log('全屏请求失败:', err);
            // 使用CSS全屏作为备选方案
            remoteVideoWrapper.classList.add('fullscreen');
            isFullscreen = true;
            updateFullscreenButton();
        });
    } else if (remoteVideoWrapper.webkitRequestFullscreen) {
        remoteVideoWrapper.webkitRequestFullscreen();
        isFullscreen = true;
        updateFullscreenButton();
    } else if (remoteVideoWrapper.mozRequestFullScreen) {
        remoteVideoWrapper.mozRequestFullScreen();
        isFullscreen = true;
        updateFullscreenButton();
    } else if (remoteVideoWrapper.msRequestFullscreen) {
        remoteVideoWrapper.msRequestFullscreen();
        isFullscreen = true;
        updateFullscreenButton();
    } else {
        // 使用CSS全屏作为备选方案
        remoteVideoWrapper.classList.add('fullscreen');
        isFullscreen = true;
        updateFullscreenButton();
    }
}

function exitFullscreen() {
    if (!remoteVideoWrapper) return;
    
    if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
            isFullscreen = false;
            updateFullscreenButton();
        }).catch(err => {
            console.log('退出全屏失败:', err);
        });
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
        isFullscreen = false;
        updateFullscreenButton();
    } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
        isFullscreen = false;
        updateFullscreenButton();
    } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
        isFullscreen = false;
        updateFullscreenButton();
    }
    
    remoteVideoWrapper.classList.remove('fullscreen');
    isFullscreen = false;
    updateFullscreenButton();
}

// 更新全屏按钮图标和提示
function updateFullscreenButton() {
    // 只有在有远程视频时才显示按钮
    const hasRemoteVideo = remoteVideo && remoteVideo.srcObject && 
                          remoteVideo.srcObject.getVideoTracks().length > 0;
    
    if (!hasRemoteVideo) {
        // 没有远程视频，隐藏所有按钮
        if (fullscreenBtn) fullscreenBtn.style.display = 'none';
        if (exitFullscreenBtn) exitFullscreenBtn.style.display = 'none';
        return;
    }
    
    if (isFullscreen) {
        // 全屏模式：显示缩小按钮（✕），隐藏放大按钮
        if (fullscreenBtn) {
            fullscreenBtn.style.display = 'none';
        }
        if (exitFullscreenBtn) {
            exitFullscreenBtn.style.display = 'flex';
        }
    } else {
        // 普通模式：显示放大按钮（⛶），隐藏缩小按钮
        if (fullscreenBtn) {
            fullscreenBtn.style.display = 'flex';
        }
        if (exitFullscreenBtn) {
            exitFullscreenBtn.style.display = 'none';
        }
    }
}

// 监听全屏状态变化
document.addEventListener('fullscreenchange', () => {
    isFullscreen = !!document.fullscreenElement;
    if (!document.fullscreenElement) {
        remoteVideoWrapper?.classList.remove('fullscreen');
    }
    updateFullscreenButton();
});

document.addEventListener('webkitfullscreenchange', () => {
    isFullscreen = !!document.webkitFullscreenElement;
    if (!document.webkitFullscreenElement) {
        remoteVideoWrapper?.classList.remove('fullscreen');
    }
    updateFullscreenButton();
});

document.addEventListener('mozfullscreenchange', () => {
    isFullscreen = !!document.mozFullScreenElement;
    if (!document.mozFullScreenElement) {
        remoteVideoWrapper?.classList.remove('fullscreen');
    }
    updateFullscreenButton();
});

document.addEventListener('MSFullscreenChange', () => {
    isFullscreen = !!document.msFullscreenElement;
    if (!document.msFullscreenElement) {
        remoteVideoWrapper?.classList.remove('fullscreen');
    }
    updateFullscreenButton();
});

// 移动端优化：防止页面缩放
document.addEventListener('touchstart', function(event) {
    if (event.touches.length > 1) {
        event.preventDefault();
    }
});

let lastTouchEnd = 0;
document.addEventListener('touchend', function(event) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// 优化按钮状态显示
function updateButtonStates() {
    if (isVideoEnabled) {
        startVideoBtn.classList.add('active');
        stopVideoBtn.classList.add('active');
    } else {
        startVideoBtn.classList.remove('active');
        stopVideoBtn.classList.remove('active');
    }
    
    if (isAudioEnabled) {
        startAudioBtn.classList.add('active');
        stopAudioBtn.classList.add('active');
    } else {
        startAudioBtn.classList.remove('active');
        stopAudioBtn.classList.remove('active');
    }
}

// 发送消息
sendBtn.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const message = messageInput.value.trim();
    if (message && isJoined) {
        socket.emit('chat-message', { message });
        messageInput.value = '';
    }
}

// 消息存储管理（使用localStorage）
const MESSAGES_STORAGE_KEY = 'chat_messages';
const MAX_STORED_MESSAGES = 500;

// 从localStorage加载消息
function loadMessagesFromStorage() {
    try {
        const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('加载本地消息失败:', error);
        return [];
    }
}

// 保存消息到localStorage（仅用于当前会话）
function saveMessageToStorage(message) {
    try {
        let messages = loadMessagesFromStorage();
        messages.push(message);
        // 只保留最近500条消息
        if (messages.length > MAX_STORED_MESSAGES) {
            messages = messages.slice(-MAX_STORED_MESSAGES);
        }
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error('保存本地消息失败:', error);
    }
}

// 注意：不在beforeunload中清除，让服务器决定是否保留历史消息

// 清空本地消息
function clearMessagesStorage() {
    try {
        localStorage.removeItem(MESSAGES_STORAGE_KEY);
    } catch (error) {
        console.error('清空本地消息失败:', error);
    }
}

// 恢复消息（已禁用）
function restoreMessages() {
    // 不再使用此函数，刷新后只显示服务器发送的历史消息
}

// 接收历史消息
socket.on('history-messages', (messages) => {
    // 清空现有消息
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // 刷新后不显示历史消息，只显示新消息
    // 如果用户想要查看历史消息，可以取消下面的注释
    /*
    if (messages && messages.length > 0) {
        messages.forEach(msg => {
            const isOwn = msg.username === currentUsername;
            addMessage(msg.username, msg.message, isOwn, msg.timestamp, false);
        });
    }
    */
    
    // 刷新后聊天记录为空，只显示新加入后的消息
});

// 接收聊天消息
socket.on('chat-message', (data) => {
    const isOwn = data.username === currentUsername;
    addMessage(data.username, data.message, isOwn, data.timestamp);
    // 不保存到本地存储，刷新后会清除
    // 消息由服务器保存，刷新后会从服务器加载
});

// 添加消息到聊天窗口
function addMessage(username, message, isOwn, timestamp = '', scroll = true) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isOwn ? 'message-own' : ''}`;
    
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = `${username} ${timestamp ? `(${timestamp})` : ''}`;
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = message;
    
    messageDiv.appendChild(header);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    if (scroll) {
        // 延迟滚动，确保DOM已更新
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }
}

// 更新用户列表
socket.on('user-list', (users) => {
    usersList.innerHTML = '';
    onlineUsers = users;
    
    // 更新当前用户ID（如果还没设置）
    const currentUser = users.find(u => u.username === currentUsername);
    if (currentUser) {
        currentUserId = currentUser.id;
    }
    
    users.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user.username;
        usersList.appendChild(li);
    });
    
    // 如果已经有其他用户在线且已开启视频，等待接收他们的offer
    console.log('在线用户列表已更新:', users);
});

socket.on('user-joined', (data) => {
    addMessage('系统', `${data.username} 加入了聊天室`, false);
    // 如果已经开启了视频或音频，与新用户建立连接
    if ((isVideoEnabled || isAudioEnabled) && localStream) {
        setTimeout(() => {
            if (!peerConnections.has(data.id)) {
                console.log('与新用户建立连接:', data.id);
                createPeerConnection(data.id, true);
            }
        }, 500);
    }
});

socket.on('user-left', (data) => {
    addMessage('系统', `${data.username} 离开了聊天室`, false);
    // 关闭与该用户的连接
    const pc = peerConnections.get(data.id);
    if (pc) {
        pc.close();
        peerConnections.delete(data.id);
    }
});

// 视频控制
startVideoBtn.addEventListener('click', async () => {
    try {
        // 移动端优化：使用适合移动设备的视频参数
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const constraints = {
            video: isMobile ? {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: 'user'
            } : {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'user'
            },
            audio: isAudioEnabled
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 确保视频元素已加载
        localVideo.srcObject = localStream;
        isVideoEnabled = true;
        
        // 监听视频加载
        localVideo.onloadedmetadata = () => {
            console.log('本地视频元数据加载完成');
            localVideo.play().catch(err => {
                console.error('播放本地视频失败:', err);
            });
        };
        
        startVideoBtn.disabled = true;
        stopVideoBtn.disabled = false;
        updateButtonStates();
        
        console.log('视频已开启，本地流轨道数:', localStream.getTracks().length);
        localStream.getTracks().forEach(track => {
            console.log('轨道:', track.kind, track.id, '状态:', track.readyState);
        });
        
        // 与所有其他用户建立连接（延迟确保流已准备好）
        setTimeout(() => {
            establishConnectionsWithOthers();
        }, 1000);
    } catch (error) {
        console.error('无法获取视频流:', error);
        alert('无法访问摄像头，请检查权限设置');
    }
});

stopVideoBtn.addEventListener('click', () => {
    if (localStream) {
        localStream.getTracks().forEach(track => {
            if (track.kind === 'video') {
                track.stop();
            }
        });
        localVideo.srcObject = null;
        isVideoEnabled = false;
        
        // 关闭所有PeerConnection
        peerConnections.forEach((pc, userId) => {
            pc.close();
            peerConnections.delete(userId);
        });
        remoteVideo.srcObject = null;
        
        startVideoBtn.disabled = false;
        stopVideoBtn.disabled = true;
        updateButtonStates();
    }
});

// 音频控制
startAudioBtn.addEventListener('click', async () => {
    try {
        if (!localStream) {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: isVideoEnabled, 
                audio: true 
            });
            if (isVideoEnabled) {
                localVideo.srcObject = localStream;
            }
        } else {
            const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream.getAudioTracks().forEach(track => {
                localStream.addTrack(track);
                // 将音频轨道添加到所有现有的PeerConnection
                peerConnections.forEach((pc) => {
                    pc.addTrack(track, localStream);
                });
            });
        }
        isAudioEnabled = true;
        
        startAudioBtn.disabled = true;
        stopAudioBtn.disabled = false;
        updateButtonStates();
        
        // 如果还没有连接，建立连接（音频或视频都可以建立连接）
        if (peerConnections.size === 0) {
            establishConnectionsWithOthers();
        }
    } catch (error) {
        console.error('无法获取音频流:', error);
        alert('无法访问麦克风，请检查权限设置');
    }
});

stopAudioBtn.addEventListener('click', () => {
    if (localStream) {
        localStream.getAudioTracks().forEach(track => {
            track.stop();
            localStream.removeTrack(track);
            // 从所有PeerConnection中移除音频轨道
            peerConnections.forEach((pc) => {
                const sender = pc.getSenders().find(s => s.track === track);
                if (sender) {
                    pc.removeTrack(sender);
                }
            });
        });
        isAudioEnabled = false;
        
        startAudioBtn.disabled = false;
        stopAudioBtn.disabled = true;
        updateButtonStates();
    }
});

// 与其他用户建立连接
function establishConnectionsWithOthers() {
    console.log('建立与其他用户的连接，在线用户:', onlineUsers);
    onlineUsers.forEach(user => {
        if (user.id !== currentUserId && !peerConnections.has(user.id)) {
            console.log('创建与用户', user.id, '的连接');
            createPeerConnection(user.id, true);
        }
    });
}

// 创建 PeerConnection
function createPeerConnection(targetUserId, isInitiator = true) {
    // 如果已经存在连接，先关闭
    if (peerConnections.has(targetUserId)) {
        const oldPc = peerConnections.get(targetUserId);
        oldPc.close();
    }
    
    const peerConnection = new RTCPeerConnection(rtcConfiguration);
    peerConnections.set(targetUserId, peerConnection);
    
    // 添加本地流
    if (localStream) {
        localStream.getTracks().forEach(track => {
            if (track.readyState === 'live') {
                peerConnection.addTrack(track, localStream);
            }
        });
    }
    
    // 接收远程流 - 优化处理
    peerConnection.ontrack = (event) => {
        console.log('收到远程流:', event.track.kind, 'from', targetUserId, event.track.id);
        
        // 创建新的媒体流或使用现有流
        if (!remoteVideo.srcObject) {
            remoteVideo.srcObject = new MediaStream();
        }
        
        const remoteStream = remoteVideo.srcObject;
        
        // 添加所有轨道
        event.streams.forEach(stream => {
            stream.getTracks().forEach(track => {
                // 检查是否已存在相同的轨道
                const existingTrack = remoteStream.getTracks().find(t => 
                    t.id === track.id
                );
                
                if (!existingTrack) {
                    remoteStream.addTrack(track);
                    console.log('添加远程轨道:', track.kind, track.id, '状态:', track.readyState);
                    
                    // 监听轨道状态变化
                    track.onended = () => {
                        console.log('远程轨道结束:', track.kind, track.id);
                        remoteStream.removeTrack(track);
                    };
                    
                    track.onmute = () => {
                        console.log('远程轨道静音:', track.kind, track.id);
                    };
                    
                    track.onunmute = () => {
                        console.log('远程轨道取消静音:', track.kind, track.id);
                    };
                }
            });
        });
        
        // 确保视频元素播放
        if (remoteVideo.srcObject.getVideoTracks().length > 0) {
            remoteVideo.play().catch(err => {
                console.error('播放远程视频失败:', err);
            });
            
            // 显示全屏按钮
            updateFullscreenButton();
        }
        
        // 添加视频加载事件
        remoteVideo.onloadedmetadata = () => {
            console.log('远程视频元数据加载完成');
        };
        
        remoteVideo.oncanplay = () => {
            console.log('远程视频可以播放');
        };
    };
    
    // ICE 候选
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', {
                candidate: event.candidate,
                target: targetUserId
            });
        } else {
            console.log('ICE 候选收集完成');
        }
    };
    
    // ICE 连接状态
    peerConnection.oniceconnectionstatechange = () => {
        const state = peerConnection.iceConnectionState;
        console.log(`ICE 连接状态 (${targetUserId}):`, state);
        
        if (state === 'failed') {
            console.log('ICE连接失败，尝试重启ICE');
            peerConnection.restartIce();
        } else if (state === 'disconnected') {
            console.log('ICE连接断开');
        } else if (state === 'connected' || state === 'completed') {
            console.log('ICE连接成功:', state);
        }
    };
    
    // ICE 收集状态
    peerConnection.onicegatheringstatechange = () => {
        console.log(`ICE收集状态 (${targetUserId}):`, peerConnection.iceGatheringState);
    };
    
    // 连接状态变化
    peerConnection.onconnectionstatechange = () => {
        const state = peerConnection.connectionState;
        console.log(`连接状态 (${targetUserId}):`, state);
        
        if (state === 'failed') {
            console.log('连接失败，尝试重新连接');
            // 关闭旧连接
            peerConnection.close();
            peerConnections.delete(targetUserId);
            
            // 如果本地流还存在，尝试重新连接
            if (localStream && (isVideoEnabled || isAudioEnabled)) {
                setTimeout(() => {
                    if (!peerConnections.has(targetUserId)) {
                        console.log('重新建立连接:', targetUserId);
                        createPeerConnection(targetUserId, true);
                    }
                }, 2000);
            }
        } else if (state === 'disconnected') {
            console.log('连接断开');
        } else if (state === 'connected') {
            console.log('连接成功');
        } else if (state === 'closed') {
            console.log('连接已关闭');
            peerConnections.delete(targetUserId);
        }
    };
    
    // 如果是发起方，创建 offer
    if (isInitiator && localStream) {
        // 添加 transceiver 以确保能接收对方的流
        peerConnection.addTransceiver('video', { direction: 'recvonly' });
        peerConnection.addTransceiver('audio', { direction: 'recvonly' });
        
        peerConnection.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true })
            .then(offer => {
                return peerConnection.setLocalDescription(offer);
            })
            .then(() => {
                console.log('发送 offer 给', targetUserId);
                socket.emit('offer', {
                    offer: peerConnection.localDescription,
                    target: targetUserId
                });
            })
            .catch(error => {
                console.error('创建 offer 失败:', error);
            });
    }
    
    return peerConnection;
}

// 处理 offer
socket.on('offer', async (data) => {
    console.log('收到 offer from', data.sender);
    let peerConnection = peerConnections.get(data.sender);
    
    // 创建或获取 PeerConnection（即使没有本地流也能接收远程流）
    if (!peerConnection) {
        // 创建一个新的连接用于接收
        peerConnection = new RTCPeerConnection(rtcConfiguration);
        peerConnections.set(data.sender, peerConnection);
        
        // 设置远程流接收处理
        peerConnection.ontrack = (event) => {
            console.log('收到远程流 (offer处理):', event.track.kind, 'from', data.sender);
            
            if (!remoteVideo.srcObject) {
                remoteVideo.srcObject = new MediaStream();
            }
            
            const remoteStream = remoteVideo.srcObject;
            event.streams.forEach(stream => {
                stream.getTracks().forEach(track => {
                    const existingTrack = remoteStream.getTracks().find(t => t.id === track.id);
                    if (!existingTrack) {
                        remoteStream.addTrack(track);
                        console.log('添加远程轨道:', track.kind, track.id);
                        
                        // 监听轨道状态
                        track.onended = () => {
                            console.log('远程轨道结束:', track.kind);
                            remoteStream.removeTrack(track);
                        };
                    }
                });
            });
            
            // 确保视频播放
            if (remoteStream.getVideoTracks().length > 0) {
                remoteVideo.play().catch(err => {
                    console.error('播放远程视频失败:', err);
                });
                
                // 显示全屏按钮
                updateFullscreenButton();
            }
        };
        
        // ICE 候选处理
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    target: data.sender
                });
            }
        };
        
        // 连接状态监控
        peerConnection.onconnectionstatechange = () => {
            console.log(`连接状态 (${data.sender}):`, peerConnection.connectionState);
        };
        
        // 如果有本地流，添加进去
        if (localStream) {
            localStream.getTracks().forEach(track => {
                if (track.readyState === 'live') {
                    peerConnection.addTrack(track, localStream);
                }
            });
        }
    }
    
    try {
        // 设置远程描述
        await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
        
        // 创建 answer
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log('发送 answer 给', data.sender);
        socket.emit('answer', {
            answer: peerConnection.localDescription,
            target: data.sender
        });
    } catch (error) {
        console.error('处理 offer 失败:', error);
    }
});

// 处理 answer
socket.on('answer', async (data) => {
    console.log('收到 answer from', data.sender);
    const peerConnection = peerConnections.get(data.sender);
    if (peerConnection) {
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
            console.log('成功设置远程描述');
        } catch (error) {
            console.error('处理 answer 失败:', error);
        }
    } else {
        console.error('没有找到对应的 PeerConnection');
    }
});

// 处理 ICE candidate
socket.on('ice-candidate', async (data) => {
    const peerConnection = peerConnections.get(data.sender);
    if (peerConnection && data.candidate) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
            console.log('成功添加 ICE candidate from', data.sender);
        } catch (error) {
            console.error('处理 ICE candidate 失败:', error);
        }
    }
});

// 页面可见性变化时处理
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('页面隐藏');
    } else {
        console.log('页面显示');
        // 页面重新显示时，检查连接状态
        if (remoteVideo.srcObject) {
            remoteVideo.play().catch(err => {
                console.error('恢复播放远程视频失败:', err);
            });
        }
        if (localVideo.srcObject) {
            localVideo.play().catch(err => {
                console.error('恢复播放本地视频失败:', err);
            });
        }
    }
});

// 页面关闭时清理
window.addEventListener('beforeunload', () => {
    // 清理媒体流
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    
    // 清理WebRTC连接
    peerConnections.forEach((pc) => {
        pc.close();
    });
    peerConnections.clear();
    
    // 断开Socket连接
    socket.disconnect();
    
    // 注意：不清除聊天记录，让用户刷新后可以看到服务器保存的历史消息
});

// 定期检查视频流状态
setInterval(() => {
    // 检查本地视频
    if (localVideo.srcObject) {
        const stream = localVideo.srcObject;
        stream.getTracks().forEach(track => {
            if (track.readyState === 'ended') {
                console.warn('本地轨道已结束:', track.kind);
            }
        });
    }
    
    // 检查远程视频
    if (remoteVideo.srcObject) {
        const stream = remoteVideo.srcObject;
        stream.getTracks().forEach(track => {
            if (track.readyState === 'ended') {
                console.warn('远程轨道已结束:', track.kind);
                stream.removeTrack(track);
            }
        });
        
        // 如果远程视频暂停，尝试播放
        if (remoteVideo.paused && stream.getVideoTracks().length > 0) {
            remoteVideo.play().catch(err => {
                console.error('自动恢复播放远程视频失败:', err);
            });
        }
    }
}, 5000); // 每5秒检查一次

