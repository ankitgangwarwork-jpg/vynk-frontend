import { useState, useRef, useEffect } from "react";
import {
    Phone,
    Video,
    Settings,
    Camera,
    Trash2,
    LogOut,
    X,
} from "lucide-react";

import { api, fileUrl } from "../api";
import { connectSocket } from "../socket";
import useCall from "../useCall";
import CallScreen from "../CallScreen";
import "./Chat.css";

function Chat({ user, onLogout }) {
    const fileInputRef = useRef(null);

    const [profilePhoto, setProfilePhoto] = useState(
        user.avatar ? fileUrl(user.avatar) : null
    );
    const [profileName, setProfileName] = useState(user.name);

    const [showSettings, setShowSettings] = useState(false);
    const [newName, setNewName] = useState(profileName);

    const [selectedUser, setSelectedUser] = useState(null);

    const [message, setMessage] = useState("");

    const [chats, setChats] = useState({}); // userId -> messages
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState("");
    const [onlineIds, setOnlineIds] = useState([]);
    const selectedRef = useRef(null);
    const callApi = useCall();

    // Browser mein saved user ko update rakhta hai
    const saveLocalUser = (changes) => {
        try {
            const saved = JSON.parse(localStorage.getItem("user") || "{}");
            localStorage.setItem(
                "user",
                JSON.stringify({ ...saved, ...changes })
            );
        } catch {
            // ignore
        }
    };

    // Latest profile backend se
    useEffect(() => {
        api.me()
            .then((me) => {
                setProfileName(me.name);
                setProfilePhoto(me.avatar ? fileUrl(me.avatar) : null);
                saveLocalUser(me);
            })
            .catch(() => { });
    }, []);

    // Backend ka message -> screen wala format
    const toUi = (m) => ({
        _id: m._id,
        text: m.text,
        type: m.sender === user._id ? "sent" : "received",
        time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        }),
        status: m.status,
    });

    const statusOf = (u) =>
        onlineIds.includes(u._id) ? "Online" : "Offline";

    useEffect(() => {
        selectedRef.current = selectedUser;
    }, [selectedUser]);

    // Users list (search ke saath)
    useEffect(() => {
        const t = setTimeout(() => {
            api.users(search).then(setUsers).catch(() => { });
        }, 300);
        return () => clearTimeout(t);
    }, [search]);

    // Live socket events
    useEffect(() => {
        const socket = connectSocket();

        const onOnline = (ids) => setOnlineIds(ids);

        const onNew = (m) => {
            const otherId = m.sender === user._id ? m.receiver : m.sender;

            setChats((prev) => ({
                ...prev,
                [otherId]: [...(prev[otherId] || []), toUi(m)],
            }));

            // Jiski chat khuli hai uska message aaya to seen mark karo
            if (
                m.sender !== user._id &&
                selectedRef.current?._id === m.sender
            ) {
                socket.emit("message:seen", { from: m.sender });
            }
        };

        const onStatus = ({ by, status }) => {
            setChats((prev) => ({
                ...prev,
                [by]: (prev[by] || []).map((msg) =>
                    msg.type === "sent" &&
                        (status === "seen" || msg.status === "sent")
                        ? { ...msg, status }
                        : msg
                ),
            }));
        };

        socket.on("users:online", onOnline);
        socket.on("message:new", onNew);
        socket.on("message:status", onStatus);

        return () => {
            socket.off("users:online", onOnline);
            socket.off("message:new", onNew);
            socket.off("message:status", onStatus);
        };
    }, [user._id]);

    const handleProfilePhoto = async (e) => {
        const file = e.target.files[0];
        e.target.value = ""; // same photo dobara chunne ke liye

        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            alert("Please select an image");
            return;
        }

        try {
            const { avatar } = await api.uploadAvatar(file);
            setProfilePhoto(fileUrl(avatar));
            saveLocalUser({ avatar });
        } catch (err) {
            alert(err.message);
        }
    };

    const removeProfilePhoto = async () => {
        try {
            await api.removeAvatar();
            setProfilePhoto(null);
            saveLocalUser({ avatar: "" });
        } catch (err) {
            alert(err.message);
        }
    };

    const saveProfileName = async () => {
        const name = newName.trim();

        if (name === "") {
            alert("Name cannot be empty");
            return;
        }

        try {
            const updated = await api.updateName(name);
            setProfileName(updated.name);
            saveLocalUser({ name: updated.name });
            setShowSettings(false);
        } catch (err) {
            alert(err.message);
        }
    };

    const sendMessage = () => {
        if (!selectedUser || message.trim() === "") {
            return;
        }

        const to = selectedUser._id;

        connectSocket().emit("message:send", { to, text: message }, (res) => {
            if (!res?.ok) {
                alert(res?.error || "Message failed");
                return;
            }

            setChats((prev) => ({
                ...prev,
                [to]: [...(prev[to] || []), toUi(res.message)],
            }));
        });

        setMessage("");
    };

    const selectUser = async (u) => {
        setSelectedUser(u);

        try {
            const history = await api.messages(u._id);

            setChats((prev) => ({ ...prev, [u._id]: history.map(toUi) }));
            connectSocket().emit("message:seen", { from: u._id });
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <>
            <div className="chat-app">

                {/* Sidebar */}
                <div className="chat-sidebar">

                    <div className="sidebar-header">
                        <h2>ChatApp</h2>
                    </div>

                    {/* Profile */}
                    <div className="profile-section">

                        <div
                            className="profile-avatar"
                            onClick={() => fileInputRef.current.click()}
                        >
                            {profilePhoto ? (
                                <img
                                    src={profilePhoto}
                                    alt="Profile"
                                />
                            ) : (
                                profileName.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="profile-info">
                            <h3>{profileName}</h3>
                            <p>My Profile</p>
                        </div>

                        <button
                            className="settings-button"
                            onClick={() => {
                                setNewName(profileName);
                                setShowSettings(true);
                            }}
                            title="Profile Settings"
                        >
                            <Settings size={19} />
                        </button>

                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleProfilePhoto}
                    />

                    {/* Search */}
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search users..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    {/* Users */}
                    <div className="user-list">

                        {users.map((u) => (
                            <div
                                key={u._id}
                                className={`user ${selectedUser?._id === u._id
                                    ? "active-user"
                                    : ""
                                    }`}
                                onClick={() => selectUser(u)}
                            >
                                <div className="user-avatar">
                                    {u.avatar ? (
                                        <img
                                            src={fileUrl(u.avatar)}
                                            alt={u.name}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                borderRadius: "50%",
                                                objectFit: "cover",
                                            }}
                                        />
                                    ) : (
                                        u.name.charAt(0).toUpperCase()
                                    )}
                                </div>

                                <div className="user-info">
                                    <h4>{u.name}</h4>

                                    <p
                                        style={{
                                            color: onlineIds.includes(u._id)
                                                ? "#22c55e"
                                                : "#888",
                                        }}
                                    >
                                        {statusOf(u)}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>

                </div>

                {/* Chat Area */}
                <div className="chat-area">

                    {/* Header */}
                    <div className="chat-header">

                        <div>
                            <h3>{selectedUser?.name || "Select a chat"}</h3>

                            {selectedUser && (
                                <span
                                    style={{
                                        color: onlineIds.includes(selectedUser._id)
                                            ? "#22c55e"
                                            : "#888",
                                    }}
                                >
                                    ● {statusOf(selectedUser)}
                                </span>
                            )}
                        </div>

                        <div className="call-buttons">

                            <button
                                title="Voice Call"
                                onClick={() =>
                                    selectedUser &&
                                    callApi.startCall(selectedUser._id, "audio")
                                }
                            ></button>

                            <button
                                title="Video Call"
                                onClick={() =>
                                    selectedUser &&
                                    callApi.startCall(selectedUser._id, "video")
                                }
                            ></button>

                        </div>

                    </div>

                    {/* Messages */}
                    <div className="messages">

                        {(chats[selectedUser?._id] || []).map(
                            (msg, index) => (
                                <div
                                    key={msg._id || index}
                                    className={`message ${msg.type}`}
                                >

                                    <div className="message-text">
                                        {msg.text}
                                    </div>

                                    <div className="message-meta">

                                        <span className="message-time">
                                            {msg.time}
                                        </span>

                                        {msg.type === "sent" && (
                                            <span
                                                className={`message-status ${msg.status}`}
                                            >
                                                {msg.status === "sent" && "✓"}

                                                {msg.status === "delivered" && "✓✓"}

                                                {msg.status === "seen" && "✓✓"}
                                            </span>
                                        )}

                                    </div>

                                </div>
                            )
                        )}

                    </div>

                    {/* Message Input */}
                    <div className="message-box">

                        <input
                            type="text"
                            placeholder={`Message ${selectedUser?.name || ""}...`}
                            value={message}
                            onChange={(e) =>
                                setMessage(e.target.value)
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    sendMessage();
                                }
                            }}
                        />

                        <button onClick={sendMessage}>
                            ➤
                        </button>

                    </div>

                </div>

                {/* Profile Settings Modal */}
                {showSettings && (
                    <div className="settings-overlay">

                        <div className="settings-modal">

                            <div className="settings-header">
                                <h2>Profile Settings</h2>

                                <button
                                    onClick={() => setShowSettings(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Profile Image */}
                            <div className="settings-photo-section">

                                <div className="settings-avatar">

                                    {profilePhoto ? (
                                        <img
                                            src={profilePhoto}
                                            alt="Profile"
                                        />
                                    ) : (
                                        profileName
                                            .charAt(0)
                                            .toUpperCase()
                                    )}

                                </div>

                                <div className="photo-actions">

                                    <button
                                        onClick={() =>
                                            fileInputRef.current.click()
                                        }
                                    >
                                        <Camera size={17} />
                                        Change Photo
                                    </button>

                                    {profilePhoto && (
                                        <button
                                            className="remove-photo"
                                            onClick={removeProfilePhoto}
                                        >
                                            <Trash2 size={17} />
                                            Remove Photo
                                        </button>
                                    )}

                                </div>

                            </div>

                            {/* Name */}
                            <label>Display Name</label>

                            <input
                                type="text"
                                value={newName}
                                onChange={(e) =>
                                    setNewName(e.target.value)
                                }
                                placeholder="Enter your name"
                            />

                            <button
                                className="save-profile-button"
                                onClick={saveProfileName}
                            >
                                Save Changes
                            </button>

                            {/* Logout */}
                            <button
                                className="logout-button"
                                onClick={onLogout}
                            >
                                <LogOut size={18} />
                                Logout
                            </button>

                        </div>

                    </div>
                )}

            </div>
            <CallScreen
                call={callApi.call}
                peer={
                    users.find((u) => u._id === callApi.call?.peerId) || {
                        name: "User",
                    }
                }
                localStream={callApi.localStream}
                remoteStream={callApi.remoteStream}
                muted={callApi.muted}
                camOff={callApi.camOff}
                onAccept={callApi.acceptCall}
                onReject={callApi.rejectCall}
                onEnd={callApi.endCall}
                onToggleMute={callApi.toggleMute}
                onToggleCam={callApi.toggleCam}
            />
        </>
    );
}

export default Chat;