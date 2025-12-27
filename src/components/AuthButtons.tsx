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
      // 0. Ensure no existing flow interferes (optional but safe)
      // 1. Start the sign-in process with just the email (trimmed)
      const { status: createStatus, supportedFirstFactors } = await signIn.create({
        identifier: DEMO_CREDENTIALS.email.trim(),
      });

      if (createStatus !== "needs_first_factor") {
         throw new Error(`Unexpected status after create: ${createStatus}`);
      }

      const passwordFactor = supportedFirstFactors?.find((factor: any) => factor.strategy === 'password') as any;

      if (!passwordFactor) {
          throw new Error("Password login is not enabled for this user. Please enable 'Password' in Clerk Dashboard > User & Authentication.");
      }

      const { status, createdSessionId } = await signIn.attemptFirstFactor({
        strategy: 'password',
        password: DEMO_CREDENTIALS.password.trim(),
      });

      if (status === "complete") {
        await setActive({ session: createdSessionId });
      } else {
        console.error("SignIn not complete. Status:", status);
        alert(`Guest Login Status: ${status}. Check console for details.`);
      }
    } catch (err: any) {
      console.error("Guest login failed", err);
      // Clerk errors are often in err.errors array
      const error = err.errors?.[0];
      const code = error?.code || "UNKNOWN_CODE";
      const msg = error?.message || err.message || "Unknown error";
      const keyPrefix = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 8) || "UNKNOWN";
      
      alert(
        `Guest Login Failed!\n` +
        `Error Code: ${code}\n` +
        `Message: "${msg}"\n\n` +
        `Debug Info:\n` +
        `- Email Attempted: '${DEMO_CREDENTIALS.email.trim()}'\n` +
        `- API Key Prefix: ${keyPrefix}...\n\n` +
        `If the code is 'form_identifier_not_found', the user definitely does not exist in the Clerk instance linked to this API Key.`
      );
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
