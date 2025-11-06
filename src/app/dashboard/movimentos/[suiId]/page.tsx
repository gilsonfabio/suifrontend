"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/server/api";

export default function MovimentosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();

  const [movim, setMovim] = useState("");
  const [statusSuite, setStatusSuite] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showModalFecha, setShowModalFecha] = useState(false);
  const [qtdUsrExtra, setQtdUsrExtra] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  const suiId = params?.suiId;
  const usrId = session?.user?.id;

  const movimentos = [
    { id: 1, nome: "Entrada" },
    { id: 2, nome: "Transferência" },
    { id: 3, nome: "Pedido" },
    { id: 4, nome: "Limpeza" },
    { id: 5, nome: "Manutenção" },
    { id: 6, nome: "Fechamento" },
  ];

  // 🔍 Buscar status atual da suíte
  const buscarStatusSuite = async () => {
    try {
      if (!suiId) return;
      const resp = await api.get(`/searchSuite/${suiId}`);
      if (!resp?.data) throw new Error("Erro ao buscar status da suíte");

      setStatusSuite(resp.data.suiStatus); 
      console.log("🟢 Status da suíte:", resp.data.suiStatus);
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar status da suíte");
    }
  };

  useEffect(() => {
    buscarStatusSuite();
  }, [suiId]);

  const handleMovimento = (movimento: string) => {
    if (movimento === "Entrada") {
      if (statusSuite !== "A") {
        alert(`A suíte não está disponível. Status atual: ${statusSuite}`);
        return;
      }
      setShowModal(true);
    }

    if (movimento === "Fechamento") {
      if (statusSuite !== "O") {
        alert(`A suíte não está ocupada. Status atual: ${statusSuite}`);
        return;
      }
      setShowModalFecha(true);
    }

    if (movimento === "Pedido") {
      if (statusSuite !== "O") {
        alert(`A suíte não está ocupada. Status atual: ${statusSuite}`);
        return;
      }
      handleLancarPedido()
    }
  };

  const handleConfirmarEntrada = async () => {
    if (!usrId || !suiId) return;
    try {
      setLoading(true);
      const res = await api.post("/entrada", {
        suiId,
        usrId,
        qtdUsrExtra,
      });

      if (!res) throw new Error("Erro ao registrar entrada.");

      console.log("✅ Entrada registrada:", res.data);
      setShowModal(false);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao registrar a entrada.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarFechamento = async () => {
    if (!usrId || !suiId) return;
    try {
      setLoading(true);
      const res = await api.post("/fechar", { movim });

      if (!res) throw new Error("Erro ao registrar fechamento.");

      console.log("✅ Fechamento registrado:", res.data);
      setShowModalFecha(false);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao registrar o fechamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleLancarPedido = async () => {
    if (!usrId || !suiId) return;
    try {
      setLoading(true);
      const resp = await api.get(`/searchMovim/${suiId}`);
      if (!resp?.data) throw new Error("Erro ao buscar movimento da suíte");

      const movId = resp.data.movId;       
      router.push(`/dashboard/pedido/${movId}`)
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao tentar registrar pedido.");
    } finally {
      setLoading(false);
    }
  };

  if (!usrId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1b4b] text-white">
        <p className="text-lg">
          ⚠️ Usuário não autenticado. Faça login novamente.
        </p>
      </div>
    );
  }

  return (
    <section className="w-full bg-[#1e1b4b] text-white min-h-screen relative">
      <div className="container mx-auto px-6 py-16 lg:py-24 relative z-10">
        {/* Cabeçalho */}
        <div className="w-full max-w-5xl mx-auto mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="bg-[#08062e] text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-pink-600/30 hover:shadow-pink-500/30 transition-all duration-300 z-50"
            >
              ← Voltar
            </button>
            <h1 className="text-3xl font-bold">
              Movimentos da Suíte {suiId}
            </h1>
          </div>
        </div>

        {/* Status da suíte */}
        <p className="text-center text-slate-300 mb-6">
          Status atual:{" "}
          <span
            className={`font-bold ${
              statusSuite === "Disponível"
                ? "text-green-400"
                : "text-red-400"
            }`}
          >
            {statusSuite || "Carregando..."}
          </span>
        </p>

        {/* Grid de Movimentos */}
        <div className="w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {movimentos.map((mov) => (
            <button
              key={mov.id}
              onClick={() => handleMovimento(mov.nome)}
              className={`bg-[#1b1740] text-white text-xl font-semibold py-8 rounded-2xl shadow-lg transition-all duration-300
                ${
                  mov.nome === "Entrada" && statusSuite !== "Disponível"
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-[#08062e] hover:shadow-pink-500/30 hover:scale-105"
                }`}
              disabled={mov.nome === "Entrada" && statusSuite !== "Disponível"}
            >
              {mov.nome}
            </button>
          ))}
        </div>

        {/* Rodapé */}
        <p className="mt-10 text-slate-400 text-sm text-center">
          Usuário logado: <strong>{usrId}</strong>
        </p>
      </div>

      {/* Modais iguais aos seus */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-[#1b1740] p-8 rounded-2xl shadow-xl w-[90%] max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">
              Entrada na Suíte {suiId}
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Informe a quantidade de usuários extras:
            </p>
            <input
              type="number"
              min="0"
              value={qtdUsrExtra}
              onChange={(e) => setQtdUsrExtra(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg bg-[#08062e] text-white text-center mb-6 focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="0"
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarEntrada}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all duration-300"
                disabled={loading}
              >
                {loading ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fechamento */}
      {showModalFecha && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-50">
          <div className="bg-[#1b1740] p-8 rounded-2xl shadow-xl w-[90%] max-w-md text-center">
            <h2 className="text-2xl font-bold mb-4">
              Fechamento da Suíte {suiId}
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModalFecha(false)}
                className="bg-gray-600 hover:bg-gray-500 text-white font-semibold px-4 py-2 rounded-lg transition-all duration-300"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarFechamento}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all duration-300"
                disabled={loading}
              >
                {loading ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
