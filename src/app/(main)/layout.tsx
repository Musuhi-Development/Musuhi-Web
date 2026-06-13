import FooterNav from "@/components/shared/FooterNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm relative">
        {children}
      </main>
      <FooterNav />
    </div>
  );
}

