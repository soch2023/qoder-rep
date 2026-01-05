import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertUserSettings } from "@shared/routes";

// Generate a random session ID if one doesn't exist to persist settings per browser session
const getSessionId = () => {
  let sid = localStorage.getItem("chess_session_id");
  if (!sid) {
    sid = Math.random().toString(36).substring(2, 15);
    localStorage.setItem("chess_session_id", sid);
  }
  return sid;
};

const SESSION_ID = getSessionId();

export function useSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [api.settings.get.path, SESSION_ID],
    queryFn: async () => {
      // In a real app we'd fetch from API. 
      // For now, if 404, we return defaults.
      try {
        const url = api.settings.get.path.replace(":sessionId", SESSION_ID);
        const res = await fetch(url);
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn("Failed to fetch settings", e);
      }
      
      // Default settings
      return {
        preferences: {
          gameMode: 'local',
          aiDifficulty: 1,
          boardOrientation: 'white',
          whiteAIDifficulty: 1,
          blackAIDifficulty: 2,
          playerColor: 'w',
        }
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const payload = {
        sessionId: SESSION_ID,
        preferences: newSettings,
      };
      
      const res = await fetch(api.settings.save.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) throw new Error("Failed to save settings");
      return res.json();
    },
    onSuccess: (data) => {
      // Optimistically update the cache
      queryClient.setQueryData([api.settings.get.path, SESSION_ID], {
        preferences: data.preferences
      });
    },
  });

  return {
    settings: query.data?.preferences || {
      gameMode: 'local',
      aiDifficulty: 1,
      boardOrientation: 'white',
      whiteAIDifficulty: 1,
      blackAIDifficulty: 2,
      playerColor: 'w',
    },
    isLoading: query.isLoading,
    updateSettings: mutation.mutate,
  };
}
