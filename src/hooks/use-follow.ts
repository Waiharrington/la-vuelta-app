"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useFollow(userId: string | undefined, currentUserId: string | undefined) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (!userId) return;

    const fetchFollowData = async () => {
      const { data: followers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", userId);

      const { data: following } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      setFollowerCount(followers?.length || 0);
      setFollowingCount(following?.length || 0);

      if (currentUserId) {
        setIsFollowing(followers?.some((f) => f.follower_id === currentUserId) || false);
      }
    };

    fetchFollowData();
  }, [userId, currentUserId, supabase]);

  const toggleFollow = useCallback(async () => {
    if (!currentUserId || !userId || loading) return;

    setLoading(true);
    const wasFollowing = isFollowing;

    setIsFollowing(!wasFollowing);
    setFollowerCount((c) => (wasFollowing ? c - 1 : c + 1));

    if (wasFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", userId);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: userId,
      });
    }

    setLoading(false);
  }, [currentUserId, userId, isFollowing, loading, supabase]);

  return { isFollowing, followerCount, followingCount, toggleFollow, loading };
}
