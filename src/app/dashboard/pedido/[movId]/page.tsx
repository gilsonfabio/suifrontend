"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api } from "@/server/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Movimento {
  movId: number;
  movSuiId: number;
  movSuiEntrada: string;
  movSuiSaida: string | null;
  movSuiTmpPer: string | null;
  movSuiVlr: number;
  movSuiTotConsumo: number;
  movSuiTotPagar: number;
  movSuiStatus: string;
}

interface ItemConsumo {
  movSuiId: number;
  movSuiProId: string;
  movSuiProQtd: number;
  movSuiProVUnit: number;
  movSuiProVTotal: number;
  prdUnidade: string;
  prdDescricao: string;
  prdReferencia: string;
}

export default function PedidoPage() {
  const params = useParams();
  const movim = params?.movId as string;

  const [movimento, setMovimento] = useState<Movimento | null>(null);
  const [itens, setItens] = useState<ItemConsumo[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal lançar
  const [modalOpen, setModalOpen] = useState(false);
  const [codigoProduto, setCodigoProduto] = useState("");
  const [quantidade, setQuantidade] = useState<number>(1);

  // Modal retirar
  const [modalRetirar, setModalRetirar] = useState(false);
  const [codigoRemove, setCodigoRemove] = useState("");
  const [qtdRemove, setQtdRemove] = useState<number>(1);

  // Produto carregado
  const [produtoInfo, setProdutoInfo] = useState<any | null>(null);
  const [loadingProduto, setLoadingProduto] = useState(false);

  // Busca por descrição
  const [listaBusca, setListaBusca] = useState<any[]>([]);
  const [buscaDescricao, setBuscaDescricao] = useState("");

  // Tempo permanência
  const [tempoPermanencia, setTempoPermanencia] = useState("00:00");

  const calcularPermanencia = (entrada: string) => {
    const inicio = new Date(entrada);
    const agora = new Date();
    const diffMs = agora.getTime() - inicio.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const horas = Math.floor(diffMin / 60);
    const minutos = diffMin % 60;

    return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(
      2,
      "0"
    )}`;
  };

  // Buscar por código
  const buscarProduto = async () => {
    if (!codigoProduto.trim()) {
      setProdutoInfo(null);
      return;
    }

    try {
      setLoadingProduto(true);
      const res = await api.get(`/searchProd/${codigoProduto}`);
      setProdutoInfo(res.data);
    } catch {
      setProdutoInfo(null);
    } finally {
      setLoadingProduto(false);
    }
  };

  // Buscar por descrição
  const buscarPorDescricao = async (texto: string) => {
    if (texto.trim().length < 2) {
      setListaBusca([]);
      return;
    }

    try {
      const res = await api.get(`/searchProdDesc/${texto}`);
      setListaBusca(res.data ?? []);
    } catch {
      setListaBusca([]);
    }
  };

  const selecionarProdutoBusca = (prod: any) => {
    setCodigoProduto(String(prod.prdId));  // <- AGORA USA prdId
    setProdutoInfo(prod);
    setListaBusca([]);
    setBuscaDescricao(prod.prdDescricao);
  };

  // Carregar dados iniciais
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const respMov = await api.get(`/dadosMovim/${movim}`);
        setMovimento(respMov.data);

        const respItens = await api.get(`/searchItens/${movim}`);
        setItens(respItens.data ?? []);
      } catch {
        alert("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    if (movim) load();
  }, [movim]);

  // Atualizar permanência
  useEffect(() => {
    if (!movimento?.movSuiEntrada || movimento.movSuiSaida) return;

    setTempoPermanencia(calcularPermanencia(movimento.movSuiEntrada));

    const interval = setInterval(() => {
      setTempoPermanencia(calcularPermanencia(movimento.movSuiEntrada));
    }, 1000);

    return () => clearInterval(interval);
  }, [movimento?.movSuiEntrada, movimento?.movSuiSaida]);

  const limparCamposLancar = () => {
    setCodigoProduto("");
    setQuantidade(1);
    setProdutoInfo(null);
    setListaBusca([]);
    setBuscaDescricao("");
  };

  const handleConfirmarLancamento = async () => {
    try {
      if (!codigoProduto.trim()) return alert("Código obrigatório");
      if (!produtoInfo) return alert("Produto não encontrado");

      setLoading(true);

      await api.post("/newItem", {
        movId: movimento?.movId,
        movConProId: codigoProduto,
        movConProQtd: quantidade,
        movConProVlrUnitario: produtoInfo.prdPrcUnitario,
      });

      setModalOpen(false);
      limparCamposLancar();

      const respMov = await api.get(`/dadosMovim/${movim}`);
      setMovimento(respMov.data);

      const respItens = await api.get(`/searchItens/${movim}`);
      setItens(respItens.data ?? []);
    } catch {
      alert("Erro ao lançar item");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarRetirada = async () => {
    try {
      if (!codigoRemove.trim()) return alert("Informe o código");

      setLoading(true);

      await api.post("/removeItem", {
        movId: movimento?.movId,
        movConProId: codigoRemove,
        movConProQtd: qtdRemove,
      });

      setModalRetirar(false);
      setCodigoRemove("");
      setQtdRemove(1);

      const respMov = await api.get(`/dadosMovim/${movim}`);
      setMovimento(respMov.data);

      const respItens = await api.get(`/searchItens/${movim}`);
      setItens(respItens.data ?? []);
    } catch {
      alert("Erro ao retirar item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Pedido da Suíte #{movimento?.movSuiId ?? "—"}
      </h1>

      {/* Dados do pedido */}
      {movimento && (
        <Card>
          <CardHeader className="font-semibold text-lg">
            Dados do Pedido
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <p><strong>ID:</strong> {movimento.movId}</p>
            <p><strong>Entrada:</strong> {movimento.movSuiEntrada}</p>
            <p><strong>Saída:</strong> {movimento.movSuiSaida || "—"}</p>
            <p><strong>Permanência:</strong> {tempoPermanencia}</p>
            <p><strong>Valor Suíte:</strong> R$ {movimento.movSuiVlr.toFixed(2)}</p>
            <p><strong>Consumo:</strong> R$ {Number(movimento.movSuiTotConsumo).toFixed(2)}</p>
            <p><strong>Total a Pagar:</strong> R$ {Number(movimento.movSuiTotPagar).toFixed(2)}</p>
            <p><strong>Status:</strong> {movimento.movSuiStatus}</p>
          </CardContent>
        </Card>
      )}

      {/* Itens */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Itens do Pedido</h2>

          <div className="flex gap-2">

            {/* MODAL LANÇAR */}
            <Dialog
              open={modalOpen}
              onOpenChange={(aberto) => {
                setModalOpen(aberto);
                if (!aberto) limparCamposLancar();
              }}
            >
              <DialogTrigger asChild>
                <Button>+ Lançar Item</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Lançar Item</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">

                  {/* BUSCAR POR DESCRIÇÃO */}
                  <Input
                    placeholder="Buscar produto por descrição..."
                    value={buscaDescricao}
                    onChange={(e) => {
                      setBuscaDescricao(e.target.value);
                      buscarPorDescricao(e.target.value);
                    }}
                  />

                  {listaBusca.length > 0 && (
                    <div className="border rounded p-2 max-h-40 overflow-y-auto bg-white shadow">
                      {listaBusca.map((p) => (
                        <div
                          key={p.prdId}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => selecionarProdutoBusca(p)}
                        >
                          <p className="font-semibold">{p.prdDescricao}</p>
                          <p className="text-xs text-gray-600">Ref: {p.prdReferencia}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Código */}
                  <Input
                    placeholder="Código do Produto"
                    value={codigoProduto}
                    onChange={(e) => setCodigoProduto(e.target.value)}
                    onBlur={buscarProduto}
                  />

                  {/* Quantidade */}
                  <Input
                    type="number"
                    placeholder="Quantidade"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Number(e.target.value))}
                  />

                  {/* Produto carregado */}
                  {loadingProduto && <p>Carregando...</p>}

                  {produtoInfo && (
                    <div className="p-3 border rounded bg-gray-50">
                      <p><strong>{produtoInfo.prdDescricao}</strong></p>
                      <p>Ref: {produtoInfo.prdReferencia}</p>
                      <p>Preço: R$ {Number(produtoInfo.prdPrcUnitario).toFixed(2)}</p>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button onClick={handleConfirmarLancamento} disabled={loading}>
                    {loading ? "Salvando..." : "Confirmar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* MODAL RETIRAR */}
            <Dialog
              open={modalRetirar}
              onOpenChange={(aberto) => {
                setModalRetirar(aberto);
                if (!aberto) {
                  setCodigoRemove("");
                  setQtdRemove(1);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button variant="destructive">– Retirar Item</Button>
              </DialogTrigger>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Retirar Item</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                  <Input
                    placeholder="Código do Produto"
                    value={codigoRemove}
                    onChange={(e) => setCodigoRemove(e.target.value)}
                  />

                  <Input
                    type="number"
                    placeholder="Quantidade"
                    value={qtdRemove}
                    onChange={(e) => setQtdRemove(Number(e.target.value))}
                  />
                </div>

                <DialogFooter>
                  <Button onClick={handleConfirmarRetirada} disabled={loading}>
                    {loading ? "Processando..." : "Confirmar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {(itens.length ?? 0) > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 border-b pb-2 font-semibold text-sm text-gray-700">
              <p>Produto</p>
              <p>Descrição</p>
              <p>Referência</p>
              <p>Unidade</p>
              <p>Qtd</p>
              <p>Vlr Unitário</p>
              <p>Total</p>
            </div>
          )}

          {itens.length === 0 ? (
            <p className="text-gray-500">Nenhum item lançado.</p>
          ) : (
            itens.map((item) => (
              <div
                key={`${item.movSuiId}-${item.movSuiProId}`}
                className="grid grid-cols-1 md:grid-cols-7 gap-3 border-b py-2 text-sm"
              >
                <p>{item.movSuiProId}</p>
                <p>{item.prdDescricao}</p>
                <p>{item.prdReferencia}</p>
                <p>{item.prdUnidade}</p>
                <p>{item.movSuiProQtd}</p>
                <p>R$ {item.movSuiProVUnit.toFixed(2)}</p>
                <p className="font-bold text-green-700">
                  R$ {item.movSuiProVTotal.toFixed(2)}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
