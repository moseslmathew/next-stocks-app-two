'use client';

import React, { useState } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton, useSignIn } from '@clerk/nextjs';
import { Loader2, UserCircle } from 'lucide-react';
import { DEMO_CREDENTIALS } from '@/lib/demo';

const MobileAuthButtons = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const [isLoadingGuest, setIsLoadingGuest] = useState(false);

  const handleGuestLogin = async () => {
    if (!isLoaded) return;
    
    setIsLoadingGuest(true);
    try {
      const result = await signIn.create({
        identifier: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password,
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
      } else {
        console.error("SignIn not complete", result);
      }
    } catch (err: any) {
      console.error("Guest login failed", err);
      const msg = err.errors?.[0]?.message || err.message || "Unknown error";
      alert(`Guest Login Failed: ${msg}\n\nPlease ensure your demo credentials in src/lib/demo.ts are correct and the user exists in your Clerk dashboard.`);
    } finally {
      setIsLoadingGuest(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
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
            <button 
                onClick={handleGuestLogin}
                disabled={isLoadingGuest}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-300 text-xs font-medium border border-violet-100 dark:border-violet-800"
            >
                {isLoadingGuest ? <Loader2 size={14} className="animate-spin" /> : <UserCircle size={14} />}
                Guest
            </button>
            <SignInButton mode="modal">
            <button className="px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs font-medium">
                Sign In
            </button>
            </SignInButton>
        </SignedOut>
    </div>
  );
};

export default MobileAuthButtons;
