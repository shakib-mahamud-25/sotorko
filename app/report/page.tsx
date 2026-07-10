import { ReportForm } from "@/components/report/report-form";

export const metadata = {
  title: "Report an Incident",
};

export default function ReportPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <ReportForm />
    </div>
  );
}
