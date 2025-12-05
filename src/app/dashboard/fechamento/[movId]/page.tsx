"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/server/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { useParams, useRouter } from "next/navigation";
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
  movSuiUsrSai: number;
  movSuiUsrQtdExtra: number;
  movSuiUsrVlrExtra: number;
  movSuiPrmId: number;
  movSuiPrmValor: number;
  movSuiVlrDeposito: number;
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

export default function FechamentoPage() {
  const router = useRouter();
  const params = useParams();
  const movim = params?.movId as string;

  const [movimento, setMovimento] = useState<Movimento | null>(null);
  const [itens, setItens] = useState<ItemConsumo[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [codigoProduto, setCodigoProduto] = useState("");
  const [quantidade, setQuantidade] = useState<number>(1);

  const [modalRetirar, setModalRetirar] = useState(false);
  const [codigoRemove, setCodigoRemove] = useState("");
  const [qtdRemove, setQtdRemove] = useState<number>(1);

  const [produtoInfo, setProdutoInfo] = useState<any | null>(null);
  const [loadingProduto, setLoadingProduto] = useState(false);

  const [listaBusca, setListaBusca] = useState<any[]>([]);
  const [buscaDescricao, setBuscaDescricao] = useState("");

  const [tempoPermanencia, setTempoPermanencia] = useState("00:00");
  const [totalComSuite, setTotSuite] = useState(0);
  const [totalAPagar, setTotalAPagar] = useState(0);

  const [showModalFechamento, setShowModalFechamento] = useState(false);

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
    )}:00`;
  };

  function atualizarTotal(mov: Movimento | null, valorSuite: number | null | undefined) {
    if (!mov) return;
  
    const suite = Number(valorSuite ?? 0);
    const consumo = Number(mov.movSuiTotConsumo ?? 0);
    const extra = Number(mov.movSuiUsrVlrExtra ?? 0);
    const deposito = Number(mov.movSuiVlrDeposito ?? 0);

    const total = ((suite + consumo + extra) - deposito);
  
    console.log("🧮 Suite:", suite, "Consumo:", consumo, "TOTAL =", total);
  
    setTotalAPagar(total);
  }

  const atualizarValorSuite = async (tmp: string, mov?: Movimento) => {
    try {
      const suiId = mov?.movSuiId ?? movimento?.movSuiId;
  
      const res = await api.get(`/vlrPermanencia/${suiId}/${tmp}`);
  
      // CORREÇÃO IMPORTANTE AQUI
      const valorSuite = Number(res.data.valorTotal ?? 0);
  
      console.log("Valor retornado da API (suite):", valorSuite, res.data);
  
      setTotSuite(valorSuite);
  
      atualizarTotal(movimento, valorSuite);
  
    } catch (err) {
      console.log("Erro ao buscar valor da suíte:", err);
    }
  };

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
    setCodigoProduto(String(prod.prdId));
    setProdutoInfo(prod);
    setListaBusca([]);
    setBuscaDescricao(prod.prdDescricao);
  };

  const carregarMovimento = async () => {
    try {
      const respMov = await api.get(`/dadosMovim/${movim}`);
      const mov = respMov.data;
  
      // 1) Salva movimento
      setMovimento(mov);
  
      // 2) Carrega itens
      const respItens = await api.get(`/searchItens/${movim}`);
      setItens(respItens.data ?? []);
  
      // 3) Calcula tempo de permanência imediatamente
      const tmp = calcularPermanencia(mov.movSuiEntrada);
      setTempoPermanencia(tmp);
  
      // 4) Calcula o valor da permanência (API)
      const res = await api.get(`/vlrPermanencia/${mov.movSuiId}/${tmp}`);
      const valorSuite = Number(res.data.valorTotal ?? 0);
  
      // 5) Atualiza o valor da permanência (isso chama o cálculo total automaticamente)
      setTotSuite(valorSuite);
  
      // 6) GARANTE o cálculo correto do total depois da permanência
      atualizarTotal(mov, valorSuite);
  
    } catch (err) {
      console.log("Erro carregar movimento:", err);
      alert("Erro ao carregar dados");
    }
  };
  
  useEffect(() => {
    if (movimento) {
      atualizarTotal(movimento, totalComSuite);
    }
  }, [movimento, totalComSuite]);

  useEffect(() => {
    if (movim) carregarMovimento();
  }, [movim]);

  useEffect(() => {
    if (!movimento?.movSuiEntrada || movimento.movSuiSaida) return;
  
    const atualizarTempo = () => {
      const tmp = calcularPermanencia(movimento.movSuiEntrada);
      setTempoPermanencia(tmp);
    };
  
    const atualizarValor = async () => {
      const tmp = calcularPermanencia(movimento.movSuiEntrada);
      await atualizarValorSuite(tmp);
    };
  
    // Atualiza imediatamente ao abrir a tela
    atualizarTempo();
    atualizarValor();
  
    // Atualiza visualmente a cada 10 segundo
    const intervalTempo = setInterval(atualizarTempo, 10000);
  
    // Chama a API apenas a cada 10 segundos
    const intervalValor = setInterval(atualizarValor, 10000);
  
    return () => {
      clearInterval(intervalTempo);
      clearInterval(intervalValor);
    };
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

      await carregarMovimento();
      atualizarTotal(movimento, totalComSuite);

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

      await carregarMovimento();
      atualizarTotal(movimento, totalComSuite);

    } catch {
      alert("Erro ao retirar item");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarFechamento = async (movId: number) => {
    if (!movId) {
      alert("Movimento inválido.");
      return;
    }
  
    try {
      setLoading(true);
  
      const res = await api.post("/fechar", { movim: movId });
  
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

  function formatarDataBR(dataISO: string | null): string {
    if (!dataISO) return "—";
  
    const data = new Date(dataISO);
  
    return data.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    });
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Pedido da Suíte #{movimento?.movSuiId ?? "—"}
      </h1>

      {/* Dados do pedido */}
      {movimento && (
        <Card>
          <CardHeader className="font-semibold text-lg flex items-center justify-between">
            <span>Dados do Pedido</span>
            <button
              onClick={() => router.back()}
              className="bg-[#08062e] text-white px-4 py-2 rounded-lg hover:bg-pink-800 ">
                ← Voltar
            </button>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <p><strong>ID:</strong> {movimento.movId}</p>
            <p><strong>Entrada:</strong> {formatarDataBR(movimento.movSuiEntrada)}</p>
            <p><strong>Saída:</strong> {movimento.movSuiSaida || "—"}</p>
            <p><strong>Permanência:</strong> {tempoPermanencia}</p>
            <p><strong>Valor da Permanência:</strong> R$ {Number(totalComSuite || 0).toFixed(2)}</p>
            <p><strong>Consumo:</strong> R$ {Number(movimento.movSuiTotConsumo).toFixed(2)}</p>
            <p>
              <strong>Usuários Extra:</strong> {Number(movimento.movSuiUsrQtdExtra)} — R$ {Number(movimento.movSuiUsrVlrExtra).toFixed(2)}
            </p>
            <p>
              <strong>Deposito:</strong> R$ {Number(movimento.movSuiVlrDeposito).toFixed(2)}
            </p>
            <p>
              <strong>Total a Pagar:</strong>
                <span className="font-bold text-green-700">
                {" "}
                R$ {Number(totalAPagar || 0).toFixed(2)}
              </span>
            </p>
            <p><strong>Status:</strong> {movimento.movSuiStatus}</p>
          </CardContent>
        </Card>
      )}

      {/* Itens */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="font-semibold text-lg">Itens do Pedido</h2>

          <div className="flex gap-2">

            {/* Modal lançar */}
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

                  {/* Buscar por descrição */}
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
                          <p className="text-xs text-gray-600">
                            Ref: {p.prdReferencia}
                          </p>
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
                      <p>
                        <strong>{produtoInfo.prdDescricao}</strong>
                      </p>
                      <p>Ref: {produtoInfo.prdReferencia}</p>
                      <p>
                        Preço: R$ {Number(produtoInfo.prdPrcUnitario).toFixed(2)}
                      </p>
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

            {/* Modal retirar */}
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
                  <Button
                    onClick={handleConfirmarRetirada}
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Confirmar"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            {/* Modal Fechamento */}
            <Dialog
                open={showModalFechamento}
                onOpenChange={(aberto) => setShowModalFechamento(aberto)}
            >
                <DialogTrigger asChild>
                    <Button variant="outline" className="bg-blue-600 text-white hover:bg-blue-700">
                        Fechamento
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Fechamento</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-gray-700 py-3">
                        Deseja realmente fechar o movimento #{movimento?.movId}?
                    </p>
                    <DialogFooter>
                        <Button
                            onClick={() => handleConfirmarFechamento(movimento!.movId)}
                            disabled={loading}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {loading ? "Processando..." : "Confirmar Fechamento"}
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
