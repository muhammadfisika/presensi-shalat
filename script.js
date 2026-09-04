let scanner = null;
let scannerBerjalan = false;
let sudahScan = false;


// =====================================
// MULAI SCAN
// =====================================

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


    // Reset hasil
    sudahScan = false;


    // Tampilkan scanner
    document.getElementById(
        "scannerContainer"
    ).style.display = "block";


    document.getElementById(
        "hasil"
    ).style.display = "none";


    tampilkanPesan("");


    // Scroll ke scanner
    document.getElementById(
        "scannerContainer"
    ).scrollIntoView({
        behavior: "smooth"
    });


    // Jalankan kamera
    jalankanScanner();

}


// =====================================
// JALANKAN SCANNER
// =====================================

function jalankanScanner() {

    if (scannerBerjalan) {
        return;
    }


    scanner = new Html5Qrcode("reader");


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

            // Hindari scan berulang
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

            // Jangan tampilkan error
            // setiap frame kamera.

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


        let pesan =
            "❌ Kamera gagal dibuka.";


        if (
            error &&
            error.name === "NotAllowedError"
        ) {

            pesan =
                "❌ Izin kamera ditolak. " +
                "Silakan izinkan kamera pada Chrome.";

        }


        if (
            error &&
            error.name === "NotFoundError"
        ) {

            pesan =
                "❌ Kamera tidak ditemukan.";

        }


        if (
            error &&
            error.name === "NotReadableError"
        ) {

            pesan =
                "❌ Kamera sedang digunakan " +
                "aplikasi lain.";

        }


        tampilkanPesan(pesan);

    });

}


// =====================================
// HASIL SCAN
// =====================================

function prosesHasilScan(qrCode) {

    console.log(
        "Hasil QR:",
        qrCode
    );


    // Hentikan kamera
    stopScanner();


    // Ambil data form
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


    // Tampilkan hasil
    document.getElementById(
        "hasil"
    ).style.display = "block";


    document.getElementById(
        "hasilData"
    ).innerHTML = `

        <p>
            <strong>QR Code:</strong><br>
            ${escapeHTML(qrCode)}
        </p>

        <p>
            <strong>Tanggal:</strong><br>
            ${escapeHTML(tanggal)}
        </p>

        <p>
            <strong>Shalat:</strong><br>
            ${escapeHTML(shalat)}
        </p>

        <p>
            <strong>Status:</strong><br>
            ${escapeHTML(status)}
        </p>

        <p>
            <strong>✓ QR berhasil dibaca</strong>
        </p>

    `;


    document.getElementById(
        "hasil"
    ).scrollIntoView({
        behavior: "smooth"
    });


    // Bunyi beep
    bunyiBeep();

}


// =====================================
// STOP SCANNER
// =====================================

function stopScanner() {

    if (
        scanner &&
        scannerBerjalan
    ) {

        scanner.stop()

            .then(() => {

                scanner.clear();

                scannerBerjalan = false;

                console.log(
                    "Kamera dihentikan"
                );

            })

            .catch(error => {

                console.error(
                    "Gagal menghentikan kamera:",
                    error
                );

                scannerBerjalan = false;

            });

    }


    document.getElementById(
        "scannerContainer"
    ).style.display = "none";

}


// =====================================
// BUNYI BEEP
// =====================================

function bunyiBeep() {

    try {

        const audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();


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
            "Beep tidak tersedia"
        );

    }

}


// =====================================
// PESAN
// =====================================

function tampilkanPesan(teks) {

    document.getElementById(
        "pesan"
    ).innerHTML = teks;

}


// =====================================
// KEAMANAN OUTPUT
// =====================================

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}
