import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/use-site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/configuracoes")({
  component: ConfiguracoesAdmin,
});

type SettingFieldProps = {
  label: string;
  settingKey: string;
  initialValue: string;
  placeholder?: string;
};

function SettingField({ label, settingKey, initialValue, placeholder }: SettingFieldProps) {
  const [value, setValue] = useState(initialValue);
  const mutation = useUpdateSiteSetting();

  // Sync when initial value loads from server
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({ key: settingKey, value });
      toast.success(`"${label}" salvo com sucesso.`);
    } catch {
      toast.error(`Erro ao salvar "${label}".`);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={settingKey}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={settingKey}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
          size="sm"
          className="shrink-0"
        >
          {mutation.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>
    </div>
  );
}

function ConfiguracoesAdmin() {
  const { settings, isLoading } = useSiteSettings();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Carregando configurações…
      </div>
    );
  }

  const g = (key: string) => settings[key] ?? "";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do site</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edite e salve cada campo individualmente. As alterações refletem em todo o site.
        </p>
      </div>

      {/* Contato */}
      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingField
            label="Telefone exibido"
            settingKey="contact.phone_display"
            initialValue={g("contact.phone_display")}
            placeholder="(47) 9680-1247"
          />
          <SettingField
            label="Número WhatsApp (apenas dígitos)"
            settingKey="contact.whatsapp_number"
            initialValue={g("contact.whatsapp_number")}
            placeholder="5547996801247"
          />
          <SettingField
            label="Link do WhatsApp"
            settingKey="contact.whatsapp_url"
            initialValue={g("contact.whatsapp_url")}
            placeholder="https://api.whatsapp.com/..."
          />
          <SettingField
            label="URL do Instagram"
            settingKey="contact.instagram"
            initialValue={g("contact.instagram")}
            placeholder="https://www.instagram.com/glass_phonesbs/"
          />
          <SettingField
            label="Endereço linha 1"
            settingKey="contact.address_line1"
            initialValue={g("contact.address_line1")}
            placeholder="Av. São Bento, 1330 — Sala 8"
          />
          <SettingField
            label="Endereço linha 2"
            settingKey="contact.address_line2"
            initialValue={g("contact.address_line2")}
            placeholder="São Bento do Sul/SC · 89281-100"
          />
          <SettingField
            label="Horário de funcionamento"
            settingKey="contact.hours"
            initialValue={g("contact.hours")}
            placeholder="Seg-Sáb 9h às 19h"
          />
        </CardContent>
      </Card>

      {/* Topbar */}
      <Card>
        <CardHeader>
          <CardTitle>Barra superior (Topbar)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingField
            label="Texto topbar esquerda (frete/entrega)"
            settingKey="topbar.shipping"
            initialValue={g("topbar.shipping")}
            placeholder="Entrega para todo o Brasil"
          />
          <SettingField
            label="Texto topbar centro (pagamento)"
            settingKey="topbar.payment"
            initialValue={g("topbar.payment")}
            placeholder="Parcelamento sob consulta no WhatsApp"
          />
        </CardContent>
      </Card>

      {/* Rodapé */}
      <Card>
        <CardHeader>
          <CardTitle>Rodapé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingField
            label="Tagline do rodapé"
            settingKey="footer.tagline"
            initialValue={g("footer.tagline")}
            placeholder="Smartphones, acessórios e assistência com atendimento humano."
          />
        </CardContent>
      </Card>

      {/* Home */}
      <Card>
        <CardHeader>
          <CardTitle>Página inicial (Home)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SettingField
            label="Título do hero da loja"
            settingKey="home.hero_title"
            initialValue={g("home.hero_title")}
            placeholder="Celulares e assistência técnica em São Bento do Sul"
          />
          <SettingField
            label="Subtítulo do hero da loja"
            settingKey="home.hero_subtitle"
            initialValue={g("home.hero_subtitle")}
            placeholder="iPhone, Samsung, Xiaomi, Motorola e muito mais."
          />
        </CardContent>
      </Card>
    </div>
  );
}
