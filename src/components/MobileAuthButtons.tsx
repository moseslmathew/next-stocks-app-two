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
      const { status: createStatus, supportedFirstFactors } = await signIn.create({
        identifier: DEMO_CREDENTIALS.email,
      });

      if (createStatus !== "needs_first_factor") {
         throw new Error(`Unexpected status after create: ${createStatus}`);
      }

      const passwordFactor = supportedFirstFactors?.find((factor: any) => factor.strategy === 'password') as any;

      if (!passwordFactor) {
          throw new Error("Password login is not enabled for this user.");
      }

      const { status, createdSessionId } = await signIn.attemptFirstFactor({
        strategy: 'password',
        password: DEMO_CREDENTIALS.password,
      });

      if (status === "complete") {
        await setActive({ session: createdSessionId });
      } else {
        console.error("SignIn not complete. Status:", status);
        alert(`Guest Login Status: ${status}. Check console for details.`);
      }
    } catch (err: any) {
      console.error("Guest login failed", err);
      const msg = err.errors?.[0]?.message || err.message || "Unknown error";
      const keyPrefix = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 8) || "UNKNOWN";
        
      alert(
        `Guest Login Failed for ${DEMO_CREDENTIALS.email}:\n"${msg}"\n\n` +
        `Potential Cause: Environment Mismatch.\n` +
        `Your app is using Clerk Key starting with: ${keyPrefix}...\n` +
        `Please verify this matches the API Keys in your Clerk Dashboard where the user '${DEMO_CREDENTIALS.email}' resides.`
      );
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
