"use client";

import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { showSuccess } from "@/utils/toast";

const formSchema = z.object({
  identifier: z.string().min(2, {
    message: "L'identifiant est requis.",
  }),
  password: z.string().min(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères.",
  }),
  accountType: z.enum(["Participant", "Présidence", "Etat-Major"], {
    required_error: "Veuillez sélectionner un type de compte.",
  }),
});

const LoginForm = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    showSuccess(`Bienvenue, ${values.identifier} (${values.accountType})`);
  }

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Connexion</h2>
        <p className="text-sm text-muted-foreground">
          Accédez à votre espace AfterWorld
        </p>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="identifier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identifiant</FormLabel>
                <FormControl>
                  <Input placeholder="Nom d'utilisateur" {...field} className="bg-background/50 border-white/10 focus:border-primary/50 transition-all" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="bg-background/50 border-white/10 focus:border-primary/50 transition-all" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type de compte</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="bg-background/50 border-white/10 focus:border-primary/50 transition-all">
                      <SelectValue placeholder="Sélectionnez votre rôle" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="Participant">Participant</SelectItem>
                    <SelectItem value="Présidence">Présidence</SelectItem>
                    <SelectItem value="Etat-Major">Etat-Major</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-6 rounded-xl transition-all duration-300 shadow-lg shadow-primary/20">
            Se connecter
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default LoginForm;