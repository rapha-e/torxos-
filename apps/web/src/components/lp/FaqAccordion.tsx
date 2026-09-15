'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    question: 'Preciso cadastrar cartão de crédito para testar?',
    answer: 'Não. Você pode testar todas as funcionalidades do TorxOS gratuitamente por 7 dias sem inserir nenhum dado financeiro ou cartão de crédito.'
  },
  {
    question: 'Funciona em qualquer computador ou impressora?',
    answer: 'Sim. O sistema opera 100% na nuvem diretamente pelo navegador e suporta impressoras térmicas padrão de mercado (58mm e 80mm).'
  },
  {
    question: 'Posso importar os dados do meu sistema antigo?',
    answer: 'Sim, nossa equipe de suporte auxilia na migração de planilhas e bancos de dados para que você não perca o histórico de clientes e estoque.'
  },
  {
    question: 'Como meus clientes consultam o status da OS pelo celular?',
    answer: 'A cada etapa do reparo, o cliente recebe um link exclusivo via WhatsApp ou pode escanear o QR Code impresso no comprovante da OS.'
  },
  {
    question: 'Se eu não gostar, como cancelo?',
    answer: 'O cancelamento pode ser feito a qualquer momento diretamente pelo painel administrativo, sem taxas ou fidelidade contratual.'
  }
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-3 max-w-4xl mx-auto w-full">
      {FAQ_DATA.map((item, index) => {
        const isOpen = openIndex === index;
        const btnId = `faq-btn-${index}`;
        const panelId = `faq-panel-${index}`;

        return (
          <div 
            key={index}
            className="rounded-xl border border-surface-border bg-surface-card overflow-hidden transition-colors"
          >
            <h3>
              <button
                type="button"
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between text-sm font-medium text-content-primary hover:text-brand-amber transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-amber cursor-pointer"
              >
                <span>{item.question}</span>
                <ChevronDown
                  aria-hidden="true"
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-brand-amber' : 'text-content-secondary'
                  }`}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-content-secondary leading-relaxed border-t border-surface-border pt-3"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
