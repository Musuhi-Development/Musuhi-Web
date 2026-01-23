export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* ヘッダーなしのレイアウト */}
      {children}
    </div>
  );
}
