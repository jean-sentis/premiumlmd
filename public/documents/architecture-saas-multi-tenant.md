# Architecture SaaS Multi-Tenant - Maisons de Ventes

## Vue d'ensemble

Architecture permettant de déployer jusqu'à **200 sites enfants** à partir d'une **codebase unique**, avec fonctionnalités et direction artistique modulables par client.

---

## Schéma d'architecture

```
┌────────────────────────────────────────────────────────────┐
│                    CODEBASE PARENT                         │
│  ✓ TOUTES les fonctionnalités (100% des features)         │
│  ✓ Système de thèmes dynamique                            │
│  ✓ Feature flags par house_id                             │
│  ✓ React + TypeScript + Vite + Tailwind                   │
│  ✓ Supabase (PostgreSQL + Auth + Storage + Edge Functions)│
└────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ SVV Corse│  │SVV Paris │  │SVV Lyon  │
        │──────────│  │──────────│  │──────────│
        │Features: │  │Features: │  │Features: │
        │☑ Vins    │  │☑ Art     │  │☑ Voitures│
        │☑ Bijoux  │  │☑ Mobilier│  │☑ Militaria│
        │☐ Voitures│  │☐ Vins    │  │☐ Bijoux  │
        │──────────│  │──────────│  │──────────│
        │Theme:    │  │Theme:    │  │Theme:    │
        │Terracotta│  │Noir/Or   │  │Bleu/Gris │
        └──────────┘  └──────────┘  └──────────┘
```

---

## Stack technique

| Composant | Technologie | Rôle |
|-----------|-------------|------|
| Frontend | React 18 + TypeScript | Interface utilisateur |
| Styling | Tailwind CSS + CSS Variables | Theming dynamique |
| Build | Vite | Bundling optimisé |
| Base de données | Supabase (PostgreSQL) | Données multi-tenant |
| Auth | Supabase Auth | Authentification users |
| Storage | Supabase Storage | Images, documents |
| Backend | Supabase Edge Functions (Deno) | API, IA, scraping |
| Hosting | Lovable CDN | Déploiement global |

---

## Structure de la table `house_config`

```sql
CREATE TABLE public.house_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  house_id TEXT UNIQUE NOT NULL,           -- Identifiant unique (ex: "svv-corse")
  domain TEXT UNIQUE,                       -- Domaine custom (ex: "encheres-corse.fr")
  
  -- BRANDING / THEMING
  theme JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    {
      "primary": "hsl(15, 60%, 45%)",
      "secondary": "hsl(35, 80%, 50%)",
      "accent": "hsl(25, 70%, 55%)",
      "background": "hsl(30, 20%, 98%)",
      "foreground": "hsl(20, 10%, 10%)",
      "font_display": "Playfair Display",
      "font_body": "Lato",
      "logo_url": "https://...",
      "favicon_url": "https://..."
    }
  */
  
  -- FEATURE FLAGS
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    {
      "specialties": ["vins", "bijoux", "mobilier", "art-moderne"],
      "lia_enabled": true,
      "chrono_enabled": true,
      "after_sale_enabled": true,
      "phone_bids_enabled": true,
      "purchase_orders_enabled": true,
      "newsletter_enabled": true,
      "expertise_cities_enabled": true,
      "aventures_enabled": false,
      "talents_region_enabled": false
    }
  */
  
  -- CONTENU SPÉCIFIQUE
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    {
      "house_name": "Hôtel des Ventes d'Ajaccio",
      "house_short_name": "SVV Ajaccio",
      "commissaire_name": "Maître Jean-Baptiste Marcaggi",
      "address": "...",
      "phone": "...",
      "email": "...",
      "expertise_cities": ["Ajaccio", "Bastia", "Porto-Vecchio"],
      "interencheres_house_id": "12345",
      "social_links": {
        "facebook": "...",
        "instagram": "..."
      }
    }
  */
  
  -- MÉTADONNÉES
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour lookup rapide par domaine
CREATE INDEX idx_house_config_domain ON public.house_config(domain);

-- RLS : lecture publique, écriture admin seulement
ALTER TABLE public.house_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.house_config
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin write access" ON public.house_config
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));
```

---

## Hook React : `useHouseConfig`

