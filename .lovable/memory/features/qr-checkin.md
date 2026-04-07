---
name: QR Code Check-in
description: Check-in via QR code for events — event QR + volunteer QR, camera + link, time window validation
type: feature
---

## Fluxo

### QR por Evento
- Cada evento tem `checkin_token` (uuid, gerado automaticamente)
- Admin abre QR na página do evento → projeta ou imprime
- Voluntário escaneia com celular → navega para `/checkin/event/{token}`
- Sistema valida janela de tempo (`checkin_window_minutes`, default 60)
- Janela: de X min antes até 2X min depois do `start_date`
- Registra `event_attendance` com status `presente`

### QR por Voluntário
- Cada perfil tem `checkin_code` (uuid, gerado automaticamente)
- Voluntário mostra QR no perfil `/profile`
- Admin usa Scanner na página do evento → `/events/:id/scan`
- Câmera lê QR → extrai `checkin_code` → busca perfil → registra presença

### Modos de leitura
- **Câmera**: componente `QRScanner` usando `html5-qrcode`
- **Link**: URL abre `CheckinPage` que processa automaticamente

## Componentes
- `EventQRCode` — Dialog com QR do evento + botão copiar link + download PNG
- `VolunteerQRCode` — Card com QR pessoal na página de perfil
- `QRScanner` — Leitor de câmera com feedback visual
- `CheckinPage` — Rota `/checkin/:type/:token` para check-in via link
- `AdminScanPage` — Rota `/events/:id/scan` para scanner do admin

## Tabelas modificadas
- `events`: + `checkin_token` uuid, + `checkin_window_minutes` integer (default 60)
- `profiles`: + `checkin_code` uuid

## Dependências
- `qrcode.react` — geração de QR SVG
- `html5-qrcode` — leitura de QR via câmera
