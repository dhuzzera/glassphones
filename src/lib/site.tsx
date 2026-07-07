import { Headphones, RefreshCw, Smartphone, ShieldCheck, BatteryCharging, Cpu, Plug, Wrench, type LucideIcon } from "lucide-react";
import hero1 from "@/assets/hero1.jpg.asset.json";
import hero2 from "@/assets/hero2.jpg.asset.json";
import hero3 from "@/assets/hero3.jpg.asset.json";
import logoDark from "@/assets/glassphone-logo-cliente.png.asset.json";
import logoFlat from "@/assets/glassphone-logo-cliente.png.asset.json";

export const SITE_URL = "https://glassphones.lovable.app";
export const WHATSAPP_URL = "https://api.whatsapp.com/message/L6DTBZKAUP67J1?autoload=1&app_absent=0";
export const WHATSAPP_NUM = "5547996801247";
export const INSTAGRAM = "https://www.instagram.com/glass_phonesbs/";
export const PHONE_DISPLAY = "(47) 9680-1247";

// Link curto do WhatsApp já traz mensagem padrão configurada pela loja.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const waLink = (_msg: string) => WHATSAPP_URL;

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const logo = (slug: string, color?: string) =>
  `https://cdn.simpleicons.org/${slug}${color ? `/${color}` : ""}`;

export const assets = { hero1: hero1.url, hero2: hero2.url, hero3: hero3.url, logoDark: logoDark.url, logoFlat: logoFlat.url };

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.695.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.593 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.582 0 11.941-5.335 11.944-11.892 0-3.176-1.24-6.165-3.495-8.413zm-8.475 18.297h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.98.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.886 9.886z"/>
    </svg>
  );
}

export type Categoria = { nome: string; slug?: string; cor?: string; icon?: LucideIcon };
export const categorias: Categoria[] = [
  { nome: "iPhone", slug: "apple", cor: "FFFFFF" },
  { nome: "Samsung", slug: "samsung", cor: "FFFFFF" },
  { nome: "Xiaomi", slug: "xiaomi", cor: "FFFFFF" },
  { nome: "Motorola", slug: "motorola", cor: "FFFFFF" },
  { nome: "Acessórios", icon: Headphones },
  { nome: "Seminovos", icon: RefreshCw },
];

export const produtos = [
  { nome: "iPhone 15 Pro Max 256GB", marca: "Apple", preco: 8499, antigo: 9999, promo: true, cor: "Titânio Natural" },
  { nome: "iPhone 14 128GB", marca: "Apple", preco: 4899, antigo: 5799, promo: true, cor: "Meia-noite" },
  { nome: "Galaxy S24 Ultra 512GB", marca: "Samsung", preco: 7299, antigo: 8499, promo: true, cor: "Titânio Cinza" },
  { nome: "Galaxy A55 5G 256GB", marca: "Samsung", preco: 2399, antigo: 2799, promo: false, cor: "Azul" },
  { nome: "Xiaomi 14 Ultra 512GB", marca: "Xiaomi", preco: 6499, antigo: 7499, promo: true, cor: "Preto" },
  { nome: "Redmi Note 13 Pro 256GB", marca: "Xiaomi", preco: 1899, antigo: 2299, promo: false, cor: "Verde" },
  { nome: "Motorola Edge 50 Ultra", marca: "Motorola", preco: 3799, antigo: 4299, promo: false, cor: "Madeira" },
  { nome: "iPhone 13 128GB Seminovo", marca: "Apple", preco: 3299, antigo: 3899, promo: true, cor: "Estelar" },
];
export type Produto = typeof produtos[number];

