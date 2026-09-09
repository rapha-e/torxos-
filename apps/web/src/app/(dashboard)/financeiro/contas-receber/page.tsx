"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContasReceberRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/financeiro/titulos?type=RECEIVABLE");
  }, [router]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center text-xs text-[#787774]">
      Redirecionando para Contas a Receber...
    </div>
  );
}
