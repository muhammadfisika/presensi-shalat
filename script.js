function mulaiScan() {

    const tanggal =
        document.getElementById("tanggal").value;

    const shalat =
        document.getElementById("shalat").value;

    const statusElement =
        document.querySelector(
            'input[name="status"]:checked'
        );


    // =========================
    // VALIDASI TANGGAL
    // =========================

    if (!tanggal) {

        tampilkanPesan(
            "❌ Silakan pilih tanggal terlebih dahulu."
        );

        return;
    }


    // =========================
    // VALIDASI SHALAT
    // =========================

    if (!shalat) {

        tampilkanPesan(
            "❌ Silakan pilih jenis shalat."
        );

        return;
    }


    // =========================
    // VALIDASI STATUS
    // =========================

    if (!statusElement) {

        tampilkanPesan(
            "❌ Silakan pilih status Hadir atau Haid."
        );

        return;
    }


    const status =
        statusElement.value;


    // =========================
    // SEMUA VALID
    // =========================

    tampilkanPesan(
        "✓ Data lengkap. Scanner QR siap digunakan."
    );


    // Menampilkan area scanner
    document.getElementById(
        "scannerContainer"
    ).style.display = "block";


    // Scroll ke scanner
    document.getElementById(
        "scannerContainer"
    ).scrollIntoView({
        behavior: "smooth"
    });


    console.log("Tanggal:", tanggal);
    console.log("Shalat:", shalat);
    console.log("Status:", status);

}


function tampilkanPesan(teks) {

    document.getElementById(
        "pesan"
    ).innerHTML = teks;

}


function stopScanner() {

    document.getElementById(
        "scannerContainer"
    ).style.display = "none";

}
