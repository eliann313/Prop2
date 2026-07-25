import { EncabezadoSitio } from "@/shared/components/EncabezadoSitio";

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EncabezadoSitio />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
    </>
  );
}
