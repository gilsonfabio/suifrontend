"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/server/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface Movimento {
  movId: number;
  movSuiData: string;
  movSuiId: number;
  movSuiEntrada: string;
  movSuiSaida: string | null;
  movSuiTmpPer: string | null;
  movSuiVlr: number;
  movSuiVlrPer: number;
  movSuiTotConsumo: number;
  movSuiVlrAcrescimo: number;
  movSuiVlrDesconto: number;
  movSuiTotPagar: number;
  movSuiUsrEnt: number;
  movSuiUsrSai: number | null;
  movSuiUsrQtdExtra: number | null;
  movSuiUsrVlrExtra: number | null;
  movSuiPrmId: number | null;
  movSuiPrmValor: number | null;
  movSuiStatus: string;
}

interface ItemConsumo {
  movConId?: number;
  movConSuiId: number;
  movConItem: string;
  movConProId: number | null;
  movConProQtd: number;
  movConProVlrUnitario: number;
  movConProVlrTotal: number;
  movConProPrmId: number | null;
  movConProVlrPrm: number | null;
  movConStatus: string;
  prdDescricao: string;
  prdReferencia: string;
  prdUnidade: string;
  prdPrcUnitario: number | null;
}

export default function PedidoPage() {
  const params = useParams();
  const movim = params?.movId as string; // corrigido se sua pasta for [movim]

  const [movimento, setMovimento] = useState<Movimento | null>(null);
  const [itens, setItens] = useState<ItemConsumo[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Carrega os dados do movimento
  useEffect(() => {
    const fetchMovimento = async () => {
      try {
        setLoading(true);
        const movId = params?.movId;
        const resp = await api.get(`/dadosMovim/${movId}`);
        setMovimento(resp.data);
      } catch (err) {
        console.error("Erro ao buscar movimento:", err);
        alert("Erro ao carregar dados do movimento");
      } finally {
        setLoading(false);
      }
    };

    if (movim) fetchMovimento();
  }, [movim]);

  // 🔹 Adiciona novo item
  const addItem = () => {
    setItens((prev) => [
      ...prev,
      {
        movConSuiId: movimento?.movSuiId || 0,
        movConItem: "",
        movConProId: null,
        movConProQtd: 1,
        movConProVlrUnitario: 0,
        movConProVlrTotal: 0,
        movConProPrmId: null,
        movConProVlrPrm: null,
        movConStatus: "ATIVO",
        prdDescricao: "",
        prdReferencia: "",
        prdUnidade: "",
        prdPrcUnitario: 0,
      },
    ]);
  };

  // 🔹 Atualiza campos e recalcula total
  const handleChangeItem = (
    index: number,
    field: keyof ItemConsumo,
    value: ItemConsumo[keyof ItemConsumo]
  ) => {
    const updated = [...itens];
    updated[index] = { ...updated[index], [field]: value };

    // Recalcula total automaticamente
    if (field === "movConProQtd" || field === "movConProVlrUnitario") {
      const qtd = Number(updated[index].movConProQtd);
      const vlr = Number(updated[index].movConProVlrUnitario);
      updated[index].movConProVlrTotal = qtd * vlr;
    }

    setItens(updated);
  };

  // 🔹 Busca produto ao digitar o código
  const handleBuscarProduto = async (index: number, codigo: string) => {
    try {
      if (!codigo.trim()) return;

      const resp = await api.get(`/produto/${codigo}`); // rota GET /produto/:codigo
      const produto = resp.data;

      const updated = [...itens];
      updated[index] = {
        ...updated[index],
        movConProId: produto.proId,
        movConItem: produto.proDescricao,
        movConProVlrUnitario: produto.proPreco || 0,
        movConProVlrTotal: (updated[index].movConProQtd || 1) * (produto.proPreco || 0),
        prdDescricao: produto.proDescricao,
        prdUnidade: produto.proUnidade,
        prdPrcUnitario: produto.proPreco || 0,
        prdReferencia: codigo,
      };

      setItens(updated);
    } catch (err) {
      console.error("Produto não encontrado:", err);
      alert("Produto não encontrado!");
    }
  };

  // 🔹 Remove item
  const removeItem = (index: number) => {
    setItens((prev) => prev.filter((_, i) => i !== index));
  };

  // 🔹 Salvar itens
  const handleSalvarItens = async () => {
    if (!movimento) return;
    try {
      setLoading(true);
      await api.post(`/pedido/item`, { movId: movimento.movId, itens });
      alert("Itens de consumo lançados com sucesso!");
      setItens([]);
    } catch (err) {
      console.error(err);
      alert("Erro ao lançar itens.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Pedido da Suíte #{movimento?.movSuiId ?? "—"}
      </h1>

      {/* 🔹 Dados do movimento */}
      {movimento && (
        <Card>
          <CardHeader className="font-semibold text-lg">
            Dados do Movimento
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <p><strong>ID:</strong> {movimento.movId}</p>
            <p><strong>Entrada:</strong> {movimento.movSuiEntrada}</p>
            <p><strong>Saída:</strong> {movimento.movSuiSaida || "—"}</p>
            <p><strong>Tempo Permanência:</strong> {movimento.movSuiTmpPer || "—"}</p>
            <p><strong>Valor Suíte:</strong> R$ {(movimento.movSuiVlr ?? 0).toFixed(2)}</p>
            <p><strong>Consumo:</strong> R$ {(movimento.movSuiTotConsumo ?? 0).toFixed(2)}</p>
            <p><strong>Total a Pagar:</strong> R$ {(movimento.movSuiTotPagar ?? 0).toFixed(2)}</p>
            <p><strong>Status:</strong> {movimento.movSuiStatus}</p>
          </CardContent>
        </Card>
      )}

      {/* 🔹 Itens de Consumo */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Itens de Consumo</h2>
          <Button onClick={addItem}>+ Adicionar Item</Button>
        </CardHeader>
        <CardContent>
          {itens.length === 0 && <p className="text-gray-500">Nenhum item adicionado.</p>}

          {itens.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center mb-4 border-b pb-3"
            >
              {/* Código do Produto */}
              <Input
                placeholder="Código do Produto"
                value={item.prdReferencia}
                onChange={(e) =>
                  handleChangeItem(index, "prdReferencia", e.target.value)
                }
                onBlur={(e) => handleBuscarProduto(index, e.target.value)}
              />

              {/* Descrição (auto preenchido) */}
              <Input
                placeholder="Descrição"
                value={item.movConItem}
                onChange={(e) =>
                  handleChangeItem(index, "movConItem", e.target.value)
                }
              />

              {/* Qtd */}
              <Input
                type="number"
                placeholder="Qtd"
                value={item.movConProQtd}
                onChange={(e) =>
                  handleChangeItem(index, "movConProQtd", Number(e.target.value))
                }
              />

              {/* Valor Unitário */}
              <Input
                type="number"
                placeholder="Valor Unitário"
                value={item.movConProVlrUnitario}
                onChange={(e) =>
                  handleChangeItem(index, "movConProVlrUnitario", Number(e.target.value))
                }
              />

              {/* Valor Total */}
              <Input
                type="number"
                disabled
                value={item.movConProVlrTotal}
                className="bg-gray-100"
              />

              {/* Unidade */}
              <Input
                disabled
                value={item.prdUnidade}
                className="bg-gray-100"
                placeholder="Unidade"
              />

              <Button variant="destructive" onClick={() => removeItem(index)}>
                Remover
              </Button>
            </div>
          ))}

          {itens.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button onClick={handleSalvarItens} disabled={loading}>
                {loading ? "Salvando..." : "Lançar Itens"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
