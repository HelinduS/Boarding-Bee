
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserCardProps {
    username: string;
    email: string;
    phoneNumber?: string;
    address: string;
    role: "ADMIN" | "USER";
    onNotifyClick?: () => void;
    onHistoryClick?: () => void;
}

const UserCard: React.FC<UserCardProps> = ({
                                               username,
                                               email,
                                               phoneNumber,
                                               address,
                                               role,
                                               onNotifyClick,
                                               onHistoryClick,
                                           }) => {
    return (
        <Card className="p-4 shadow-md hover:shadow-lg transition-shadow duration-200 w-full max-w-lg">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* User Details (Left Side) */}
                <div className="flex-1 space-y-3">
                    <div>
                        <p className="text-sm text-gray-500">Username</p>
                        <p className="font-medium text-gray-900">{username}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{email}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium text-gray-900">
                            {phoneNumber || "Not provided"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium text-gray-900">{address}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Role</p>
                        <p className="font-medium text-gray-900">{role}</p>
                    </div>
                    {/* Buttons */}
                    <div className="flex gap-2 mt-2">
                        <Button className="bg-orange-500 text-white hover:bg-orange-600"
                                variant="outline" size="sm" onClick={onNotifyClick}>
                            Notify
                        </Button>
                        <Button className="bg-green-500 text-white hover:bg-green-600"
                            variant="outline" size="sm" onClick={onHistoryClick}>
                            History
                        </Button>
                    </div>
                </div>

                {/* Profile Picture Placeholder (Right Side) */}
                <div className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        <span>No Image</span>
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default UserCard;