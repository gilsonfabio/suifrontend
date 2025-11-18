"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/server/api";

// Tipagem opcional
type MovimentoSuite = {
  movId: number;
  movSuiId: number;
  movSuiEntrada: string;
  movSuiStatus: string;
};

export default function MovimentosPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();

  const [statusSuite, setStatusSuite] = useState<string | null>(null);
  const [movimentoAtual, setMovimentoAtual] = useState<MovimentoSuite | null>(null);

  const [showModalEntrada, setShowModalEntrada] = useState(false);
  const [showModalFechamento, setShowModalFechamento] = useState(false);

  const [qtdUsrExtra, setQtdUsrExtra] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // Params
  const suiId = params?.suiId;
  const usrId = session?.user?.id;

  // Lista de movimentos
  const movimentos = [
    { id: 1, nome: "Entrada" },
    { id: 2, nome: "Transferência" },
    { id: 3, nome: "Pedido" },
    { id: 4, nome: "Limpeza" },
    { id: 5, nome: "Manutenção" },
    { id: 6, nome: "Fechamento" },
  ];

  // =============================================================
  // 🔍 Buscar status da suíte
  // =============================================================
  const carregarStatusSuite = async () => {
    try {
      if (!suiId) return;

      const resp = await api.get(`/searchSuite/${suiId}`);
      setStatusSuite(resp.data?.suiStatus || null);
    } catch (err) {
      console.error(err);
      alert("Erro ao obter status da suíte.");
    }
  };

  useEffect(() => {
    carregarStatusSuite();
  }, [suiId]);

  // =============================================================
  // 🔍 Buscar movimento ativo da suíte
  // =============================================================
  const carregarMovimentoAtual = async () => {
    try {
      const resp = await api.get(`/searchMovim/${suiId}`);
      if (!resp.data) throw new Error("Movimento não encontrado.");
      setMovimentoAtual(resp.data);
    } catch (err) {
      console.error(err);
      alert("Erro ao obter movimento atual.");
    }
  };

  // =============================================================
  // 📌 Ação ao clicar em um movimento
  // =============================================================
  const handleMovimento = async (tipo: string) => {

    if (tipo === "Entrada") {
      if (statusSuite !== "A") {
        alert(`A suíte não está disponível. Status atual: ${statusSuite}`);
        return;
      }
      setShowModalEntrada(true);
      return;
    }

    if (tipo === "Fechamento") {
      if (statusSuite !== "O") {
        alert(`A suíte não está ocupada. Status atual: ${statusSuite}`);
        return;
      }

      await carregarMovimentoAtual();
      setShowModalFechamento(true);
      return;
    }

    if (tipo === "Pedido") {
      if (statusSuite !== "O") {
        alert(`A suíte não está ocupada. Status atual: ${statusSuite}`);
        return;
      }
      handleLancarPedido();
      return;
    }

    if (tipo === "Limpeza") {
      handleLimpezaSuite();
      return;
    }

    if (tipo === "Manutenção") {
      handleManutencaoSuite();
      return;
    }

    alert(`Movimento "${tipo}" ainda não implementado.`);
  };

  // =============================================================
  // ✔ Entrada
  // =============================================================
  const handleConfirmarEntrada = async () => {
    if (!usrId || !suiId) return;

    try {
      setLoading(true);

      const res = await api.post("/entrada", {
        suiId,
        usrId,
        qtdUsrExtra,
      });

      console.log("Entrada registrada:", res.data);

      setShowModalEntrada(false);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar entrada.");
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // ✔ Fechamento
  // =============================================================
  const handleConfirmarFechamento = async () => {
    if (!movimentoAtual?.movId) {
      alert("Não foi possível encontrar o movimento ativo.");
      return;
    }

    try {
      setLoading(true);

      const res = await api.post("/fechar", {
        movim: movimentoAtual.movId,
      });

      console.log("Fechamento concluído:", res.data);

      setShowModalFechamento(false);
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Erro ao registrar fechamento.");
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // ✔ Pedido
  // =============================================================
  const handleLancarPedido = async () => {
    try {
      const resp = await api.get(`/searchMovim/${suiId}`);
      const movId = resp.data?.movId;

      if (!movId) throw new Error("Movimento não encontrado.");

      router.push(`/dashboard/pedido/${movId}`);
    } catch (err) {
      console.error(err);
      alert("Erro ao iniciar pedido.");
    }
  };

  // =============================================================
  // ✔ LIMPEZA — NOVO
  // =============================================================
  const handleLimpezaSuite = async () => {
    try {
      if (!suiId) return;

      setLoading(true);

      const res = await api.put(`/limpezaSuite/${suiId}`);

      console.log("Status da suíte atualizado:", res.data);

      await carregarStatusSuite();

      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status da suíte.");
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // ✔ MANUTENÇÃO — NOVO
  // =============================================================
  const handleManutencaoSuite = async () => {
    try {
      if (!suiId) return;

      setLoading(true);

      const res = await api.put(`/manutencaoSuite/${suiId}`);

      console.log("Status da suíte atualizado:", res.data);

      await carregarStatusSuite();

      router.push("/dashboard");

    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status da suíte.");
    } finally {
      setLoading(false);
    }
  };

  // =============================================================
  // 🔐 Quando não autenticado
  // =============================================================
  if (!usrId) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1e1b4b] text-white">
        <p>⚠️ Usuário não autenticado.</p>
      </div>
    );
  }

  // =============================================================
  // 🖥 Renderização
  // =============================================================
  return (
    <section className="w-full bg-[#1e1b4b] text-white min-h-screen">

      <div className="container mx-auto px-6 py-16">

        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="bg-[#08062e] px-4 py-2 rounded-lg hover:bg-pink-600/30"
          >
            ← Voltar
          </button>

          <h1 className="text-3xl font-bold">Movimentos da Suíte {suiId}</h1>
        </div>

        <p className="text-center mb-4 text-slate-300">
          Status atual:{" "}
          <span className="font-bold text-pink-400">
            {statusSuite || "Carregando..."}
          </span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">

          {movimentos.map((mov) => (
            <button
              key={mov.id}
              onClick={() => handleMovimento(mov.nome)}
              className="bg-[#1b1740] py-8 rounded-2xl shadow-lg hover:scale-105 hover:bg-[#08062e] transition"
            >
              {mov.nome}
            </button>
          ))}

        </div>

        <p className="text-center text-sm text-slate-400 mt-10">
          Usuário logado: <strong>{usrId}</strong>
        </p>
      </div>

      {/* === MODAL ENTRADA === */}
      {showModalEntrada && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1b1740] p-8 rounded-2xl w-[90%] max-w-md text-center">

            <h2 className="text-2xl font-bold mb-4">Entrada na Suíte {suiId}</h2>

            <p className="text-slate-300 mb-4">Informe usuários extras:</p>

            <input
              type="number"
              min="0"
              value={qtdUsrExtra}
              onChange={(e) => setQtdUsrExtra(Number(e.target.value))}
              className="w-full px-4 py-2 rounded bg-[#08062e] text-center mb-6"
            />

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModalEntrada(false)}
                className="bg-gray-600 px-4 py-2 rounded-lg"
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmarEntrada}
                className="bg-pink-600 px-4 py-2 rounded-lg"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Confirmar"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* === MODAL FECHAMENTO === */}
      {showModalFechamento && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1b1740] p-8 rounded-2xl w-[90%] max-w-md text-center">

            <h2 className="text-2xl font-bold mb-4">Fechar Suíte {suiId}</h2>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowModalFechamento(false)}
                className="bg-gray-600 px-4 py-2 rounded-lg"
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                onClick={handleConfirmarFechamento}
                className="bg-pink-600 px-4 py-2 rounded-lg"
                disabled={loading}
              >
                {loading ? "Fechando..." : "Confirmar"}
              </button>
            </div>

          </div>
        </div>
      )}

    </section>
  );
}

