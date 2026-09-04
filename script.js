// ======================================================
// KONFIGURASI
// ======================================================

// GANTI dengan URL Web App Google Apps Script Anda
const API_URL =
    "https://script.google.com/macros/s/AKfycbwxLATlIbHlM0OyKi8DHc6wIr2fRedGQXeOXSrdoMYD4WlvwahJcOInHLVBg7lWNau3/exec";


// ======================================================
// VARIABEL SCANNER
// ======================================================

let scanner = null;
let scannerBerjalan = false;
let sudahScan = false;


// ======================================================
// MULAI SCAN
// ======================================================

function mulaiScan() {

    const tanggal =
        document.getElementById("tanggal").value;

    const shalat =
        document.getElementById("shalat").value;

    const statusElement =
        document.querySelector(
            'input[name="status"]:checked'
        );


    // -----------------------------
    // VALIDASI
    // -----------------------------

    if (!tanggal) {

        tampilkanPesan(
            "❌ Silakan pilih tanggal terlebih dahulu."
        );

        return;
    }


    if (!shalat) {

        tampilkanPesan(
            "❌ Silakan pilih jenis shalat."
        );

        return;
    }


    if (!statusElement) {

        tampilkanPesan(
            "❌ Silakan pilih status Hadir atau Haid."
        );

        return;
    }


    // Reset
    sudahScan = false;


    // Tampilkan scanner
    document.getElementById(
        "scannerContainer"
    ).style.display = "block";


    document.getElementById(
        "hasil"
    ).style.display = "none";


    tampilkanPesan("");


    document.getElementById(
        "scannerContainer"
    ).scrollIntoView({
        behavior: "smooth"
    });


    jalankanScanner();

}


// ======================================================
// JALANKAN KAMERA
// ======================================================

function jalankanScanner() {

    if (scannerBerjalan) {
        return;
    }


    scanner =
        new Html5Qrcode("reader");


    const config = {

        fps: 10,

        qrbox: {
            width: 250,
            height: 250
        },

        aspectRatio: 1.0

    };


    scanner.start(

        {
            facingMode: "environment"
        },

        config,

        qrCodeMessage => {

            if (sudahScan) {
                return;
            }


            sudahScan = true;


            console.log(
                "QR Code terbaca:",
                qrCodeMessage
            );


            prosesHasilScan(
                qrCodeMessage
            );

        },

        errorMessage => {

            // Error pembacaan frame
            // tidak ditampilkan ke pengguna.

        }

    )

    .then(() => {

        scannerBerjalan = true;

        console.log(
            "Kamera berhasil dijalankan"
        );

    })

    .catch(error => {

        scannerBerjalan = false;

        console.error(
            "Kamera gagal dibuka:",
            error
        );


        tampilkanPesan(
            "❌ Kamera gagal dibuka. " +
            "Pastikan izin kamera diberikan."
        );

    });

}


// ======================================================
// HASIL SCAN
// ======================================================

function prosesHasilScan(qrCode) {

    stopScanner();


    const tanggal =
        document.getElementById("tanggal").value;


    const shalat =
        document.getElementById("shalat").value;


    const statusElement =
        document.querySelector(
            'input[name="status"]:checked'
        );


    const status =
        statusElement.value;


    // Kirim data ke Apps Script
    kirimPresensi(
        qrCode,
        tanggal,
        shalat,
        status
    );

}


// ======================================================
// KIRIM KE GOOGLE APPS SCRIPT
// ======================================================

async function kirimPresensi(
    qrCode,
    tanggal,
    shalat,
    status
) {

    tampilkanPesan(
        "⏳ Memproses presensi..."
    );


    try {

        const response =
            await fetch(API_URL, {

                method: "POST",

                headers: {
                    "Content-Type":
                        "text/plain;charset=utf-8"
                },

                body: JSON.stringify({

                    qrCode: qrCode,

                    tanggal: tanggal,

                    shalat: shalat,

                    status: status

                })

            });


        const data =
            await response.json();


        console.log(
            "Response Apps Script:",
            data
        );


        prosesResponse(data);


    } catch (error) {

        console.error(
            "Error API:",
            error
        );


        tampilkanPesan(
            "❌ Gagal terhubung ke server."
        );

    }

}


// ======================================================
// PROSES RESPONSE APPS SCRIPT
// ======================================================

function prosesResponse(data) {


    // =========================================
    // BERHASIL
    // =========================================

    if (data.status === "success") {

        bunyiBeep();


        document.getElementById(
            "hasil"
        ).style.display = "block";


        document.getElementById(
            "hasilData"
        ).innerHTML = `

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

            <div class="berhasil">
                ✓ Input kehadiran berhasil
            </div>

        `;


        document.getElementById(
            "hasil"
        ).scrollIntoView({
            behavior: "smooth"
        });


        return;
    }


    // =========================================
    // DUPLIKAT
    // =========================================

    if (data.status === "duplicate") {

        document.getElementById(
            "hasil"
        ).style.display = "block";


        document.getElementById(
            "hasilData"
        ).innerHTML = `

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


        document.getElementById(
            "hasil"
        ).scrollIntoView({
            behavior: "smooth"
        });


        return;
    }


    // =========================================
    // ERROR
    // =========================================

    tampilkanPesan(
        "❌ " +
        (data.message ||
        "Terjadi kesalahan.")
    );

}


// ======================================================
// STOP SCANNER
// ======================================================

function stopScanner() {

    if (
        scanner &&
        scannerBerjalan
    ) {

        scanner.stop()

        .then(() => {

            scanner.clear();

            scannerBerjalan =
                false;

        })

        .catch(error => {

            console.error(
                "Gagal menghentikan kamera:",
                error
            );

            scannerBerjalan =
                false;

        });

    }


    document.getElementById(
        "scannerContainer"
    ).style.display = "none";

}


// ======================================================
// BEEP
// ======================================================

function bunyiBeep() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;


        const audioContext =
            new AudioContext();


        const oscillator =
            audioContext.createOscillator();


        const gainNode =
            audioContext.createGain();


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
            audioContext.currentTime + 0.15
        );

    } catch (error) {

        console.log(
            "Beep tidak tersedia."
        );

    }

}


// ======================================================
// PESAN
// ======================================================

function tampilkanPesan(teks) {

    document.getElementById(
        "pesan"
    ).innerHTML = teks;

}


// ======================================================
// KEAMANAN HTML
// ======================================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text == null ? "" : text;

    return div.innerHTML;

}
