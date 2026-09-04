/* =====================================================
   URL GOOGLE APPS SCRIPT
===================================================== */

const API_URL =
    "https://script.google.com/macros/s/AKfycbwxLATlIbHlM0OyKi8DHc6wIr2fRedGQXeOXSrdoMYD4WlvwahJcOInHLVBg7lWNau3/exec";


/* =====================================================
   VARIABEL GLOBAL
===================================================== */

let scanner = null;

let scannerBerjalan = false;

let sedangMemproses = false;

let notifikasiTimer = null;

let qrTerakhir = "";

let waktuQrTerakhir = 0;


/*
   Jeda minimal sebelum QR yang sama
   boleh diproses lagi.

   1500 = 1,5 detik
*/

const JEDA_SCAN = 1500;


/* =====================================================
   SET TANGGAL OTOMATIS HARI INI
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const tanggal =
            document.getElementById(
                "tanggal"
            );

        const sekarang =
            new Date();

        const tahun =
            sekarang.getFullYear();

        const bulan =
            String(
                sekarang.getMonth() + 1
            ).padStart(2, "0");

        const hari =
            String(
                sekarang.getDate()
            ).padStart(2, "0");

        tanggal.value =
            tahun +
            "-" +
            bulan +
            "-" +
            hari;

    }
);


/* =====================================================
   MULAI SCAN
===================================================== */

function mulaiScan() {

    const tanggal =
        document.getElementById(
            "tanggal"
        ).value;


    const shalat =
        document.getElementById(
            "shalat"
        ).value;


    const statusElement =
        document.querySelector(
            'input[name="status"]:checked'
        );


    /* ---------------------------------------------
       VALIDASI TANGGAL
    --------------------------------------------- */

    if (!tanggal) {

        tampilkanPesan(
            "❌ Silakan pilih tanggal terlebih dahulu."
        );

        return;
    }


    /* ---------------------------------------------
       VALIDASI SHALAT
    --------------------------------------------- */

    if (!shalat) {

        tampilkanPesan(
            "❌ Silakan pilih jenis shalat."
        );

        return;
    }


    /* ---------------------------------------------
       VALIDASI STATUS
    --------------------------------------------- */

    if (!statusElement) {

        tampilkanPesan(
            "❌ Silakan pilih status Hadir atau Haid."
        );

        return;
    }


    /* ---------------------------------------------
       CEK API URL
    --------------------------------------------- */

    if (
        !API_URL ||
        API_URL.includes(
            "MASUKKAN_URL"
        )
    ) {

        tampilkanPesan(
            "❌ URL Apps Script belum dimasukkan."
        );

        return;
    }


    /* ---------------------------------------------
       RESET
    --------------------------------------------- */

    sedangMemproses =
        false;

    qrTerakhir =
        "";

    waktuQrTerakhir =
        0;


    /* ---------------------------------------------
       TAMPILKAN SCANNER
    --------------------------------------------- */

    document.getElementById(
        "scannerContainer"
    ).style.display =
        "block";


    document.getElementById(
        "hasil"
    ).style.display =
        "none";


    tampilkanPesan("");


    /* ---------------------------------------------
       Ubah tombol
    --------------------------------------------- */

    const tombol =
        document.getElementById(
            "btnScan"
        );


    tombol.disabled =
        true;


    tombol.innerHTML =
        "📷 KAMERA SEDANG AKTIF";


    /* ---------------------------------------------
       Status scanner
    --------------------------------------------- */

    document.getElementById(
        "scannerStatus"
    ).innerHTML =
        "⏳ Membuka kamera...";


    document.getElementById(
        "scanInfo"
    ).innerHTML =
        "Arahkan QR Code siswa ke kamera";


    /* ---------------------------------------------
       Scroll
    --------------------------------------------- */

    document.getElementById(
        "scannerContainer"
    ).scrollIntoView({
        behavior:
            "smooth"
    });


    /* ---------------------------------------------
       Jalankan scanner
    --------------------------------------------- */

    jalankanScanner();

}


/* =====================================================
   JALANKAN SCANNER
===================================================== */

