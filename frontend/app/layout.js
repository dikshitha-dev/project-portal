import "./globals.css";

export const metadata = {
  title: "Project Review & Mentorship Portal",
  description: "Submit, review, and track project progress with a premium experience",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
