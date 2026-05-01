"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Send, Trash2, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { cn } from "@/lib/utils";

const PrivateMessaging = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const userRole = user?.user_metadata?.role;
  const isAuthorized = userRole === 'Etat-Major' || userRole === 'Présidence';

  const fetchMessages = useCallback(async (silent = false) => {
    if (!isAuthorized) return;
    if (!silent) setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          profiles:sender_id (
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // On ne met à jour l'état que si le nombre de messages a changé pour éviter les flashs
      setMessages(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) return prev;
        return data || [];
      });
    } catch (err) {
      console.error("Erreur messagerie:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) return;

    // 1. Chargement initial
    fetchMessages();
    
    // 2. Temps réel (WebSocket)
    const channel = supabase
      .channel('db-messages')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'private_messages' }, 
        () => fetchMessages(true)
      )
      .subscribe();

    // 3. Sécurité : Polling (toutes les 3 secondes)
    // Si le temps réel échoue, l'utilisateur verra quand même les messages
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isAuthorized, fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    const text = content.trim();
    setContent("");
    setSending(true);
    
    try {
      const { error } = await supabase
        .from('private_messages')
        .insert([{ sender_id: user.id, content: text }]);

      if (error) throw error;
      fetchMessages(true); // Forcer la mise à jour locale
    } catch (err: any) {
      showError("Erreur d'envoi");
      setContent(text);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('private_messages')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchMessages(true);
    } catch (err: any) {
      showError("Action non autorisée");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <Shield size={48} className="text-red-500/50" />
        <h2 className="text-xl font-bold">Accès Restreint</h2>
        <p className="text-muted-foreground max-w-md">Ce canal de communication est strictement réservé à l'État-Major et à la Présidence.</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-12rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center">
            <Shield className="mr-2 text-primary" /> Canal Sécurisé
          </h2>
          <p className="text-sm text-muted-foreground">Communications confidentielles EM / Présidence</p>
        </div>
      </div>

      <Card className="flex-1 bg-white/[0.02] border-white/5 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : messages.length === 0 ? (
              <p className="text-center text-muted-foreground py-10 italic">Aucun message dans ce canal.</p>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const canDelete = isMe || userRole === 'Etat-Major';
                const senderName = msg.profiles?.full_name || "Utilisateur";
                const senderRole = msg.profiles?.role || "Inconnu";
                
                return (
                  <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "mr-auto items-start")}>
                    <div className="flex items-center space-x-2 mb-1 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {senderName} ({senderRole})
                      </span>
                      <span className="text-[8px] text-muted-foreground/50">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="group relative">
                      <div className={cn(
                        "px-4 py-2 rounded-2xl text-sm whitespace-pre-wrap",
                        isMe ? "bg-primary text-white rounded-tr-none" : "bg-white/10 text-white rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      {canDelete && (
                        <button 
                          onClick={() => handleDelete(msg.id)}
                          className={cn(
                            "absolute top-1/2 -translate-y-1/2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg",
                            isMe ? "-left-10" : "-right-10"
                          )}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/5 bg-white/[0.01]">
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input 
              placeholder="Écrire un message sécurisé..." 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-background/50 border-white/10"
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={sending || !content.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send size={18} />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default PrivateMessaging;