function jalankanScanner() {

    if (scannerBerjalan) {

        return;
    }


    try {

        scanner =
            new Html5Qrcode(
                "reader"
            );

    } catch (error) {

        console.error(
            "Gagal membuat scanner:",
            error
        );

        tampilkanNotifikasi(
            "error",
            "Kamera gagal",
            "Scanner QR tidak dapat dibuat."
        );

        return;
    }


    const config = {

        fps: 10,

        qrbox: {
            width: 250,
            height: 250
        },

        aspectRatio: 1.0,

        disableFlip: false

    };


    scanner.start(

        {
            facingMode:
                "environment"
        },

        config,


        /* =========================================
           QR BERHASIL DIBACA
        ========================================= */

        function (qrCodeMessage) {

            prosesQR(
                qrCodeMessage
            );

        },


        /* =========================================
           ERROR SCAN
        ========================================= */

        function (errorMessage) {

            /*
               Jangan tampilkan error scan
               karena library memang akan
               mengirim banyak pesan ketika
               belum menemukan QR.
            */

        }

    )

    .then(function () {

        scannerBerjalan =
            true;


        document.getElementById(
            "scannerStatus"
        ).innerHTML =
            "🟢 Kamera aktif — siap scan";


        document.getElementById(
            "scanInfo"
        ).innerHTML =
            "Scan siswa berikutnya...";


        console.log(
            "Kamera berhasil dijalankan"
        );

    })

    .catch(function (error) {

        scannerBerjalan =
            false;


        console.error(
            "Kamera gagal dibuka:",
            error
        );


        let pesanError =
            "Pastikan izin kamera diberikan.";


        if (
            String(error)
                .includes(
                    "NotAllowedError"
                )
        ) {

            pesanError =
                "Izin kamera ditolak. Silakan izinkan kamera untuk aplikasi ini.";

        }


        if (
            String(error)
                .includes(
                    "NotFoundError"
                )
        ) {

            pesanError =
                "Kamera tidak ditemukan pada perangkat.";

        }


        tampilkanNotifikasi(
            "error",
            "Kamera gagal dibuka",
            pesanError
        );


        tampilkanPesan(
            "❌ " +
            pesanError
        );


        resetTombolScan();

    });

}


/* =====================================================
   PROSES QR
===================================================== */

function prosesQR(qrCode) {

    if (!qrCode) {

        return;
    }


    qrCode =
        String(
            qrCode
        ).trim();


    const sekarang =
        Date.now();


    /* ---------------------------------------------
       CEGAH QR YANG SAMA TERBACA BERULANG
    --------------------------------------------- */

    if (

        qrCode === qrTerakhir &&

        (
            sekarang -
            waktuQrTerakhir
        ) < JEDA_SCAN

    ) {

        return;
    }


    /* ---------------------------------------------
       CEGAH REQUEST BERSAMAAN
    --------------------------------------------- */

    if (sedangMemproses) {

        return;
    }


    qrTerakhir =
        qrCode;


    waktuQrTerakhir =
        sekarang;


    sedangMemproses =
        true;


    console.log(
        "QR terbaca:",
        qrCode
    );


    /* ---------------------------------------------
       UPDATE STATUS
    --------------------------------------------- */

    document.getElementById(
        "scanInfo"
    ).innerHTML =
        "⏳ Memproses QR: " +
        escapeHTML(qrCode);


    /* ---------------------------------------------
       AMBIL DATA FORM
    --------------------------------------------- */

    const tanggal =
        document.getElementById(
            "tanggal"
        ).value;


    const shalat =
        document.getElementById(
            "shalat"
        ).value;


    const statusElement =
        document.querySelector(
            'input[name="status"]:checked'
        );


    if (!statusElement) {

        sedangMemproses =
            false;

        return;
    }


    const status =
        statusElement.value;


    /* ---------------------------------------------
       KIRIM KE APPS SCRIPT
    --------------------------------------------- */

    kirimPresensi(
        qrCode,
        tanggal,
        shalat,
        status
    );

}


/* =====================================================
   KIRIM PRESENSI
===================================================== */

