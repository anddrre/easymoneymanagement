 "use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ArrowDownLeft, ArrowUpRight, Wallet, Plus, LogOut, Trash2, Pencil, X, Download, CalendarDays, Loader2, TrendingUp } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

type Tx = { id: string; user_id: string; type: "income" | "expense"; amount: number; description: string; transaction_date: string; created_at: string };
const rupiah = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
const today = () => new Date().toLocaleDateString("en-CA");

export default function Home() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [authError, setAuthError] = useState("");
  const [notice, setNotice] = useState("");
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Tx | null>(null);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session?.user) loadTransactions(); }, [session, month]);

  async function loadTransactions() {
    const start = `${month}-01`;
    const endDate = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 1);
    const end = endDate.toLocaleDateString("en-CA");
    const { data, error } = await supabase.from("transactions").select("*").gte("transaction_date", start).lt("transaction_date", end).order("transaction_date", { ascending: false }).order("created_at", { ascending: false });
    if (error) setNotice(error.message); else setTransactions((data || []) as Tx[]);
  }

  async function authenticate(e: React.FormEvent) {
    e.preventDefault(); setAuthError(""); setLoading(true);
    const result = authMode === "signup"
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (result.error) setAuthError(result.error.message);
    else if (authMode === "signup" && !result.data.session) setAuthError("Akun dibuat. Silakan cek email untuk konfirmasi, lalu login.");
  }

  function openNew() { setEditing(null); setType("expense"); setAmount(""); setDescription(""); setDate(today()); setModal(true); }
  function openEdit(t: Tx) { setEditing(t); setType(t.type); setAmount(String(t.amount)); setDescription(t.description); setDate(t.transaction_date); setModal(true); }

  async function saveTransaction(e: React.FormEvent) {
    e.preventDefault();
    const numeric = Number(amount);
    if (!numeric || numeric <= 0 || !description.trim()) return;
    setSaving(true); setNotice("");
    const payload = { type, amount: numeric, description: description.trim(), transaction_date: date, user_id: session.user.id };
    const result = editing
      ? await supabase.from("transactions").update(payload).eq("id", editing.id)
      : await supabase.from("transactions").insert(payload);
    setSaving(false);
    if (result.error) { setNotice(result.error.message); return; }
    setModal(false); setNotice("Transaksi berhasil disimpan."); await loadTransactions();
  }

  async function deleteTransaction(id: string) {
    if (!confirm("Hapus transaksi ini?")) return;
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) setNotice(error.message); else { setNotice("Transaksi dihapus."); loadTransactions(); }
  }

  async function logout() { await supabase.auth.signOut(); setTransactions([]); }

  const income = useMemo(() => transactions.filter(t => t.type === "income").reduce((s,t) => s + Number(t.amount), 0), [transactions]);
  const expense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s,t) => s + Number(t.amount), 0), [transactions]);
  const visible = transactions.filter(t => filter === "all" || t.type === filter);
  const balance = income - expense;

  function exportCsv() {
    const rows = [["Tanggal","Jenis","Keterangan","Nominal"], ...visible.map(t => [t.transaction_date, t.type === "income" ? "Pemasukan" : "Pengeluaran", t.description, String(t.amount)])];
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"','""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `myfinance-${month}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  if (loading) return <main className="center"><Loader2 className="spin" /> Memuat MyFinance...</main>;

  if (!session) return <main className="auth-wrap">
    <section className="auth-card">
      <div className="brand-mark"><Wallet size={25}/></div><p className="eyebrow">PERSONAL FINANCE TRACKER</p>
      <h1>{authMode === "login" ? "Selamat datang." : "Buat akun baru."}</h1>
      <p className="muted">Catat pemasukan dan pengeluaranmu dalam satu tempat.</p>
      <form onSubmit={authenticate} className="stack">
        {authMode === "signup" && <label>Nama lengkap<input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu" required /></label>}
        <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@email.com" required /></label>
        <label>Password<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Minimal 6 karakter" required /></label>
        {authError && <p className="error">{authError}</p>}
        <button className="primary full" disabled={loading}>{authMode === "login" ? "Masuk" : "Daftar akun"}</button>
      </form>
      <p className="switch">{authMode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button className="link" onClick={()=>{setAuthMode(authMode==="login"?"signup":"login");setAuthError("");}}>{authMode==="login"?"Daftar":"Login"}</button></p>
      <p className="tiny">Setiap akun hanya dapat melihat dan mengelola transaksi miliknya sendiri.</p>
    </section>
  </main>;

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark small"><Wallet size={20}/></div><span>my<span className="brand-accent">finance</span></span></div>
      <div className="user-area"><span className="user-email">{session.user.email}</span><button className="icon-btn" title="Keluar" onClick={logout}><LogOut size={18}/></button></div>
    </header>
    <section className="welcome">
      <div><p className="eyebrow">RINGKASAN KEUANGAN</p><h1>Keuanganmu, lebih teratur.</h1><p className="muted">Pantau arus uang tanpa pencatatan yang rumit.</p></div>
      <button className="primary" onClick={openNew}><Plus size={18}/> Tambah transaksi</button>
    </section>
    {notice && <div className="notice" onClick={()=>setNotice("")}>{notice}<button><X size={14}/></button></div>}
    <div className="month-row"><label className="month-select"><CalendarDays size={17}/><input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><span className="muted small-text">{transactions.length} transaksi</span></div>
    <section className="summary-grid">
      <article className="summary-card balance-card"><div className="card-label"><span>Total bersih bulan ini</span><Wallet size={18}/></div><strong>{rupiah(balance)}</strong><p>Selisih pemasukan dan pengeluaran</p></article>
      <article className="summary-card"><div className="card-label"><span>Pemasukan</span><span className="round-icon income-bg"><ArrowDownLeft size={18}/></span></div><strong className="green">{rupiah(income)}</strong><p>Total uang masuk</p></article>
      <article className="summary-card"><div className="card-label"><span>Pengeluaran</span><span className="round-icon expense-bg"><ArrowUpRight size={18}/></span></div><strong className="red">{rupiah(expense)}</strong><p>Total uang keluar</p></article>
    </section>
    <section className="content-grid">
      <article className="panel transactions-panel">
        <div className="panel-head"><div><h2>Riwayat transaksi</h2><p className="muted">Semua catatan keuanganmu.</p></div><button className="secondary" onClick={exportCsv}><Download size={16}/> Export CSV</button></div>
        <div className="filters">{(["all","income","expense"] as const).map(f=><button key={f} className={filter===f?"filter active":"filter"} onClick={()=>setFilter(f)}>{f==="all"?"Semua":f==="income"?"Pemasukan":"Pengeluaran"}</button>)}</div>
        {visible.length===0 ? <div className="empty"><div className="empty-icon"><TrendingUp size={23}/></div><b>Belum ada transaksi</b><span>Tambahkan pemasukan atau pengeluaran pertamamu.</span><button className="primary" onClick={openNew}><Plus size={16}/> Tambah transaksi</button></div> :
          <div className="tx-list">{visible.map(t=><div className="tx-row" key={t.id}><div className={`tx-icon ${t.type==="income"?"income-bg":"expense-bg"}`}>{t.type==="income"?<ArrowDownLeft size={19}/>:<ArrowUpRight size={19}/>}</div><div className="tx-info"><b>{t.description}</b><span>{new Date(t.transaction_date+"T00:00:00").toLocaleDateString("id-ID",{day:"numeric",month:"short",year:"numeric"})}</span></div><strong className={t.type==="income"?"green":"red"}>{t.type==="income"?"+":"−"}{rupiah(Number(t.amount))}</strong><div className="row-actions"><button className="icon-btn" title="Edit" onClick={()=>openEdit(t)}><Pencil size={15}/></button><button className="icon-btn danger-hover" title="Hapus" onClick={()=>deleteTransaction(t.id)}><Trash2 size={15}/></button></div></div>)}</div>}
      </article>
      <aside className="panel insight-panel"><h2>Komposisi arus uang</h2><p className="muted">Perbandingan bulan terpilih.</p>
        {income+expense===0?<div className="chart-empty">Grafik akan muncul setelah ada transaksi.</div>:<><div className="chart"><ResponsiveContainer width="100%" height="210"><PieChart><Pie data={[{name:"Pemasukan",value:income},{name:"Pengeluaran",value:expense}]} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={4}><Cell fill="#16a879"/><Cell fill="#ef6b68"/></Pie><Tooltip formatter={(v:any)=>rupiah(Number(v))}/></PieChart></ResponsiveContainer></div><div className="legend"><span><i className="dot green-dot"/>Pemasukan <b>{rupiah(income)}</b></span><span><i className="dot red-dot"/>Pengeluaran <b>{rupiah(expense)}</b></span></div></>}
      </aside>
    </section>
    <footer>MyFinance <span>•</span> Data pribadi tersimpan aman per akun.</footer>

    {modal && <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false);}}><form className="modal" onSubmit={saveTransaction}>
      <div className="modal-head"><div><p className="eyebrow">{editing?"UBAH CATATAN":"CATAT KEUANGAN"}</p><h2>{editing?"Edit transaksi":"Transaksi baru"}</h2></div><button type="button" className="icon-btn" onClick={()=>setModal(false)}><X/></button></div>
      <div className="type-switch"><button type="button" className={type==="expense"?"selected expense-selected":""} onClick={()=>setType("expense")}><ArrowUpRight size={17}/> Pengeluaran</button><button type="button" className={type==="income"?"selected income-selected":""} onClick={()=>setType("income")}><ArrowDownLeft size={17}/> Pemasukan</button></div>
      <label>Nominal (Rupiah)<input type="number" min="1" step="1" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="Contoh: 100000" required autoFocus/></label>
      <label>Keterangan<input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Contoh: Beli ayam" maxLength={120} required/></label>
      <label>Tanggal<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label>
      <button className="primary full" disabled={saving}>{saving?<Loader2 className="spin" size={17}/>:<Plus size={17}/>} {saving?"Menyimpan...":editing?"Simpan perubahan":"Simpan transaksi"}</button>
    </form></div>}
  </main>;
}