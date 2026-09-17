import "./globals.css";

export const metadata = {
  title: "Administration des plats",
  description: "API REST protégée par clé, avec son administration : Next.js, Prisma, PostgreSQL",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
