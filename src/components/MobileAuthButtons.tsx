'use client';

import React from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const MobileAuthButtons = () => {
  return (
    <div className="flex items-center">
        <SignedIn>
            <UserButton afterSignOutUrl="/" 
            appearance={{
                elements: {
                    avatarBox: "w-8 h-8 border-2 border-white dark:border-gray-800 shadow-sm"
                }
            }}
            />
        </SignedIn>
        <SignedOut>
            <SignInButton mode="modal">
            <button className="px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium">
                Sign In
            </button>
            </SignInButton>
        </SignedOut>
    </div>
  );
};

export default MobileAuthButtons;
