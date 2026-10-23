import { useEffect, useRef, useState } from "react";
import { connectSocket } from "./socket";

const RTC_CONFIG = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

// call.state: calling | incoming | connecting | connected
export default function useCall() {
    const [call, setCall] = useState(null);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [muted, setMuted] = useState(false);
    const [camOff, setCamOff] = useState(false);

    const pcRef = useRef(null);
    const localRef = useRef(null);
    const peerRef = useRef(null);
    const incomingRef = useRef(null);
    const pendingIce = useRef([]);
    const busyRef = useRef(false);

    // Sab kuch band karo
    const cleanup = () => {
        pcRef.current?.close();
        pcRef.current = null;

        localRef.current?.getTracks().forEach((t) => t.stop());
        localRef.current = null;

        incomingRef.current = null;
        peerRef.current = null;
        pendingIce.current = [];
        busyRef.current = false;

        setLocalStream(null);
        setRemoteStream(null);
        setMuted(false);
        setCamOff(false);
        setCall(null);
    };

    const createPc = (peerId) => {
        const pc = new RTCPeerConnection(RTC_CONFIG);

        pc.onicecandidate = (e) => {
            if (e.candidate) {
                connectSocket().emit("call:ice", {
                    to: peerId,
                    candidate: e.candidate,
                });
            }
        };

        pc.ontrack = (e) => setRemoteStream(e.streams[0]);

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === "connected") {
                setCall((c) => c && { ...c, state: "connected" });
            }
            if (pc.connectionState === "failed") {
                alert("Call connect nahi ho payi");
                cleanup();
            }
        };

        pcRef.current = pc;
        return pc;
    };

    const getMedia = async (type) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: type === "video",
            });
            localRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch {
            alert("Microphone / camera ki permission do (ya device busy hai)");
            return null;
        }
    };

    // Remote description lagne se pehle aaye ICE candidates yahan jama hote hain
    const flushIce = async (pc) => {
        for (const c of pendingIce.current) {
            try {
                await pc.addIceCandidate(c);
            } catch {
                // ignore
            }
        }
        pendingIce.current = [];
    };

    // ---------- Call karo ----------
    const startCall = async (peerId, type) => {
        if (busyRef.current) return;
        busyRef.current = true;

        const stream = await getMedia(type);
        if (!stream) {
            busyRef.current = false;
            return;
        }

        peerRef.current = peerId;
        setCall({ peerId, type, state: "calling" });

        const pc = createPc(peerId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        connectSocket().emit("call:offer", { to: peerId, offer, type });
    };

    // ---------- Call uthao ----------
    const acceptCall = async () => {
        const inc = incomingRef.current;
        if (!inc) return;

        const stream = await getMedia(inc.type);
        if (!stream) {
            rejectCall();
            return;
        }

        setCall((c) => c && { ...c, state: "connecting" });

        const pc = createPc(inc.from);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        await pc.setRemoteDescription(inc.offer);
        await flushIce(pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        connectSocket().emit("call:answer", { to: inc.from, answer });
    };

    // ---------- Reject / End ----------
    const rejectCall = () => {
        const inc = incomingRef.current;
        if (inc) connectSocket().emit("call:reject", { to: inc.from });
        cleanup();
    };

    const endCall = () => {
        if (peerRef.current) {
            connectSocket().emit("call:end", { to: peerRef.current });
        }
        cleanup();
    };

    const toggleMute = () => {
        const next = !muted;
        localRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next));
        setMuted(next);
    };

    const toggleCam = () => {
        const next = !camOff;
        localRef.current?.getVideoTracks().forEach((t) => (t.enabled = !next));
        setCamOff(next);
    };

    // ---------- Server ke events ----------
    useEffect(() => {
        const socket = connectSocket();

        const onIncoming = ({ from, offer, type }) => {
            if (busyRef.current) {
                socket.emit("call:reject", { to: from }); // pehle se call mein hai
                return;
            }
            busyRef.current = true;
            incomingRef.current = { from, offer, type };
            peerRef.current = from;
            setCall({ peerId: from, type, state: "incoming" });
        };

        const onAnswered = async ({ answer }) => {
            const pc = pcRef.current;
            if (!pc) return;
            await pc.setRemoteDescription(answer);
            await flushIce(pc);
            setCall((c) => c && { ...c, state: "connecting" });
        };

        const onIce = async ({ candidate }) => {
            const pc = pcRef.current;
            if (pc && pc.remoteDescription) {
                try {
                    await pc.addIceCandidate(candidate);
                } catch {
                    // ignore
                }
            } else {
                pendingIce.current.push(candidate);
            }
        };

        const onRejected = () => {
            alert("Call reject kar di gayi");
            cleanup();
        };

        const onEnded = () => cleanup();

        const onUnavailable = () => {
            alert("User abhi offline hai");
            cleanup();
        };

        socket.on("call:incoming", onIncoming);
        socket.on("call:answered", onAnswered);
        socket.on("call:ice", onIce);
        socket.on("call:rejected", onRejected);
        socket.on("call:ended", onEnded);
        socket.on("call:unavailable", onUnavailable);

        return () => {
            socket.off("call:incoming", onIncoming);
            socket.off("call:answered", onAnswered);
            socket.off("call:ice", onIce);
            socket.off("call:rejected", onRejected);
            socket.off("call:ended", onEnded);
            socket.off("call:unavailable", onUnavailable);

            // Chat band ho (logout) to camera/mic bhi band
            pcRef.current?.close();
            localRef.current?.getTracks().forEach((t) => t.stop());
        };
    }, []);

    return {
        call,
        localStream,
        remoteStream,
        muted,
        camOff,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCam,
    };
}