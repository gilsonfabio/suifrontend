"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { api } from "@/server/api";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const telefoneRegex = /^\+?\d{8,15}$/;

const registerSchema = z
  .object({
    nome: z.string().min(2, "Nome muito curto"),
    email: z.string().email("E-mail inválido"),
    telefone: z.string().regex(telefoneRegex, "Telefone inválido"),
    dataNascimento: z
      .string()
      .refine((value) => {
        const date = new Date(value);
        const today = new Date();
        const minDate = new Date("1900-01-01");
        return date <= today && date >= minDate;
      }, "Data de nascimento inválida"),
    password: z.string().min(6, "A senha deve ter ao menos 6 caracteres"),
    confirmPassword: z.string(),
    timeDoCoracao: z.string().min(1, "Informe o time do coração"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
 
export default function RegisterPage() {
  const router = useRouter();
   
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
   
  async function onSubmit(data: RegisterFormData) {
    try {
        const response = api.post(`/newuser`, {
            body: JSON.stringify({
                nome: data.nome,
                email: data.email,
                telefone: data.telefone,
                dataNascimento: data.dataNascimento,
                password: data.password,
                timeDoCoracao: data.timeDoCoracao,
          }),
        })      
        toast.success("Usuário registrado com sucesso!");
        router.push("/login");     
    } catch (err) {
        console.error(err);
        toast.error((err as Error).message || "Erro ao cadastrar usuário");
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Registro de Usuário</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" placeholder="Seu nome" {...register("nome")} />
              {errors.nome && <p className="text-sm text-red-600 mt-1">{errors.nome.message}</p>}
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@exemplo.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="+5511999998888" {...register("telefone")} />
              {errors.telefone && <p className="text-sm text-red-600 mt-1">{errors.telefone.message}</p>}
            </div>

            <div>
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
              {errors.dataNascimento && (
                <p className="text-sm text-red-600 mt-1">{errors.dataNascimento.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirma senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repita a senha"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="timeDoCoracao">Time do coração</Label>
              <Input id="timeDoCoracao" placeholder="Ex: " {...register("timeDoCoracao")} />
              {errors.timeDoCoracao && (
                <p className="text-sm text-red-600 mt-1">{errors.timeDoCoracao.message}</p>
              )}
            </div>

            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
