import FooterNav from "@/components/shared/FooterNav";
import FloatingActionButton from "@/components/shared/FloatingActionButton";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm relative">
        {children}
        <FloatingActionButton />
        <div className="max-w-md mx-auto fixed bottom-0 left-0 right-0 z-50">
          <FooterNav />
        </div>
      </main>
    </div>
  );
}

