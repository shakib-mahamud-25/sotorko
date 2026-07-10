export default function PrivacyPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="text-muted-foreground">
        Sotorko is built privacy-first: no account is required to submit a
        report, your exact location is stored securely and never shown
        publicly, and uploaded photos are visible only to moderators with
        metadata stripped automatically.
      </p>
      <p className="text-muted-foreground">
        Full legal policy text pending review — placeholder for MVP scaffold.
      </p>
    </div>
  );
}
