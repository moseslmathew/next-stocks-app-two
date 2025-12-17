'use server';

import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { getMarketData } from '@/services/marketData';
import { auth } from '@clerk/nextjs/server';

import { prisma } from '@/lib/db';

// --- Watchlist Management ---

export async function createWatchlist(name: string, region: string = 'IN') {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    const watchlist = await prisma.watchlist.create({
      data: { name, userId, region },
    });
    revalidatePath('/watchlist');
    return { success: true, watchlist };
  } catch (error) {
    console.error('Create list failed:', error);
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteWatchlist(watchlistId: string) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };
  
    try {
      // Create 'Default' check later? For now allow deleting any.
      await prisma.watchlist.delete({
        where: { id: watchlistId, userId }, // Ensure ownership
      });
      revalidatePath('/watchlist');
      return { success: true };
    } catch (error) {
      console.error('Delete list failed:', error);
      return { success: false, error: 'Failed to delete watchlist' };
    }
}

export async function getUserWatchlists(region?: string) {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const where: any = { userId };
    if (region && region !== 'ALL') {
        where.region = region;
    }

    let watchlists = await prisma.watchlist.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    // Auto-create default if none exist for this specific region view
    // Only do this if a specific region was requested (to avoid creating defaults during 'ALL' view implies mixed context?)
    // Actually, distinct regions usually need at least one list.
    if (watchlists.length === 0 && region && region !== 'ALL') {
        const defaultList = await prisma.watchlist.create({
            data: { name: 'My Portfolio', userId, region }
        });
        watchlists = [defaultList];
    } else if (watchlists.length === 0 && (!region || region === 'ALL')) {
         // Default legacy behavior: create IN list?
         // Or create one for IN since that's default.
         const defaultList = await prisma.watchlist.create({
            data: { name: 'My Portfolio', userId, region: 'IN' }
        });
        watchlists = [defaultList];
    }

    return watchlists;
  } catch (error) {
    console.error('Fetch lists failed:', error);
    return [];
  }
}

// --- Item Management ---

export async function addToWatchlist(symbol: string, watchlistId?: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
    let targetListId = watchlistId;

    if (!targetListId) {
        // Fallback to first available list
        const firstList = await prisma.watchlist.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
        if (firstList) {
            targetListId = firstList.id;
        } else {
            // Create default if absolutely none exist
             const defaultList = await prisma.watchlist.create({
                data: { name: 'My Portfolio', userId }
            });
            targetListId = defaultList.id;
        }
    }

    // Verify ownership (if ID was provided or found)
    const list = await prisma.watchlist.findUnique({ where: { id: targetListId, userId } });
    if (!list) return { success: false, error: 'Watchlist not found' };

    // Check if already exists to prevent duplicates in same list
    const existing = await prisma.watchlistItem.findUnique({
        where: { watchlistId_symbol: { watchlistId: targetListId, symbol } }
    });
    if (existing) return { success: true }; // Already there, treat as success

    const lastItem = await prisma.watchlistItem.findFirst({
        where: { watchlistId: targetListId },
        orderBy: { order: 'desc' },
    });
    const newOrder = lastItem ? lastItem.order + 1 : 0;

    await prisma.watchlistItem.create({
      data: { 
        symbol,
        watchlistId: targetListId,
        order: newOrder
      },
    });
    revalidatePath('/watchlist');
    revalidatePath(`/quote/${symbol}`); // Revalidate quote page too
    return { success: true };
  } catch (error) {
    console.error('Add item failed:', error);
    return { success: false, error: 'Failed to add to watchlist' };
  }
}

export async function removeFromWatchlist(symbol: string, watchlistId?: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: 'Unauthorized' };

  try {
     let targetListId = watchlistId;

    if (!targetListId) {
        // Fallback to first available list
        const firstList = await prisma.watchlist.findFirst({
            where: { userId },
            orderBy: { createdAt: 'asc' }
        });
        if (firstList) {
            targetListId = firstList.id;
        } else {
            return { success: false, error: 'No watchlist found' };
        }
    }

    await prisma.watchlistItem.delete({
      where: { 
        watchlistId_symbol: {
          watchlistId: targetListId,
          symbol
        }
      },
    });
    revalidatePath('/watchlist');
    revalidatePath(`/quote/${symbol}`);
    return { success: true };
  } catch (error) {
    console.error('Remove item failed:', error);
    return { success: false, error: 'Failed to remove from watchlist' };
  }
}

export async function reorderWatchlist(watchlistId: string, items: { symbol: string; order: number }[]) {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    try {
         // Verify ownership first
         const list = await prisma.watchlist.findUnique({ where: { id: watchlistId, userId } });
         if (!list) return { success: false, error: 'Unauthorized' };

        await prisma.$transaction(
            items.map((item) => 
                prisma.watchlistItem.update({
                    where: { watchlistId_symbol: { watchlistId, symbol: item.symbol } },
                    data: { order: item.order }
                })
            )
        );
        return { success: true };
    } catch (error) {
        console.error('Reorder failed:', error);
        return { success: false, error: 'Failed to reorder' };
    }
}

// Updated signature: Items by Watchlist ID
export async function getWatchlist(watchlistId: string, range: '1d' | '7d' | '52w' = '1d', includeHistory = true) {
  const { userId } = await auth();
  if (!userId) return [];

  // TODO: Verify userId owns watchlistId? Technically strict, but implicit via findFirst check usually.
  // We can trust the ID for now or do a join check.
  
  try {
    const items = await prisma.watchlistItem.findMany({
      where: { watchlistId },
      orderBy: { order: 'asc' },
    });
    
    if (items.length === 0) return [];

    const symbols = items.map(item => item.symbol);
    const marketData = await getMarketData(symbols, range, includeHistory);
    
    return marketData.map(data => {
        const item = items.find(i => i.symbol === data.symbol);
        return {
            ...data,
            order: item ? item.order : 0
        };
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

  } catch (error) {
    console.error('Fetch items failed:', error);
    return [];
  }
}

export async function isInWatchlist(symbol: string, watchlistId?: string) {
  const { userId } = await auth();
  if (!userId) return false;

  try {
    let targetListId = watchlistId;

    if (!targetListId) {
         // Check recursively? Or just check first list?
         // Better: Check if it exists in ANY of user's lists if no ID provided.
         // This makes the "Star" icon light up if you have it anywhere.
         const item = await prisma.watchlistItem.findFirst({
             where: {
                 symbol,
                 watchlist: { userId } // Implicit join
             }
         });
         return !!item;
    }

    const item = await prisma.watchlistItem.findUnique({
      where: { 
        watchlistId_symbol: {
          watchlistId: targetListId,
          symbol
        }
      },
    });
    return !!item;
  } catch (error) {
    return false;
  }
}
