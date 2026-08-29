import "./globals.css";

export const metadata = {
  title: "PG Management System",
  description: "PG owner management workspace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}