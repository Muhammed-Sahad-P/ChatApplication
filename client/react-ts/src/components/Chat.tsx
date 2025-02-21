import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axiosInstance from "../utils/axiosInstance";
import '../styles/chat.scss';

const socket = io("http://localhost:5000");

const Chat = () => {
    const [messages, setMessages] = useState<{ sender: string; content: string }[]>([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        socket.on("new-message", (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });

        return () => {
            socket.off("new-message");
        };
    }, []);

    const sendMessage = async () => {
        if (message.trim() === "") return;
        const { data } = await axiosInstance.post("/messages/send", { receiver: "user_id_here", content: message });
        socket.emit("new-message", data.data);
        setMessage("");
    };

    return (
        <div className="chat-container">
            <div className="messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.sender === "you" ? "sent" : "received"}`}>
                        {msg.content}
                    </div>
                ))}
            </div>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Chat;
