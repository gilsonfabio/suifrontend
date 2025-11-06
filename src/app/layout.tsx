import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Meu App Next 15",
  description: "NextAuth + API externa + Tema dark/light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
