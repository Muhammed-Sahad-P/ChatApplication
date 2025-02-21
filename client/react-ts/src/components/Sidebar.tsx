import { useEffect, useState } from "react";
import '../styles/sidebar.scss'
import axiosInstance from "../utils/axiosInstance";

interface User {
    _id: string;
    username: string;
}

const Sidebar = ({ selectUser }: { selectUser: (id: string) => void }) => {
    const [users, setUsers] = useState<User[]>([]);

    useEffect(() => {
        axiosInstance.get("/auth/users").then((res) => {
            setUsers(res.data);
        });
    }, []);

    return (
        <div className="sidebar">
            <h2>Users</h2>
            <ul>
                {users.map((user) => (
                    <li key={user._id} onClick={() => selectUser(user._id)}>
                        {user.username}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Sidebar;
