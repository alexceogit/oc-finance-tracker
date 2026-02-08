# Supabase Entegrasyonu

## Kurulum

### 1. Supabase Projesi Oluştur

1. https://supabase.com adresine git
2. Yeni proje oluştur
3. API credentials'ları al

### 2. Environment Variables

```bash
# .env dosyası oluştur
cp .env.example .env

# Değerleri doldur
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### 3. Environment Variables'i Gateway'e Ekle

```bash
# Gateway'den supabase credentials al
source ~/.bashrc veya ~/.bash_aliases'a ekle:
export VITE_SUPABASE_URL=https://xxx.supabase.co
export VITE_SUPABASE_KEY=your-key
```

Veya manuel olarak `.env.supabase` dosyasını kullan.

## Kullanım

```typescript
import { supabase, supabaseHelpers } from './services/supabase';

// Bağlantıyı test et
const test = await supabaseHelpers.testConnection();
console.log(test);

// Veri senkronize et
await supabaseHelpers.syncTable('incomes', localIncomes);

// Buluttan veri çek
const { data } = await supabaseHelpers.fetchTable('incomes');
```

## Özellikler

- ✅ Database sync
- ✅ Real-time subscriptions
- ✅ Cross-device data sharing
- ✅ Free tier: 500MB database + 1GB storage

## Notlar

- Environment variables `VITE_` prefix ile başlamalı (Vite requirement)
- Anon key güvenli - client-side kullanılabilir
- Service role key sadece server-side kullanılmalı
