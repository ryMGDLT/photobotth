import { PhotoboothWizard } from "@/features/photobooth/components/photobooth-wizard";

export default async function StartPage({
  searchParams,
}: {
  searchParams?: Promise<{ step?: string }>;
}) {
  const params = await searchParams;
  const requestedStep =
    params?.step === "camera" ||
    params?.step === "editor" ||
    params?.step === "finish"
      ? params.step
      : undefined;

  return <PhotoboothWizard initialStep={requestedStep} />;
}
