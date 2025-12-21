'use client';

import React from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const AuthButtons = () => {
  return (
    <>
        <SignedOut>
            <SignInButton mode="modal">
            <button className="px-5 py-2 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30 transform hover:-translate-y-0.5">
                Sign In
            </button>
            </SignInButton>
        </SignedOut>
        <SignedIn>
            <UserButton afterSignOutUrl="/" 
            appearance={{
                elements: {
                    avatarBox: "w-9 h-9 border-2 border-white dark:border-gray-800 shadow-sm"
                }
            }}
            />
        </SignedIn>
    </>
  );
};

export default AuthButtons;