async function kirimPresensi(

    qrCode,
    tanggal,
    shalat,
    status

) {

    try {

        const response =
            await fetch(

                API_URL,

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "text/plain;charset=utf-8"

                    },

                    body:
                        JSON.stringify({

                            qrCode:
                                qrCode,

                            tanggal:
                                tanggal,

                            shalat:
                                shalat,

                            status:
                                status

                        })

                }

            );


        const data =
            await response.json();


        console.log(
            "Response Apps Script:",
            data
        );


        prosesResponse(
            data
        );


    } catch (error) {

        console.error(
            "Error API:",
            error
        );


        tampilkanNotifikasi(

            "error",

            "Koneksi gagal",

            "Tidak dapat terhubung ke server."

        );


        document.getElementById(
            "scanInfo"
        ).innerHTML =
            "❌ Gagal terhubung ke server";


    } finally {

        /*
           Setelah request selesai,
           kamera tetap berjalan.
        */

        sedangMemproses =
            false;


        setTimeout(
            function () {

                if (scannerBerjalan) {

                    document.getElementById(
                        "scanInfo"
                    ).innerHTML =
                        "Scan siswa berikutnya...";

                }

            },
            1000
        );

    }

}


/* =====================================================
   PROSES RESPONSE
===================================================== */

function prosesResponse(
    data
) {


    /* ==============================================
       BERHASIL
    ============================================== */

    if (
        data.status ===
        "success"
    ) {

        bunyiBeep();


        tampilkanNotifikasi(

            "berhasil",

            "✓ Input kehadiran berhasil",

            escapeHTML(
                data.nama
            ) +
            " • " +
            escapeHTML(
                data.kelas
            ) +
            " • " +
            escapeHTML(
                data.shalat
            ) +
            " • " +
            escapeHTML(
                data.statusPresensi
            )

        );


        tampilkanHasil(

            data,

            "success"

        );


        document.getElementById(
            "scanInfo"
        ).innerHTML =
            "🟢 Berhasil. Scan siswa berikutnya...";


        return;
    }


    /* ==============================================
       DUPLIKAT
    ============================================== */

    if (
        data.status ===
        "duplicate"
    ) {


        tampilkanNotifikasi(

            "duplikat",

            "⚠️ Presensi sudah dilakukan",

            escapeHTML(
                data.nama
            ) +
            " • " +
            escapeHTML(
                data.kelas
            ) +
            " • " +
            escapeHTML(
                data.shalat
            )

        );


        tampilkanHasil(

            data,

            "duplicate"

        );


        document.getElementById(
            "scanInfo"
        ).innerHTML =
            "⚠️ Data sudah ada. Scan siswa berikutnya...";


        return;
    }


    /* ==============================================
       ERROR
    ============================================== */

    tampilkanNotifikasi(

        "error",

        "❌ Presensi gagal",

        escapeHTML(
            data.message ||
            "Terjadi kesalahan."
        )

    );


    document.getElementById(
        "scanInfo"
    ).innerHTML =
        "❌ Data tidak dapat disimpan.";

}


/* =====================================================
   TAMPILKAN NOTIFIKASI
===================================================== */

function tampilkanNotifikasi(

    tipe,
    judul,
    pesan

) {

    const notifikasi =
        document.getElementById(
            "notifikasi"
        );


    const icon =
        document.getElementById(
            "notifikasiIcon"
        );


    const judulElement =
        document.getElementById(
            "notifikasiJudul"
        );


    const pesanElement =
        document.getElementById(
            "notifikasiPesan"
        );


    /* ---------------------------------------------
       Hapus class lama
    --------------------------------------------- */

    notifikasi.classList.remove(
        "berhasil",
        "duplikat",
        "error"
    );


    /* ---------------------------------------------
       Tentukan icon
    --------------------------------------------- */

    if (
        tipe ===
        "berhasil"
    ) {

        icon.innerHTML =
            "✓";

    }

    else if (
        tipe ===
        "duplikat"
    ) {

        icon.innerHTML =
            "⚠";

    }

    else {

        icon.innerHTML =
            "✕";

    }


    /* ---------------------------------------------
       Tambahkan tipe
    --------------------------------------------- */

    notifikasi.classList.add(
        tipe
    );


    /* ---------------------------------------------
       Isi notifikasi
    --------------------------------------------- */

    judulElement.innerHTML =
        judul;


    pesanElement.innerHTML =
        pesan;


    /* ---------------------------------------------
       Tampilkan
    --------------------------------------------- */

    notifikasi.classList.add(
        "tampil"
    );


    /* ---------------------------------------------
       Hapus timer lama
    --------------------------------------------- */

    if (
        notifikasiTimer
    ) {

        clearTimeout(
            notifikasiTimer
        );

    }


    /* ---------------------------------------------
       Hilangkan setelah 2,5 detik
    --------------------------------------------- */

    notifikasiTimer =
        setTimeout(

            function () {

                notifikasi.classList.remove(
                    "tampil"
                );

            },

            2500

        );

}


