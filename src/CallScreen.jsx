import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from "lucide-react";
import { fileUrl } from "./api";
import "./CallScreen.css";

function CallScreen({
    call,
    peer,
    localStream,
    remoteStream,
    muted,
    camOff,
    onAccept,
    onReject,
    onEnd,
    onToggleMute,
    onToggleCam,
}) {
    const localRef = useRef(null);
    const remoteRef = useRef(null);

    useEffect(() => {
        if (localRef.current) localRef.current.srcObject = localStream;
    }, [localStream, call]);

    useEffect(() => {
        if (remoteRef.current) remoteRef.current.srcObject = remoteStream;
    }, [remoteStream, call]);

    if (!call) return null;

    const isVideo = call.type === "video";
    const incoming = call.state === "incoming";
    const showRemoteVideo = isVideo && call.state === "connected";

    const labels = {
        calling: "Calling...",
        incoming: isVideo ? "Incoming video call" : "Incoming voice call",
        connecting: "Connecting...",
        connected: "Connected",
    };

    return (
        <div className="call-overlay">

            {/* Doosre ki video (audio call mein sirf awaaz chalti hai) */}
            <video
                ref={remoteRef}
                className={`remote-video ${showRemoteVideo ? "" : "hidden"}`}
                autoPlay
                playsInline
            />

            {!showRemoteVideo && (
                <div className="call-info">
                    <div className="call-avatar">
                        {peer.avatar ? (
                            <img src={fileUrl(peer.avatar)} alt={peer.name} />
                        ) : (
                            peer.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <h2>{peer.name}</h2>
                    <p>{labels[call.state]}</p>
                </div>
            )}

            {/* Meri apni video */}
            {isVideo && !incoming && (
                <video
                    ref={localRef}
                    className="local-video"
                    autoPlay
                    playsInline
                    muted
                />
            )}

            <div className="call-controls">
                {incoming ? (
                    <>
                        <button className="call-btn reject" onClick={onReject}>
                            <PhoneOff size={24} />
                        </button>
                        <button className="call-btn accept" onClick={onAccept}>
                            <Phone size={24} />
                        </button>
                    </>
                ) : (
                    <>
                        <button className="call-btn" onClick={onToggleMute}>
                            {muted ? <MicOff size={22} /> : <Mic size={22} />}
                        </button>

                        {isVideo && (
                            <button className="call-btn" onClick={onToggleCam}>
                                {camOff ? (
                                    <VideoOff size={22} />
                                ) : (
                                    <Video size={22} />
                                )}
                            </button>
                        )}

                        <button className="call-btn reject" onClick={onEnd}>
                            <PhoneOff size={24} />
                        </button>
                    </>
                )}
            </div>

        </div>
    );
}

export default CallScreen;