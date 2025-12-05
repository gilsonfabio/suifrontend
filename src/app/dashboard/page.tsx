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
      setCategorias(res.data);
    } catch (err) {
      console.log("❌ Erro ao buscar categorias:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchCategorias();
  }, [status, fetchCategorias]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status === "authenticated") {
        fetchCategorias();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => window.removeEventListener("visibilitychange", handleVisibilityChange);
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
      <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-20">
        <div className="space-y-4 text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-wide drop-shadow-xl">
            Categorias e Suítes
          </h2>
          <p className="text-gray-300">Visualize o status das suítes em tempo real</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-300 animate-pulse">Carregando categorias...</p>
        ) : categorias.length === 0 ? (
          <p className="text-center text-gray-300">Nenhuma categoria disponível.</p>
        ) : (
          <>
            {/* 🔹 Legenda de status com totalizadores */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {(() => {
                const allSuites = categorias.flatMap((cat) => cat.suites || []);

                const totals = {
                  ocupadas: allSuites.filter((s) => s.suiStatus === "O").length,
                  limpeza: allSuites.filter((s) => s.suiStatus === "L").length,
                  manutencao: allSuites.filter((s) => s.suiStatus === "M").length,
                  disponiveis: allSuites.filter((s) => s.suiStatus === "A").length,
                };

                const items = [
                  { label: "Ocupadas", value: totals.ocupadas, color: "bg-red-600", dot: "bg-white/30", text: "text-white" },
                  { label: "Limpeza", value: totals.limpeza, color: "bg-yellow-400", dot: "bg-black/20", text: "text-black" },
                  { label: "Manutenção", value: totals.manutencao, color: "bg-gray-400", dot: "bg-black/20", text: "text-black" },
                  { label: "Disponíveis", value: totals.disponiveis, color: "bg-[#1b1740]", dot: "bg-pink-500/30", text: "text-white" },
                ];

                return items.map((item, index) => (
                  <div
                    key={index}
                    className={`${item.color} ${item.text} flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg backdrop-blur-md`}
                  >
                    <div className={`w-4 h-4 rounded-full ${item.dot}`} />
                    <span className="font-medium">{item.value} {item.label}</span>
                  </div>
                ));
              })()}
            </div>

            {/* 🔹 Grid de categorias e suítes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {categorias.map((categoria) => (
                <div
                  key={categoria.catId}
                  className="bg-[#0d0a3a] p-6 rounded-3xl shadow-2xl border border-pink-600/20 hover:border-pink-500/40 transition-all duration-300 hover:shadow-pink-500/20 flex flex-col"
                >
                  <h3 className="text-xl font-bold mb-5 text-center pb-2 border-b border-pink-500/40">
                    {categoria.catDescricao}
                  </h3>

                  {categoria.suites?.length ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {categoria.suites.map((suite) => {
                        const statusMap: any = {
                          O: "bg-red-600 text-white animate-pulse",
                          L: "bg-yellow-400 text-black",
                          M: "bg-gray-400 text-black",
                          A: "bg-[#1b1740] text-white hover:bg-pink-600/30",
                        };

                        return (
                          <button
                            key={suite.suiId}
                            onClick={() => handleIrMovimentos(suite.suiId)}
                            className={`p-3 text-center text-sm rounded-xl font-medium transition-all duration-200 hover:scale-105 ${statusMap[suite.suiStatus || "A"]}`}
                          >
                            {suite.suiDescricao}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs text-center italic mt-4">Nenhuma suíte cadastrada.</p>
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