```typescript
// src/hooks/useHouseConfig.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HouseTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  font_display: string;
  font_body: string;
  logo_url: string;
  favicon_url: string;
}

interface HouseFeatures {
  specialties: string[];
  lia_enabled: boolean;
  chrono_enabled: boolean;
  after_sale_enabled: boolean;
  phone_bids_enabled: boolean;
  purchase_orders_enabled: boolean;
  newsletter_enabled: boolean;
  expertise_cities_enabled: boolean;
  aventures_enabled: boolean;
  talents_region_enabled: boolean;
}

interface HouseContent {
  house_name: string;
  house_short_name: string;
  commissaire_name: string;
  address: string;
  phone: string;
  email: string;
  expertise_cities: string[];
  interencheres_house_id: string;
  social_links: Record<string, string>;
}

interface HouseConfig {
  id: string;
  house_id: string;
  domain: string | null;
  theme: HouseTheme;
  features: HouseFeatures;
  content: HouseContent;
  is_active: boolean;
}

function detectHouseId(): string {
  const hostname = window.location.hostname;
  
  // Mapping domaine → house_id
  // En production, on fait un lookup dans la DB
  if (hostname.includes('localhost') || hostname.includes('lovable.app')) {
    return 'svv-corse'; // Default pour dev
  }
  
  // Le house_id sera résolu côté serveur via le domaine
  return hostname;
}

export function useHouseConfig() {
  const houseId = detectHouseId();
  
  return useQuery({
    queryKey: ['house-config', houseId],
    queryFn: async (): Promise<HouseConfig> => {
      // Essayer d'abord par domaine, puis par house_id
      const { data, error } = await supabase
        .from('house_config')
        .select('*')
        .or(`domain.eq.${houseId},house_id.eq.${houseId}`)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data as HouseConfig;
    },
    staleTime: 1000 * 60 * 60, // Cache 1h
  });
}

// Hook pour vérifier si une feature est activée
export function useFeatureEnabled(featureName: keyof HouseFeatures): boolean {
  const { data: config } = useHouseConfig();
  
  if (!config) return false;
  
  const value = config.features[featureName];
  return typeof value === 'boolean' ? value : Array.isArray(value) && value.length > 0;
}

// Hook pour vérifier si une spécialité est activée
export function useSpecialtyEnabled(specialty: string): boolean {
  const { data: config } = useHouseConfig();
  
  if (!config) return false;
  return config.features.specialties?.includes(specialty) ?? false;
}
```

---

## ThemeProvider dynamique

```typescript
// src/providers/DynamicThemeProvider.tsx

import { useEffect } from 'react';
import { useHouseConfig } from '@/hooks/useHouseConfig';

export function DynamicThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: config, isLoading } = useHouseConfig();
  
  useEffect(() => {
    if (!config?.theme) return;
    
    const root = document.documentElement;
    const theme = config.theme;
    
    // Appliquer les couleurs CSS
    root.style.setProperty('--primary', theme.primary);
    root.style.setProperty('--secondary', theme.secondary);
    root.style.setProperty('--accent', theme.accent);
    root.style.setProperty('--background', theme.background);
    root.style.setProperty('--foreground', theme.foreground);
    
    // Appliquer les fonts
    root.style.setProperty('--font-display', theme.font_display);
    root.style.setProperty('--font-body', theme.font_body);
    
    // Charger les fonts Google si nécessaire
    const fontLink = document.createElement('link');
    fontLink.href = `https://fonts.googleapis.com/css2?family=${theme.font_display.replace(' ', '+')}:wght@400;700&family=${theme.font_body.replace(' ', '+')}:wght@400;500;600&display=swap`;
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    // Mettre à jour le favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon && theme.favicon_url) {
      favicon.href = theme.favicon_url;
    }
    
    // Mettre à jour le titre
    document.title = config.content.house_short_name;
    
  }, [config]);
  
  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }
  
  return <>{children}</>;
}
```

---

## Composant conditionnel par feature

```typescript
// src/components/FeatureGate.tsx

import { useFeatureEnabled } from '@/hooks/useHouseConfig';

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureEnabled(feature as any);
  
  if (!isEnabled) return <>{fallback}</>;
  return <>{children}</>;
}

