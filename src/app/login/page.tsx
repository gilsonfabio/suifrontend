"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { ThemeSwitcher } from "@/components/theme-switcher";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setLoading(false);

    if (res?.ok) {
      toast.success("Login realizado com sucesso!");
      router.push("/dashboard");
    } else {
      toast.error("Credenciais inválidas!");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Lado esquerdo - imagem */}
      <div className="relative w-full md:w-1/2 h-[50vh] md:h-auto">
        <Image
          src="/login.jpg"
          alt="Imagem da Copa"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Lado direito - formulário */}
      <div className="flex items-center justify-center w-full md:w-1/2 bg-gray-100 dark:bg-gray-900 p-6">
        <div className="w-full max-w-md">
          <ThemeSwitcher />

          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">
                Login
              </CardTitle>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="flex flex-col gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>

              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
