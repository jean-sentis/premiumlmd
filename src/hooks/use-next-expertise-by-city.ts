import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDemoNow } from "@/lib/site-config";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export interface NextExpertise {
  id: string;
  city: string;
  title: string;
  date: Date;
  formattedDate: string;
  startTime: string | null;
  endTime: string | null;
  description: string | null;
}

const CITY_MAPPINGS: Record<string, string[]> = {
  "Sartène": ["Sartène", "Sartene"],
  "Propriano": ["Propriano"],
  "Bonifacio": ["Bonifacio"],
  "Lévie": ["Lévie", "Levie"],
  "Porto-Vecchio": ["Porto-Vecchio", "Porto Vecchio"],
};

export function useNextExpertiseByCity(cities: string[]) {
  const demoNow = getDemoNow();
  const todayStr = format(demoNow, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["next-expertise-by-city", todayStr, cities],
    queryFn: async () => {
      // Fetch all upcoming special_expertise events
      const { data, error } = await supabase
        .from("svv_events")
        .select("id, title, start_date, start_time, end_time, location, description")
        .eq("is_active", true)
        .eq("event_type", "special_expertise")
        .gte("start_date", todayStr)
        .order("start_date", { ascending: true });

      if (error) throw error;

      // Map each city to its next expertise
      const expertiseByCity: Record<string, NextExpertise | null> = {};

      for (const city of cities) {
        const variants = CITY_MAPPINGS[city] || [city];
        
        // Find the first event matching this city
        const event = data?.find((e) => 
          e.location && variants.some(v => 
            e.location.toLowerCase().includes(v.toLowerCase())
          )
        );

        if (event) {
          const date = new Date(event.start_date);
          expertiseByCity[city] = {
            id: event.id,
            city,
            title: event.title,
            date,
            formattedDate: format(date, "d MMMM", { locale: fr }),
            startTime: event.start_time,
            endTime: event.end_time,
            description: event.description,
          };
        } else {
          expertiseByCity[city] = null;
        }
      }

      return expertiseByCity;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
