import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Mic, MicOff, Send, Plus, Trash2, Bell, Check, Sparkles, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { TasteCloud } from '@/components/compte/TasteCloud';
import { InteractiveList } from '@/components/compte/InteractiveList';
import { FinalProposals } from '@/components/compte/FinalProposals';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import OnboardingProgress from '@/components/compte/OnboardingProgress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TasteData {
  styles: string[];
  ambiances: string[];
  categories: string[];
  periods: string[];
  materials: string[];
  colors: string[];
  budget_min?: number;
  budget_max?: number;
}

interface TasteProfile {
  id: string;
  profile_name: string;
  styles: string[];
  ambiances: string[];
  categories: string[];
  periods: string[];
  materials: string[];
  colors: string[];
  budget_min?: number;
  budget_max?: number;
  conversation_history: { role: string; content: string }[];
  summary?: string;
  is_complete: boolean;
  alerts_enabled: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showExamples?: {
    enabled: boolean;
    searchTerms: string[];
    context: string;
    lots?: Array<{
      id: string;
      title: string;
      imageUrl: string;
    }>;
  };
  interactiveList?: {
    enabled: boolean;
    items: string[];
    question: string;
  };
  showFinalProposals?: boolean;
  finalProposalLots?: Array<{
    id: string;
    title: string;
    imageUrl: string;
  }>;
}

interface UserContext {
  memorizedLots: Array<{ title: string }>;
  alerts: string[];
  interests: string[];
  newsletterInterests: string[];
  purchaseOrders: Array<{ lotTitle: string; maxBid: number }>;
  phoneBidRequests: Array<{ lotTitle: string }>;
  userProfile?: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
  };
}

