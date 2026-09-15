import React from 'react';
import { Check, X } from 'lucide-react';

interface FeatureRow {
  title: string;
  caderno: string | boolean;
  sistemasAntigos: string | boolean;
  torxOs: boolean;
}

const COMPARISON_DATA: FeatureRow[] = [
  {
    title: 'Acompanhamento de OS pelo cliente via WhatsApp',
    caderno: false,
    sistemasAntigos: false,
    torxOs: true,
  },
  {
    title: 'Previsão de Ruptura de Estoque com IA',
    caderno: false,
    sistemasAntigos: false,
    torxOs: true,
  },
  {
    title: 'Cálculo de Margem Líquida e DRE em Tempo Real',
    caderno: false,
    sistemasAntigos: 'Complexo',
    torxOs: true,
  },
  {
    title: 'Impressão Térmica de OS com QR Code',
    caderno: false,
    sistemasAntigos: true,
    torxOs: true,
  },
  {
    title: 'Mentor Virtual com IA para Orçamentos e Gestão',
    caderno: false,
    sistemasAntigos: false,
    torxOs: true,
  },
  {
    title: 'Interface Rápida e 100% na Nuvem',
    caderno: false,
    sistemasAntigos: 'Lento / Local',
    torxOs: true,
  },
];

export function ComparisonSection() {
  return (
    <section id="comparativo" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
      <div className="text-center space-y-2">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-amber bg-brand-amber-muted px-3 py-1 rounded-full border border-brand-amber/20">
          Comparativo Direto
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-content-primary tracking-tight">
          Por que trocar o caderno ou sistemas legados pelo TorxOS?
        </h2>
      </div>

      {/* Visão Desktop: Tabela Semântica Acessível */}
      <div className="hidden md:block rounded-2xl border border-surface-border bg-surface-card overflow-hidden shadow-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <caption className="sr-only">Comparativo de funcionalidades entre TorxOS e soluções de mercado</caption>
          <thead>
            <tr className="border-b border-surface-border text-content-secondary text-[11px] uppercase tracking-wider">
              <th scope="col" className="py-4 px-6 font-semibold">Funcionalidade / Capacidade</th>
              <th scope="col" className="py-4 px-4 text-center font-medium">Caderno / Planilhas</th>
              <th scope="col" className="py-4 px-4 text-center font-medium">Sistemas Antigos</th>
              <th scope="col" className="py-4 px-4 text-center text-brand-amber font-bold bg-brand-amber-muted/20 border-x border-brand-amber/20">
                TorxOS PRO
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border text-content-primary">
            {COMPARISON_DATA.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                <th scope="row" className="py-4 px-6 font-medium text-content-primary">
                  {row.title}
                </th>
                <td className="py-4 px-4 text-center text-content-muted">
                  {renderStatus(row.caderno)}
                </td>
                <td className="py-4 px-4 text-center text-content-muted">
                  {renderStatus(row.sistemasAntigos)}
                </td>
                <td className="py-4 px-4 text-center bg-brand-amber-muted/20 border-x border-brand-amber/20 text-brand-amber font-semibold">
                  <Check aria-hidden="true" className="w-4 h-4 mx-auto text-brand-amber"/>
                  <span className="sr-only">Incluso no TorxOS PRO</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visão Mobile: Lista de Cards sem scroll horizontal */}
      <div className="md:hidden space-y-3">
        {COMPARISON_DATA.map((row, i) => (
          <div key={i} className="p-4 rounded-xl border border-surface-border bg-surface-card space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-semibold text-content-primary leading-snug">{row.title}</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-amber bg-brand-amber-muted px-2 py-0.5 rounded border border-brand-amber/20 shrink-0">
                TorxOS ✓
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-surface-border text-content-secondary">
              <div className="flex items-center gap-1.5">
                <span className="text-content-muted">Caderno:</span>
                <span>{typeof row.caderno === 'boolean' ? (row.caderno ? 'Sim' : 'Não') : row.caderno}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-content-muted">Antigos:</span>
                <span>{typeof row.sistemasAntigos === 'boolean' ? (row.sistemasAntigos ? 'Sim' : 'Não') : row.sistemasAntigos}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function renderStatus(val: string | boolean) {
  if (typeof val === 'boolean') {
    return val ? (
      <>
        <Check aria-hidden="true" className="w-4 h-4 mx-auto text-emerald-400"/>
        <span className="sr-only">Sim</span>
      </>
    ) : (
      <>
        <X aria-hidden="true" className="w-4 h-4 mx-auto text-content-muted"/>
        <span className="sr-only">Não</span>
      </>
    );
  }
  return <span className="font-mono text-[11px] text-content-secondary">{val}</span>;
}
