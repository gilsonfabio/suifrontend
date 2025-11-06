"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/server/api";

interface Suite {
  suiId: number;
  suiDescricao?: string;
  catId?: number;
  suiStatus?: "A" | "O" | "L" | "M";
}

interface Categoria {
  catId: number;
  catDescricao?: string;
  suites?: Suite[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/categorias");
      console.log("📦 Dados recebidos da API:", res.data);
      setCategorias(res.data);
    } catch (err) {
      console.log("❌ Erro ao buscar categorias:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchCategorias();
    }
  }, [status, fetchCategorias]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status === "authenticated") {
        console.log("🔁 Atualizando categorias ao voltar para a tela...");
        fetchCategorias();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, fetchCategorias]);

  const handleIrMovimentos = (suiId: number) => {
    router.push(`/dashboard/movimentos/${suiId}`);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e1b4b] text-white">
        Carregando sessão...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1e1b4b] text-white">
        Acesso negado. Faça login para continuar.
      </div>
    );
  }

  return (
    <section className="w-full bg-[#1e1b4b] text-white min-h-screen">
      <div className="container mx-auto px-6 py-16 lg:py-24">
        <div className="space-y-6 text-center mb-12">
          <h2 className="text-3xl font-bold">Categorias e Suítes</h2>
        </div>
  
        {loading ? (
          <p className="text-center text-gray-300">Carregando categorias...</p>
        ) : categorias.length === 0 ? (
          <p className="text-center text-gray-300">
            Nenhuma categoria disponível.
          </p>
        ) : (
          <>
            {/* 🔹 Legenda de status com totalizadores */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {(() => {
                // Conta as suítes por status
                const allSuites = categorias.flatMap((cat) => cat.suites || []);
                const totalOcupadas = allSuites.filter((s) => s.suiStatus === "O").length;
                const totalLimpeza = allSuites.filter((s) => s.suiStatus === "L").length;
                const totalManutencao = allSuites.filter((s) => s.suiStatus === "M").length;
                const totalDisponiveis = allSuites.filter((s) => s.suiStatus === "A").length;
  
                return (
                  <>
                    <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg shadow">
                      <div className="w-4 h-4 rounded-full bg-white/30" />
                      <span>{totalOcupadas} suíte(s) ocupada(s)</span>
                    </div>
  
                    <div className="flex items-center gap-2 bg-yellow-400 text-black px-3 py-2 rounded-lg shadow">
                      <div className="w-4 h-4 rounded-full bg-black/20" />
                      <span>{totalLimpeza} suíte(s) em limpeza</span>
                    </div>
  
                    <div className="flex items-center gap-2 bg-gray-400 text-black px-3 py-2 rounded-lg shadow">
                      <div className="w-4 h-4 rounded-full bg-black/20" />
                      <span>{totalManutencao} suíte(s) em manutenção</span>
                    </div>
  
                    <div className="flex items-center gap-2 bg-[#1b1740] text-white px-3 py-2 rounded-lg shadow">
                      <div className="w-4 h-4 rounded-full bg-pink-500/30" />
                      <span>{totalDisponiveis} suíte(s) disponível(is)</span>
                    </div>
                  </>
                );
              })()}
            </div>
  
            {/* 🔹 Grid de categorias e suítes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6 items-start">
              {categorias.map((categoria) => (
                <div
                  key={categoria.catId}
                  className="bg-[#08062e] p-5 rounded-2xl shadow-lg hover:shadow-pink-500/30 transition-all duration-300 flex flex-col h-full"
                >
                  <h3 className="text-lg font-bold mb-4 text-center border-b border-pink-500/50 pb-1">
                    {categoria.catDescricao}
                  </h3>
  
                  {categoria.suites && categoria.suites.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 items-start">
                      {categoria.suites.map((suite) => {
                        const isOcupada = suite.suiStatus === "O";
                        const isLimpeza = suite.suiStatus === "L";
                        const isManutencao = suite.suiStatus === "M";
  
                        let buttonClasses = "";
                        if (isOcupada) {
                          buttonClasses = "bg-red-600 text-white animate-pulse";
                        } else if (isLimpeza) {
                          buttonClasses = "bg-yellow-400 text-black";
                        } else if (isManutencao) {
                          buttonClasses = "bg-gray-400 text-black";
                        } else {
                          buttonClasses = "bg-[#1b1740] text-white hover:bg-pink-600/30";
                        }
  
                        return (
                          <button
                            key={suite.suiId}
                            onClick={() => handleIrMovimentos(suite.suiId)}
                            className={`text-center text-sm p-2 w-full rounded-lg hover:scale-105 transition-all duration-200 ${buttonClasses}`}
                          >
                            {suite.suiDescricao}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs mt-4 text-center italic">
                      Nenhuma suíte cadastrada.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
