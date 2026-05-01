"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Send, History, Loader2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

const Bank = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const [transferData, setTransferData] = useState({
    targetId: "",
    amount: ""
  });

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Solde actuel
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();
      setBalance(profile?.balance || 0);

      // 2. Liste des autres utilisateurs
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id, full_name, committee')
        .neq('id', user.id);
      setUsers(allUsers || []);

      // 3. Historique des transactions
      const { data: txs } = await supabase
        .from('transactions')
        .select('*, sender:sender_id(full_name), receiver:receiver_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(10);
      setTransactions(txs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(transferData.amount);
    if (!transferData.targetId || isNaN(amount) || amount <= 0) {
      showError("Veuillez remplir tous les champs correctement");
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.rpc('transfer_coins', {
        target_user_id: transferData.targetId,
        amount_to_send: amount
      });

      if (error) throw error;

      showSuccess(`Transfert de ${amount} AfterCoins réussi`);
      setTransferData({ targetId: "", amount: "" });
      fetchData();
    } catch (err: any) {
      showError(err.message || "Erreur lors du transfert");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Solde Card */}
        <Card className="md:col-span-1 bg-gradient-to-br from-primary/20 to-transparent border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Votre Solde</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <Coins className="text-primary h-8 w-8" />
              </div>
              <div>
                <div className="text-4xl font-black tracking-tighter">{balance}</div>
                <div className="text-xs text-muted-foreground font-medium">AfterCoins</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transfer Form */}
        <Card className="md:col-span-2 bg-white/[0.02] border-white/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Send className="mr-2 h-5 w-5 text-primary" /> Envoyer des fonds
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTransfer} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Destinataire</label>
                <Select 
                  value={transferData.targetId} 
                  onValueChange={(v) => setTransferData({...transferData, targetId: v})}
                >
                  <SelectTrigger className="bg-background/50 border-white/10">
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name} {u.committee ? `(${u.committee})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Montant</label>
                <Input 
                  type="number" 
                  placeholder="0" 
                  value={transferData.amount}
                  onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                  className="bg-background/50 border-white/10"
                />
              </div>
              <Button type="submit" disabled={sending} className="w-full">
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transférer"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card className="bg-white/[0.02] border-white/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <History className="mr-2 h-5 w-5 text-primary" /> Historique récent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground italic">Aucune transaction enregistrée</p>
            ) : (
              transactions.map((tx) => {
                const isOut = tx.sender_id === user?.id;
                const isSystem = !tx.sender_id;
                
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="flex items-center space-x-4">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isSystem ? "bg-blue-500/10 text-blue-400" : isOut ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {isSystem ? <Coins size={18} /> : isOut ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {isSystem ? "Système AfterWorld" : isOut ? `À : ${tx.receiver?.full_name}` : `De : ${tx.sender?.full_name}`}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                          {new Date(tx.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-bold",
                      isSystem ? "text-blue-400" : isOut ? "text-red-400" : "text-emerald-400"
                    )}>
                      {isOut ? "-" : "+"}{tx.amount}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Bank;