// Usage:
// <FeatureGate feature="lia_enabled">
//   <LiaDialogue />
// </FeatureGate>
```

---

## Filtrage des spécialités dans le menu

```typescript
// src/components/SpecialtiesMenu.tsx

import { useHouseConfig } from '@/hooks/useHouseConfig';

const ALL_SPECIALTIES = [
  { id: 'vins', label: 'Vins & Spiritueux', path: '/specialites/vins-spiritueux' },
  { id: 'bijoux', label: 'Bijoux & Montres', path: '/specialites/bijoux-montres' },
  { id: 'mobilier', label: 'Mobilier & Objets', path: '/specialites/mobilier-objets-art' },
  { id: 'art-moderne', label: 'Art Moderne', path: '/specialites/art-moderne' },
  { id: 'voitures', label: 'Voitures de Collection', path: '/specialites/voitures-collection' },
  { id: 'militaria', label: 'Militaria', path: '/specialites/militaria' },
  // ... etc
];

export function SpecialtiesMenu() {
  const { data: config } = useHouseConfig();
  
  const enabledSpecialties = ALL_SPECIALTIES.filter(
    spec => config?.features.specialties?.includes(spec.id)
  );
  
  return (
    <nav>
      {enabledSpecialties.map(spec => (
        <Link key={spec.id} to={spec.path}>
          {spec.label}
        </Link>
      ))}
    </nav>
  );
}
```

---

## Structure multi-tenant de la base de données

Toutes les tables métier incluent une colonne `house_id` :

```sql
-- Exemple : table des ventes
ALTER TABLE public.interencheres_sales 
  ADD COLUMN house_id TEXT REFERENCES public.house_config(house_id);

-- RLS pour filtrer par house
CREATE POLICY "Filter by house" ON public.interencheres_sales
  FOR SELECT USING (
    house_id = (
      SELECT house_id FROM public.house_config 
      WHERE domain = current_setting('request.headers')::json->>'host'
      OR house_id = current_setting('app.current_house_id', true)
    )
  );
```

---

## Estimation des coûts

### Infrastructure

| Élément | Coût mensuel | Notes |
|---------|--------------|-------|
| Supabase Pro | 25€ | 1 projet = toutes les maisons |
| Lovable | Selon plan | Hébergement inclus |
| Domaines | ~0.80€/domaine | 200 × 10€/an ÷ 12 |
| **Total infra** | **~190€/mois** | Pour 200 sites |

### Développement initial

| Tâche | Estimation |
|-------|------------|
| Architecture multi-tenant | 20-30h |
| Système de theming | 10-15h |
| Feature flags | 10-15h |
| Back-office admin | 30-50h |
| Tests & documentation | 15-20h |
| **Total** | **85-130h** |

### Par nouveau client

| Tâche | Estimation |
|-------|------------|
| Configuration initiale | 1-2h |
| Personnalisation theme | 1-2h |
| Import données (si migration) | 2-4h |
| Formation client | 2-3h |
| **Total** | **6-11h/client** |

---

## Avantages de cette architecture

1. **Maintenance centralisée** : 1 correction = 200 sites mis à jour
2. **Déploiement rapide** : Nouveau client en quelques heures
3. **Coût marginal faible** : Infrastructure partagée
4. **Évolutivité** : Nouvelles features disponibles pour tous
5. **Cohérence** : Stack identique, moins de bugs edge-case
6. **Sécurité** : RLS PostgreSQL natif, pas de failles par client

---

## Risques et mitigations

| Risque | Mitigation |
|--------|------------|
| Client veut feature très spécifique | Feature flag dédié ou surcharge config |
| Performance avec 200 clients | Index optimisés, cache agressif |
| Downtime affecte tous | Staging environment, rollback rapide |
| Données clients mélangées | RLS strict, tests automatisés |

---

## Prochaines étapes recommandées

1. **Phase 1** : Créer `house_config` + hooks + ThemeProvider
2. **Phase 2** : Migrer composants existants vers feature flags
3. **Phase 3** : Construire back-office admin CRUD
4. **Phase 4** : Tests automatisés (Vitest)
5. **Phase 5** : Documentation déploiement client
6. **Phase 6** : Onboarding premier client pilote

---

*Document généré le 3 janvier 2026 - Architecture Lovable SaaS Multi-Tenant*
