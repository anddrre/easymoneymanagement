# MyFinance — Personal Finance Tracker

Aplikasi pencatat pemasukan dan pengeluaran dengan multi-user authentication, dashboard, filter bulanan, grafik, edit/hapus transaksi, dan export CSV.

## 1. Buat database Supabase
1. Buka https://supabase.com/ lalu buat project baru.
2. Buka **SQL Editor** → **New query**.
3. Salin seluruh isi `supabase/schema.sql`, lalu klik **Run**.
4. Buka **Project Settings → API** (atau **Data API**) dan salin:
   - Project URL
   - `anon` / publishable key (jangan gunakan `service_role` key).

## 2. Konfigurasi lokal (opsional)
1. Salin `.env.example` menjadi `.env.local`.
2. Isi nilai berikut:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
   ```
3. Jalankan:
   ```
   npm install
   npm run dev
   ```
4. Buka http://localhost:3000

## 3. Deploy ke Vercel
1. Upload folder project ini ke repository GitHub.
2. Buka https://vercel.com/new dan import repository tersebut.
3. Framework preset: **Next.js** (biasanya terdeteksi otomatis).
4. Tambahkan Environment Variables berikut di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Klik **Deploy**.
6. Setelah deploy, buka URL website dan buat akun melalui **Daftar akun**.

## 4. Multi-user & keamanan data
- Setiap orang dapat mendaftar menggunakan email dan password.
- Data transaksi memiliki `user_id`.
- Row Level Security (RLS) di Supabase membatasi SELECT/INSERT/UPDATE/DELETE hanya untuk pemilik data.
- Frontend menggunakan anon/publishable key; jangan pernah memasukkan `service_role` key ke frontend atau Vercel `NEXT_PUBLIC_*`.

## 5. Konfirmasi email
Secara default Supabase dapat meminta konfirmasi email sebelum login. Untuk produksi:
- Supabase → Authentication → URL Configuration.
- Set **Site URL** ke URL deployment Vercel, misalnya `https://nama-app.vercel.app`.
- Tambahkan URL deployment tersebut ke **Redirect URLs**.
- Jika email konfirmasi belum siap, pengaturan konfirmasi email dapat diubah di Authentication → Providers → Email. Untuk aplikasi publik, sebaiknya tetap aktifkan konfirmasi email dan konfigurasi SMTP yang layak.

## Fitur
- Daftar / login multi-user
- Ringkasan pemasukan, pengeluaran, dan selisih bersih per bulan
- Tambah, edit, hapus transaksi
- Filter bulan dan jenis transaksi
- Grafik komposisi arus uang
- Export CSV yang dapat dibuka di Excel

Catatan: saldo yang ditampilkan adalah selisih pemasukan dan pengeluaran pada bulan yang dipilih, bukan saldo awal rekening. Tambahkan saldo awal jika ingin fitur saldo rekening berjalan.
