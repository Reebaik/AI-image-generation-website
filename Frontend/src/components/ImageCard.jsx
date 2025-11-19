import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";

const ImageCard = ({ image, onLike, onDelete, isAdmin }) => {
    const { user } = useSelector((state) => state.auth);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(image.likes.count);
    const [showFullPrompt, setShowFullPrompt] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [creator, setCreator] = useState(null);

    useEffect(() => {
        const fetchCreator = async () => {
            try {
                const response = await fetch(
                    `http://localhost:5000/api/users/${image.userId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("token")}`,
                        },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    setCreator(data);
                }
            } catch (error) {
                console.error("Error fetching creator:", error);
            }
        };

        if (!image.creatorDeleted) {
            fetchCreator();
        }
    }, [image.userId, image.creatorDeleted]);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative">
                <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-64 object-cover"
                />
                <div className="absolute top-2 right-2">
                    <button
                        onClick={handleLike}
                        className={`p-2 rounded-full ${
                            isLiked
                                ? "bg-red-500 text-white"
                                : "bg-white text-gray-600"
                        }`}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </button>
                </div>
            </div>
            <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-600 text-sm">
                                {image.creatorDeleted
                                    ? "FU"
                                    : creator?.username?.charAt(0).toUpperCase() || "U"}
                            </span>
                        </div>
                        <span className="ml-2 text-sm text-gray-600">
                            {image.creatorDeleted
                                ? "Former User"
                                : creator?.username || "Unknown User"}
                        </span>
                    </div>
                    <span className="text-sm text-gray-500">
                        {new Date(image.createdAt).toLocaleDateString()}
                    </span>
                </div>
                <p className="text-gray-800 mb-2">
                    {showFullPrompt
                        ? image.prompt
                        : `${image.prompt.substring(0, 100)}${
                              image.prompt.length > 100 ? "..." : ""
                          }`}
                </p>
                {image.prompt.length > 100 && (
                    <button
                        onClick={() => setShowFullPrompt(!showFullPrompt)}
                        className="text-blue-500 text-sm"
                    >
                        {showFullPrompt ? "Show less" : "Show more"}
                    </button>
                )}
                <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                        <span className="text-gray-600 text-sm">
                            {likesCount} likes
                        </span>
                    </div>
                    {isAdmin && (
                        <button
                            onClick={() => onDelete(image._id)}
                            className="text-red-500 text-sm"
                        >
                            Delete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageCard; 