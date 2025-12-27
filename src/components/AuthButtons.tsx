'use client';

import React, { useEffect, useState } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton, useSignIn } from '@clerk/nextjs';
import { useSearchParams } from 'next/navigation';
import { Loader2, UserCircle } from 'lucide-react';
import { DEMO_CREDENTIALS } from '@/lib/demo';

const AuthButtons = () => {
  const { signIn, setActive, isLoaded } = useSignIn();
  const searchParams = useSearchParams();
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
    } catch (err) {
      console.error("Guest login failed", err);
      // Optional: Add toast error here
    } finally {
      setIsLoadingGuest(false);
    }
  };

  // Auto-login if ?guest=true is present
  useEffect(() => {
      const isGuestMode = searchParams?.get('guest') === 'true';
      if (isGuestMode && isLoaded && !isLoadingGuest) {
          handleGuestLogin();
      }
  }, [searchParams, isLoaded]);

  return (
    <>
        <SignedOut>
            <button 
                onClick={handleGuestLogin}
                disabled={isLoadingGuest}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-900/10 text-violet-600 dark:text-violet-300 text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/20 transition-all border border-violet-100 dark:border-violet-800"
            >
                {isLoadingGuest ? <Loader2 size={16} className="animate-spin" /> : <UserCircle size={16} />}
                Guest Mode
            </button>

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
