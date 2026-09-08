/**
 * Utility to enforce and manage single-vote-per-page logic across the wedding application.
 * Each guest receives exactly one vote per page (e.g. bachelor party, bachelorette party).
 */

const DEVICE_VOTER_STORAGE_KEY = 'wedding_guest_voter_device_id';

/**
 * Returns a stable unique identifier for the current guest or browser device.
 * Prioritizes the active invitation household ID if unlocked, otherwise
 * uses a persistent browser device UUID in localStorage.
 */
export function getGuestVoterId(householdId?: string | null): string {
  if (householdId && householdId.trim()) {
    return householdId.trim();
  }
  if (typeof window === 'undefined') return 'guest_voter_anonymous';

  try {
    let deviceId = window.localStorage.getItem(DEVICE_VOTER_STORAGE_KEY);
    if (!deviceId) {
      deviceId = `voter_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`;
      window.localStorage.setItem(DEVICE_VOTER_STORAGE_KEY, deviceId);
    }
    return deviceId;
  } catch {
    return 'guest_voter_fallback';
  }
}

/**
 * Key for localStorage vote persistence per page and voter.
 */
function getStorageKey(pageKey: 'bachelor' | 'bachelorette', voterId: string): string {
  return `wedding_voted_${pageKey}_${voterId}`;
}

export interface VotableIdea {
  id: string;
  votes?: number;
  voterIds?: string[];
}

/**
 * Finds which idea (if any) the guest has currently voted for on this page.
 */
export function getVotedIdeaId<T extends VotableIdea>(
  pageKey: 'bachelor' | 'bachelorette',
  ideas: T[],
  voterId: string,
): string | null {
  // 1. Check if voterId is present in any idea's voterIds array
  const ideaWithVoter = ideas.find(idea => Array.isArray(idea.voterIds) && idea.voterIds.includes(voterId));
  if (ideaWithVoter) {
    return ideaWithVoter.id;
  }

  // 2. Check localStorage fallback (e.g. if loaded from seed data without voterIds)
  if (typeof window !== 'undefined') {
    try {
      const storedIdeaId = window.localStorage.getItem(getStorageKey(pageKey, voterId));
      if (storedIdeaId && ideas.some(i => i.id === storedIdeaId)) {
        return storedIdeaId;
      }
    } catch {}
  }

  return null;
}

export interface VoteToggleResult<T> {
  updatedIdeas: T[];
  votedIdeaId: string | null;
  action: 'voted' | 'switched' | 'withdrawn';
  previousIdeaId: string | null;
}

/**
 * Executes a single-vote toggle or switch for the given page:
 * - If guest clicks the idea they already voted for -> withdraws the vote (decrements by 1).
 * - If guest clicks a different idea -> switches vote (removes from old idea, adds to new idea).
 * - If guest has not voted yet -> adds 1 vote to new idea.
 * In all cases, each guest can have AT MOST 1 vote on the entire page.
 */
export function togglePageVote<T extends VotableIdea>(
  pageKey: 'bachelor' | 'bachelorette',
  ideas: T[],
  targetIdeaId: string,
  voterId: string,
): VoteToggleResult<T> {
  const currentVotedId = getVotedIdeaId(pageKey, ideas, voterId);

  // Case A: Withdrawing vote
  if (currentVotedId === targetIdeaId) {
    const updatedIdeas = ideas.map(idea => {
      if (idea.id === targetIdeaId) {
        const remainingVoters = (idea.voterIds || []).filter(id => id !== voterId);
        return {
          ...idea,
          voterIds: remainingVoters,
          votes: Math.max(0, (idea.votes || 1) - 1),
        };
      }
      return idea;
    });

    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(getStorageKey(pageKey, voterId));
      } catch {}
    }

    return {
      updatedIdeas,
      votedIdeaId: null,
      action: 'withdrawn',
      previousIdeaId: currentVotedId,
    };
  }

  // Case B: Switching vote (or voting for the first time)
  const isSwitch = Boolean(currentVotedId && currentVotedId !== targetIdeaId);

  const updatedIdeas = ideas.map(idea => {
    // Remove vote from previous idea if switching
    if (isSwitch && idea.id === currentVotedId) {
      const remainingVoters = (idea.voterIds || []).filter(id => id !== voterId);
      return {
        ...idea,
        voterIds: remainingVoters,
        votes: Math.max(0, (idea.votes || 1) - 1),
      };
    }

    // Add vote to target idea
    if (idea.id === targetIdeaId) {
      const existingVoters = (idea.voterIds || []).filter(id => id !== voterId);
      return {
        ...idea,
        voterIds: [...existingVoters, voterId],
        votes: (idea.votes || 0) + 1,
      };
    }

    return idea;
  });

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(getStorageKey(pageKey, voterId), targetIdeaId);
    } catch {}
  }

  return {
    updatedIdeas,
    votedIdeaId: targetIdeaId,
    action: isSwitch ? 'switched' : 'voted',
    previousIdeaId: currentVotedId,
  };
}