export const servicos = [
  { slug: "troca-de-tela", icon: Smartphone, nome: "Troca de Tela", desc: "Display original ou compatível A+ para iPhone, Samsung, Xiaomi e Motorola.", preco: 149, prazo: "40 min a 2 horas", detalhes: "Substituímos o display trincado ou com falha de toque usando peças originais ou compatíveis premium. Testes de multitoque, cores e brilho após a troca, com 90 dias de garantia." },
  { slug: "troca-de-bateria", icon: BatteryCharging, nome: "Troca de Bateria", desc: "Bateria nova com garantia. Recupere autonomia do seu aparelho.", preco: 99, prazo: "30 a 60 minutos", detalhes: "Trocamos a bateria por uma nova, calibrada, com selo de garantia. Ideal para aparelhos que descarregam rápido, desligam sozinhos ou incham." },
  { slug: "reparo-de-placa", icon: Cpu, nome: "Reparo de Placa", desc: "Diagnóstico e reparo em placa lógica: não liga, sem sinal, oxidação.", preco: 199, prazo: "1 a 5 dias úteis", detalhes: "Diagnóstico eletrônico em bancada com microscópio para aparelhos que não ligam, sem sinal, sem carga ou com oxidação. Orçamento sem compromisso." },
  { slug: "conector-de-carga", icon: Plug, nome: "Conector de Carga", desc: "Troca do conector para carregamento e transferência de dados.", preco: 89, prazo: "1 hora", detalhes: "Substituição do flex ou conector de carga (Lightning, USB-C, Micro USB) para resolver mau contato, carregamento intermitente e falha na transferência de dados." },
  { slug: "limpeza-interna", icon: Wrench, nome: "Limpeza Interna", desc: "Limpeza técnica completa, remoção de poeira e revisão geral.", preco: 59, prazo: "40 minutos", detalhes: "Abertura, limpeza dos componentes internos, alto-falantes e conectores. Recomendado a cada 12 meses ou após contato com poeira e umidade." },
  { slug: "pelicula-3d", icon: ShieldCheck, nome: "Película 3D", desc: "Aplicação de película de vidro premium com garantia de bolhas.", preco: 39, prazo: "10 minutos", detalhes: "Aplicação profissional de película de vidro 3D com alta transparência e proteção contra impactos. Garantia contra bolhas na aplicação." },
];

export const modelosPop = ["iPhone 15", "iPhone 14", "iPhone 13", "iPhone 12", "iPhone 11", "Galaxy S24", "Galaxy S23", "Galaxy A54", "Xiaomi 13", "Redmi Note 12", "Motorola Edge 40", "Outro"];
export const defeitos = ["Tela quebrada / trincada", "Bateria viciada", "Não liga", "Conector de carga", "Câmera com defeito", "Alto-falante", "Molhou", "Outro"];

export const faqs = [
  { q: "Qual a garantia dos reparos?", a: "Todos os reparos têm 90 dias de garantia sobre o serviço e as peças aplicadas. Basta apresentar a ordem de serviço." },
  { q: "Quanto tempo demora a troca de tela?", a: "A maioria das trocas de tela é concluída no mesmo dia, entre 40 minutos e 2 horas, dependendo do modelo e da disponibilidade da peça." },
  { q: "Como funciona o orçamento?", a: "O orçamento é gratuito. Envie modelo e defeito pelo WhatsApp ou traga o aparelho na loja. Respondemos em poucos minutos com valor e prazo." },
  { q: "Vocês atendem qualquer marca?", a: "Sim. Trabalhamos com iPhone, Samsung, Xiaomi, Motorola e outras marcas populares. Se o modelo for raro, confirmamos a disponibilidade da peça antes." },
  { q: "Formas de pagamento?", a: "Trabalhamos com Pix, dinheiro, débito e crédito. Fale com a gente no WhatsApp para conhecer as condições e opções de parcelamento." },
  { q: "Vocês fazem retirada no domicílio?", a: "Sim, atendemos São Bento do Sul e região com serviço de coleta e entrega. Consulte a disponibilidade pelo WhatsApp." },
];

export const heroSlides = [
  { img: assets.hero1, tag: "Assistência Técnica", title: "Tela quebrada?", sub: "A gente resolve com garantia." },
  { img: assets.hero2, tag: "Vitrine Premium", title: "iPhone & Galaxy", sub: "Modelos novos e seminovos." },
  { img: assets.hero3, tag: "Reparo Especializado", title: "Placa, bateria, conector", sub: "Diagnóstico em minutos." },
];
