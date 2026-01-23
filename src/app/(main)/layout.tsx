export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* フッターナビ、FABなどを配置 */}
      <main>{children}</main>
      {/* <FooterNav /> */}
      {/* <RecordingFAB /> */}
    </div>
  );
}
