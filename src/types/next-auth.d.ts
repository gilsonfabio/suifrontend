import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
  }
}

export interface Selecao {
  selId: number; 
  selName: string; 
  selTipo: string; 
  selAvatar: string; 
  selPntClass: number; 
  selCrtYellow: number; 
  selCrtRed: number; 
  selGolPros: number; 
  selGolCont: number; 
  selEsqJogo: string; 
  selGrpId: number; 
  selAbreviacao: string; 
  selStatus: string;
}

export interface Grupo {
  grpId: number;
  grpEveId: number;
  grpDescricao: string;
  grpStatus: string;
}

export interface GrupoComSelecoes extends Grupo {
  selecoes: Selecao[];
}