const CeQueJaime = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<TasteProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [tasteData, setTasteData] = useState<TasteData>({
    styles: [],
    ambiances: [],
    categories: [],
    periods: [],
    materials: [],
    colors: [],
  });
  const [isThinking, setIsThinking] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [createdAlertKeywords, setCreatedAlertKeywords] = useState<string[]>([]);
  const [proposedKeywords, setProposedKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());
  const [showAlertSelection, setShowAlertSelection] = useState(false);
  const [alertExplanation, setAlertExplanation] = useState<string>('');
  const [synthesizingAlerts, setSynthesizingAlerts] = useState(false);
  const [showIntroDialog, setShowIntroDialog] = useState(() => {
    return !localStorage.getItem('lia-intro-seen');
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep callbacks stable to avoid re-creating the SpeechRecognition instance on every render
  const handleSpeechResult = useCallback((transcript: string) => {
    if (transcript.trim()) {
      setInputText((prev) => {
        const separator = prev.trim() ? ' ' : '';
        return prev + separator + transcript.trim();
      });
      inputRef.current?.focus();
    }
  }, []);

  // Speech recognition - append to input instead of sending directly
  const {
    isListening,
    isSupported,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
    language: 'fr-FR',
    continuous: true,
  });

  // Scroll chat to bottom on new messages (without scrolling the whole page)
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = chatScrollAreaRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    requestAnimationFrame(() => {
      viewport.scrollTop = viewport.scrollHeight;
    });
  }, [messages, isThinking]);

  // Load profiles and user context
  useEffect(() => {
    if (user) {
      loadProfiles();
      loadUserContext();
    }
  }, [user]);

  // Fetch existing user data to provide context to AI
  const loadUserContext = async () => {
    if (!user) return;
    
    try {
      // Fetch memorized lots with titles
      const { data: memorizedData } = await supabase
        .from('memorized_lots')
        .select('lot_id')
        .eq('user_id', user.id)
        .limit(10);
      
      let memorizedLots: Array<{ title: string }> = [];
      if (memorizedData && memorizedData.length > 0) {
        const lotIds = memorizedData.map(m => m.lot_id);
        const { data: lotsData } = await supabase
          .from('interencheres_lots')
          .select('title')
          .in('id', lotIds);
        memorizedLots = (lotsData || []).map(l => ({ title: l.title }));
      }
      
      // Fetch active alerts
      const { data: alertsData } = await supabase
        .from('user_alerts')
        .select('keyword')
        .eq('user_id', user.id)
        .eq('is_active', true);
      const alerts = (alertsData || []).map(a => a.keyword);
      
      // Fetch interests (specialty choices)
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('specialty')
        .eq('user_id', user.id);
      const interests = (interestsData || []).map(i => i.specialty);
      
      // Fetch user profile for name
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, display_name, newsletter_subscribed')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Newsletter interests are stored in user_interests with a specific type or we use the specialty list
      const newsletterInterests = interests.filter(i => 
        ['Bijoux', 'Montres', 'Mobilier', 'Tableaux', 'Vins', 'Voitures', 'Art moderne', 'Céramiques', 'Argenterie'].includes(i)
      );
      
      // Fetch purchase orders with lot titles
      const { data: ordersData } = await supabase
        .from('purchase_orders')
        .select('lot_id, max_bid')
        .eq('user_id', user.id)
        .limit(5);
      
      let purchaseOrders: Array<{ lotTitle: string; maxBid: number }> = [];
      if (ordersData && ordersData.length > 0) {
        const orderLotIds = ordersData.map(o => o.lot_id);
        const { data: orderLotsData } = await supabase
          .from('interencheres_lots')
          .select('id, title')
          .in('id', orderLotIds);
        const lotTitleMap = new Map((orderLotsData || []).map(l => [l.id, l.title]));
        purchaseOrders = ordersData.map(o => ({
          lotTitle: lotTitleMap.get(o.lot_id) || 'Lot inconnu',
          maxBid: o.max_bid
        }));
      }
      
      // Fetch phone bid requests with lot titles
      const { data: phoneBidsData } = await supabase
        .from('phone_bid_requests')
        .select('lot_id')
        .eq('user_id', user.id)
        .limit(5);
      
      let phoneBidRequests: Array<{ lotTitle: string }> = [];
      if (phoneBidsData && phoneBidsData.length > 0) {
        const phoneLotIds = phoneBidsData.map(p => p.lot_id);
        const { data: phoneLotsData } = await supabase
          .from('interencheres_lots')
          .select('id, title')
          .in('id', phoneLotIds);
        const phoneLotTitleMap = new Map((phoneLotsData || []).map(l => [l.id, l.title]));
        phoneBidRequests = phoneBidsData.map(p => ({
          lotTitle: phoneLotTitleMap.get(p.lot_id) || 'Lot inconnu'
        }));
      }
      
      setUserContext({
        memorizedLots,
        alerts,
        interests,
        newsletterInterests,
        purchaseOrders,
        phoneBidRequests,
        userProfile: profileData ? {
          firstName: profileData.first_name || undefined,
          lastName: profileData.last_name || undefined,
          displayName: profileData.display_name || undefined,
        } : undefined
      });
      
      console.log('User context loaded:', { 
        memorizedLots: memorizedLots.length, 
        alerts: alerts.length, 
        interests: interests.length,
        purchaseOrders: purchaseOrders.length,
        phoneBidRequests: phoneBidRequests.length
      });
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  };

  const loadProfiles = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('taste_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Parse JSON fields with proper typing
      const parsedProfiles: TasteProfile[] = (data || []).map(p => ({
        id: p.id,
        profile_name: p.profile_name,
        styles: Array.isArray(p.styles) ? (p.styles as string[]) : [],
        ambiances: Array.isArray(p.ambiances) ? (p.ambiances as string[]) : [],
        categories: Array.isArray(p.categories) ? (p.categories as string[]) : [],
        periods: Array.isArray(p.periods) ? (p.periods as string[]) : [],
        materials: Array.isArray(p.materials) ? (p.materials as string[]) : [],
        colors: Array.isArray(p.colors) ? (p.colors as string[]) : [],
        conversation_history: Array.isArray(p.conversation_history) 
          ? (p.conversation_history as { role: string; content: string }[]) 
          : [],
        budget_min: p.budget_min ?? undefined,
        budget_max: p.budget_max ?? undefined,
        summary: p.summary ?? undefined,
        is_complete: p.is_complete ?? false,
        alerts_enabled: p.alerts_enabled ?? false,
      }));

      setProfiles(parsedProfiles);

      // Auto-select first profile or create one
      if (parsedProfiles.length > 0) {
        selectProfile(parsedProfiles[0]);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Erreur lors du chargement des profils');
    } finally {
      setLoading(false);
    }
  };

  const selectProfile = (profile: TasteProfile) => {
    setActiveProfileId(profile.id);
    const history = profile.conversation_history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content
    }));
    setMessages(history);
    setTasteData({
      styles: profile.styles,
      ambiances: profile.ambiances,
      categories: profile.categories,
      periods: profile.periods,
      materials: profile.materials,
      colors: profile.colors,
      budget_min: profile.budget_min ?? undefined,
      budget_max: profile.budget_max ?? undefined,
    });
    setShowSummary(profile.is_complete);
    
    // If profile exists but has no conversation, start one
    if (history.length === 0) {
      // Delay to ensure state is set
      setTimeout(() => {
        startConversation();
      }, 100);
    }
  };

  const createNewProfile = async () => {
    if (!user) return;
    if (profiles.length >= 5) {
      toast.error('Maximum 5 profils autorisés');
      return;
    }

    try {
      const profileName = profiles.length === 0 ? 'Mon profil' : `Profil ${profiles.length + 1}`;
      
      const { data, error } = await supabase
        .from('taste_profiles')
        .insert({
          user_id: user.id,
          profile_name: profileName,
        })
        .select()
        .single();

      if (error) throw error;

      const newProfile: TasteProfile = {
        ...data,
        styles: [],
        ambiances: [],
        categories: [],
        periods: [],
        materials: [],
        colors: [],
        conversation_history: [],
      };

      setProfiles([...profiles, newProfile]);
      selectProfile(newProfile);
      
      // Start conversation with AI
      startConversation();
      
      toast.success('Nouveau profil créé');
    } catch (error) {
      console.error('Error creating profile:', error);
      toast.error('Erreur lors de la création du profil');
    }
  };

  const startConversation = async () => {
    setIsThinking(true);
    
    try {
      const response = await supabase.functions.invoke('taste-interview', {
        body: { 
          messages: [{ role: 'user', content: 'Bonjour, je souhaite découvrir mes goûts pour les enchères.' }],
          currentTaste: tasteData,
          userContext
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message || "Bonjour ! Je suis ravi de vous accompagner dans la découverte de vos goûts. Commençons par une question simple : quel type d'objet vous attire le plus spontanément ? Les meubles anciens, les bijoux, les tableaux, ou peut-être autre chose ?"
      };

      setMessages([assistantMessage]);
      
      // Save to database
      if (activeProfileId) {
        await supabase
          .from('taste_profiles')
          .update({ 
            conversation_history: [{ role: assistantMessage.role, content: assistantMessage.content }] as unknown as never
          })
          .eq('id', activeProfileId);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Fallback greeting
      const fallbackMessage: Message = {
        role: 'assistant',
        content: "Bonjour ! Je suis ravi de vous accompagner dans la découverte de vos goûts pour les enchères. Dites-moi, quel type d'objet vous attire le plus spontanément ?"
      };
      setMessages([fallbackMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || sending) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setSending(true);
    setIsThinking(true);

    try {
      const response = await supabase.functions.invoke('taste-interview', {
        body: { 
          messages: newMessages,
          currentTaste: tasteData,
          userContext
        }
      });

      if (response.error) throw response.error;

      const data = response.data;
      
      // Update taste data with extracted info
      const newTasteData = { ...tasteData };
      if (data.extracted) {
        ['styles', 'ambiances', 'categories', 'periods', 'materials', 'colors'].forEach(key => {
          const extracted = data.extracted[key] || [];
          if (extracted.length > 0) {
            const currentSet = new Set(newTasteData[key as keyof TasteData] as string[]);
            extracted.forEach((item: string) => currentSet.add(item));
            (newTasteData as any)[key] = Array.from(currentSet);
          }
        });
        if (data.extracted.budget_min) newTasteData.budget_min = data.extracted.budget_min;
        if (data.extracted.budget_max) newTasteData.budget_max = data.extracted.budget_max;
      }
      setTasteData(newTasteData);

      // Build assistant message with optional examples
      let showExamples: Message['showExamples'] = undefined;
      if (data.show_examples?.enabled && data.show_examples?.search_terms?.length > 0) {
        const searchTerms = data.show_examples.search_terms;
        
        // Search for images on the web via Firecrawl
        try {
          const imageResponse = await supabase.functions.invoke('search-example-images', {
            body: { searchTerms }
          });
          
          if (imageResponse.data?.success && imageResponse.data?.images?.length > 0) {
            showExamples = {
              enabled: true,
              searchTerms,
              context: data.show_examples.context || '',
              lots: imageResponse.data.images.map((img: { url: string; title: string }) => ({
                id: img.url,
                title: img.title,
                imageUrl: img.url
              }))
            };
          }
        } catch (imgError) {
          console.error('Error fetching example images:', imgError);
        }
      }

      // Parse interactive list if present
      let interactiveList: Message['interactiveList'] = undefined;
      if (data.interactive_list?.enabled && data.interactive_list?.items?.length > 0) {
        interactiveList = {
          enabled: true,
          items: data.interactive_list.items,
          question: data.interactive_list.question || 'Est-ce que ces éléments vous parlent ?'
        };
      }

      // Parse final proposals if present
      let showFinalProposals = false;
      let finalProposalLots: Message['finalProposalLots'] = undefined;
      if (data.show_final_proposals) {
        showFinalProposals = true;
        // Fetch images for final proposals
        const searchTerms = data.show_examples?.search_terms || 
          [...(newTasteData.styles || []), ...(newTasteData.categories || [])].slice(0, 5);
        
        if (searchTerms.length > 0) {
          try {
            const imageResponse = await supabase.functions.invoke('search-example-images', {
              body: { searchTerms, count: 10 }
            });
            
            if (imageResponse.data?.success && imageResponse.data?.images?.length > 0) {
              finalProposalLots = imageResponse.data.images.slice(0, 10).map((img: { url: string; title: string }) => ({
                id: img.url,
                title: img.title,
                imageUrl: img.url
              }));
            }
          } catch (imgError) {
            console.error('Error fetching final proposal images:', imgError);
          }
        }
      }

      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message,
        showExamples,
        interactiveList,
        showFinalProposals,
        finalProposalLots
      };
      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);

      // Check if AI wants to open alerts validation
      if (data.open_alerts_validation) {
        proposeAlerts();
      }

      // Check if summary
      if (data.is_summary) {
        setShowSummary(true);
      }

      // Save to database
      if (activeProfileId) {
        const historyForDb = updatedMessages.map(m => ({ role: m.role, content: m.content }));
        await supabase
          .from('taste_profiles')
          .update({ 
            conversation_history: historyForDb as unknown as never,
            styles: newTasteData.styles as unknown as never,
            ambiances: newTasteData.ambiances as unknown as never,
            categories: newTasteData.categories as unknown as never,
            periods: newTasteData.periods as unknown as never,
            materials: newTasteData.materials as unknown as never,
            colors: newTasteData.colors as unknown as never,
            budget_min: newTasteData.budget_min,
            budget_max: newTasteData.budget_max,
            is_complete: data.is_summary || false,
          })
          .eq('id', activeProfileId);
        
        // Update local profiles
        setProfiles(prev => prev.map(p => 
          p.id === activeProfileId 
            ? { ...p, ...newTasteData, conversation_history: updatedMessages, is_complete: data.is_summary || false }
            : p
        ));
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Erreur de communication avec l\'IA');
    } finally {
      setSending(false);
      setIsThinking(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;

    try {
      const { error } = await supabase
        .from('taste_profiles')
        .delete()
        .eq('id', profileToDelete);

      if (error) throw error;

      const remainingProfiles = profiles.filter(p => p.id !== profileToDelete);
      setProfiles(remainingProfiles);
      
      if (activeProfileId === profileToDelete) {
        if (remainingProfiles.length > 0) {
          selectProfile(remainingProfiles[0]);
        } else {
          setActiveProfileId(null);
          setMessages([]);
          setTasteData({
            styles: [],
            ambiances: [],
            categories: [],
            periods: [],
            materials: [],
            colors: [],
          });
        }
      }

      toast.success('Profil supprimé');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteDialog(false);
      setProfileToDelete(null);
    }
  };

  // Propose keywords for user validation using AI synthesis
  const proposeAlerts = async () => {
    setSynthesizingAlerts(true);
    setAlertExplanation('');
    
    try {
      const { data, error } = await supabase.functions.invoke('synthesize-alerts', {
        body: {
          tasteData,
          userContext
        }
      });

      if (error) throw error;

      const keywords = data.keywords || [];
      const explanation = data.explanation || '';
      
      setProposedKeywords(keywords);
      setSelectedKeywords(new Set(keywords)); // All selected by default
      setAlertExplanation(explanation);
      setShowAlertSelection(true);
    } catch (error) {
      console.error('Error synthesizing alerts:', error);
      toast.error('Erreur lors de la génération des alertes');
      
      // Fallback to simple extraction
      const keywords: string[] = [];
      if (userContext?.interests?.length) keywords.push(...userContext.interests);
      if (tasteData.categories.length) keywords.push(...tasteData.categories.slice(0, 2));
      if (tasteData.styles.length) keywords.push(...tasteData.styles.slice(0, 2));
      
      const uniqueKeywords = [...new Set(keywords)];
      setProposedKeywords(uniqueKeywords);
      setSelectedKeywords(new Set(uniqueKeywords));
      setAlertExplanation("Voici les mots-clés correspondant à vos goûts.");
      setShowAlertSelection(true);
    } finally {
      setSynthesizingAlerts(false);
    }
  };

  const toggleKeyword = (keyword: string) => {
    const newSelected = new Set(selectedKeywords);
    if (newSelected.has(keyword)) {
      newSelected.delete(keyword);
    } else {
      newSelected.add(keyword);
    }
    setSelectedKeywords(newSelected);
  };

  const confirmAlerts = async () => {
    if (!activeProfileId || selectedKeywords.size === 0) return;

    try {
      const keywordsToCreate = Array.from(selectedKeywords);

      // Insert alerts
      for (const keyword of keywordsToCreate) {
        await supabase
          .from('user_alerts')
          .insert({
            user_id: user!.id,
            keyword,
            is_active: true
          });
      }

      // Update profile
      await supabase
        .from('taste_profiles')
        .update({ alerts_enabled: true })
        .eq('id', activeProfileId);

      setProfiles(prev => prev.map(p => 
        p.id === activeProfileId ? { ...p, alerts_enabled: true } : p
      ));

      // Store created keywords for display
      setCreatedAlertKeywords(keywordsToCreate);
      setShowAlertSelection(false);

      toast.success(`${keywordsToCreate.length} alertes créées`);
    } catch (error) {
      console.error('Error enabling alerts:', error);
      toast.error('Erreur lors de la création des alertes');
    }
  };

  const resetConversation = async () => {
    if (!activeProfileId) return;
    
    try {
      // Clear conversation in database
      await supabase
        .from('taste_profiles')
        .update({ 
          conversation_history: [] as unknown as never,
          styles: [] as unknown as never,
          ambiances: [] as unknown as never,
          categories: [] as unknown as never,
          periods: [] as unknown as never,
          materials: [] as unknown as never,
          colors: [] as unknown as never,
          budget_min: null,
          budget_max: null,
          is_complete: false,
          summary: null
        })
        .eq('id', activeProfileId);
      
      // Reset local state
      setMessages([]);
      setTasteData({
        styles: [],
        ambiances: [],
        categories: [],
        periods: [],
        materials: [],
        colors: [],
      });
      setShowSummary(false);
      
      // Update profiles list
      setProfiles(prev => prev.map(p => 
        p.id === activeProfileId 
          ? { ...p, conversation_history: [], styles: [], ambiances: [], categories: [], periods: [], materials: [], colors: [], is_complete: false }
          : p
      ));
      
      // Restart conversation
      startConversation();
      
      toast.success('Conversation oubliée, on recommence !');
    } catch (error) {
      console.error('Error resetting conversation:', error);
      toast.error('Erreur lors de la réinitialisation');
    }
  };

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate dialogue progress (step 4 progresses based on conversation length)
  // Estimate 8 exchanges for a complete conversation, so progress from 3.0 to 4.0
  const userMessageCount = messages.filter(m => m.role === 'user').length;
  const dialogueProgress = Math.min(3 + (userMessageCount / 8), 4);

  return (
    <div className="space-y-6">
      <OnboardingProgress currentStep={dialogueProgress} totalSteps={4} />

      {/* Introduction Dialog */}
      <Dialog open={showIntroDialog} onOpenChange={setShowIntroDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Dialogue avec Lia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground py-2">
            <p>
              <strong className="text-foreground">Comme dans un palace, nous souhaitons anticiper vos envies et donc mieux connaître vos goûts.</strong>
            </p>
            <p>
              Ce qui prend le plus de temps dans les ventes aux enchères, c'est d'arriver sur les lots qui vous intéressent, ceux qui vous font frémir.
            </p>
            <p>
              Au-delà des alertes précises et des lots que vous likez, un échange avec <strong className="text-foreground">Lia</strong> peut lui permettre d'attirer votre attention sur des lots qui ne sont pas dans vos filtres et qui devraient pourtant vous intéresser.
            </p>
            <p className="text-foreground">
              Si vous le souhaitez, commencez cet échange avec Lia maintenant ou plus tard.
            </p>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.setItem('lia-intro-seen', 'true');
                setShowIntroDialog(false);
                navigate('/compte/profil');
              }}
            >
              Je ne le souhaite pas
            </Button>
            <Button 
              onClick={() => {
                localStorage.setItem('lia-intro-seen', 'true');
                setShowIntroDialog(false);
              }}
              className="gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Allons-y, je suis curieux
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-foreground">Dialogue avec Lia</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Au fil de vos échanges, Lia apprend ce qui vous plaît et peut attirer votre attention sur des lots qui devraient vous intéresser, signalés par un <span className="text-emerald-600 font-medium">cadre vert</span> dans les catalogues. Vous pouvez compléter ce dialogue naturellement quand vous le souhaitez.
          </p>
        </div>
        {profiles.length < 5 && profiles.length > 0 && (
          <Button 
            onClick={createNewProfile}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau profil
          </Button>
        )}
      </div>

      {/* Profile tabs */}
      {profiles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => selectProfile(profile)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full text-sm whitespace-nowrap
                transition-all
                ${activeProfileId === profile.id 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-muted hover:bg-muted/80 text-foreground'
                }
              `}
            >
              {profile.profile_name}
              {profile.is_complete && <Check className="w-3 h-3" />}
              {profile.alerts_enabled && <Bell className="w-3 h-3" />}
            </button>
          ))}
        </div>
      )}

      {/* Main content */}
      {!activeProfileId ? (
        <Card 
          onClick={createNewProfile}
          className="p-8 text-center border-2 border-emerald-500 bg-emerald-50/30 max-w-md mx-auto cursor-pointer hover:bg-emerald-50/50 transition-colors"
        >
          <p className="text-lg font-serif text-emerald-800">
            On commence ?
          </p>
        </Card>
      ) : (
        <div className="max-w-3xl mx-auto w-full">
          {/* Chat - full width, less tall */}
          <Card className="flex flex-col h-[50vh] min-h-[350px]">
            {/* Chat header with reset button */}
            {messages.length > 0 && (
              <div className="flex justify-between items-center p-2 border-b">
                {activeProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setProfileToDelete(activeProfileId);
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive hover:text-destructive gap-2 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                    Supprimer
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetConversation}
                  className="text-muted-foreground hover:text-foreground gap-1 text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                  Oublier la conversation
                </Button>
              </div>
            )}
            {/* Messages */}
            <ScrollArea ref={chatScrollAreaRef} className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`
                        max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line
                        ${message.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-br-md' 
                          : 'bg-muted text-foreground rounded-bl-md'
                        }
                      `}>
                        {message.content}
                      </div>
                      
                      {/* Example lots grid */}
                      {message.showExamples?.enabled && message.showExamples.lots && message.showExamples.lots.length > 0 && (
                        <div className="mt-3 max-w-[90%]">
                          {message.showExamples.context && (
                            <p className="text-sm text-muted-foreground mb-2">{message.showExamples.context}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {message.showExamples.lots.map((lot) => (
                              <button
                                key={lot.id}
                                onClick={() => handleSendMessage(`J'aime bien celui-ci : "${lot.title}"`)}
                                className="group relative aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                              >
                                <img 
                                  src={lot.imageUrl} 
                                  alt={lot.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <p className="text-white text-xs line-clamp-2">{lot.title}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Interactive list with checkboxes */}
                      {message.interactiveList?.enabled && message.interactiveList.items?.length > 0 && (
                        <div className="mt-3 max-w-[90%] w-full">
                          <InteractiveList
                            items={message.interactiveList.items}
                            question={message.interactiveList.question}
                            onValidate={(validated, rejected) => {
                              const validatedText = validated.length > 0 
                                ? `J'aime : ${validated.join(', ')}` 
                                : '';
                              const rejectedText = rejected.length > 0 
                                ? `Je n'aime pas : ${rejected.join(', ')}` 
                                : '';
                              const response = [validatedText, rejectedText].filter(Boolean).join('. ');
                              if (response) handleSendMessage(response);
                            }}
                          />
                        </div>
                      )}
                      
                      {/* Final proposals with yes/no */}
                      {message.showFinalProposals && message.finalProposalLots && message.finalProposalLots.length > 0 && (
                        <div className="mt-3 max-w-full w-full">
                          <FinalProposals
                            lots={message.finalProposalLots}
                            onValidate={(validatedIds, rejectedIds) => {
                              const validatedTitles = message.finalProposalLots!
                                .filter(lot => validatedIds.includes(lot.id))
                                .map(lot => lot.title);
                              const rejectedTitles = message.finalProposalLots!
                                .filter(lot => rejectedIds.includes(lot.id))
                                .map(lot => lot.title);
                              const response = `J'ai validé : ${validatedTitles.join(', ') || 'aucun'}. J'ai rejeté : ${rejectedTitles.join(', ') || 'aucun'}.`;
                              handleSendMessage(response);
                            }}
                          />
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Thinking indicator */}
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-muted px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Interim transcript */}
                {isListening && interimTranscript && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-end"
                  >
                    <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-primary/50 text-primary-foreground rounded-br-md italic">
                      {interimTranscript}...
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                {/* Microphone button */}
                {isSupported && (
                  <Button
                    type="button"
                    variant={isListening ? "destructive" : "outline"}
                    size="icon"
                    onClick={toggleListening}
                    className="shrink-0"
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </Button>
                )}

                {/* Text input - NOT disabled during listening to allow both */}
                <div className="flex-1 relative min-w-0">
                  <Input
                    ref={inputRef}
                    value={inputText + (interimTranscript ? (inputText ? ' ' : '') + interimTranscript : '')}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    placeholder={isListening ? "Parlez ou tapez..." : "Écrivez votre réponse..."}
                    disabled={sending}
                    className="w-full"
                  />
                  {interimTranscript && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground animate-pulse">
                      ...
                    </span>
                  )}
                </div>

                {/* Send button */}
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={!inputText.trim() || sending}
                  size="icon"
                  className="shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {isListening && (
                <p className="text-xs text-center text-muted-foreground mt-2 animate-pulse">
                  🎤 Dictée vocale active — Parlez naturellement
                </p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Navigation section */}
      <div className="pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/compte/alertes')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
          
          <Button
            onClick={() => navigate('/compte/profil')}
            className="flex items-center gap-2"
          >
            Terminer
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce profil ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'historique de conversation et les goûts associés seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProfile} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CeQueJaime;
