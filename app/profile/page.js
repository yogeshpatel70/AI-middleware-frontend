import React from "react";

export default function ProfilePage() {
  // Dummy data
  const user = {
    name: "John Doe",
    email: "john.doe@example.com",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "Frontend developer with a taste for clean UI and elegant code. Loves React, coffee, and a good playlist while coding.",
    location: "Bangalore, India"
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white shadow-md rounded-lg max-w-sm w-full p-6 flex flex-col items-center">
        <img
          src={user.avatar}
          alt="User Avatar"
          className="w-24 h-24 rounded-full mb-4 border-4 border-blue-200"
        />
        <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
        <p className="text-gray-500 mb-2">{user.email}</p>
        <p className="text-sm text-gray-700 mb-4 text-center">{user.bio}</p>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">{user.location}</span>
      </div>
    </main>
  );
}
