process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = 'true';
process.env.PUPPETEER_EXECUTABLE_PATH = '/usr/bin/chromium';
const venom = require('venom-bot');
const QRCode = require('qrcode');
const express = require('express');

// ============================================================
//  KONFIGURASI
// ============================================================
const CONFIG = {
  namaPerusahaan: 'Rental Mobil Bandung',
  noAdmin: '6281234567890',
  jamOperasional: '08:00 - 20:00 WIB',
  lokasi: 'Jl. Contoh No. 123, Bandung',
  kontakAdmin: '0812-3456-7890',
};

const ARMADA = {
  '1':  { nama: 'Toyota Fortuner',         kategori: 'Premium SUV',          harga: 650000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '2':  { nama: 'Toyota Avanza TSS',       kategori: 'Family MPV',            harga: 350000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '3':  { nama: 'Toyota Innova Reborn',    kategori: 'Premium',               harga: 450000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '4':  { nama: 'Toyota Calya',            kategori: 'LCGC MPV',              harga: 300000, kapasitas: 7, transmisi: 'Manual', sopir: false },
  '5':  { nama: 'Toyota Agya',             kategori: 'LCGC City Car',         harga: 300000, kapasitas: 4, transmisi: 'Matic',  sopir: false },
  '6':  { nama: 'Toyota Innova Zenix',     kategori: 'Premium Hybrid MPV',    harga: 550000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '7':  { nama: 'Mitsubishi Pajero Sport', kategori: 'Premium SUV',           harga: 600000, kapasitas: 7, transmisi: 'Matic',  sopir: true  },
  '8':  { nama: 'Honda Brio RS',           kategori: 'City Car',              harga: 300000, kapasitas: 5, transmisi: 'Matic',  sopir: false },
  '9':  { nama: 'Daihatsu Xenia',          kategori: 'Family MPV',            harga: 350000, kapasitas: 7, transmisi: 'Manual', sopir: false },
};

// ============================================================
//  SESSION
// ============================================================
const sessions = {};
function getSession(id) {
  if (!sessions[id]) sessions[id] = { step: 'MENU', data: {} };
  return sessions[id];
}
function resetSession(id) { sessions[id] = { step: 'MENU', data: {} }; }

// ============================================================
//  PESAN
// ============================================================
function pesanMenu() {
  return `🚗 *${CONFIG.namaPerusahaan}*\n━━━━━━━━━━━━━━━━━━━━━\nSelamat datang! Pilih menu:\n\n*1️⃣ Lihat Daftar Mobil*\n*2️⃣ Booking Sekarang*\n*3️⃣ Syarat & Ketentuan*\n*4️⃣ Hubungi Admin*\n*5️⃣ Lokasi & Jam Buka*\n\n_Ketik angka untuk memilih_`;
}

function pesanDaftarMobil() {
  let msg = `🚗 *DAFTAR ARMADA*\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
  for (const [key, m] of Object.entries(ARMADA)) {
    msg += `*${key}. ${m.nama}*\n   📌 ${m.kategori} | ⚙️ ${m.transmisi}\n   💰 Rp ${m.harga.toLocaleString('id-ID')}/hari | 👥 ${m.kapasitas} kursi\n\n`;
  }
  msg += `_Ketik nomor untuk booking atau *BACK* untuk kembali_`;
  return msg;
}

function pesanKonfirmasi(data, mobil) {
  const total = (mobil.harga + (data.pakaiSopir ? 150000 : 0)) * data.lamaHari;
  return `📝 *KONFIRMASI PESANAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👤 *Nama :* ${data.nama}\n📱 *No WA :* ${data.noWA}\n🆘 *Darurat :* ${data.kontakDarurat}\n📧 *Email :* ${data.email}\n🪪 *NIM/NIK :* ${data.nik}\n\n` +
    (data.status === 'mahasiswa'
      ? `🎓 Universitas : ${data.universitas}\n   Jurusan : ${data.jurusan}\n   Angkatan : ${data.angkatan}\n`
      : `💼 Tempat Kerja : ${data.tempatKerja}\n   Divisi : ${data.divisi}\n`) +
    `\n🚗 *${mobil.nama}* (${mobil.kategori})\n📅 ${data.tanggalMulai} → ${data.tanggalSelesai} (${data.lamaHari} hari)\n👨‍✈️ Sopir: ${data.pakaiSopir ? 'Ya' : 'Tidak'}\n\n💰 *Total: Rp ${total.toLocaleString('id-ID')}*\n\n*1. ✅ Konfirmasi*\n*2. ❌ Batalkan*`;
}

// ============================================================
//  WEB SERVER QR
// ============================================================
let lastQR = null;
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/qr', async (req, res) => {
  if (!lastQR) {
    return res.send(`<html><head><meta http-equiv="refresh" content="3"><style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f0f9f4}</style></head><body><h2>⏳ Bot sudah aktif atau menunggu QR...</h2><p>Refresh otomatis tiap 3 detik</p></body></html>`);
  }
  const qrImg = await QRCode.toDataURL(lastQR, { width: 400 });
  res.send(`<html><head><meta http-equiv="refresh" content="20"><style>body{font-family:sans-serif;text-align:center;padding:40px;background:#f0f9f4}.box{background:white;display:inline-block;padding:30px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.1)}h2{color:#1a7a4a}</style></head><body><div class="box"><h2>📱 Scan QR WhatsApp</h2><img src="${qrImg}" width="320"/><p>Auto refresh 20 detik | WhatsApp → Perangkat Tertaut → Tautkan</p></div></body></html>`);
});

app.get('/',(req,res)=>res.redirect('/qr'));
app.listen(PORT, '0.0.0.0', () => console.log(`🌐 Web QR aktif: port ${PORT}`));

// ============================================================
//  HANDLER PESAN
// ============================================================
async function handlePesan(client, from, body) {
  const session = getSession(from);
  const input = body.trim();
  console.log(`📨 ${new Date().toLocaleTimeString('id-ID')} dari ${from}: ${input}`);

  const kirim = async (teks) => await client.sendText(from, teks);

  if (/^(halo|hai|hi|hello|start|mulai|menu)$/i.test(input)) { resetSession(from); await kirim(pesanMenu()); return; }
  if (/^back$/i.test(input)) { resetSession(from); await kirim(pesanMenu()); return; }

  switch (session.step) {
    case 'MENU':
      if (input === '1') { session.step = 'LIHAT_MOBIL'; await kirim(pesanDaftarMobil()); }
      else if (input === '2') { session.step = 'INPUT_NAMA'; await kirim(`📝 *FORM BOOKING*\n━━━━━━━━━━━━━━━━━━━━━\n\n👤 Masukkan *Nama Lengkap* Anda:`); }
      else if (input === '3') await kirim(`📋 *SYARAT & KETENTUAN*\n━━━━━━━━━━━━━━━━━━━━━\n\n✅ KTP asli + SIM A aktif + KK\n✅ Minimal sewa 1 hari\n✅ Deposit Rp 500.000 - 1.000.000\n✅ BBM ditanggung penyewa\n✅ Pembatalan <24 jam kena biaya 50%\n\n_Ketik *BACK* untuk kembali_`);
      else if (input === '4') await kirim(`👨‍💼 *HUBUNGI ADMIN*\n━━━━━━━━━━━━━━━━━━━━━\n📞 ${CONFIG.kontakAdmin}\n🕐 ${CONFIG.jamOperasional}\n\n_Ketik *BACK* untuk kembali_`);
      else if (input === '5') await kirim(`📍 *LOKASI*\n━━━━━━━━━━━━━━━━━━━━━\n🏢 ${CONFIG.lokasi}\n🕐 ${CONFIG.jamOperasional}\n\n_Ketik *BACK* untuk kembali_`);
      else await kirim(pesanMenu());
      break;

    case 'LIHAT_MOBIL':
      if (ARMADA[input]) { session.data.mobilKey = input; session.step = 'INPUT_NAMA'; await kirim(`✅ Pilih: *${ARMADA[input].nama}*\n\n👤 Masukkan *Nama Lengkap*:`); }
      else await kirim(pesanDaftarMobil());
      break;

    case 'INPUT_NAMA':
      if (input.length < 3) { await kirim('❌ Nama terlalu pendek:'); break; }
      session.data.nama = input; session.step = 'INPUT_NOWA';
      await kirim(`👋 Halo *${input}*!\n\n📱 Masukkan *No WhatsApp*:\nContoh: 08123456789`); break;

    case 'INPUT_NOWA':
      if (!/^08[0-9]{8,12}$/.test(input)) { await kirim('❌ Format salah. Contoh: 08123456789'); break; }
      session.data.noWA = input; session.step = 'INPUT_KONDARURAT';
      await kirim(`🆘 Masukkan *No Kontak Darurat*:`); break;

    case 'INPUT_KONDARURAT':
      if (!/^08[0-9]{8,12}$/.test(input)) { await kirim('❌ Format salah. Contoh: 08123456789'); break; }
      session.data.kontakDarurat = input; session.step = 'INPUT_EMAIL';
      await kirim(`📧 Masukkan *Email*:`); break;

    case 'INPUT_EMAIL':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) { await kirim('❌ Format email salah. Contoh: nama@email.com'); break; }
      session.data.email = input; session.step = 'INPUT_NIK';
      await kirim(`🪪 Masukkan *NIM / NIK*:`); break;

    case 'INPUT_NIK':
      if (input.length < 5) { await kirim('❌ Terlalu pendek. Masukkan ulang:'); break; }
      session.data.nik = input; session.step = 'INPUT_STATUS';
      await kirim(`📋 *Status:*\n\n*1. 🎓 Mahasiswa/Pelajar*\n*2. 💼 Pekerja*`); break;

    case 'INPUT_STATUS':
      if (input === '1') { session.data.status = 'mahasiswa'; session.step = 'INPUT_UNIVERSITAS'; await kirim(`🎓 Nama *Universitas*:`); }
      else if (input === '2') { session.data.status = 'pekerja'; session.step = 'INPUT_TEMPAT_KERJA'; await kirim(`🏢 *Tempat Kerja*:`); }
      else await kirim('Ketik *1* Mahasiswa atau *2* Pekerja:');
      break;

    case 'INPUT_UNIVERSITAS': session.data.universitas = input; session.step = 'INPUT_JURUSAN'; await kirim(`📚 *Jurusan*:`); break;
    case 'INPUT_JURUSAN': session.data.jurusan = input; session.step = 'INPUT_ANGKATAN'; await kirim(`📅 *Angkatan* (contoh: 2022):`); break;
    case 'INPUT_ANGKATAN': session.data.angkatan = input; session.step = 'PILIH_MOBIL_BOOKING'; await kirim(`✅ Data tersimpan!\n\n${pesanDaftarMobil()}`); break;
    case 'INPUT_TEMPAT_KERJA': session.data.tempatKerja = input; session.step = 'INPUT_DIVISI'; await kirim(`🏬 *Divisi/Bagian*:`); break;
    case 'INPUT_DIVISI': session.data.divisi = input; session.step = 'PILIH_MOBIL_BOOKING'; await kirim(`✅ Data tersimpan!\n\n${pesanDaftarMobil()}`); break;

    case 'PILIH_MOBIL_BOOKING':
      if (ARMADA[input]) {
        session.data.mobilKey = input; session.step = 'INPUT_TANGGAL_MULAI';
        await kirim(`✅ *${ARMADA[input].nama}*\n\n📅 *Tanggal pengambilan* (DD/MM/YYYY):\nContoh: 25/12/2024`);
      } else await kirim(`❌ Pilihan tidak valid.\n\n${pesanDaftarMobil()}`);
      break;

    case 'INPUT_TANGGAL_MULAI': {
      const re = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      if (!re.test(input)) { await kirim('❌ Format salah. Gunakan DD/MM/YYYY'); break; }
      const [,d,m,y] = input.match(re);
      const tgl = new Date(`${y}-${m}-${d}`);
      if (isNaN(tgl)) { await kirim('❌ Tanggal tidak valid:'); break; }
      session.data.tanggalMulai = input; session.data.tglObj = tgl;
      session.step = 'INPUT_DURASI';
      await kirim(`⏱️ *Durasi sewa* (hari):\nContoh: 2`); break;
    }

    case 'INPUT_DURASI': {
      const dur = parseInt(input);
      if (isNaN(dur) || dur < 1) { await kirim('❌ Minimal 1 hari:'); break; }
      session.data.lamaHari = dur;
      const selesai = new Date(session.data.tglObj);
      selesai.setDate(selesai.getDate() + dur);
      session.data.tanggalSelesai = `${String(selesai.getDate()).padStart(2,'0')}/${String(selesai.getMonth()+1).padStart(2,'0')}/${selesai.getFullYear()}`;
      const mobil = ARMADA[session.data.mobilKey];
      if (mobil.sopir) {
        session.step = 'PILIH_SOPIR';
        await kirim(`📅 Selesai: *${session.data.tanggalSelesai}*\n\n🧑‍✈️ *Pakai Sopir?*\nTambahan Rp 150.000/hari\n\n*1. ✅ Ya*\n*2. ❌ Tidak*`);
      } else {
        session.data.pakaiSopir = false; session.step = 'KONFIRMASI';
        await kirim(pesanKonfirmasi(session.data, mobil));
      }
      break;
    }

    case 'PILIH_SOPIR':
      if (input === '1') session.data.pakaiSopir = true;
      else if (input === '2') session.data.pakaiSopir = false;
      else { await kirim('Ketik *1* Ya atau *2* Tidak:'); break; }
      session.step = 'KONFIRMASI';
      await kirim(pesanKonfirmasi(session.data, ARMADA[session.data.mobilKey]));
      break;

    case 'KONFIRMASI':
      if (input === '1') {
        const mobil = ARMADA[session.data.mobilKey];
        const d = session.data;
        const adminMsg = `🔔 *PESANAN BARU!*\n━━━━━━━━━━━━━━━━━━━━━\n👤 ${d.nama}\n📱 ${d.noWA}\n🆘 ${d.kontakDarurat}\n📧 ${d.email}\n🪪 ${d.nik}\n` +
          (d.status === 'mahasiswa' ? `🎓 ${d.universitas} | ${d.jurusan} | ${d.angkatan}\n` : `💼 ${d.tempatKerja} | ${d.divisi}\n`) +
          `🚗 ${mobil.nama} (${mobil.kategori})\n📅 ${d.tanggalMulai} → ${d.tanggalSelesai} (${d.lamaHari} hari)\n👨‍✈️ Sopir: ${d.pakaiSopir ? 'Ya' : 'Tidak'}\n💰 Total: Rp ${((mobil.harga + (d.pakaiSopir ? 150000 : 0)) * d.lamaHari).toLocaleString('id-ID')}`;
        await client.sendText(`${CONFIG.noAdmin}@c.us`, adminMsg);
        await kirim(`✅ *PESANAN DITERIMA!*\n\nTerima kasih *${d.nama}*!\nAdmin akan menghubungi dalam 1x24 jam.\n📞 ${CONFIG.kontakAdmin}\n\n_Ketik *MENU* untuk kembali_`);
        resetSession(from);
      } else if (input === '2') {
        resetSession(from); await kirim('❌ Dibatalkan.\n\nKetik *MENU* untuk kembali.');
      } else await kirim('Ketik *1* konfirmasi atau *2* batalkan.');
      break;

    default: resetSession(from); await kirim(pesanMenu());
  }
}

// ============================================================
//  START VENOM
// ============================================================
console.log('🚀 Memulai Bot WhatsApp Rental Mobil...');

// Hapus sesi lama agar QR muncul fresh
const { execSync } = require('child_process');
try {
  // token dipertahankan agar tidak perlu scan ulang


venom.create(
  'rental-bot',
  (base64Qr) => {
    // base64Qr sudah dalam format data URL
    lastQR = base64Qr;
    console.log('📱 QR tersedia! Buka /qr di browser.');
  },
  (statusSession) => {
    console.log('Status:', statusSession);
  },
  {
  headless: 'new',
  devtools: false,
  useChrome: true,
  debug: false,
  logQR: false,
  autoClose: 0,

  browserArgs: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--disable-software-rasterizer',
    '--no-zygote',
    '--single-process',
    '--no-first-run'
  ],

  executablePath: '/usr/bin/chromium',
  folderNameToken: 'tokens'
}
).then((client) => {
  console.log('✅ Bot WhatsApp Rental Mobil AKTIF!');
  console.log(`🏢 ${CONFIG.namaPerusahaan}`);
  lastQR = null;

  client.onMessage(async (msg) => {
    if (msg.isGroupMsg || msg.from === 'status@broadcast') return;
    if (msg.type !== 'chat') return;
    try {
      await handlePesan(client, msg.from, msg.body);
    } catch (err) {
      console.error('❌ Error:', err);
      await client.sendText(msg.from, '⚠️ Terjadi kesalahan. Ketik *MENU* untuk memulai ulang.');
    }
  });

}).catch((err) => {
  console.error('❌ Gagal start bot:', err);
  // Hapus token lalu restart
  try {
    const { execSync } = require('child_process');
    // token dipertahankan agar tidak perlu scan ulang
    console.log('🗑️ Token dihapus, restart dalam 5 detik...');
  } catch(e) {}
  setTimeout(() => process.exit(1), 5000);
});