/* =====================================================
   TAMPILKAN HASIL TERAKHIR
===================================================== */

function tampilkanHasil(

    data,
    tipe

) {

    const hasil =
        document.getElementById(
            "hasil"
        );


    const hasilData =
        document.getElementById(
            "hasilData"
        );


    hasil.style.display =
        "block";


    if (
        tipe ===
        "success"
    ) {

        hasilData.innerHTML = `

            <div class="berhasil">

                ✓ Input kehadiran berhasil

            </div>

            <p>
                <strong>Nama</strong><br>
                ${escapeHTML(data.nama)}
            </p>

            <p>
                <strong>NIS</strong><br>
                ${escapeHTML(
                    String(data.nis)
                )}
            </p>

            <p>
                <strong>Kelas</strong><br>
                ${escapeHTML(data.kelas)}
            </p>

            <p>
                <strong>Shalat</strong><br>
                ${escapeHTML(data.shalat)}
            </p>

            <p>
                <strong>Status</strong><br>
                ${escapeHTML(
                    data.statusPresensi
                )}
            </p>

        `;

    }

    else {

        hasilData.innerHTML = `

            <div class="duplikat">

                ⚠️ Presensi sudah dilakukan

            </div>

            <p>
                <strong>
                    ${escapeHTML(data.nama)}
                </strong>
            </p>

            <p>
                Kelas:
                ${escapeHTML(data.kelas)}
            </p>

            <p>
                Shalat:
                ${escapeHTML(data.shalat)}
            </p>

            <p>
                Tanggal:
                ${escapeHTML(data.tanggal)}
            </p>

        `;

    }

}


/* =====================================================
   STOP SCANNER
===================================================== */

function stopScanner() {

    if (
        scanner &&
        scannerBerjalan
    ) {

        scanner.stop()

            .then(

                function () {

                    scanner.clear();

                    scannerBerjalan =
                        false;

                    scanner =
                        null;

                    console.log(
                        "Kamera dihentikan"
                    );

                }

            )

            .catch(

                function (error) {

                    console.error(
                        "Gagal menghentikan kamera:",
                        error
                    );

                    scannerBerjalan =
                        false;

                    scanner =
                        null;

                }

            );

    }


    document.getElementById(
        "scannerContainer"
    ).style.display =
        "none";


    resetTombolScan();


    document.getElementById(
        "scannerStatus"
    ).innerHTML =
        "Kamera belum aktif";


    document.getElementById(
        "scanInfo"
    ).innerHTML =
        "Scan siswa berikutnya...";


    sedangMemproses =
        false;


    qrTerakhir =
        "";

}


/* =====================================================
   RESET TOMBOL SCAN
===================================================== */

function resetTombolScan() {

    const tombol =
        document.getElementById(
            "btnScan"
        );


    tombol.disabled =
        false;


    tombol.innerHTML =
        "📷 MULAI SCAN QR CODE";

}


/* =====================================================
   TAMPILKAN PESAN
===================================================== */

function tampilkanPesan(
    teks
) {

    document.getElementById(
        "pesan"
    ).innerHTML =
        teks;

}


/* =====================================================
   BUNYI BEEP
===================================================== */

function bunyiBeep() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        if (!AudioContext) {

            return;
        }


        const audioContext =
            new AudioContext();


        const oscillator =
            audioContext
                .createOscillator();


        const gainNode =
            audioContext
                .createGain();


        oscillator.connect(
            gainNode
        );


        gainNode.connect(
            audioContext.destination
        );


        oscillator.frequency.value =
            1000;


        oscillator.type =
            "sine";


        gainNode.gain.setValueAtTime(

            0.3,

            audioContext.currentTime

        );


        oscillator.start();


        oscillator.stop(

            audioContext.currentTime +
            0.15

        );

    }

    catch (error) {

        console.log(
            "Beep tidak tersedia."
        );

    }

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text == null
            ? ""
            : text;


    return div.innerHTML;

}
